const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const {
  Sale, SaleItem, SalePayment, Branch, CashRegister, RegisterSession,
  Customer, User, Product, PaymentMethod, Invoice, InvoiceType,
  BranchStock, StockMovement, LoyaltyTransaction, CreditTransaction,
  Alert, CreditNote, sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const { parsePagination, generateSaleNumber, calculateLoyaltyPoints, formatDecimal } = require('../utils/helpers');
const { EVENTS } = require('../socket');
const logger = require('../utils/logger');
const factuHoyService = require('../services/factuhoy.service');
const { logSaleCreate, logSaleVoid, logDiscountApply } = require('../utils/auditLogger');
const { getAlertThresholds } = require('../utils/alertThresholds');

/**
 * Generate credit note for a voided sale with issued invoice
 * This runs asynchronously after sale void to cancel the AFIP invoice
 */
async function generateCreditNoteForVoidedSale(invoiceId, saleId, reason, userId) {
  try {
    logger.info(`Generating credit note for voided sale ${saleId}, invoice ${invoiceId}`);

    // Load invoice with all relationships
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [
        {
          model: Sale,
          as: 'sale',
          include: [
            { model: Branch, as: 'branch' },
            { model: Customer, as: 'customer' },
            {
              model: SaleItem,
              as: 'items',
              include: [{ model: Product, as: 'product' }]
            }
          ]
        },
        { model: InvoiceType, as: 'invoice_type' }
      ]
    });

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    if (invoice.status !== 'CANCELLED') {
      throw new Error(`Invoice ${invoiceId} is not cancelled (status: ${invoice.status})`);
    }

    const sale = invoice.sale;
    const branch = sale.branch;

    // Determine credit note type based on invoice type
    const creditNoteTypeMap = {
      'A': 'A',
      'B': 'B',
      'C': 'C'
    };
    const creditNoteType = creditNoteTypeMap[invoice.invoice_type.code] || 'B';

    // Generate credit note number
    const pointOfSale = branch.factuhoy_point_of_sale || 1;
    const lastCreditNote = await CreditNote.findOne({
      where: {
        branch_id: branch.id,
        credit_note_type: creditNoteType
      },
      order: [['credit_note_number', 'DESC']]
    });

    const nextNumber = lastCreditNote ? lastCreditNote.credit_note_number + 1 : 1;

    // Create credit note record first
    const creditNote = await CreditNote.create({
      original_invoice_id: invoice.id,
      branch_id: branch.id,
      credit_note_type: creditNoteType,
      point_of_sale: pointOfSale,
      credit_note_number: nextNumber,
      reason: reason || 'Venta cancelada',
      net_amount: parseFloat(invoice.net_amount),
      tax_amount: parseFloat(invoice.tax_amount),
      total_amount: parseFloat(invoice.total_amount),
      status: 'PENDING',
      created_by: userId,
      retry_count: 0
    });

    logger.info(`Credit note ${creditNote.id} created for invoice ${invoice.id}`);

    // Prepare credit note data for FactuHoy
    const creditNoteData = {
      credit_note_type: `NC_${creditNoteType}`,
      point_of_sale: invoice.point_of_sale,
      customer: {
        name: invoice.customer_name,
        document_type: invoice.customer_document_type,
        document_number: invoice.customer_document_number || '0',
        tax_condition: invoice.customer_tax_condition,
        address: invoice.customer_address || ''
      },
      items: sale.items.map(item => ({
        description: item.product_name,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        tax_rate: parseFloat(item.tax_rate) || 21,
        total: parseFloat(item.total)
      })),
      totals: {
        subtotal: parseFloat(invoice.net_amount),
        tax_21: parseFloat(invoice.tax_amount),
        tax_10_5: 0,
        tax_27: 0,
        total: parseFloat(invoice.total_amount)
      },
      original_invoice: {
        type: invoice.invoice_type.code,
        point_of_sale: invoice.point_of_sale,
        number: invoice.invoice_number
      },
      reason: reason || 'Venta cancelada',
      branch: branch
    };

    // Submit to FactuHoy API
    const result = await factuHoyService.createCreditNote(creditNoteData);

    if (result.success) {
      // Update credit note with CAE and success status
      await creditNote.update({
        cae: result.cae,
        cae_expiration_date: result.cae_expiration,
        factuhoy_id: result.invoice_number?.toString() || null,
        factuhoy_response: result.afip_response,
        pdf_url: result.pdf_url || result.afip_response?.pdf_url || null,
        status: 'ISSUED',
        issued_at: new Date(),
        error_message: null
      });

      logger.info(`Credit note ${creditNote.id} issued successfully - CAE: ${result.cae}`);

      return { success: true, credit_note_id: creditNote.id, cae: result.cae };
    } else {
      // Mark as failed, will be retried later
      const newRetryCount = creditNote.retry_count + 1;
      await creditNote.update({
        status: result.retryable && newRetryCount < 3 ? 'PENDING' : 'FAILED',
        error_message: result.error,
        factuhoy_response: result.afip_response,
        retry_count: newRetryCount,
        last_retry_at: new Date()
      });

      logger.error(`Credit note ${creditNote.id} submission failed - ${result.error}`);

      // Create alert for failed credit note
      await Alert.create({
        id: uuidv4(),
        alert_type: 'FAILED_INVOICE',
        severity: result.retryable && newRetryCount < 3 ? 'MEDIUM' : 'HIGH',
        branch_id: branch.id,
        user_id: userId,
        title: `Nota de crédito tipo ${creditNoteType} falló`,
        message: `Error al generar nota de crédito para venta ${sale.sale_number}. ${result.error}`,
        reference_type: 'CREDIT_NOTE',
        reference_id: creditNote.id
      });

      return { success: false, credit_note_id: creditNote.id, error: result.error };
    }
  } catch (error) {
    logger.error(`Error generating credit note for invoice ${invoiceId}`, {
      error: error.message,
      stack: error.stack,
      invoice_id: invoiceId,
      sale_id: saleId
    });

    throw error;
  }
}

/**
 * Get all sales with filters
 * GET /api/v1/sales
 */
exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset, sortBy, sortOrder } = parsePagination(req.query);
    const { branch_id, session_id, customer_id, status, from_date, to_date, search } = req.query;

    const where = {};

    if (branch_id) where.branch_id = branch_id;
    if (session_id) where.session_id = session_id;
    if (customer_id) where.customer_id = customer_id;
    if (status) where.status = status;

    if (from_date || to_date) {
      where.created_at = {};
      if (from_date) where.created_at[Op.gte] = new Date(from_date);
      if (to_date) where.created_at[Op.lte] = new Date(to_date);
    }

    if (search) {
      where.sale_number = { [Op.iLike]: `%${search}%` };
    }

    // Filter by user's accessible branches if needed
    if (!req.user.permissions.canViewAllBranches) {
      where.branch_id = req.user.branch_id;
    }

    const { count, rows } = await Sale.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'first_name', 'last_name', 'company_name'] },
        { model: SalePayment, as: 'payments', include: [{ model: PaymentMethod, as: 'payment_method' }] }
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset
    });

    const salesWithSummary = rows.map((sale) => ({
      id: sale.id,
      sale_number: sale.sale_number,
      created_at: sale.created_at,
      total_amount: sale.total_amount,
      status: sale.status,
      customer_name: sale.customer
        ? sale.customer.company_name || `${sale.customer.first_name} ${sale.customer.last_name}`
        : null,
      payment_methods: sale.payments.map((p) => p.payment_method.name),
      items_count: 0 // Would need separate query for count
    }));

    return paginated(res, salesWithSummary, {
      page,
      limit,
      total_items: count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sale by ID with full details
 * GET /api/v1/sales/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findByPk(id, {
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] },
        { model: CashRegister, as: 'register', attributes: ['id', 'register_number', 'name'] },
        { model: Customer, as: 'customer' },
        { model: User, as: 'seller', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'voider', attributes: ['id', 'first_name', 'last_name'] },
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'sku', 'name'] }]
        },
        {
          model: SalePayment,
          as: 'payments',
          include: [{ model: PaymentMethod, as: 'payment_method' }]
        },
        { model: Invoice, as: 'invoice' }
      ]
    });

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    const saleData = sale.toJSON();
    saleData.branch_name = sale.branch?.name;
    saleData.register_name = sale.register?.name || `Caja ${sale.register?.register_number}`;
    saleData.customer_name = sale.customer
      ? sale.customer.company_name || `${sale.customer.first_name} ${sale.customer.last_name}`
      : null;
    saleData.seller_name = sale.seller ? `${sale.seller.first_name} ${sale.seller.last_name}` : null;
    saleData.created_by_name = `${sale.creator.first_name} ${sale.creator.last_name}`;

    return success(res, saleData);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new sale
 * POST /api/v1/sales
 */
