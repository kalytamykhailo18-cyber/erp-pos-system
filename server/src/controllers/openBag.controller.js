const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  OpenBag, Product, Branch, User, BranchStock, StockMovement, Alert, sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset, sortBy, sortOrder } = parsePagination(req.query);
    const { branch_id, product_id, status } = req.query;

    const where = {};
    if (branch_id) where.branch_id = branch_id;
    if (product_id) where.product_id = product_id;
    if (status) where.status = status;

    const { count, rows } = await OpenBag.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'short_name', 'sku', 'weight_size']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'opener',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [[sortBy || 'opened_at', sortOrder || 'DESC']],
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
    const openBag = await OpenBag.findByPk(req.params.id, {
      include: [
        { model: Product, as: 'product' },
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'opener', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'closer', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!openBag) throw new NotFoundError('Open bag not found');
    return success(res, openBag);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { branch_id, product_id, original_weight, low_stock_threshold, notes } = req.body;

    if (!branch_id || !product_id || !original_weight) {
      throw new BadRequestError('branch_id, product_id, and original_weight are required');
    }

    // Verify product exists and is weighable
    const product = await Product.findByPk(product_id);
    if (!product) throw new NotFoundError('Product not found');
    if (!product.is_weighable) {
      throw new BadRequestError('Product must be weighable to open as bag');
    }

    // Check if there's already an open bag for this product at this branch
    const existingOpenBag = await OpenBag.findOne({
      where: {
        branch_id,
        product_id,
        status: 'OPEN'
      }
    });

    if (existingOpenBag) {
      throw new BadRequestError(
        'There is already an open bag for this product at this branch. Close the existing bag first.'
      );
    }

    // Create open bag record
    const openBag = await OpenBag.create({
      id: uuidv4(),
      branch_id,
      product_id,
      original_weight,
      remaining_weight: original_weight,
      low_stock_threshold: low_stock_threshold || (original_weight * 0.15), // Default 15% threshold
      status: 'OPEN',
      opened_at: new Date(),
      opened_by: req.user?.id,
      notes
    }, { transaction: t });

    // Create stock movement (opening a sealed bag reduces sealed inventory)
    await StockMovement.create({
      id: uuidv4(),
      branch_id,
      product_id,
      movement_type: 'ADJUSTMENT_MINUS',
      quantity: -1, // Remove 1 sealed bag from inventory
      quantity_before: 0, // Will be updated by stock sync
      quantity_after: 0, // Will be updated by stock sync
      reference_type: 'OPEN_BAG',
      reference_id: openBag.id,
      adjustment_reason: 'Sealed bag opened for loose sales',
      performed_by: req.user?.id,
      notes: `Opened ${original_weight}kg bag for loose sales`
    }, { transaction: t });

    // Update branch stock (this is simplified - actual implementation should handle sealed vs loose stock separately)
    const branchStock = await BranchStock.findOne({
      where: { branch_id, product_id }
    });

    if (branchStock) {
      // In a real implementation, you'd track sealed vs loose stock separately
      // For now, we just note that a bag was opened
      await branchStock.update({
        updated_at: new Date()
      }, { transaction: t });
    }

    await t.commit();

    // Reload with associations
    await openBag.reload({
      include: [
        { model: Product, as: 'product' },
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
        { model: User, as: 'opener', attributes: ['id', 'name'] }
      ]
    });

    return created(res, openBag, 'Bag opened successfully for loose sales');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.deduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { quantity, sale_id } = req.body;

    if (!quantity || quantity <= 0) {
      throw new BadRequestError('Valid quantity is required');
    }

    const openBag = await OpenBag.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: Branch, as: 'branch' }
      ]
    });

    if (!openBag) throw new NotFoundError('Open bag not found');
    if (openBag.status !== 'OPEN') {
      throw new BadRequestError('Bag is not open');
    }

    const quantityNum = parseFloat(quantity);
    const remainingNum = parseFloat(openBag.remaining_weight);

    if (quantityNum > remainingNum) {
      throw new BadRequestError(
        `Insufficient quantity in bag. Available: ${remainingNum}kg, Requested: ${quantityNum}kg`
      );
    }

    const newRemaining = remainingNum - quantityNum;

    // Update open bag remaining weight
    await openBag.update({
      remaining_weight: newRemaining,
      status: newRemaining === 0 ? 'EMPTY' : 'OPEN',
      closed_at: newRemaining === 0 ? new Date() : null,
      closed_by: newRemaining === 0 ? req.user?.id : null
    }, { transaction: t });

    // Check if low stock threshold reached
    if (openBag.low_stock_threshold && newRemaining > 0 && newRemaining <= openBag.low_stock_threshold) {
      // Create low stock alert
      await Alert.create({
        id: uuidv4(),
        alert_type: 'LOW_STOCK',
        severity: 'MEDIUM',
        branch_id: openBag.branch_id,
        user_id: req.user?.id,
        title: 'Open Bag Running Low',
        message: `${openBag.product.name} - Open bag running low (${newRemaining}kg remaining)`,
        reference_type: 'OPEN_BAG',
        reference_id: openBag.id,
        is_read: false
      }, { transaction: t });
    }

    await t.commit();

    // Reload with associations
    await openBag.reload({
      include: [
        { model: Product, as: 'product' },
        { model: Branch, as: 'branch', attributes: ['id', 'name'] }
      ]
    });

    return success(res, openBag, 'Quantity deducted from open bag');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.close = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const openBag = await OpenBag.findByPk(id);
    if (!openBag) throw new NotFoundError('Open bag not found');
    if (openBag.status !== 'OPEN') {
      throw new BadRequestError('Bag is already closed');
    }

    await openBag.update({
      status: 'EMPTY',
      remaining_weight: 0,
      closed_at: new Date(),
      closed_by: req.user?.id,
      notes: notes || openBag.notes
    });

    return success(res, openBag, 'Bag closed successfully');
  } catch (error) {
    next(error);
  }
};

exports.getOpenBagsByBranch = async (req, res, next) => {
  try {
    const { branchId } = req.params;

    const openBags = await OpenBag.findAll({
      where: {
        branch_id: branchId,
        status: 'OPEN'
      },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'short_name', 'sku', 'weight_size']
        }
      ],
      order: [['opened_at', 'DESC']]
    });

    return success(res, openBags);
  } catch (error) {
    next(error);
  }
};

exports.getLowStockBags = async (req, res, next) => {
  try {
    const { branch_id } = req.query;

    const where = {
      status: 'OPEN',
      [Op.and]: [
        sequelize.where(
          sequelize.col('remaining_weight'),
          Op.lte,
          sequelize.col('low_stock_threshold')
        )
      ]
    };

    if (branch_id) where.branch_id = branch_id;

    const lowStockBags = await OpenBag.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'short_name', 'sku']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['remaining_weight', 'ASC']]
    });

    return success(res, lowStockBags);
  } catch (error) {
    next(error);
  }
};
