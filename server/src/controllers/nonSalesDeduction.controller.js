const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  NonSalesDeduction, Product, Branch, User, StockMovement, BranchStock, OpenBag, sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset, sortBy, sortOrder } = parsePagination(req.query);
    const { branch_id, approval_status, deduction_type } = req.query;

    const where = {};
    if (branch_id) where.branch_id = branch_id;
    if (approval_status) where.approval_status = approval_status;
    if (deduction_type) where.deduction_type = deduction_type;

    const { count, rows } = await NonSalesDeduction.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'short_name', 'sku', 'is_weighable']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [[sortBy || 'created_at', sortOrder || 'DESC']],
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
    const deduction = await NonSalesDeduction.findByPk(req.params.id, {
      include: [
        { model: Product, as: 'product' },
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
        { model: StockMovement, as: 'stock_movement' }
      ]
    });

    if (!deduction) throw new NotFoundError('Non-sales deduction not found');
    return success(res, deduction);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      branch_id,
      product_id,
      quantity,
      deduction_type,
      reason,
      recipient
    } = req.body;

    if (!branch_id || !product_id || !quantity || !deduction_type) {
      throw new BadRequestError('branch_id, product_id, quantity, and deduction_type are required');
    }

    if (!['FREE_SAMPLE', 'DONATION'].includes(deduction_type)) {
      throw new BadRequestError('deduction_type must be FREE_SAMPLE or DONATION');
    }

    // Verify product exists
    const product = await Product.findByPk(product_id);
    if (!product) throw new NotFoundError('Product not found');

    // Verify branch exists
    const branch = await Branch.findByPk(branch_id);
    if (!branch) throw new NotFoundError('Branch not found');

    // Create deduction request (status = PENDING, awaiting manager approval)
    const deduction = await NonSalesDeduction.create({
      id: uuidv4(),
      branch_id,
      product_id,
      quantity: parseFloat(quantity),
      deduction_type,
      reason,
      recipient,
      requested_by: req.user.id,
      approval_status: 'PENDING'
    });

    // Reload with associations
    await deduction.reload({
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'short_name'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
        { model: User, as: 'requester', attributes: ['id', 'name'] }
      ]
    });

    return created(res, deduction, 'Deduction request created. Awaiting manager approval.');
  } catch (error) {
    next(error);
  }
};

exports.approve = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    // Verify user is manager or owner
    if (!['MANAGER', 'OWNER'].includes(req.user.role_name)) {
      throw new ForbiddenError('Only managers and owners can approve deduction requests');
    }

    const deduction = await NonSalesDeduction.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: Branch, as: 'branch' }
      ]
    });

    if (!deduction) throw new NotFoundError('Deduction request not found');

    if (deduction.approval_status !== 'PENDING') {
      throw new BadRequestError(`Deduction is already ${deduction.approval_status.toLowerCase()}`);
    }

    const quantityNum = parseFloat(deduction.quantity);

    // Check stock availability
    const branchStock = await BranchStock.findOne({
      where: {
        branch_id: deduction.branch_id,
        product_id: deduction.product_id
      }
    });

    if (!branchStock || parseFloat(branchStock.quantity) < quantityNum) {
      throw new BadRequestError('Insufficient stock to complete deduction');
    }

    const quantityBefore = parseFloat(branchStock.quantity);
    const quantityAfter = quantityBefore - quantityNum;

    // Create stock movement
    const stockMovement = await StockMovement.create({
      id: uuidv4(),
      branch_id: deduction.branch_id,
      product_id: deduction.product_id,
      movement_type: 'NON_SALES_DEDUCTION',
      quantity: -quantityNum,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      reference_type: 'NON_SALES_DEDUCTION',
      reference_id: deduction.id,
      adjustment_reason: `${deduction.deduction_type}: ${deduction.reason || 'No reason provided'}`,
      performed_by: req.user.id,
      notes: deduction.recipient ? `Recipient: ${deduction.recipient}` : null
    }, { transaction: t });

    // Update branch stock
    await branchStock.update({
      quantity: quantityAfter
    }, { transaction: t });

    // If product is weighable, try to deduct from open bag
    if (deduction.product.is_weighable) {
      const openBag = await OpenBag.findOne({
        where: {
          branch_id: deduction.branch_id,
          product_id: deduction.product_id,
          status: 'OPEN'
        }
      });

      if (openBag) {
        const remainingNum = parseFloat(openBag.remaining_weight);
        if (remainingNum >= quantityNum) {
          const newRemaining = remainingNum - quantityNum;
          await openBag.update({
            remaining_weight: newRemaining,
            status: newRemaining === 0 ? 'EMPTY' : 'OPEN',
            closed_at: newRemaining === 0 ? new Date() : null,
            closed_by: newRemaining === 0 ? req.user.id : null
          }, { transaction: t });
        }
      }
    }

    // Update deduction record
    await deduction.update({
      approval_status: 'APPROVED',
      approved_by: req.user.id,
      approved_at: new Date(),
      stock_movement_id: stockMovement.id
    }, { transaction: t });

    await t.commit();

    // Reload with all associations
    await deduction.reload({
      include: [
        { model: Product, as: 'product' },
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
        { model: User, as: 'requester', attributes: ['id', 'name'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] },
        { model: StockMovement, as: 'stock_movement' }
      ]
    });

    return success(res, deduction, 'Deduction approved and stock updated');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.reject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    // Verify user is manager or owner
    if (!['MANAGER', 'OWNER'].includes(req.user.role_name)) {
      throw new ForbiddenError('Only managers and owners can reject deduction requests');
    }

    const deduction = await NonSalesDeduction.findByPk(id);
    if (!deduction) throw new NotFoundError('Deduction request not found');

    if (deduction.approval_status !== 'PENDING') {
      throw new BadRequestError(`Deduction is already ${deduction.approval_status.toLowerCase()}`);
    }

    await deduction.update({
      approval_status: 'REJECTED',
      approved_by: req.user.id,
      approved_at: new Date(),
      rejection_reason: rejection_reason || 'Rejected by manager'
    });

    // Reload with associations
    await deduction.reload({
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name'] },
        { model: User, as: 'requester', attributes: ['id', 'name'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] }
      ]
    });

    return success(res, deduction, 'Deduction request rejected');
  } catch (error) {
    next(error);
  }
};

exports.getPending = async (req, res, next) => {
  try {
    const { branch_id } = req.query;

    const where = { approval_status: 'PENDING' };
    if (branch_id) where.branch_id = branch_id;

    const pendingDeductions = await NonSalesDeduction.findAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'short_name', 'sku'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
        { model: User, as: 'requester', attributes: ['id', 'name', 'email'] }
      ],
      order: [['created_at', 'ASC']]
    });

    return success(res, pendingDeductions);
  } catch (error) {
    next(error);
  }
};
