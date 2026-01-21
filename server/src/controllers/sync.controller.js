const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  Sale, SaleItem, SalePayment, Customer, Product, BranchStock, SyncLog, SyncQueue, Alert, sequelize
} = require('../database/models');
const { success, created } = require('../utils/apiResponse');
const { BusinessError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { EVENTS } = require('../socket');

// Get pending sync items for a branch
exports.getPendingSync = async (req, res, next) => {
  try {
    const { branch_id } = req.params;
    const { last_sync_at } = req.query;

    const since = last_sync_at ? new Date(last_sync_at) : new Date(0);

    // Get products updated since last sync
    const products = await Product.findAll({
      where: {
        updated_at: { [Op.gt]: since }
      },
      include: [
        { model: require('../database/models').Category, as: 'category', attributes: ['name'] },
        { model: require('../database/models').UnitOfMeasure, as: 'unit', attributes: ['code'] }
      ]
    });

    // Get customers updated since last sync
    const customers = await Customer.findAll({
      where: {
        updated_at: { [Op.gt]: since }
      }
    });

    // Get branch stock
    const stocks = await BranchStock.findAll({
      where: {
        branch_id,
        updated_at: { [Op.gt]: since }
      }
    });

    // Get payment methods
    const paymentMethods = await require('../database/models').PaymentMethod.findAll({
      where: {
        is_active: true,
        updated_at: { [Op.gt]: since }
      }
    });

    // Get categories
    const categories = await require('../database/models').Category.findAll({
      where: {
        is_active: true,
        updated_at: { [Op.gt]: since }
      }
    });

    return success(res, {
      sync_timestamp: new Date().toISOString(),
      products,
      customers,
      stocks,
      payment_methods: paymentMethods,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// Upload offline changes from POS (supports multiple entity types)
exports.uploadOfflineSales = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { branch_id, register_id, items } = req.body;

    const results = {
      processed: 0,
      success: [],
      failed: [],
      duplicates: [],
      conflicts: []
    };

    // Track synced sales for invoice generation (after transaction commits)
    const syncedSalesForInvoicing = [];

    // Group items by entity type
    const groupedItems = {};
    for (const item of items) {
      const entityType = item.entity_type;
      if (!groupedItems[entityType]) {
        groupedItems[entityType] = [];
      }
      groupedItems[entityType].push(item);
    }

    // Process SALE entities
    if (groupedItems['SALE']) {
      for (const item of groupedItems['SALE']) {
        try {
          const saleData = item.data;

          // Check for duplicate by local_id
          const existing = await Sale.findOne({
            where: { local_id: item.local_id, branch_id }
          });

          if (existing) {
            results.duplicates.push({
              local_id: item.local_id,
              entity_type: 'SALE',
              server_id: existing.id,
              message: 'Sale already synced'
            });
            continue;
          }

          // Validate inventory availability
          for (const saleItem of saleData.items) {
            const stock = await BranchStock.findOne({
              where: { branch_id, product_id: saleItem.product_id }
            });

            if (stock && parseFloat(stock.quantity) < saleItem.quantity) {
              results.conflicts.push({
                local_id: item.local_id,
                entity_type: 'SALE',
                conflict_type: 'INSUFFICIENT_STOCK',
                message: `Product ${saleItem.product_name} has insufficient stock (available: ${stock.quantity}, required: ${saleItem.quantity})`
              });
              throw new Error('Insufficient stock');
            }
          }

          // Create sale
          const sale = await Sale.create({
            id: uuidv4(),
            local_id: item.local_id,
            sale_number: `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            branch_id,
            register_id: saleData.register_id,
            session_id: saleData.session_id,
            customer_id: saleData.customer_id,
            seller_id: saleData.created_by,
            subtotal: saleData.subtotal,
            discount_amount: saleData.discount_amount || 0,
            discount_percent: saleData.discount_percent || 0,
            tax_amount: saleData.tax_amount || 0,
            total_amount: saleData.total_amount,
            points_earned: saleData.points_earned || 0,
            points_redeemed: saleData.points_redeemed || 0,
            points_redemption_value: saleData.points_redemption_value || 0,
            credit_used: saleData.credit_used || 0,
            change_as_credit: saleData.change_as_credit || 0,
            status: saleData.status || 'COMPLETED',
            created_by: saleData.created_by,
            invoice_override: saleData.invoice_override || null, // Store invoice override for retry
            synced_at: new Date(),
            created_at: saleData.local_created_at || new Date()
          }, { transaction: t });

          // Create sale items
          for (const saleItem of saleData.items) {
            await SaleItem.create({
              id: uuidv4(),
              sale_id: sale.id,
              product_id: saleItem.product_id,
              quantity: saleItem.quantity,
              unit_price: saleItem.unit_price,
              cost_price: saleItem.cost_price,
              discount_percent: saleItem.discount_percent || 0,
              discount_amount: saleItem.discount_amount || 0,
              tax_rate: saleItem.tax_rate || 0,
              tax_amount: saleItem.tax_amount || 0,
              line_total: saleItem.line_total,
              notes: saleItem.notes
            }, { transaction: t });

            // Update stock (already validated above)
            const stock = await BranchStock.findOne({
              where: { branch_id, product_id: saleItem.product_id }
            });

            if (stock) {
              await stock.update({
                quantity: parseFloat(stock.quantity) - saleItem.quantity,
                updated_at: new Date()
              }, { transaction: t });
            }
          }

          // Create payments
          for (const payment of saleData.payments) {
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
              qr_transaction_id: payment.qr_transaction_id,
              status: 'APPROVED'
            }, { transaction: t });
          }

          results.success.push({
            local_id: item.local_id,
            entity_type: 'SALE',
            server_id: sale.id,
            sale_number: sale.sale_number
          });
          results.processed++;

          // Track sale for invoice generation (with invoice_override from offline data)
          syncedSalesForInvoicing.push({
            sale_id: sale.id,
            branch_id,
            customer_id: saleData.customer_id,
            user_id: saleData.created_by,
            invoice_override: saleData.invoice_override // Preserve from offline sale
          });

        } catch (error) {
          results.failed.push({
            local_id: item.local_id,
            entity_type: 'SALE',
            error: error.message
          });
          logger.error(`Failed to sync sale ${item.local_id}:`, error);
        }
      }
    }

    // Process STOCK_MOVEMENT entities
    if (groupedItems['STOCK_MOVEMENT']) {
      const StockMovement = require('../database/models').StockMovement;

      for (const item of groupedItems['STOCK_MOVEMENT']) {
        try {
          const movementData = item.data;

          // Check for duplicate by local_id
          const existing = await StockMovement.findOne({
            where: { local_id: item.local_id }
          });

          if (existing) {
            results.duplicates.push({
              local_id: item.local_id,
              entity_type: 'STOCK_MOVEMENT',
              server_id: existing.id,
              message: 'Stock movement already synced'
            });
            continue;
          }

          // Create stock movement
          await StockMovement.create({
            id: uuidv4(),
            local_id: item.local_id,
            branch_id: movementData.branch_id,
            product_id: movementData.product_id,
            movement_type: movementData.movement_type,
            quantity: movementData.quantity,
            quantity_before: movementData.quantity_before,
            quantity_after: movementData.quantity_after,
            reference_type: movementData.reference_type,
            reference_id: movementData.reference_id,
            adjustment_reason: movementData.adjustment_reason,
            related_branch_id: movementData.related_branch_id,
            performed_by: movementData.performed_by,
            notes: movementData.notes,
            synced_at: new Date(),
            created_at: movementData.local_created_at || new Date()
          }, { transaction: t });

          results.success.push({
            local_id: item.local_id,
            entity_type: 'STOCK_MOVEMENT',
            server_id: uuidv4()
          });
          results.processed++;

        } catch (error) {
          results.failed.push({
            local_id: item.local_id,
            entity_type: 'STOCK_MOVEMENT',
            error: error.message
          });
          logger.error(`Failed to sync stock movement ${item.local_id}:`, error);
        }
      }
    }

    // Process REGISTER_SESSION entities
    if (groupedItems['REGISTER_SESSION']) {
      const RegisterSession = require('../database/models').RegisterSession;

      for (const item of groupedItems['REGISTER_SESSION']) {
        try {
          const sessionData = item.data;

          // Check for duplicate by local_id
          const existing = await RegisterSession.findOne({
            where: { local_id: item.local_id }
          });

          if (existing) {
            results.duplicates.push({
              local_id: item.local_id,
              entity_type: 'REGISTER_SESSION',
              server_id: existing.id,
              message: 'Register session already synced'
            });
            continue;
          }

          // Handle different operation types (OPEN, CLOSE, CASH_DROP, etc.)
          // This would require more complex logic based on sessionData.operation_type
          // For now, just log it
          logger.info(`Processing register operation: ${sessionData.operation_type} for session ${item.local_id}`);

          results.success.push({
            local_id: item.local_id,
            entity_type: 'REGISTER_SESSION',
            message: 'Logged - full implementation pending'
          });
          results.processed++;

        } catch (error) {
          results.failed.push({
            local_id: item.local_id,
            entity_type: 'REGISTER_SESSION',
            error: error.message
          });
          logger.error(`Failed to sync register session ${item.local_id}:`, error);
        }
      }
    }

    // Log sync
    await SyncLog.create({
      id: uuidv4(),
      branch_id,
      sync_type: 'UPLOAD',
      entity_type: 'MULTI',
      records_processed: items.length,
      records_success: results.success.length,
      records_failed: results.failed.length,
      sync_data: JSON.stringify(results),
      synced_by: req.user?.id
    }, { transaction: t });

    await t.commit();

    // AFTER TRANSACTION COMMITS: Create alerts for sync errors
    if (results.failed.length > 0 || results.conflicts.length > 0) {
      const Branch = require('../database/models').Branch;
      const branch = await Branch.findByPk(branch_id);
      const errorCount = results.failed.length + results.conflicts.length;
      const severity = errorCount > 10 ? 'HIGH' : (errorCount > 5 ? 'MEDIUM' : 'LOW');

      const syncErrorAlert = await Alert.create({
        id: uuidv4(),
        alert_type: 'SYNC_ERROR',
        severity: severity,
        branch_id: branch_id,
        user_id: req.user?.id,
        title: `Errores de sincronización en ${branch?.name || 'sucursal'}`,
        message: `${errorCount} elemento(s) fallaron al sincronizar. Fallos: ${results.failed.length}, Conflictos: ${results.conflicts.length}`,
        reference_type: 'SYNC',
        reference_id: null
      });

      // Emit alert via WebSocket
      const io = req.app.get('io');
      if (io) {
        io.emitToOwners(EVENTS.ALERT_CREATED, {
          alert_id: syncErrorAlert.id,
          type: 'SYNC_ERROR',
          severity: severity,
          branch_name: branch?.name,
          error_count: errorCount,
          failed_count: results.failed.length,
          conflict_count: results.conflicts.length
        }, branch_id);
      }
    }

    // AFTER TRANSACTION COMMITS: Trigger async invoice generation for synced sales
    // This must happen AFTER commit to ensure sale data is persisted
    if (syncedSalesForInvoicing.length > 0) {
      const { generateInvoiceForSale } = require('./sale.controller');

      setImmediate(async () => {
        for (const saleInfo of syncedSalesForInvoicing) {
          try {
            await generateInvoiceForSale(
              saleInfo.sale_id,
              saleInfo.branch_id,
              saleInfo.customer_id,
              saleInfo.user_id,
              saleInfo.invoice_override // Pass invoice_override from offline sale
            );
            logger.info(`Invoice generation triggered for synced sale ${saleInfo.sale_id}`);
          } catch (error) {
            logger.error(`Failed to generate invoice for synced sale ${saleInfo.sale_id}`, {
              error: error.message,
              sale_id: saleInfo.sale_id
            });
          }
        }
      });
    }

    return success(res, {
      ...results,
      server_time: new Date().toISOString()
    }, `Synced ${results.processed} items successfully`);
  } catch (error) {
    await t.rollback();
    logger.error('Sync push failed:', error);
    next(error);
  }
};

// Download data for offline use
exports.downloadForOffline = async (req, res, next) => {
  try {
    const { branch_id } = req.body;

    // Get all active products with stock
    const products = await Product.findAll({
      where: { is_active: true },
      include: [
        { model: require('../database/models').Category, as: 'category', attributes: ['id', 'name'] },
        { model: require('../database/models').UnitOfMeasure, as: 'unit', attributes: ['id', 'code', 'name'] },
        {
          model: BranchStock,
          as: 'branch_stocks',
          where: { branch_id },
          required: false
        }
      ]
    });

    // Format products for offline use
    const offlineProducts = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      short_name: p.short_name,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      tax_rate: p.tax_rate,
      is_tax_included: p.is_tax_included,
      is_weighable: p.is_weighable,
      category_id: p.category_id,
      category_name: p.category?.name,
      unit_id: p.unit_id,
      unit_code: p.unit?.code,
      thumbnail_url: p.thumbnail_url,
      stock_quantity: p.branch_stocks?.[0]?.quantity || 0,
      min_stock: p.branch_stocks?.[0]?.min_stock || 0
    }));

    // Get active customers
    const customers = await Customer.findAll({
      where: { is_active: true },
      attributes: [
        'id', 'customer_code', 'first_name', 'last_name', 'company_name',
        'phone', 'document_number', 'qr_code', 'loyalty_points', 'credit_balance',
        'is_wholesale', 'wholesale_discount_percent'
      ]
    });

    // Get payment methods
    const paymentMethods = await require('../database/models').PaymentMethod.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC']]
    });

    // Get categories
    const categories = await require('../database/models').Category.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    // Log download
    await SyncLog.create({
      id: uuidv4(),
      branch_id,
      sync_type: 'DOWNLOAD',
      entity_type: 'FULL',
      records_processed: products.length + customers.length,
      records_success: products.length + customers.length,
      records_failed: 0,
      synced_by: req.user.id
    });

    return success(res, {
      download_timestamp: new Date().toISOString(),
      products: offlineProducts,
      customers,
      payment_methods: paymentMethods,
      categories,
      counts: {
        products: products.length,
        customers: customers.length,
        payment_methods: paymentMethods.length,
        categories: categories.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get sync status
exports.getSyncStatus = async (req, res, next) => {
  try {
    const { branch_id } = req.params;

    // Get latest sync logs
    const recentSyncs = await SyncLog.findAll({
      where: { branch_id },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Get pending sales count
    const pendingSales = await Sale.count({
      where: {
        branch_id,
        sync_status: 'PENDING'
      }
    });

    // Last successful sync
    const lastSuccessfulSync = await SyncLog.findOne({
      where: {
        branch_id,
        records_failed: 0
      },
      order: [['created_at', 'DESC']]
    });

    return success(res, {
      pending_sales: pendingSales,
      last_sync: lastSuccessfulSync?.created_at,
      recent_syncs: recentSyncs
    });
  } catch (error) {
    next(error);
  }
};

// Force sync specific sale
exports.forceSyncSale = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { sale_id } = req.params;

    const sale = await Sale.findByPk(sale_id);
    if (!sale) {
      throw new BusinessError('Sale not found');
    }

    if (sale.sync_status === 'SYNCED') {
      return success(res, sale, 'Sale already synced');
    }

    await sale.update({
      sync_status: 'SYNCED',
      synced_at: new Date()
    }, { transaction: t });

    await t.commit();

    logger.info(`Sale ${sale_id} force synced`);

    return success(res, sale, 'Sale synced');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Get conflicts for a branch
exports.getConflicts = async (req, res, next) => {
  try {
    const { branch_id } = req.query;

    const where = {
      status: 'CONFLICT'
    };

    if (branch_id) {
      where.branch_id = branch_id;
    }

    // Get all conflict items from sync queue
    const conflicts = await SyncQueue.findAll({
      where,
      include: [
        {
          model: require('../database/models').Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Transform to conflict response format
    const conflictData = conflicts.map(item => ({
      id: item.id,
      local_id: item.entity_local_id,
      entity_type: item.entity_type,
      conflict_type: item.conflict_type || 'UNKNOWN',
      error_message: item.error_message,
      local_created_at: item.local_created_at,
      retry_count: item.retry_count,
      branch: item.branch,
      payload: item.payload
    }));

    return success(res, {
      conflicts: conflictData,
      count: conflictData.length
    });
  } catch (error) {
    next(error);
  }
};

// Resolve sync conflicts
exports.resolveConflict = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params; // SyncQueue item ID
    const { resolution, merged_data } = req.body;

    // Find the conflict in sync queue
    const queueItem = await SyncQueue.findByPk(id, { transaction: t });
    if (!queueItem) {
      throw new BusinessError('Conflict not found', 404);
    }

    if (queueItem.status !== 'CONFLICT') {
      throw new BusinessError('Item is not in conflict state', 400);
    }

    const conflictType = queueItem.conflict_type;
    const entityType = queueItem.entity_type;
    const localId = queueItem.entity_local_id;

    logger.info(`Resolving conflict ${id}: ${entityType} ${localId} with ${resolution}`);

    // Handle different resolution strategies
    switch (resolution) {
      case 'LOCAL_WINS':
        // Retry the sync operation (will attempt to force local data)
        await queueItem.update({
          status: 'PENDING',
          retry_count: 0,
          conflict_type: null,
          conflict_resolution: 'LOCAL_WINS',
          conflict_resolved_by: req.user.id,
          error_message: null
        }, { transaction: t });
        logger.info(`Conflict ${id} marked for retry with LOCAL_WINS`);
        break;

      case 'SERVER_WINS':
        // Discard the local change
        await queueItem.update({
          status: 'FAILED',
          conflict_resolution: 'SERVER_WINS',
          conflict_resolved_by: req.user.id,
          error_message: 'Discarded in favor of server data'
        }, { transaction: t });

        // Also mark related local entity as discarded
        if (entityType === 'SALE') {
          await Sale.update({
            sync_status: 'CONFLICT',
            sync_error: 'Discarded in favor of server data'
          }, {
            where: { local_id: localId },
            transaction: t
          });
        }
        logger.info(`Conflict ${id} resolved with SERVER_WINS - local data discarded`);
        break;

      case 'MERGED':
        // Use merged data provided by user
        if (!merged_data) {
          throw new BusinessError('merged_data required for MERGED resolution', 400);
        }

        await queueItem.update({
          status: 'PENDING',
          retry_count: 0,
          payload: merged_data, // Update payload with merged data
          conflict_type: null,
          conflict_resolution: 'MERGED',
          conflict_resolved_by: req.user.id,
          error_message: null
        }, { transaction: t });
        logger.info(`Conflict ${id} marked for retry with MERGED data`);
        break;

      default:
        throw new BusinessError(`Invalid resolution strategy: ${resolution}`, 400);
    }

    await t.commit();

    return success(res, {
      id: queueItem.id,
      local_id: localId,
      entity_type: entityType,
      resolution,
      message: 'Conflict resolved successfully'
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Get sync logs
exports.getSyncLogs = async (req, res, next) => {
  try {
    const { branch_id, sync_type, start_date, end_date, page = 1, limit = 20 } = req.query;

    const where = {};
    if (branch_id) where.branch_id = branch_id;
    if (sync_type) where.sync_type = sync_type;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await SyncLog.findAndCountAll({
      where,
      include: [
        { model: require('../database/models').Branch, as: 'branch', attributes: ['name', 'code'] },
        { model: require('../database/models').User, as: 'synced_by_user', attributes: ['first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return success(res, {
      logs: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total_items: count,
        total_pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};
