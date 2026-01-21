const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  Invoice, Sale, Customer, Branch, AFIPConfig, InvoiceType, CreditNote, User, sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const { parsePagination, toDecimal } = require('../utils/helpers');
const logger = require('../utils/logger');
const factuHoyService = require('../services/factuhoy.service');

// Invoice CRUD
exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { branch_id, invoice_type_id, status, start_date, end_date, search } = req.query;

    const where = {};
    if (invoice_type_id) where.invoice_type_id = invoice_type_id;
    if (status) where.status = status;
    if (start_date || end_date) {
      where.issued_at = {};
      if (start_date) where.issued_at[Op.gte] = new Date(start_date);
      if (end_date) where.issued_at[Op.lte] = new Date(end_date);
    }
    if (search) {
      where[Op.or] = [
        { invoice_number: { [Op.iLike]: `%${search}%` } },
        { cae: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Build include array with branch filter through Sale
    // Note: Invoice stores customer data as snapshot fields, not as FK to Customer
    const include = [
      {
        model: Sale,
        as: 'sale',
        attributes: ['sale_number', 'total_amount', 'branch_id'],
        ...(branch_id && {
          where: { branch_id },
          required: true
        }),
        include: [
          { model: Branch, as: 'branch', attributes: ['name', 'code'] }
        ]
      },
      { model: InvoiceType, as: 'invoice_type', attributes: ['code', 'name'] }
    ];

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: Sale,
          as: 'sale',
          include: [
            { model: require('../database/models').SaleItem, as: 'items' },
            { model: Branch, as: 'branch' }
          ]
        },
        { model: Customer, as: 'customer' },
        { model: InvoiceType, as: 'invoice_type' }
      ]
    });

    if (!invoice) throw new NotFoundError('Invoice not found');
    return success(res, invoice);
  } catch (error) {
    next(error);
  }
};

exports.getBySale = async (req, res, next) => {
  try {
    const invoices = await Invoice.findAll({
      where: { sale_id: req.params.saleId },
      include: [
        { model: InvoiceType, as: 'invoice_type', attributes: ['code', 'name'] },
        { model: Sale, as: 'sale', include: [{ model: Branch, as: 'branch', attributes: ['name', 'code'] }] }
      ],
      order: [['created_at', 'DESC']]
    });

    return success(res, invoices);
  } catch (error) {
    next(error);
  }
};