exports.create = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const {
      branch_id, register_id, session_id, customer_id, seller_id,
      discount_percent, discount_amount, discount_type, discount_value,
      discount_reason, discount_approved_by_pin,
      points_redeemed, credit_used, change_as_credit, items, payments,
      local_id, local_created_at,
      invoice_override // Invoice override parameters from frontend
    } = req.body;

    // Verify session is open
    const session = await RegisterSession.findByPk(session_id);
    if (!session || session.status !== 'OPEN') {
      throw new BusinessError('Register session is not open', 'E401');
    }

    // Get branch for sale number
    const branch = await Branch.findByPk(branch_id);
    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    // Calculate sale totals
    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id);
      if (!product) {
        throw new NotFoundError(`Product ${item.product_id} not found`);
      }

      const lineDiscount = item.discount_percent
        ? (item.unit_price * item.quantity * item.discount_percent / 100)
        : 0;
      const lineTotal = (item.unit_price * item.quantity) - lineDiscount;
      const taxAmount = product.is_tax_included
        ? (lineTotal * product.tax_rate / (100 + parseFloat(product.tax_rate)))
        : (lineTotal * product.tax_rate / 100);

      saleItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        cost_price: product.cost_price,
        discount_percent: item.discount_percent || 0,
        discount_amount: lineDiscount,
        tax_rate: product.tax_rate,
        tax_amount: taxAmount,
        line_total: lineTotal,
        notes: item.notes
      });

      subtotal += lineTotal;
    }

    // Apply sale-level discount
    // Support both old format (discount_percent/discount_amount) and new format (discount_type/discount_value)
    let saleDiscount = 0;
    let actualDiscountType = null;
    let actualDiscountPercent = 0;
    let discountAppliedBy = null;
    let discountApprovedBy = null;

    // Check if customer is wholesale and apply automatic discount
    let wholesaleDiscount = 0;
    if (customer_id) {
      const customer = await Customer.findByPk(customer_id, { attributes: ['is_wholesale', 'wholesale_discount_percent'] });
      if (customer && customer.is_wholesale && customer.wholesale_discount_percent) {
        wholesaleDiscount = subtotal * (parseFloat(customer.wholesale_discount_percent) / 100);
        logger.info(`Wholesale discount applied: ${customer.wholesale_discount_percent}% = $${wholesaleDiscount.toFixed(2)}`);
      }
    }

    if (discount_type && discount_value) {
      // New format from frontend
      actualDiscountType = discount_type;

      if (discount_type === 'FIXED') {
        saleDiscount = discount_value;
        actualDiscountPercent = (discount_value / subtotal) * 100;
      } else if (discount_type === 'PERCENT') {
        actualDiscountPercent = discount_value;
        saleDiscount = subtotal * discount_value / 100;
      }
    } else if (discount_amount || discount_percent) {
      // Old format (backward compatibility)
      saleDiscount = discount_amount || (discount_percent ? subtotal * discount_percent / 100 : 0);
      actualDiscountPercent = discount_percent || ((discount_amount / subtotal) * 100);
      actualDiscountType = discount_amount ? 'FIXED' : 'PERCENT';
    }

    // Validate discount permissions if MANUAL discount applied (wholesale is automatic)
    // Only validate the MANUAL discount portion, not wholesale
    if (saleDiscount > 0 && actualDiscountType !== 'WHOLESALE') {
      // Check if user has permission to give discounts
      if (!req.user.permissions.canGiveDiscount) {
        throw new BusinessError(
          'No tienes permiso para aplicar descuentos. Requiere autorización de supervisor.',
          'E409'
        );
      }

      // Validate discount reason is provided for manual discounts
      if (!discount_reason || discount_reason.trim() === '') {
        throw new BusinessError(
          'Debe proporcionar una razón para el descuento',
          'E410'
        );
      }

      // Check if discount exceeds user's maximum allowed percentage
      const maxAllowed = req.user.permissions.maxDiscountPercent || 0;

      if (actualDiscountPercent > maxAllowed) {
        // Discount exceeds user's limit - requires manager approval
        if (!discount_approved_by_pin) {
          throw new BusinessError(
            `Este descuento (${actualDiscountPercent.toFixed(1)}%) excede tu límite (${maxAllowed}%). Se requiere PIN de supervisor.`,
            'E411'
          );
        }

        // Verify manager PIN
        const managers = await User.findAll({
          include: [{
            model: sequelize.models.Role,
            as: 'role',
            where: {
              can_give_discount: true
            }
          }],
          where: {
            is_active: true
          }
        });

        let managerAuthorized = null;
        for (const manager of managers) {
          if (manager.pin_code && await bcrypt.compare(discount_approved_by_pin, manager.pin_code)) {
            // Verify manager has sufficient discount permission
            const managerMaxDiscount = parseFloat(manager.role.max_discount_percent) || 0;
            if (actualDiscountPercent <= managerMaxDiscount) {
              managerAuthorized = manager;
              break;
            }
          }
        }

        if (!managerAuthorized) {
          throw new BusinessError(
            'PIN de supervisor inválido o el supervisor no tiene permisos suficientes para aprobar este descuento',
            'E412'
          );
        }

        discountApprovedBy = managerAuthorized.id;
        logger.info(`Discount of ${actualDiscountPercent.toFixed(1)}% approved by manager ${managerAuthorized.id} for user ${req.user.id}`);
      }

      discountAppliedBy = req.user.id;
    }

    // Add wholesale discount to total sale discount AFTER permission validation
    saleDiscount += wholesaleDiscount;

    // Calculate points redemption value (10 points = 1 peso, so 0.1 peso per point)
    const pointsValue = points_redeemed ? points_redeemed * 0.1 : 0;

    // Calculate total
    const totalAmount = subtotal - saleDiscount - pointsValue - (credit_used || 0);

    // Validate payment method requirements
    for (const payment of payments) {
      const paymentMethod = await PaymentMethod.findByPk(payment.payment_method_id);
      if (!paymentMethod) {
        throw new NotFoundError(`Payment method ${payment.payment_method_id} not found`);
      }

      // Enforce requires_reference flag
      if (paymentMethod.requires_reference && !payment.reference_number) {
        throw new BusinessError(
          `${paymentMethod.name} requiere un número de comprobante/referencia`,
          'E408'
        );
      }

      // Validate card payment fields
      if (paymentMethod.code === 'DEBIT' || paymentMethod.code === 'CREDIT') {
        if (!payment.authorization_code || payment.authorization_code.trim().length === 0) {
          throw new BusinessError(
            `${paymentMethod.name} requiere un código de autorización`,
            'E409'
          );
        }

        // Validate card_last_four if provided
        if (payment.card_last_four && !/^\d{4}$/.test(payment.card_last_four)) {
          throw new BusinessError(
            'Los últimos 4 dígitos de la tarjeta deben ser numéricos',
            'E410'
          );
        }
      }

      // Validate payment amount
      if (!payment.amount || payment.amount <= 0) {
        throw new BusinessError(
          'El monto del pago debe ser mayor a cero',
          'E411'
        );
      }
    }

    // Verify payments cover total
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    if (totalPaid < totalAmount) {
      throw new BusinessError('Payment amount is less than total', 'E407');
    }

    // Create sale
    const sale = await Sale.create({
      id: uuidv4(),
      sale_number: generateSaleNumber(branch.code),
      branch_id,
      register_id,
      session_id,
      customer_id,
      seller_id,
      subtotal,
      discount_amount: saleDiscount,
      discount_percent: actualDiscountPercent || 0,
      discount_type: actualDiscountType,
      discount_reason: discount_reason || null,
      discount_applied_by: discountAppliedBy,
      discount_approved_by: discountApprovedBy,
      tax_amount: saleItems.reduce((sum, i) => sum + parseFloat(i.tax_amount), 0),
      total_amount: totalAmount,
      points_redeemed: points_redeemed || 0,
      points_redemption_value: pointsValue,
      credit_used: credit_used || 0,
      change_as_credit: change_as_credit || 0,
      status: 'COMPLETED',
      created_by: req.user.id,
      invoice_override: invoice_override || null,
      local_id,
      local_created_at,
      synced_at: new Date(),
      sync_status: 'SYNCED'
    }, { transaction: t });

    // Create sale items
    for (const item of saleItems) {
      await SaleItem.create({
        id: uuidv4(),
        sale_id: sale.id,
        ...item
      }, { transaction: t });

      // Update stock
      if (item.product_id) {
        const stock = await BranchStock.findOne({
          where: { branch_id, product_id: item.product_id }
        });

        if (stock) {
          const newQty = parseFloat(stock.quantity) - parseFloat(item.quantity);
          await stock.update({ quantity: newQty }, { transaction: t });

          // Create stock movement
          await StockMovement.create({
            id: uuidv4(),
            branch_id,
            product_id: item.product_id,
            movement_type: 'SALE',
            quantity: -parseFloat(item.quantity),
            quantity_before: stock.quantity,
            quantity_after: newQty,
            reference_type: 'SALE',
            reference_id: sale.id,
            performed_by: req.user.id
          }, { transaction: t });

          // Check for low stock and create alert if needed
          const product = await Product.findByPk(item.product_id, { attributes: ['name', 'sku', 'minimum_stock'] });
          if (product && product.minimum_stock && newQty <= product.minimum_stock) {
            await Alert.create({
              id: uuidv4(),
              alert_type: 'LOW_STOCK',
              severity: newQty === 0 ? 'HIGH' : 'MEDIUM',
              branch_id,
              user_id: req.user.id,
              title: newQty === 0 ? `Stock agotado: ${product.name}` : `Stock bajo: ${product.name}`,
              message: `${product.name} (SKU: ${product.sku}) tiene ${newQty} unidades. Mínimo requerido: ${product.minimum_stock}`,
              reference_type: 'PRODUCT',
              reference_id: item.product_id
            }, { transaction: t });
          }
        }
      }
    }

    // Create sale payments
    for (const payment of payments) {
      await SalePayment.create({
        id: uuidv4(),
        sale_id: sale.id,
        payment_method_id: payment.payment_method_id,
        amount: payment.amount,
        reference_number: payment.reference_number,
        card_last_four: payment.card_last_four,
        card_brand: payment.card_brand,
        authorization_code: payment.authorization_code,
        qr_provider: payment.qr_provider,
        qr_transaction_id: payment.qr_transaction_id
      }, { transaction: t });
    }

    // Handle loyalty points
    if (customer_id) {
      const customer = await Customer.findByPk(customer_id);

      // Validate and deduct redeemed points
      if (points_redeemed > 0) {
        if (customer.loyalty_points < points_redeemed) {
          throw new BusinessError(
            `Cliente no tiene suficientes puntos. Disponible: ${customer.loyalty_points}, Solicitado: ${points_redeemed}`,
            'E413'
          );
        }
        const newBalance = customer.loyalty_points - points_redeemed;
        await customer.update({ loyalty_points: newBalance }, { transaction: t });

        await LoyaltyTransaction.create({
          id: uuidv4(),
          customer_id,
          transaction_type: 'REDEEM',
          points: -points_redeemed,
          points_balance_after: newBalance,
          sale_id: sale.id,
          description: `Canje en venta ${sale.sale_number}`,
          created_by: req.user.id
        }, { transaction: t });
      }

      // Calculate and add earned points
      const pointsEarned = calculateLoyaltyPoints(totalAmount);
      if (pointsEarned > 0) {
        const newBalance = customer.loyalty_points + pointsEarned;
        await customer.update({ loyalty_points: newBalance }, { transaction: t });

        await LoyaltyTransaction.create({
          id: uuidv4(),
          customer_id,
          transaction_type: 'EARN',
          points: pointsEarned,
          points_balance_after: newBalance,
          sale_id: sale.id,
          description: `Puntos por venta ${sale.sale_number}`,
          created_by: req.user.id
        }, { transaction: t });

        sale.points_earned = pointsEarned;
        await sale.save({ transaction: t });
      }

      // Validate and handle credit
      if (credit_used > 0) {
        const currentCredit = parseFloat(customer.credit_balance);
        if (currentCredit < credit_used) {
          throw new BusinessError(
            `Cliente no tiene suficiente crédito. Disponible: $${formatDecimal(currentCredit)}, Solicitado: $${formatDecimal(credit_used)}`,
            'E414'
          );
        }
        const newCreditBalance = currentCredit - credit_used;
        await customer.update({ credit_balance: newCreditBalance }, { transaction: t });

        await CreditTransaction.create({
          id: uuidv4(),
          customer_id,
          transaction_type: 'DEBIT',
          amount: -credit_used,
          balance_after: newCreditBalance,
          sale_id: sale.id,
          description: `Uso de crédito en venta ${sale.sale_number}`,
          created_by: req.user.id
        }, { transaction: t });
      }

      if (change_as_credit > 0) {
        const newCreditBalance = parseFloat(customer.credit_balance) + change_as_credit;
        await customer.update({ credit_balance: newCreditBalance }, { transaction: t });

        await CreditTransaction.create({
          id: uuidv4(),
          customer_id,
          transaction_type: 'CREDIT',
          amount: change_as_credit,
          balance_after: newCreditBalance,
          sale_id: sale.id,
          description: `Vuelto como crédito de venta ${sale.sale_number}`,
          created_by: req.user.id
        }, { transaction: t });
      }
    }

    await t.commit();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emitToBranch(branch_id, EVENTS.SALE_CREATED, {
        sale_id: sale.id,
        sale_number: sale.sale_number,
        total_amount: sale.total_amount,
        created_by: req.user.first_name + ' ' + req.user.last_name
      });
    }

    // Return created sale with details
    const createdSale = await Sale.findByPk(sale.id, {
      include: [
        { model: SaleItem, as: 'items' },
        { model: SalePayment, as: 'payments' }
      ]
    });

    // Create audit log entry for sale creation
    await logSaleCreate(req, sale, t);

    // Log discount application if applicable
    if (saleDiscount > 0 && actualDiscountType !== 'WHOLESALE') {
      await logDiscountApply(
        req,
        sale,
        saleDiscount,
        actualDiscountPercent,
        discount_reason,
        discountApprovedBy,
        t
      );
    }

    // Commit transaction before async operations
    await t.commit();

    // Get configurable thresholds for this branch
    const thresholds = await getAlertThresholds(branch_id, ['LARGE_DISCOUNT', 'HIGH_VALUE_SALE']);
    const largeDiscountThreshold = thresholds.LARGE_DISCOUNT || 15; // Default 15%
    const highValueThreshold = thresholds.HIGH_VALUE_SALE || 50000; // Default $50,000

    // Create LARGE_DISCOUNT alert if discount exceeds threshold
    if (actualDiscountPercent > largeDiscountThreshold && actualDiscountType !== 'WHOLESALE') {
      const largeDiscountAlert = await Alert.create({
        id: uuidv4(),
        alert_type: 'LARGE_DISCOUNT',
        severity: 'MEDIUM',
        branch_id,
        user_id: req.user.id,
        title: `Descuento grande aplicado en ${branch.name}`,
        message: `Venta ${sale.sale_number}: descuento del ${actualDiscountPercent.toFixed(1)}% ($${saleDiscount.toFixed(2)})${discountApprovedBy ? ' con autorización de supervisor' : ''}. Motivo: ${discount_reason}`,
        reference_type: 'SALE',
        reference_id: sale.id
      });

      // Emit alert to owners via Socket.io
      if (io) {
        io.emitToOwners(EVENTS.ALERT_CREATED, {
          alert_id: largeDiscountAlert.id,
          type: 'LARGE_DISCOUNT',
          severity: 'MEDIUM',
          branch_name: branch.name,
          sale_number: sale.sale_number,
          discount_percent: actualDiscountPercent,
          discount_amount: saleDiscount
        }, branch_id);
      }
    }

    // Create HIGH_VALUE_SALE alert if total exceeds threshold
    if (totalAmount > highValueThreshold) {
      const highValueAlert = await Alert.create({
        id: uuidv4(),
        alert_type: 'HIGH_VALUE_SALE',
        severity: 'INFO',
        branch_id,
        user_id: req.user.id,
        title: `Venta de alto valor en ${branch.name}`,
        message: `Venta ${sale.sale_number} por $${totalAmount.toFixed(2)} supera el umbral de $${highValueThreshold.toFixed(2)}`,
        reference_type: 'SALE',
        reference_id: sale.id
      });

      // Emit alert to owners via Socket.io
      if (io) {
        io.emitToOwners(EVENTS.ALERT_CREATED, {
          alert_id: highValueAlert.id,
          type: 'HIGH_VALUE_SALE',
          severity: 'INFO',
          branch_name: branch.name,
          sale_number: sale.sale_number,
          total_amount: totalAmount,
          threshold: highValueThreshold
        }, branch_id);
      }
    }

    // Automatic invoice generation through FactuHoy (async, don't block response)
    // DISABLED: FactuHoy confirmed no API access - invoicing is done manually
    if (process.env.FACTUHOY_ENABLED !== 'false') {
      setImmediate(async () => {
        try {
          await generateInvoiceForSale(sale.id, branch_id, customer_id, req.user.id, invoice_override);
        } catch (error) {
          logger.error(`Failed to generate invoice for sale ${sale.sale_number}`, {
            sale_id: sale.id,
            error: error.message
          });

          // Create FAILED_INVOICE alert
          const failedInvoiceAlert = await Alert.create({
            id: uuidv4(),
            alert_type: 'FAILED_INVOICE',
            severity: 'HIGH',
            branch_id,
            user_id: req.user.id,
            title: `Error al generar factura en ${branch.name}`,
            message: `No se pudo generar la factura para la venta ${sale.sale_number} ($${totalAmount.toFixed(2)}). Error: ${error.message}`,
            reference_type: 'SALE',
            reference_id: sale.id
          });

          // Emit via Socket.io
          const alertIo = req.app.get('io');
          if (alertIo) {
            alertIo.to(`branch_${branch_id}`).emit('ALERT_CREATED', failedInvoiceAlert);
            alertIo.to('owners').emit('ALERT_CREATED', failedInvoiceAlert);
          }
        }
      });
    } else {
      logger.info(`FactuHoy disabled - invoice for sale ${sale.sale_number} must be created manually`, {
        sale_id: sale.id,
        sale_number: sale.sale_number
      });
    }

    return created(res, createdSale);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Void a sale
 * POST /api/v1/sales/:id/void
 */
