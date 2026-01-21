const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  BranchStock, Product, Branch, StockMovement, StockTransfer, StockTransferItem,
  User, sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.getBranchStock = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    // Support both :branchId param and branch_id query param
    const branch_id = req.params.branchId || req.params.branch_id || req.query.branch_id;
    const { low_stock, search, category_id } = req.query;

    const where = {};
    if (branch_id) where.branch_id = branch_id;

    const productWhere = { is_active: true };
    if (category_id) productWhere.category_id = category_id;
    if (search) {
      productWhere[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { barcode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (low_stock === 'true') {
      where[Op.and] = [
        sequelize.where(
          sequelize.col('quantity'),
          Op.lte,
          sequelize.col('min_stock')
        )
      ];
    }

    const { count, rows } = await BranchStock.findAndCountAll({
      where,
      include: [{
        model: Product,
        as: 'product',
        where: productWhere,
        required: true
      }],
      order: [[{ model: Product, as: 'product' }, 'name', 'ASC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.getProductStock = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    const stocks = await BranchStock.findAll({
      where: { product_id },
      include: [{ model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] }]
    });

    return success(res, stocks);
  } catch (error) {
    next(error);
  }
};

exports.adjustStock = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { branch_id, product_id, quantity, reason, notes } = req.body;

    let stock = await BranchStock.findOne({
      where: { branch_id, product_id }
    });

    if (!stock) {
      stock = await BranchStock.create({
        id: uuidv4(),
        branch_id,
        product_id,
        quantity: 0,
        reserved_quantity: 0,
        expected_shrinkage: 0,
        actual_shrinkage: 0
      }, { transaction: t });
    }

    const previousQuantity = parseFloat(stock.quantity);
    const newQuantity = previousQuantity + quantity;

    if (newQuantity < 0) {
      throw new BusinessError('Stock cannot be negative');
    }

    await stock.update({ quantity: newQuantity }, { transaction: t });

    const movement = await StockMovement.create({
      id: uuidv4(),
      branch_id,
      product_id,
      movement_type: quantity > 0 ? 'ADJUSTMENT_PLUS' : 'ADJUSTMENT_MINUS',
      quantity: Math.abs(quantity),
      quantity_before: previousQuantity,
      quantity_after: newQuantity,
      adjustment_reason: reason,
      notes,
      performed_by: req.user.id
    }, { transaction: t });

    await t.commit();
    return success(res, { stock, movement });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.updateMinMax = async (req, res, next) => {
  try {
    const { branch_id, product_id, min_stock, max_stock } = req.body;

    let stock = await BranchStock.findOne({
      where: { branch_id, product_id }
    });

    if (!stock) {
      stock = await BranchStock.create({
        id: uuidv4(),
        branch_id,
        product_id,
        quantity: 0,
        min_stock: min_stock || 0,
        max_stock: max_stock || 0
      });
    } else {
      await stock.update({ min_stock, max_stock });
    }

    return success(res, stock);
  } catch (error) {
    next(error);
  }
};

exports.getMovements = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { branch_id, product_id, movement_type, start_date, end_date } = req.query;

    const where = {};
    if (branch_id) where.branch_id = branch_id;
    if (product_id) where.product_id = product_id;
    if (movement_type) where.movement_type = movement_type;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const { count, rows } = await StockMovement.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['name', 'sku'] },
        { model: Branch, as: 'branch', attributes: ['name', 'code'] },
        { model: User, as: 'performer', attributes: ['first_name', 'last_name'] }
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

// Stock Transfers
exports.getTransfers = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { from_branch_id, to_branch_id, status } = req.query;

    const where = {};
    if (from_branch_id) where.source_branch_id = from_branch_id;
    if (to_branch_id) where.destination_branch_id = to_branch_id;
    if (status) where.status = status;

    const { count, rows } = await StockTransfer.findAndCountAll({
      where,
      include: [
        { model: Branch, as: 'source_branch', attributes: ['name', 'code'] },
        { model: Branch, as: 'destination_branch', attributes: ['name', 'code'] },
        { model: User, as: 'requester', attributes: ['first_name', 'last_name'] }
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

exports.getTransferById = async (req, res, next) => {
  try {
    const transfer = await StockTransfer.findByPk(req.params.id, {
      include: [
        { model: Branch, as: 'source_branch' },
        { model: Branch, as: 'destination_branch' },
        { model: User, as: 'requester', attributes: ['first_name', 'last_name'] },
        { model: User, as: 'approver', attributes: ['first_name', 'last_name'] },
        { model: User, as: 'shipper', attributes: ['first_name', 'last_name'] },
        { model: User, as: 'receiver', attributes: ['first_name', 'last_name'] },
        {
          model: StockTransferItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['name', 'sku'] }]
        }
      ]
    });

    if (!transfer) throw new NotFoundError('Transfer not found');
    return success(res, transfer);
  } catch (error) {
    next(error);
  }
};

exports.createTransfer = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { from_branch_id, to_branch_id, items, notes } = req.body;

    const transfer = await StockTransfer.create({
      id: uuidv4(),
      transfer_number: `TR-${Date.now()}`,
      source_branch_id: from_branch_id,
      destination_branch_id: to_branch_id,
      status: 'PENDING',
      notes,
      requested_by: req.user.id,
      requested_at: new Date()
    }, { transaction: t });

    for (const item of items) {
      await StockTransferItem.create({
        id: uuidv4(),
        transfer_id: transfer.id,
        product_id: item.product_id,
        requested_quantity: item.quantity,
        shipped_quantity: 0,
        received_quantity: 0
      }, { transaction: t });
    }

    await t.commit();

    const createdTransfer = await StockTransfer.findByPk(transfer.id, {
      include: [
        { model: Branch, as: 'source_branch' },
        { model: Branch, as: 'destination_branch' },
        { model: StockTransferItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    return created(res, createdTransfer);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.approveTransfer = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const transfer = await StockTransfer.findByPk(req.params.id, {
      include: [{ model: StockTransferItem, as: 'items' }]
    });

    if (!transfer) throw new NotFoundError('Transfer not found');
    if (transfer.status !== 'PENDING') {
      throw new BusinessError('Transfer is not pending approval');
    }

    // Update items with sent quantities and deduct from source branch
    for (const item of req.body.items) {
      const transferItem = transfer.items.find((i) => i.id === item.id);
      if (!transferItem) continue;

      await transferItem.update({ shipped_quantity: item.shipped_quantity }, { transaction: t });

      // Deduct from source branch
      const sourceStock = await BranchStock.findOne({
        where: { branch_id: transfer.source_branch_id, product_id: transferItem.product_id }
      });

      if (!sourceStock || sourceStock.quantity < item.shipped_quantity) {
        throw new BusinessError(`Insufficient stock for product ${transferItem.product_id}`);
      }

      const newQuantity = parseFloat(sourceStock.quantity) - item.shipped_quantity;
      await sourceStock.update({ quantity: newQuantity }, { transaction: t });

      // Create movement record
      await StockMovement.create({
        id: uuidv4(),
        branch_id: transfer.source_branch_id,
        product_id: transferItem.product_id,
        movement_type: 'TRANSFER_OUT',
        quantity: item.shipped_quantity,
        quantity_before: sourceStock.quantity,
        quantity_after: newQuantity,
        reference_type: 'TRANSFER',
        reference_id: transfer.id,
        performed_by: req.user.id
      }, { transaction: t });
    }

    await transfer.update({
      status: 'IN_TRANSIT',
      approved_by: req.user.id,
      approved_at: new Date(),
      shipped_by: req.user.id,
      shipped_at: new Date()
    }, { transaction: t });

    await t.commit();
    return success(res, transfer, 'Transfer approved and in transit');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.receiveTransfer = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const transfer = await StockTransfer.findByPk(req.params.id, {
      include: [{ model: StockTransferItem, as: 'items' }]
    });

    if (!transfer) throw new NotFoundError('Transfer not found');
    if (transfer.status !== 'IN_TRANSIT') {
      throw new BusinessError('Transfer is not in transit');
    }

    // Update items with received quantities and add to destination branch
    for (const item of req.body.items) {
      const transferItem = transfer.items.find((i) => i.id === item.item_id);
      if (!transferItem) continue;

      await transferItem.update({ received_quantity: item.quantity_received }, { transaction: t });

      // Add to destination branch
      let destStock = await BranchStock.findOne({
        where: { branch_id: transfer.destination_branch_id, product_id: transferItem.product_id }
      });

      const previousQuantity = destStock ? parseFloat(destStock.quantity) : 0;
      const newQuantity = previousQuantity + item.quantity_received;

      if (!destStock) {
        destStock = await BranchStock.create({
          id: uuidv4(),
          branch_id: transfer.destination_branch_id,
          product_id: transferItem.product_id,
          quantity: newQuantity,
          reserved_quantity: 0,
          expected_shrinkage: 0,
          actual_shrinkage: 0
        }, { transaction: t });
      } else {
        await destStock.update({ quantity: newQuantity }, { transaction: t });
      }

      // Create movement record
      await StockMovement.create({
        id: uuidv4(),
        branch_id: transfer.destination_branch_id,
        product_id: transferItem.product_id,
        movement_type: 'TRANSFER_IN',
        quantity: item.quantity_received,
        quantity_before: previousQuantity,
        quantity_after: newQuantity,
        reference_type: 'TRANSFER',
        reference_id: transfer.id,
        performed_by: req.user.id
      }, { transaction: t });
    }

    await transfer.update({
      status: 'RECEIVED',
      received_by: req.user.id,
      received_at: new Date()
    }, { transaction: t });

    await t.commit();
    return success(res, transfer, 'Transfer received');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.cancelTransfer = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const transfer = await StockTransfer.findByPk(req.params.id, {
      include: [{ model: StockTransferItem, as: 'items' }]
    });

    if (!transfer) throw new NotFoundError('Transfer not found');
    if (transfer.status === 'RECEIVED') {
      throw new BusinessError('Cannot cancel received transfer');
    }

    // If in transit, restore stock to source branch
    if (transfer.status === 'IN_TRANSIT') {
      for (const item of transfer.items) {
        const sourceStock = await BranchStock.findOne({
          where: { branch_id: transfer.source_branch_id, product_id: item.product_id }
        });

        if (sourceStock) {
          const newQuantity = parseFloat(sourceStock.quantity) + parseFloat(item.shipped_quantity);
          await sourceStock.update({ quantity: newQuantity }, { transaction: t });

          await StockMovement.create({
            id: uuidv4(),
            branch_id: transfer.source_branch_id,
            product_id: item.product_id,
            movement_type: 'ADJUSTMENT_PLUS',
            quantity: item.shipped_quantity,
            quantity_before: sourceStock.quantity,
            quantity_after: newQuantity,
            reference_type: 'TRANSFER_CANCELLATION',
            reference_id: transfer.id,
            adjustment_reason: 'TRANSFER_CANCELLED',
            notes: `Transfer ${transfer.transfer_number} cancelled - stock restored`,
            performed_by: req.user.id
          }, { transaction: t });
        }
      }
    }

    await transfer.update({
      status: 'CANCELLED',
      notes: `${transfer.notes || ''}\nCancelled by ${req.user.first_name} ${req.user.last_name}: ${req.body.reason || ''}`
    }, { transaction: t });

    await t.commit();
    return success(res, null, 'Transfer cancelled');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Shrinkage
exports.getShrinkage = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { branch_id, product_id, reason, start_date, end_date } = req.query;

    const where = { movement_type: 'SHRINKAGE' };
    if (branch_id) where.branch_id = branch_id;
    if (product_id) where.product_id = product_id;
    if (reason) where.adjustment_reason = reason;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const { count, rows } = await StockMovement.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['name', 'sku'] },
        { model: Branch, as: 'branch', attributes: ['name', 'code'] },
        { model: User, as: 'performer', attributes: ['first_name', 'last_name'] }
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

exports.recordShrinkage = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { branch_id, product_id, quantity, reason, notes } = req.body;

    // Get current stock
    const stock = await BranchStock.findOne({
      where: { branch_id, product_id }
    });

    if (!stock) throw new NotFoundError('Stock record not found');

    const previousQuantity = parseFloat(stock.quantity);
    const newQuantity = previousQuantity - quantity;

    if (newQuantity < 0) {
      throw new BusinessError('Shrinkage quantity exceeds available stock');
    }

    // Update stock
    await stock.update({ quantity: newQuantity }, { transaction: t });

    // Create movement record with movement_type='SHRINKAGE'
    const movement = await StockMovement.create({
      id: uuidv4(),
      branch_id,
      product_id,
      movement_type: 'SHRINKAGE',
      quantity,
      quantity_before: previousQuantity,
      quantity_after: newQuantity,
      reference_type: 'ADJUSTMENT',
      adjustment_reason: reason,
      notes,
      performed_by: req.user.id
    }, { transaction: t });

    await t.commit();
    return created(res, movement);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getShrinkageReport = async (req, res, next) => {
  try {
    const { branch_id, start_date, end_date } = req.query;

    const where = { movement_type: 'SHRINKAGE' };
    if (branch_id) where.branch_id = branch_id;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    // Group by reason
    const byReason = await StockMovement.findAll({
      where,
      attributes: [
        'adjustment_reason',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['adjustment_reason']
    });

    // Group by product
    const byProduct = await StockMovement.findAll({
      where,
      attributes: [
        'product_id',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity']
      ],
      include: [{ model: Product, as: 'product', attributes: ['name', 'sku', 'cost_price'] }],
      group: ['product_id', 'product.id', 'product.name', 'product.sku', 'product.cost_price'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: 20
    });

    // Total loss
    const totals = await StockMovement.findOne({
      where,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_records']
      ]
    });

    return success(res, {
      by_reason: byReason,
      by_product: byProduct,
      totals: totals?.toJSON() || { total_quantity: 0, total_records: 0 }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit physical inventory count
 * Processes counted quantities and creates adjustment movements for variances
 */
exports.submitInventoryCount = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { branch_id, entries, notes } = req.body;

    // Validate branch exists
    const branch = await Branch.findByPk(branch_id);
    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    const results = {
      processed: 0,
      adjustments: 0,
      no_change: 0,
      details: []
    };

    // Process each inventory count entry
    for (const entry of entries) {
      const { product_id, counted_quantity } = entry;

      // Get or create BranchStock record
      let stock = await BranchStock.findOne({
        where: { branch_id, product_id },
        transaction: t
      });

      const countedQty = parseFloat(counted_quantity);
      let previousQty = 0;

      if (!stock) {
        // No existing stock record - create one with counted quantity
        stock = await BranchStock.create({
          id: uuidv4(),
          branch_id,
          product_id,
          quantity: countedQty,
          reserved_quantity: 0,
          expected_shrinkage: 0,
          actual_shrinkage: 0,
          last_counted_at: new Date(),
          last_counted_quantity: countedQty,
          min_stock: null,
          max_stock: null
        }, { transaction: t });

        // Create INITIAL movement
        await StockMovement.create({
          id: uuidv4(),
          branch_id,
          product_id,
          movement_type: 'INITIAL',
          quantity: countedQty,
          quantity_before: 0,
          quantity_after: countedQty,
          reference_type: 'INVENTORY_COUNT',
          reference_id: null,
          adjustment_reason: 'INVENTORY_COUNT',
          notes: notes || 'Initial inventory count',
          performed_by: req.user.id
        }, { transaction: t });

        results.processed++;
        results.adjustments++;
        results.details.push({
          product_id,
          previous_quantity: 0,
          counted_quantity: countedQty,
          variance: countedQty,
          action: 'INITIAL'
        });
      } else {
        // Existing stock - calculate variance
        previousQty = parseFloat(stock.quantity);
        const variance = countedQty - previousQty;

        // Update stock with counted quantity and last count info
        await stock.update({
          quantity: countedQty,
          last_counted_at: new Date(),
          last_counted_quantity: countedQty
        }, { transaction: t });

        if (variance !== 0) {
          // Create adjustment movement for variance
          const movementType = variance > 0 ? 'ADJUSTMENT_PLUS' : 'ADJUSTMENT_MINUS';

          await StockMovement.create({
            id: uuidv4(),
            branch_id,
            product_id,
            movement_type: movementType,
            quantity: Math.abs(variance),
            quantity_before: previousQty,
            quantity_after: countedQty,
            reference_type: 'INVENTORY_COUNT',
            reference_id: null,
            adjustment_reason: 'INVENTORY_COUNT',
            notes: notes || `Inventory count variance: ${variance > 0 ? '+' : ''}${variance}`,
            performed_by: req.user.id
          }, { transaction: t });

          results.adjustments++;
          results.details.push({
            product_id,
            previous_quantity: previousQty,
            counted_quantity: countedQty,
            variance,
            action: movementType
          });
        } else {
          // No variance - just update last counted info
          results.no_change++;
          results.details.push({
            product_id,
            previous_quantity: previousQty,
            counted_quantity: countedQty,
            variance: 0,
            action: 'NO_CHANGE'
          });
        }

        results.processed++;
      }
    }

    await t.commit();

    logger.info(`Inventory count submitted for branch ${branch_id} by user ${req.user.id}: ${results.processed} items processed, ${results.adjustments} adjustments`);

    return success(res, results, 'Inventory count processed successfully');
  } catch (error) {
    await t.rollback();
    logger.error('Error submitting inventory count', { error: error.message, stack: error.stack });
    next(error);
  }
};