// Generate invoice for sale
exports.generate = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { sale_id, invoice_type, customer_id, customer_data } = req.body;

    // Get sale
    const sale = await Sale.findByPk(sale_id, {
      include: [{ model: Branch, as: 'branch' }]
    });
    if (!sale) throw new NotFoundError('Sale not found');

    // Check if sale already has this type of invoice
    const existingInvoice = await Invoice.findOne({
      where: { sale_id, invoice_type }
    });
    if (existingInvoice) {
      throw new BusinessError(`Sale already has a ${invoice_type} invoice`);
    }

    // Get AFIP config for branch
    const afipConfig = await AFIPConfig.findOne({
      where: { branch_id: sale.branch_id, is_active: true }
    });

    // Determine invoice type based on customer
    let finalInvoiceType = invoice_type;
    let customer = null;

    if (customer_id) {
      customer = await Customer.findByPk(customer_id);
    }

    // Validate invoice type based on customer document type
    if (finalInvoiceType === 'A' && (!customer || !customer.document_number)) {
      throw new BusinessError('Invoice type A requires customer with CUIT');
    }

    // Generate invoice number
    const lastInvoice = await Invoice.findOne({
      where: {
        branch_id: sale.branch_id,
        invoice_type: finalInvoiceType
      },
      order: [['invoice_number', 'DESC']]
    });

    const pointOfSale = afipConfig?.point_of_sale || '0001';
    const nextNumber = lastInvoice
      ? String(parseInt(lastInvoice.invoice_number.split('-')[1]) + 1).padStart(8, '0')
      : '00000001';
    const invoiceNumber = `${pointOfSale}-${nextNumber}`;

    // Calculate tax amounts
    const subtotal = parseFloat(sale.subtotal);
    const taxAmount = parseFloat(sale.tax_amount);
    const totalAmount = parseFloat(sale.total_amount);

    // Create invoice (without AFIP integration for now - will be added in Phase 7)
    const invoice = await Invoice.create({
      id: uuidv4(),
      sale_id,
      branch_id: sale.branch_id,
      customer_id: customer?.id || null,
      invoice_type: finalInvoiceType,
      invoice_number: invoiceNumber,
      point_of_sale: pointOfSale,
      invoice_date: new Date(),
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: 'PENDING',
      // Customer data snapshot
      customer_name: customer?.company_name || customer_data?.name || `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 'Consumidor Final',
      customer_document_type: customer?.document_type || customer_data?.document_type || 'DNI',
      customer_document_number: customer?.document_number || customer_data?.document_number || null,
      customer_tax_condition: customer?.tax_condition || customer_data?.tax_condition || 'CONSUMIDOR_FINAL',
      customer_address: customer?.address || customer_data?.address || null,
      created_by: req.user.id
    }, { transaction: t });

    await t.commit();

    logger.info(`Invoice ${invoiceNumber} generated for sale ${sale.sale_number}`);

    return created(res, invoice);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Submit/Retry invoice to AFIP via FactuHoy
exports.submitToAFIP = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Load invoice with relationships
    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: Sale,
          as: 'sale',
          include: [{ model: Branch, as: 'branch' }]
        },
        { model: InvoiceType, as: 'invoice_type' }
      ]
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    // If already issued, return success
    if (invoice.status === 'ISSUED') {
      logger.info(`Invoice ${invoice.id} already issued - CAE: ${invoice.cae}`);
      return success(res, invoice, 'Invoice already issued successfully');
    }

    // Only retry PENDING or FAILED invoices
    if (invoice.status !== 'PENDING' && invoice.status !== 'FAILED') {
      throw new BusinessError(`Cannot retry invoice with status ${invoice.status}`, 'E400');
    }

    // Load retry logic from scheduler
    const { retryInvoice } = require('../schedulers/invoiceRetry');

    logger.info(`Manual retry requested for invoice ${invoice.id} by user ${req.user?.id}`);

    // Execute retry
    const result = await retryInvoice(invoice);

    // Reload invoice to get updated data
    await invoice.reload({
      include: [
        {
          model: Sale,
          as: 'sale',
          include: [{ model: Branch, as: 'branch' }]
        },
        { model: InvoiceType, as: 'invoice_type' }
      ]
    });

    if (result.success) {
      logger.info(`Manual retry successful for invoice ${invoice.id} - CAE: ${invoice.cae}`);
      return success(res, invoice, `Invoice issued successfully - CAE: ${invoice.cae}`);
    } else {
      logger.warn(`Manual retry failed for invoice ${invoice.id} - ${result.error}`);
      return res.status(400).json({
        success: false,
        message: 'Invoice retry failed',
        data: invoice,
        error: result.error,
        final_status: result.final_status
      });
    }
  } catch (error) {
    logger.error('Error in submitToAFIP', { error: error.message, stack: error.stack });
    next(error);
  }
};

// Void invoice
exports.void = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) throw new NotFoundError('Invoice not found');

    if (invoice.status === 'VOIDED') {
      throw new BusinessError('Invoice is already voided');
    }

    // If approved, need credit note instead
    if (invoice.status === 'APPROVED' && invoice.cae) {
      throw new BusinessError('Approved invoices must be cancelled with a credit note');
    }

    await invoice.update({
      status: 'VOIDED',
      void_reason: req.body.reason,
      voided_by: req.user.id,
      voided_at: new Date()
    }, { transaction: t });

    await t.commit();

    return success(res, null, 'Invoice voided');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Create credit note
exports.createCreditNote = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { reason, items } = req.body;

    // Load original invoice with all relationships
    const originalInvoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: Sale,
          as: 'sale',
          include: [
            { model: Branch, as: 'branch' },
            { model: require('../database/models').SaleItem, as: 'items', include: [{ model: require('../database/models').Product, as: 'product' }] }
          ]
        },
        { model: InvoiceType, as: 'invoice_type' }
      ],
      transaction: t
    });

    if (!originalInvoice) throw new NotFoundError('Original invoice not found');

    if (originalInvoice.status !== 'ISSUED') {
      throw new BusinessError('Can only create credit note for issued invoices with CAE');
    }

    if (!originalInvoice.cae) {
      throw new BusinessError('Cannot create credit note for invoice without CAE');
    }

    // Check for existing credit notes (idempotency)
    const existingCreditNote = await CreditNote.findOne({
      where: {
        original_invoice_id: originalInvoice.id,
        status: { [Op.in]: ['PENDING', 'ISSUED'] }
      },
      transaction: t
    });

    if (existingCreditNote) {
      throw new BusinessError('Credit note already exists for this invoice');
    }

    // Calculate credit note amounts (CRITICAL FIX #8: Use toDecimal for precision)
    let netAmount = 0;
    let taxAmount = 0;
    let totalAmount = 0;

    if (items && items.length > 0) {
      // Partial credit note
      for (const item of items) {
        totalAmount += toDecimal(item.amount);
      }
      // Estimate tax (21% for simplicity, should be calculated properly)
      netAmount = toDecimal(totalAmount / 1.21);
      taxAmount = toDecimal(totalAmount - netAmount);
    } else {
      // Full credit note
      netAmount = toDecimal(originalInvoice.net_amount);
      taxAmount = toDecimal(originalInvoice.tax_amount);
      totalAmount = toDecimal(originalInvoice.total_amount);
    }

    // Determine credit note type based on original invoice
    const invoiceTypeCode = originalInvoice.invoice_type?.code || originalInvoice.invoice_type_id;
    let creditNoteType;
    if (invoiceTypeCode === 'A') creditNoteType = 'A';
    else if (invoiceTypeCode === 'B') creditNoteType = 'B';
    else creditNoteType = 'C';

    // Generate credit note number
    const branch = originalInvoice.sale?.branch;
    const pointOfSale = branch?.factuhoy_point_of_sale || 1;

    // CRITICAL FIX #7: Use SELECT FOR UPDATE lock to prevent race condition
    // Find last credit note number for this POS and type with row lock
    const lastCreditNote = await CreditNote.findOne({
      where: {
        branch_id: branch.id,
        credit_note_type: creditNoteType
      },
      order: [['credit_note_number', 'DESC']],
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    const nextNumber = lastCreditNote ? lastCreditNote.credit_note_number + 1 : 1;

    // Create credit note record within the same locked transaction
    const creditNote = await CreditNote.create({
      original_invoice_id: originalInvoice.id,
      credit_note_type: creditNoteType,
      point_of_sale: pointOfSale,
      credit_note_number: nextNumber,
      reason: reason,
      net_amount: netAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: 'PENDING',
      branch_id: branch.id,
      created_by: req.user?.id,
      retry_count: 0
    }, { transaction: t });

    await t.commit();

    logger.info(`Credit note created for invoice ${originalInvoice.invoice_number} by user ${req.user?.id}`);

    // Submit to FactuHoy asynchronously
    submitCreditNoteToAFIP(creditNote.id, originalInvoice.id).catch(error => {
      logger.error(`Failed to submit credit note ${creditNote.id} to AFIP:`, error);
    });

    // Reload with associations
    await creditNote.reload({
      include: [
        { model: Invoice, as: 'original_invoice' },
        { model: Branch, as: 'branch' },
        { model: require('../database/models').User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] }
      ]
    });

    return created(res, creditNote, 'Credit note created and will be submitted to AFIP');
  } catch (error) {
    await t.rollback();
    logger.error('Error creating credit note', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Async function to submit credit note to AFIP via FactuHoy
 * @param {string} creditNoteId - Credit note ID
 * @param {string} originalInvoiceId - Original invoice ID
 */
async function submitCreditNoteToAFIP(creditNoteId, originalInvoiceId) {
  try {
    // Load credit note with all relationships
    const creditNote = await CreditNote.findByPk(creditNoteId, {
      include: [
        {
          model: Invoice,
          as: 'original_invoice',
          include: [
            {
              model: Sale,
              as: 'sale',
              include: [
                { model: Branch, as: 'branch' },
                { model: require('../database/models').SaleItem, as: 'items', include: [{ model: require('../database/models').Product, as: 'product' }] }
              ]
            },
            { model: InvoiceType, as: 'invoice_type' }
          ]
        },
        { model: Branch, as: 'branch' }
      ]
    });

    if (!creditNote) {
      logger.error(`Credit note ${creditNoteId} not found for AFIP submission`);
      return;
    }

    const originalInvoice = creditNote.original_invoice;
    const sale = originalInvoice.sale;
    const branch = creditNote.branch;
    const invoiceType = originalInvoice.invoice_type;

    // Prepare credit note data for FactuHoy
    const creditNoteTypeCode = `NC_${creditNote.credit_note_type}`;

    const creditNoteData = {
      invoice_type: creditNoteTypeCode,
      point_of_sale: creditNote.point_of_sale,
      invoice_number: creditNote.credit_note_number,
      original_invoice: {
        type: invoiceType?.code || 'B',
        point_of_sale: originalInvoice.point_of_sale,
        number: originalInvoice.invoice_number,
        cae: originalInvoice.cae
      },
      customer: {
        name: originalInvoice.customer_name,
        document_type: originalInvoice.customer_document_type,
        document_number: originalInvoice.customer_document_number,
        tax_condition: originalInvoice.customer_tax_condition,
        address: originalInvoice.customer_address
      },
      items: sale.items?.map(item => ({
        code: item.product?.sku || item.product_code,
        description: item.product_name,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price),
        subtotal: parseFloat(item.subtotal),
        tax_amount: parseFloat(item.tax_amount),
        total: parseFloat(item.total)
      })) || [],
      totals: {
        subtotal: parseFloat(creditNote.net_amount),
        tax: parseFloat(creditNote.tax_amount),
        total: parseFloat(creditNote.total_amount)
      },
      branch: {
        name: branch.name,
        address: branch.address,
        tax_id: branch.tax_id,
        tax_condition: branch.tax_condition
      },
      reason: creditNote.reason
    };

    logger.info(`Submitting credit note ${creditNote.id} to FactuHoy`);

    // Call FactuHoy API
    const result = await factuHoyService.createCreditNote(creditNoteData);

    if (result.success) {
      // Update credit note with success
      await creditNote.update({
        cae: result.cae,
        cae_expiration_date: result.cae_expiration,
        factuhoy_id: result.invoice_number?.toString() || null,
        factuhoy_response: result.afip_response,
        pdf_url: result.pdf_url || null,
        status: 'ISSUED',
        issued_at: new Date(),
        error_message: null
      });

      logger.info(`Credit note ${creditNote.id} successfully issued - CAE: ${result.cae}`);
    } else {
      // Update with failure
      const newRetryCount = creditNote.retry_count + 1;
      const shouldFail = !result.retryable || newRetryCount >= 3;

      await creditNote.update({
        status: shouldFail ? 'FAILED' : 'PENDING',
        error_message: result.error,
        factuhoy_response: result.afip_response,
        retry_count: newRetryCount,
        last_retry_at: new Date()
      });

      logger.error(`Credit note ${creditNote.id} submission failed: ${result.error}`);
    }
  } catch (error) {
    logger.error(`Exception submitting credit note ${creditNoteId} to AFIP:`, error);

    // Update credit note with error
    try {
      const creditNote = await CreditNote.findByPk(creditNoteId);
      if (creditNote) {
        await creditNote.update({
          status: 'FAILED',
          error_message: error.message,
          retry_count: creditNote.retry_count + 1,
          last_retry_at: new Date()
        });
      }
    } catch (updateError) {
      logger.error(`Failed to update credit note status:`, updateError);
    }
  }
}

// Get invoice statistics
exports.getStats = async (req, res, next) => {
  try {
    const { branch_id, start_date, end_date } = req.query;

    logger.info(`Getting invoice stats - branch_id: ${branch_id}, start_date: ${start_date}, end_date: ${end_date}`);

    const where = { status: 'ISSUED' };
    if (start_date || end_date) {
      where.issued_at = {};
      if (start_date) where.issued_at[Op.gte] = new Date(start_date);
      if (end_date) where.issued_at[Op.lte] = new Date(end_date);
    }

    // Build include for branch filter through sale
    const include = [
      {
        model: InvoiceType,
        as: 'invoice_type',
        attributes: []
      }
    ];

    // Add sale join for branch filtering
    if (branch_id) {
      include.push({
        model: Sale,
        as: 'sale',
        attributes: [],
        where: { branch_id },
        required: true
      });
    }

    logger.info(`Invoice stats where clause: ${JSON.stringify(where)}`);

    // By invoice type
    const byType = await Invoice.findAll({
      where,
      attributes: [
        [sequelize.col('invoice_type.code'), 'invoice_type'],
        [sequelize.fn('COUNT', sequelize.col('Invoice.id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('Invoice.total_amount')), 'total']
      ],
      include,
      group: ['invoice_type.code'],
      raw: true
    });

    logger.info(`Invoice stats byType result: ${JSON.stringify(byType)}`);

    // Totals
    const totals = await Invoice.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Invoice.id')), 'total_count'],
        [sequelize.fn('SUM', sequelize.col('Invoice.total_amount')), 'total_amount'],
        [sequelize.fn('SUM', sequelize.col('Invoice.tax_amount')), 'total_tax']
      ],
      include: branch_id ? [{
        model: Sale,
        as: 'sale',
        attributes: [],
        where: { branch_id },
        required: true
      }] : [],
      raw: true
    });

    logger.info(`Invoice stats totals result: ${JSON.stringify(totals)}`);

    // Pending invoices
    const pendingWhere = { status: 'PENDING' };
    const pendingCount = await Invoice.count({
      where: pendingWhere,
      include: branch_id ? [{
        model: Sale,
        as: 'sale',
        attributes: [],
        where: { branch_id },
        required: true
      }] : []
    });

    logger.info(`Invoice stats pendingCount: ${pendingCount}`);

    const response = {
      by_type: byType,
      totals: {
        total_count: parseInt(totals?.total_count) || 0,
        total_amount: parseFloat(totals?.total_amount) || 0,
        total_tax: parseFloat(totals?.total_tax) || 0
      },
      pending_count: pendingCount
    };

    logger.info(`Invoice stats response: ${JSON.stringify(response)}`);

    return success(res, response);
  } catch (error) {
    logger.error(`Invoice stats error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

// Print invoice
exports.getPrintData = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: Sale,
          as: 'sale',
          include: [
            {
              model: require('../database/models').SaleItem,
              as: 'items',
              include: [{ model: require('../database/models').Product, as: 'product' }]
            },
            { model: Branch, as: 'branch' }
          ]
        },
        { model: Customer, as: 'customer' },
        { model: InvoiceType, as: 'invoice_type' }
      ]
    });

    if (!invoice) throw new NotFoundError('Invoice not found');

    // Format for printing
    const printData = {
      invoice: {
        type: invoice.invoice_type?.code || invoice.invoice_type,
        number: invoice.invoice_number,
        date: invoice.issued_at || invoice.created_at,
        cae: invoice.cae,
        cae_expiration: invoice.cae_expiration_date
      },
      branch: {
        name: invoice.sale?.branch?.name,
        address: invoice.sale?.branch?.address,
        cuit: invoice.sale?.branch?.tax_id,
        tax_condition: invoice.sale?.branch?.tax_condition
      },
      customer: {
        name: invoice.customer_name,
        document_type: invoice.customer_document_type,
        document_number: invoice.customer_document_number,
        tax_condition: invoice.customer_tax_condition,
        address: invoice.customer_address
      },
      items: invoice.sale?.items?.map((item) => ({
        code: item.product?.sku,
        description: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        tax_amount: item.tax_amount,
        total: item.total
      })) || [],
      totals: {
        subtotal: invoice.net_amount,
        tax: invoice.tax_amount,
        total: invoice.total_amount
      }
    };

    return success(res, printData);
  } catch (error) {
    next(error);
  }
};