exports.voidSale = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { reason, manager_pin } = req.body;

    const sale = await Sale.findByPk(id, {
      include: [
        { model: SaleItem, as: 'items' },
        { model: Branch, as: 'branch' },
        {
          model: RegisterSession,
          as: 'session',
          attributes: ['id', 'status', 'business_date', 'closed_at']
        },
        { model: Invoice, as: 'invoice' }
      ]
    });

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    if (sale.status === 'VOIDED') {
      throw new BusinessError('Sale is already cancelled', 'E404');
    }

    // CRITICAL: Check if session is still open (cannot void sales from closed shifts)
    if (sale.session && sale.session.status === 'CLOSED') {
      throw new BusinessError(
        'Cannot void sales from closed shifts. Session was closed on ' +
        new Date(sale.session.closed_at).toLocaleDateString(),
        'E408'
      );
    }

    // CRITICAL: Check if sale is from current business day (same-day void restriction)
    const currentBusinessDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const saleBusinessDate = sale.session?.business_date || sale.created_at.toISOString().split('T')[0];

    if (saleBusinessDate !== currentBusinessDate) {
      throw new BusinessError(
        `Cannot void sales from previous days. Sale is from ${saleBusinessDate}, current business date is ${currentBusinessDate}`,
        'E409'
      );
    }

    // Check permission - either user has permission or manager authorized
    let approvedBy = null;
    if (!req.user.permissions.canVoidSale) {
      if (!manager_pin) {
        throw new BusinessError('Manager authorization required to void this sale', 'E106');
      }
      // Find manager by PIN
      const manager = await User.findOne({
        where: { pin_code: manager_pin, is_active: true },
        include: [{ model: require('../database/models').Role, as: 'role' }]
      });

      if (!manager || !manager.role.can_void_sale) {
        throw new BusinessError('Invalid manager PIN or insufficient permissions', 'E107');
      }
      approvedBy = manager.id;
    }

    // Capture old state before voiding
    const oldSaleState = {
      status: sale.status,
      voided_at: sale.voided_at,
      voided_by: sale.voided_by,
      void_reason: sale.void_reason,
      void_approved_by: sale.void_approved_by,
      total_amount: sale.total_amount
    };

    // Void the sale
    await sale.update({
      status: 'VOIDED',
      voided_at: new Date(),
      voided_by: req.user.id,
      void_reason: reason,
      void_approved_by: approvedBy
    }, { transaction: t });

    // Restore stock for each item
    for (const item of sale.items) {
      const stock = await BranchStock.findOne({
        where: { branch_id: sale.branch_id, product_id: item.product_id }
      });

      if (stock) {
        const newQty = parseFloat(stock.quantity) + parseFloat(item.quantity);
        await stock.update({ quantity: newQty }, { transaction: t });

        await StockMovement.create({
          id: uuidv4(),
          branch_id: sale.branch_id,
          product_id: item.product_id,
          movement_type: 'RETURN',
          quantity: parseFloat(item.quantity),
          quantity_before: stock.quantity,
          quantity_after: newQty,
          reference_type: 'VOIDED_SALE',
          reference_id: sale.id,
          performed_by: req.user.id,
          notes: `Anulación de venta ${sale.sale_number}: ${reason}`
        }, { transaction: t });
      }
    }

    // Reverse loyalty/credit transactions if customer exists
    if (sale.customer_id) {
      const customer = await Customer.findByPk(sale.customer_id);

      // Reverse points earned
      if (sale.points_earned > 0) {
        const newBalance = customer.loyalty_points - sale.points_earned;
        await customer.update({ loyalty_points: newBalance }, { transaction: t });

        await LoyaltyTransaction.create({
          id: uuidv4(),
          customer_id: sale.customer_id,
          transaction_type: 'ADJUST',
          points: -sale.points_earned,
          points_balance_after: newBalance,
          sale_id: sale.id,
          description: `Anulación de puntos por venta ${sale.sale_number}`,
          created_by: req.user.id
        }, { transaction: t });
      }

      // Restore redeemed points
      if (sale.points_redeemed > 0) {
        const newBalance = customer.loyalty_points + sale.points_redeemed;
        await customer.update({ loyalty_points: newBalance }, { transaction: t });

        await LoyaltyTransaction.create({
          id: uuidv4(),
          customer_id: sale.customer_id,
          transaction_type: 'ADJUST',
          points: sale.points_redeemed,
          points_balance_after: newBalance,
          sale_id: sale.id,
          description: `Devolución de puntos canjeados por anulación ${sale.sale_number}`,
          created_by: req.user.id
        }, { transaction: t });
      }
    }

    // Reverse payment allocations (mark as reversed for reconciliation)
    const salePayments = await SalePayment.findAll({
      where: { sale_id: sale.id },
      include: [{ model: PaymentMethod, as: 'payment_method' }]
    });

    for (const payment of salePayments) {
      // Create reversal record with negative amount
      await SalePayment.create({
        id: uuidv4(),
        sale_id: sale.id,
        payment_method_id: payment.payment_method_id,
        amount: -parseFloat(payment.amount), // Negative amount for reversal
        reference_number: payment.reference_number
          ? `VOID-${payment.reference_number}`
          : `VOID-${sale.sale_number}`,
        card_last_four: payment.card_last_four,
        card_brand: payment.card_brand,
        authorization_code: payment.authorization_code
          ? `VOID-${payment.authorization_code}`
          : null,
        qr_provider: payment.qr_provider,
        qr_transaction_id: payment.qr_transaction_id
          ? `VOID-${payment.qr_transaction_id}`
          : null
      }, { transaction: t });

      logger.info(`Payment reversed for voided sale`, {
        sale_id: sale.id,
        payment_id: payment.id,
        payment_method: payment.payment_method.code,
        amount: payment.amount,
        reversal_amount: -parseFloat(payment.amount)
      });
    }

    // CRITICAL: Cancel invoice in FactuHoy if already invoiced
    if (sale.invoice) {
      const invoice = sale.invoice;

      // Only cancel invoices that are ISSUED (have valid CAE)
      if (invoice.status === 'ISSUED' && invoice.cae) {
        logger.info(`Cancelling invoice ${invoice.id} for voided sale ${sale.sale_number}`, {
          invoice_id: invoice.id,
          sale_id: sale.id,
          cae: invoice.cae
        });

        // Update invoice status to CANCELLED
        await invoice.update({
          status: 'CANCELLED',
          error_message: `Cancelled due to sale void: ${reason}`,
          updated_at: new Date()
        }, { transaction: t });

        // Note: Credit note generation in FactuHoy will be handled asynchronously
        // to avoid blocking the void operation. This is logged for later processing.
        logger.warn(`Invoice ${invoice.id} with CAE ${invoice.cae} cancelled - Credit note must be generated in FactuHoy`, {
          invoice_id: invoice.id,
          sale_number: sale.sale_number,
          cae: invoice.cae,
          void_reason: reason
        });

        // TODO: Implement automatic credit note generation via FactuHoy API
        // This should be done asynchronously after the void completes
      } else if (invoice.status === 'PENDING') {
        // If invoice is still pending, just mark as cancelled
        await invoice.update({
          status: 'CANCELLED',
          error_message: `Cancelled due to sale void: ${reason}`
        }, { transaction: t });

        logger.info(`Pending invoice ${invoice.id} cancelled for voided sale`);
      }
    }

    // Create Alert record for owner (CRITICAL: Must persist in database)
    const alert = await Alert.create({
      id: uuidv4(),
      alert_type: 'VOIDED_SALE',
      severity: 'HIGH',
      branch_id: sale.branch_id,
      user_id: req.user.id,
      title: `Venta cancelada en ${sale.branch.name}`,
      message: `Venta ${sale.sale_number} por $${formatDecimal(sale.total_amount)} fue cancelada por ${req.user.first_name} ${req.user.last_name}. Motivo: ${reason}`,
      reference_type: 'SALE',
      reference_id: sale.id
    }, { transaction: t });

    // Create audit log entry for void operation
    await logSaleVoid(req, oldSaleState, sale, t);

    await t.commit();

    // CRITICAL: Generate credit note asynchronously for voided invoiced sales
    // This must happen AFTER the transaction commits to ensure sale is voided first
    // DISABLED when FactuHoy has no API access - credit notes must be created manually
    if (process.env.FACTUHOY_ENABLED !== 'false' && sale.invoice && sale.invoice.status === 'ISSUED' && sale.invoice.cae) {
      // Call async credit note generation (don't await - fire and forget)
      generateCreditNoteForVoidedSale(sale.invoice.id, sale.id, reason, req.user.id)
        .catch(error => {
          logger.error(`Failed to generate credit note for voided sale ${sale.id}`, {
            error: error.message,
            invoice_id: sale.invoice.id,
            sale_id: sale.id
          });
        });
    } else if (process.env.FACTUHOY_ENABLED === 'false' && sale.invoice) {
      logger.info(`FactuHoy disabled - credit note for voided sale ${sale.sale_number} must be created manually`, {
        sale_id: sale.id,
        invoice_id: sale.invoice.id
      });
    }

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emitToBranch(sale.branch_id, EVENTS.SALE_VOIDED, {
        sale_id: sale.id,
        sale_number: sale.sale_number,
        voided_by: req.user.first_name + ' ' + req.user.last_name,
        reason
      });

      // Alert owners with persisted alert data
      io.emitToOwners(EVENTS.ALERT_CREATED, {
        alert_id: alert.id,
        alert_type: 'VOIDED_SALE',
        severity: 'HIGH',
        branch_id: sale.branch_id,
        title: alert.title,
        message: alert.message,
        reference_type: 'SALE',
        reference_id: sale.id
      }, sale.branch_id);
    }

    return success(res, sale, 'Sale cancelled successfully');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Get receipt data for printing
 * GET /api/v1/sales/:id/receipt
 */