/**
 * Get invoice types (A, B, C)
 * GET /api/v1/invoices/types
 */
exports.getInvoiceTypes = async (_req, res, next) => {
  try {
    const { InvoiceType } = require('../database/models');

    const types = await InvoiceType.findAll({
      attributes: ['id', 'code', 'name', 'description'],
      order: [['code', 'ASC']]
    });

    const formattedTypes = types.map(type => ({
      id: type.id,
      code: type.code,
      name: type.name,
      description: type.description,
      afip_code: getAfipCode(type.code)
    }));

    return success(res, formattedTypes);
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending invoices that need attention
 * GET /api/v1/invoices/status/pending
 */
exports.getPendingInvoices = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { branch_id } = req.query;

    const where = { status: 'PENDING' };

    const include = [
      { model: Sale, as: 'sale', attributes: ['sale_number', 'total_amount'] },
      { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] },
      { model: InvoiceType, as: 'invoice_type', attributes: ['code', 'name'] }
    ];

    // Filter by branch if provided
    if (branch_id) {
      include[0].where = { branch_id };
      include[0].required = true;
    }

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include,
      order: [['created_at', 'ASC']], // Oldest first - most urgent
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

/**
 * Get failed invoices
 * GET /api/v1/invoices/status/failed
 */
exports.getFailedInvoices = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { branch_id } = req.query;

    const where = { status: 'FAILED' };

    const include = [
      { model: Sale, as: 'sale', attributes: ['sale_number', 'total_amount'] },
      { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] },
      { model: InvoiceType, as: 'invoice_type', attributes: ['code', 'name'] }
    ];

    // Filter by branch if provided
    if (branch_id) {
      include[0].where = { branch_id };
      include[0].required = true;
    }

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include,
      order: [['last_retry_at', 'DESC']], // Most recently failed first
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

/**
 * Get credit notes with filters
 * GET /api/v1/invoices/credit-notes/list
 */
exports.getCreditNotes = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { branch_id, from_date, to_date, status } = req.query;

    const where = {};

    if (branch_id) where.branch_id = branch_id;
    if (status) where.status = status;

    if (from_date || to_date) {
      where.created_at = {};
      if (from_date) where.created_at[Op.gte] = new Date(from_date);
      if (to_date) where.created_at[Op.lte] = new Date(to_date);
    }

    const { count, rows } = await CreditNote.findAndCountAll({
      where,
      include: [
        {
          model: Invoice,
          as: 'original_invoice',
          attributes: ['id', 'invoice_number', 'invoice_type_id', 'total_amount'],
          include: [
            { model: InvoiceType, as: 'invoice_type', attributes: ['code', 'name'] }
          ]
        },
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

/**
 * Get credit note by ID
 * GET /api/v1/invoices/credit-notes/:id
 */
exports.getCreditNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const creditNote = await CreditNote.findByPk(id, {
      include: [
        {
          model: Invoice,
          as: 'original_invoice',
          attributes: ['id', 'invoice_number', 'invoice_type_id', 'total_amount', 'cae'],
          include: [
            { model: InvoiceType, as: 'invoice_type', attributes: ['code', 'name'] },
            {
              model: Sale,
              as: 'sale',
              attributes: ['id', 'sale_number', 'total_amount'],
              include: [
                {
                  model: require('../database/models').SaleItem,
                  as: 'items',
                  include: [{ model: require('../database/models').Product, as: 'product' }]
                }
              ]
            }
          ]
        },
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code', 'address'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    if (!creditNote) {
      throw new NotFoundError('Credit note not found');
    }

    return success(res, creditNote);
  } catch (error) {
    next(error);
  }
};

/**
 * Retry failed credit note
 * POST /api/v1/invoices/credit-notes/:id/retry
 */
exports.retryCreditNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Load credit note with relationships
    const creditNote = await CreditNote.findByPk(id, {
      include: [
        {
          model: Invoice,
          as: 'original_invoice',
          include: [
            {
              model: Sale,
              as: 'sale',
              include: [
                { model: Branch, as: 'branch' },
                { model: require('../database/models').SaleItem, as: 'items', include: [{ model: require('../database/models').Product, as: 'product' }] }
              ]
            },
            { model: InvoiceType, as: 'invoice_type' }
          ]
        },
        { model: Branch, as: 'branch' }
      ]
    });

    if (!creditNote) {
      throw new NotFoundError('Credit note not found');
    }

    // If already issued, return success
    if (creditNote.status === 'ISSUED') {
      logger.info(`Credit note ${creditNote.id} already issued - CAE: ${creditNote.cae}`);
      return success(res, creditNote, 'Credit note already issued successfully');
    }

    // Only retry PENDING or FAILED credit notes
    if (creditNote.status !== 'PENDING' && creditNote.status !== 'FAILED') {
      throw new BusinessError(`Cannot retry credit note with status ${creditNote.status}`, 'E400');
    }

    logger.info(`Manual retry requested for credit note ${creditNote.id} by user ${req.user?.id}`);

    // Execute retry by calling submitCreditNoteToAFIP
    await submitCreditNoteToAFIP(creditNote.id, creditNote.original_invoice_id);

    // Reload credit note to get updated data
    await creditNote.reload({
      include: [
        { model: Invoice, as: 'original_invoice' },
        { model: Branch, as: 'branch' },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] }
      ]
    });

    if (creditNote.status === 'ISSUED') {
      logger.info(`Manual retry successful for credit note ${creditNote.id} - CAE: ${creditNote.cae}`);
      return success(res, creditNote, `Credit note issued successfully - CAE: ${creditNote.cae}`);
    } else {
      logger.warn(`Manual retry failed for credit note ${creditNote.id} - ${creditNote.error_message}`);
      return res.status(400).json({
        success: false,
        message: 'Credit note retry failed',
        data: creditNote,
        error: creditNote.error_message
      });
    }
  } catch (error) {
    logger.error('Error in retryCreditNote', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Retry all pending invoices (batch operation)
 * POST /api/v1/invoices/retry-pending
 */
exports.retryPendingBatch = async (req, res, next) => {
  try {
    const { branch_id } = req.body;

    logger.info(`Batch retry requested for pending invoices${branch_id ? ` in branch ${branch_id}` : ''} by user ${req.user?.id}`);

    // Load retry logic from scheduler
    const invoiceRetryJob = require('../schedulers/invoiceRetry');

    // Build where clause for pending invoices
    const where = {
      status: 'PENDING',
      retry_count: { [Op.lt]: 3 }
    };

    // Build include for branch filter
    const include = [];
    if (branch_id) {
      include.push({
        model: Sale,
        as: 'sale',
        attributes: [],
        where: { branch_id },
        required: true
      });
    }

    // Get pending invoices to retry
    const pendingInvoices = await Invoice.findAll({
      where,
      include: include.length > 0 ? include : [
        { model: Sale, as: 'sale', include: [{ model: Branch, as: 'branch' }] },
        { model: InvoiceType, as: 'invoice_type' }
      ],
      limit: 50 // Process max 50 at a time
    });

    if (pendingInvoices.length === 0) {
      logger.info('No pending invoices to retry');
      return success(res, { processed: 0, succeeded: 0, failed: 0 }, 'No pending invoices to retry');
    }

    logger.info(`Found ${pendingInvoices.length} pending invoices to retry`);

    let succeeded = 0;
    let failed = 0;

    // Retry each invoice
    for (const invoice of pendingInvoices) {
      try {
        const result = await invoiceRetryJob.retryInvoice(invoice);
        if (result.success) {
          succeeded++;
        } else {
          failed++;
        }
      } catch (error) {
        logger.error(`Failed to retry invoice ${invoice.id}:`, error);
        failed++;
      }
    }

    logger.info(`Batch retry complete: ${succeeded} succeeded, ${failed} failed`);

    return success(res, {
      processed: pendingInvoices.length,
      succeeded,
      failed
    }, `Processed ${pendingInvoices.length} invoices: ${succeeded} succeeded, ${failed} failed`);

  } catch (error) {
    logger.error('Error in retryPendingBatch', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Helper function to get AFIP code for invoice type
 */
function getAfipCode(invoiceTypeCode) {
  const codes = {
    'A': 1,
    'B': 6,
    'C': 11,
    'NC_A': 3,
    'NC_B': 8,
    'NC_C': 13
  };
  return codes[invoiceTypeCode] || null;
}