exports.getReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findByPk(id, {
      include: [
        { model: Branch, as: 'branch' },
        { model: Customer, as: 'customer' },
        { model: User, as: 'creator', attributes: ['first_name', 'last_name'] },
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        },
        {
          model: SalePayment,
          as: 'payments',
          include: [{ model: PaymentMethod, as: 'payment_method' }]
        }
      ]
    });

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    const receipt = {
      // Header
      business_name: 'PetFood Store',
      branch_name: sale.branch.name,
      branch_address: sale.branch.address,
      branch_phone: sale.branch.phone,

      // Sale info
      sale_number: sale.sale_number,
      date: sale.created_at,
      cashier: `${sale.creator.first_name} ${sale.creator.last_name}`,

      // Customer (if any)
      customer: sale.customer ? {
        name: sale.customer.company_name || `${sale.customer.first_name} ${sale.customer.last_name}`,
        document: sale.customer.document_number
      } : null,

      // Items
      items: sale.items.map((item) => ({
        name: item.product.short_name || item.product.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount_amount,
        total: item.line_total
      })),

      // Totals
      subtotal: sale.subtotal,
      discount: sale.discount_amount,
      points_redemption: sale.points_redemption_value,
      credit_used: sale.credit_used,
      total: sale.total_amount,

      // Payments
      payments: sale.payments.map((p) => ({
        method: p.payment_method.name,
        amount: p.amount
      })),

      // Loyalty
      points_earned: sale.points_earned,
      change_as_credit: sale.change_as_credit,

      // Footer
      message: '¡Gracias por su compra!'
    };

    return success(res, receipt);
  } catch (error) {
    next(error);
  }
};

/**
 * Issue invoice for sale
 * POST /api/v1/sales/:id/invoice
 */
exports.issueInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    let {
      invoice_type_code, customer_name, customer_document_type,
      customer_document_number, customer_tax_condition, customer_address
    } = req.body;

    const sale = await Sale.findByPk(id, {
      include: [
        { model: Branch, as: 'branch' },
        { model: Invoice, as: 'invoice' }
      ]
    });

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    if (sale.invoice && sale.invoice.status === 'ISSUED') {
      throw new BusinessError('Invoice already issued for this sale', 'E405');
    }

    // Apply branch default invoice type if not explicitly provided
    if (!invoice_type_code && sale.branch.default_invoice_type) {
      invoice_type_code = sale.branch.default_invoice_type;
      logger.info(`Using branch default invoice type: ${invoice_type_code} for sale ${sale.id}`);
    }

    // Fallback to 'B' if still not set
    if (!invoice_type_code) {
      invoice_type_code = 'B';
      logger.info(`Using fallback invoice type 'B' for sale ${sale.id}`);
    }

    // Get invoice type
    const invoiceType = await InvoiceType.findOne({ where: { code: invoice_type_code } });
    if (!invoiceType) {
      throw new NotFoundError('Invoice type not found');
    }

    // Comprehensive validation for Type A invoices
    if (invoice_type_code === 'A') {
      // Validate CUIT exists
      if (!customer_document_number) {
        throw new BusinessError('Factura A requires customer CUIT', 'E202');
      }

      // Validate CUIT format: 11 digits
      const cuitWithoutDashes = customer_document_number.replace(/-/g, '');
      if (!/^\d{11}$/.test(cuitWithoutDashes)) {
        throw new BusinessError(
          'El CUIT debe contener 11 dígitos numéricos (formato: XX-XXXXXXXX-X)',
          'E412'
        );
      }

      // Validate tax condition exists
      if (!customer_tax_condition || customer_tax_condition.trim().length === 0) {
        throw new BusinessError('Factura A requires customer tax condition', 'E413');
      }

      // Validate address exists
      if (!customer_address || customer_address.trim().length === 0) {
        throw new BusinessError('Factura A requires customer billing address', 'E414');
      }

      // Validate customer name exists
      if (!customer_name || customer_name.trim().length === 0) {
        throw new BusinessError('Factura A requires customer name/company name', 'E415');
      }
    }

    // TODO: Integrate with FactuHoy API here
    // For now, create pending invoice
    const invoice = await Invoice.create({
      id: uuidv4(),
      sale_id: sale.id,
      invoice_type_id: invoiceType.id,
      point_of_sale: sale.branch.factuhoy_point_of_sale || 1,
      invoice_number: 0, // Will be assigned by AFIP
      customer_name,
      customer_document_type,
      customer_document_number,
      customer_tax_condition,
      customer_address,
      net_amount: sale.subtotal,
      tax_amount: sale.tax_amount,
      total_amount: sale.total_amount,
      status: 'PENDING'
    });

    return created(res, invoice);
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales by session
 * GET /api/v1/sales/session/:sessionId
 */
exports.getBySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { page, limit, offset } = parsePagination(req.query);

    const { count, rows } = await Sale.findAndCountAll({
      where: { session_id: sessionId },
      include: [
        { model: Customer, as: 'customer', attributes: ['first_name', 'last_name', 'company_name'] },
        { model: SalePayment, as: 'payments', include: [{ model: PaymentMethod, as: 'payment_method' }] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, {
      page,
      limit,
      total_items: count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales summary report
 * GET /api/v1/sales/report/summary
 */
exports.getSummaryReport = async (req, res, next) => {
  try {
    const { branch_id, from_date, to_date } = req.query;

    const where = {
      created_at: {
        [Op.between]: [new Date(from_date), new Date(to_date)]
      },
      status: 'COMPLETED'
    };

    if (branch_id) where.branch_id = branch_id;

    // Get totals
    const totals = await Sale.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_sales'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_amount'],
        [sequelize.fn('SUM', sequelize.col('discount_amount')), 'total_discount'],
        [sequelize.fn('SUM', sequelize.col('tax_amount')), 'total_tax']
      ],
      raw: true
    });

    // Get voided sales
    const voided = await Sale.findOne({
      where: { ...where, status: 'VOIDED' },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'amount']
      ],
      raw: true
    });

    // Get by payment method
    const byPaymentMethod = await SalePayment.findAll({
      include: [{
        model: Sale,
        as: 'sale',
        where: { ...where },
        attributes: []
      }, {
        model: PaymentMethod,
        as: 'payment_method',
        attributes: ['name']
      }],
      attributes: [
        [sequelize.fn('SUM', sequelize.col('SalePayment.amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('SalePayment.id')), 'count']
      ],
      group: ['payment_method.id', 'payment_method.name'],
      raw: true
    });

    return success(res, {
      total_sales: parseInt(totals.total_sales) || 0,
      total_amount: formatDecimal(totals.total_amount || 0),
      total_discount: formatDecimal(totals.total_discount || 0),
      total_tax: formatDecimal(totals.total_tax || 0),
      voided_count: parseInt(voided.count) || 0,
      voided_amount: formatDecimal(voided.amount || 0),
      average_sale: totals.total_sales > 0
        ? formatDecimal(totals.total_amount / totals.total_sales)
        : '0.00',
      by_payment_method: byPaymentMethod.map((p) => ({
        method_name: p['payment_method.name'],
        total: formatDecimal(p.total || 0),
        count: parseInt(p.count) || 0
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function: Generate invoice for sale through FactuHoy
 * Called asynchronously after sale creation
 * @param {string} saleId - Sale ID
 * @param {string} branchId - Branch ID
 * @param {string} customerId - Customer ID (optional)
 * @param {string} userId - User ID who created the sale
 * @param {object} invoiceOverride - Optional invoice override from frontend
 * @param {string} invoiceOverride.invoice_type - Override invoice type (A/B/C)
 * @param {string} invoiceOverride.customer_cuit - Override customer CUIT
 * @param {string} invoiceOverride.customer_tax_condition - Override customer tax condition
 * @param {string} invoiceOverride.customer_address - Override customer address
 */
async function generateInvoiceForSale(saleId, branchId, customerId, userId, invoiceOverride = null) {
  try {
    // DUPLICATE PREVENTION: Check if invoice already exists for this sale
    const existingInvoice = await Invoice.findOne({
      where: { sale_id: saleId }
    });

    if (existingInvoice) {
      logger.warn(`Invoice already exists for sale ${saleId} - skipping generation`, {
        sale_id: saleId,
        existing_invoice_id: existingInvoice.id,
        status: existingInvoice.status
      });
      return existingInvoice;
    }

    // Load sale with all details
    const sale = await Sale.findByPk(saleId, {
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        },
        { model: Branch, as: 'branch' },
        { model: Customer, as: 'customer' }
      ]
    });

    if (!sale) {
      throw new Error(`Sale ${saleId} not found`);
    }

    const branch = sale.branch;
    const customer = sale.customer;

    // Determine invoice type - use override if provided, otherwise auto-determine
    let invoiceType = 'B'; // Default to B
    if (invoiceOverride && invoiceOverride.invoice_type) {
      // Use frontend-selected invoice type
      invoiceType = invoiceOverride.invoice_type;
      logger.info(`Using override invoice type: ${invoiceType}`, { sale_id: saleId });
    } else if (customer) {
      // Auto-determine based on tax conditions
      invoiceType = factuHoyService.determineInvoiceType(
        branch.tax_condition,
        customer.tax_condition,
        customer.document_number
      );
      logger.info(`Auto-determined invoice type: ${invoiceType}`, { sale_id: saleId });
    }

    // Get invoice type from database
    const invoiceTypeRecord = await InvoiceType.findOne({
      where: { code: invoiceType }
    });

    if (!invoiceTypeRecord) {
      throw new Error(`Invoice type ${invoiceType} not found in database`);
    }

    // Calculate net amount (before tax)
    const totalAmount = parseFloat(sale.total_amount);
    const taxAmount = parseFloat(sale.tax_amount);
    const netAmount = totalAmount - taxAmount;

    // Determine customer data - use override if provided for Type A
    const customerData = {
      name: customer ? (customer.company_name || `${customer.first_name} ${customer.last_name}`) : 'Consumidor Final',
      document_type: customer?.document_type || 'DNI',
      document_number: customer?.document_number || null,
      tax_condition: customer?.tax_condition || 'CONSUMIDOR_FINAL',
      address: customer?.address || null
    };

    // Override customer data if provided (for Invoice Type A)
    if (invoiceOverride) {
      if (invoiceOverride.customer_cuit) {
        // Validate CUIT format: XX-XXXXXXXX-X (11 digits total)
        const cuitWithoutDashes = invoiceOverride.customer_cuit.replace(/-/g, '');
        if (!/^\d{11}$/.test(cuitWithoutDashes)) {
          throw new BusinessError(
            'El CUIT debe contener 11 dígitos numéricos (formato: XX-XXXXXXXX-X)',
            'E412'
          );
        }
        customerData.document_number = invoiceOverride.customer_cuit;
        customerData.document_type = 'CUIT'; // CUIT implies document type is CUIT
      }
      if (invoiceOverride.customer_tax_condition) {
        customerData.tax_condition = invoiceOverride.customer_tax_condition;
      }
      if (invoiceOverride.customer_address) {
        customerData.address = invoiceOverride.customer_address;
      }
      logger.info(`Using override customer data for invoice`, {
        sale_id: saleId,
        override_data: invoiceOverride
      });
    }

    // CRITICAL FIX #5: Use transaction with SELECT FOR UPDATE to prevent race condition
    // Get next invoice number atomically
    const sequelize = Invoice.sequelize;
    const invoice = await sequelize.transaction(async (t) => {
      // Lock the last invoice row to prevent concurrent number generation
      const lastInvoice = await Invoice.findOne({
        where: {
          point_of_sale: branch.factuhoy_point_of_sale || 1,
          invoice_type_id: invoiceTypeRecord.id
        },
        order: [['invoice_number', 'DESC']],
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      const nextInvoiceNumber = lastInvoice ? lastInvoice.invoice_number + 1 : 1;

      // Create invoice record with PENDING status within the same transaction
      const newInvoice = await Invoice.create({
        id: uuidv4(),
        sale_id: saleId,
        invoice_type_id: invoiceTypeRecord.id,
        point_of_sale: branch.factuhoy_point_of_sale || 1,
        invoice_number: nextInvoiceNumber,
        customer_name: customerData.name,
        customer_document_type: customerData.document_type,
        customer_document_number: customerData.document_number,
        customer_tax_condition: customerData.tax_condition,
        customer_address: customerData.address,
        net_amount: netAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'PENDING',
        retry_count: 0
      }, { transaction: t });

      return newInvoice;
    });

    logger.info(`Invoice ${invoice.id} created for sale ${sale.sale_number}`, {
      invoice_id: invoice.id,
      sale_id: saleId,
      invoice_type: invoiceType,
      status: 'PENDING'
    });

    // Prepare data for FactuHoy - use the prepared customerData (with overrides applied)
    const invoiceData = {
      invoice_type: invoiceType,
      point_of_sale: branch.factuhoy_point_of_sale || 1,
      customer: {
        name: customerData.name,
        document_type: customerData.document_type,
        document_number: customerData.document_number || '0',
        tax_condition: customerData.tax_condition,
        address: customerData.address || ''
      },
      items: sale.items.map(item => ({
        description: item.product_name,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        tax_rate: parseFloat(item.tax_rate) || 21,
        total: parseFloat(item.total)
      })),
      totals: {
        subtotal: netAmount,
        tax_21: taxAmount, // Simplified - assuming all tax is 21%
        tax_10_5: 0,
        tax_27: 0,
        total: totalAmount
      },
      branch: branch
    };

    // Call FactuHoy API
    const result = await factuHoyService.createInvoice(invoiceData);

    if (result.success) {
      // Generate local PDF as fallback if FactuHoy doesn't provide one
      let pdfUrl = result.afip_response?.pdf_url || null;

      if (!pdfUrl) {
        try {
          const pdfService = require('../services/pdf.service');
          const localPdfPath = await pdfService.generateInvoicePDF({
            invoice,
            sale,
            branch,
            items: sale.sale_items,
            invoiceType: invoiceTypeRecord
          });
          pdfUrl = localPdfPath;
          logger.info(`Generated local PDF fallback for invoice ${invoice.id}`);
        } catch (pdfError) {
          logger.error(`Failed to generate local PDF for invoice ${invoice.id}:`, pdfError);
        }
      }

      // Update invoice with CAE and success status
      await invoice.update({
        cae: result.cae,
        cae_expiration_date: result.cae_expiration,
        factuhoy_id: result.invoice_number?.toString() || null,
        factuhoy_response: result.afip_response,
        pdf_url: pdfUrl,
        status: 'ISSUED',
        issued_at: new Date(),
        error_message: null
      });

      logger.info(`Invoice ${invoice.id} issued successfully - CAE: ${result.cae}`, {
        invoice_id: invoice.id,
        sale_id: saleId,
        cae: result.cae
      });
    } else {
      // Update invoice with error status
      await invoice.update({
        status: result.retryable ? 'PENDING' : 'FAILED',
        error_message: result.error,
        factuhoy_response: result.afip_response,
        retry_count: result.retryable ? invoice.retry_count + 1 : invoice.retry_count,
        last_retry_at: new Date()
      });

      logger.error(`Invoice ${invoice.id} failed - ${result.error}`, {
        invoice_id: invoice.id,
        sale_id: saleId,
        error: result.error,
        retryable: result.retryable
      });

      // Log the error - invoice will remain in PENDING status for manual retry
      if (result.retryable) {
        logger.info(`Invoice ${invoice.id} can be retried manually - marked as PENDING`);
      } else {
        logger.warn(`Invoice ${invoice.id} marked as FAILED - manual intervention required`);
      }

      // Create alert for failed invoice (CRITICAL FIX #2: Use SALE reference type consistently)
      const Alert = require('../database/models').Alert;
      const sale = await Sale.findByPk(saleId);
      await Alert.create({
        id: uuidv4(),
        alert_type: 'FAILED_INVOICE',
        severity: result.retryable ? 'MEDIUM' : 'HIGH',
        branch_id: sale?.branch_id,
        user_id: sale?.created_by,
        title: result.retryable ? `Factura ${invoice.invoice_number || invoice.id} pendiente de reintento` : `Factura ${invoice.invoice_number || invoice.id} FALLÓ`,
        message: `Error al generar factura: ${result.error}. ${result.retryable ? 'Se puede reintentar manualmente.' : 'Requiere intervención manual.'}`,
        reference_type: 'SALE',
        reference_id: sale.id
      });

      // Emit alert via Socket.io
      const io = global.io;
      if (io && sale) {
        io.emitToBranch(sale.branch_id, 'ALERT_CREATED', {
          alert_type: 'FAILED_INVOICE',
          severity: result.retryable ? 'MEDIUM' : 'HIGH',
          invoice_id: invoice.id,
          sale_id: saleId,
          error: result.error
        });
      }
    }

    return invoice;
  } catch (error) {
    logger.error(`Error generating invoice for sale ${saleId}`, {
      sale_id: saleId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
