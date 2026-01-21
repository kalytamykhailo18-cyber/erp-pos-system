const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const {
  Expense,
  ExpenseCategory,
  Branch,
  User,
  sequelize
} = require('../database/models');
const { NotFoundError, BusinessError, ValidationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class ExpenseService {
  /**
   * Generate next expense number
   */
  async generateExpenseNumber() {
    const year = new Date().getFullYear();
    const prefix = `EXP-${year}-`;

    // Find the last expense number for this year
    const lastExpense = await Expense.findOne({
      where: {
        expense_number: {
          [Op.like]: `${prefix}%`
        }
      },
      order: [['created_at', 'DESC']]
    });

    let nextNumber = 1;
    if (lastExpense) {
      const lastNumber = parseInt(lastExpense.expense_number.split('-').pop());
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(5, '0')}`;
  }

  /**
   * Get all expenses with optional filters and pagination
   */
  async getAllExpenses(filters = {}, pagination = {}) {
    const where = {};

    // Date range filter
    if (filters.from_date || filters.to_date) {
      where.expense_date = {};
      if (filters.from_date) where.expense_date[Op.gte] = filters.from_date;
      if (filters.to_date) where.expense_date[Op.lte] = filters.to_date;
    }

    // Category filter
    if (filters.category_id) {
      where.category_id = filters.category_id;
    }

    // Branch filter
    if (filters.branch_id) {
      where.branch_id = filters.branch_id;
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Search by vendor name or description
    if (filters.search) {
      where[Op.or] = [
        { vendor_name: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } },
        { expense_number: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    // Build order clause
    const sortBy = pagination.sortBy || 'expense_date';
    const sortOrder = pagination.sortOrder || 'DESC';
    const order = sortBy === 'expense_date'
      ? [[sortBy, sortOrder], ['created_at', 'DESC']]
      : [[sortBy, sortOrder]];

    return Expense.findAndCountAll({
      where,
      include: [
        {
          model: ExpenseCategory,
          as: 'category',
          attributes: ['id', 'name', 'color_hex']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false
        }
      ],
      order,
      limit: pagination.limit,
      offset: pagination.offset,
      distinct: true
    });
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(id) {
    const expense = await Expense.findByPk(id, {
      include: [
        {
          model: ExpenseCategory,
          as: 'category'
        },
        {
          model: Branch,
          as: 'branch',
          required: false
        },
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false
        },
        {
          model: Expense,
          as: 'parent',
          required: false,
          attributes: ['id', 'expense_number', 'description']
        }
      ]
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    return expense;
  }

  /**
   * Create a new expense
   */
  async createExpense(data, userId) {
    // Generate expense number
    const expense_number = await this.generateExpenseNumber();

    // Set tax year from expense date if not provided
    const expenseDate = new Date(data.expense_date);
    const tax_year = data.tax_year || expenseDate.getFullYear();

    const expense = await Expense.create({
      id: uuidv4(),
      expense_number,
      ...data,
      tax_year,
      submitted_by: userId,
      status: 'PENDING'
    });

    logger.info(`Expense created: ${expense.expense_number} by user ${userId}`);
    return this.getExpenseById(expense.id);
  }

  /**
   * Update an existing expense
   */
  async updateExpense(id, data, userId) {
    const expense = await this.getExpenseById(id);

    // Only allow updates if expense is not yet paid or rejected
    if (expense.status === 'PAID') {
      throw new BusinessError('Cannot update an expense that has been paid');
    }

    await expense.update(data);

    logger.info(`Expense updated: ${expense.expense_number} by user ${userId}`);
    return this.getExpenseById(expense.id);
  }

  /**
   * Soft delete expense (mark as cancelled)
   */
  async deleteExpense(id, userId) {
    const expense = await this.getExpenseById(id);

    // Only allow deletion if expense is pending or rejected
    if (['APPROVED', 'PAID'].includes(expense.status)) {
      throw new BusinessError('Cannot delete an expense that has been approved or paid');
    }

    await expense.update({ status: 'CANCELLED' });

    logger.info(`Expense deleted: ${expense.expense_number} by user ${userId}`);
    return { success: true, message: 'Expense cancelled successfully' };
  }

  /**
   * Approve expense
   */
  async approveExpense(id, userId) {
    const expense = await this.getExpenseById(id);

    if (expense.status !== 'PENDING') {
      throw new BusinessError(`Cannot approve expense with status: ${expense.status}`);
    }

    await expense.update({
      status: 'APPROVED',
      approved_by: userId,
      approved_at: new Date()
    });

    logger.info(`Expense approved: ${expense.expense_number} by user ${userId}`);
    return this.getExpenseById(expense.id);
  }

  /**
   * Reject expense
   */
  async rejectExpense(id, reason, userId) {
    const expense = await this.getExpenseById(id);

    if (expense.status !== 'PENDING') {
      throw new BusinessError(`Cannot reject expense with status: ${expense.status}`);
    }

    await expense.update({
      status: 'REJECTED',
      rejection_reason: reason,
      approved_by: userId,
      approved_at: new Date()
    });

    logger.info(`Expense rejected: ${expense.expense_number} by user ${userId}`);
    return this.getExpenseById(expense.id);
  }

  /**
   * Mark expense as paid
   */
  async markAsPaid(id, paidDate, userId) {
    const expense = await this.getExpenseById(id);

    if (expense.status !== 'APPROVED') {
      throw new BusinessError('Only approved expenses can be marked as paid');
    }

    await expense.update({
      status: 'PAID',
      paid_date: paidDate || new Date()
    });

    logger.info(`Expense marked as paid: ${expense.expense_number} by user ${userId}`);
    return this.getExpenseById(expense.id);
  }

  /**
   * Get expense statistics
   */
  async getExpenseStats(filters = {}) {
    const where = {};

    // Date range filter
    if (filters.from_date || filters.to_date) {
      where.expense_date = {};
      if (filters.from_date) where.expense_date[Op.gte] = filters.from_date;
      if (filters.to_date) where.expense_date[Op.lte] = filters.to_date;
    }

    // Branch filter
    if (filters.branch_id) {
      where.branch_id = filters.branch_id;
    }

    // Get totals by status
    const totalPending = await Expense.sum('amount', { where: { ...where, status: 'PENDING' } }) || 0;
    const totalApproved = await Expense.sum('amount', { where: { ...where, status: 'APPROVED' } }) || 0;
    const totalPaid = await Expense.sum('amount', { where: { ...where, status: 'PAID' } }) || 0;

    // Count by status
    const countPending = await Expense.count({ where: { ...where, status: 'PENDING' } });
    const countApproved = await Expense.count({ where: { ...where, status: 'APPROVED' } });
    const countPaid = await Expense.count({ where: { ...where, status: 'PAID' } });

    // Get breakdown by category
    const byCategory = await Expense.findAll({
      attributes: [
        'category_id',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('Expense.id')), 'count']
      ],
      where,
      include: [
        {
          model: ExpenseCategory,
          as: 'category',
          attributes: ['name', 'color_hex']
        }
      ],
      group: ['category_id', 'category.id'],
      raw: false
    });

    return {
      total_amount: parseFloat(totalPending) + parseFloat(totalApproved) + parseFloat(totalPaid),
      total_pending: parseFloat(totalPending),
      total_approved: parseFloat(totalApproved),
      total_paid: parseFloat(totalPaid),
      count_pending: countPending,
      count_approved: countApproved,
      count_paid: countPaid,
      by_category: byCategory.map(item => ({
        category_id: item.category_id,
        category_name: item.category?.name || 'Unknown',
        color_hex: item.category?.color_hex || '#3B82F6',
        total: parseFloat(item.get('total')),
        count: parseInt(item.get('count'))
      }))
    };
  }

  /**
   * Get all recurring expenses
   */
  async getRecurringExpenses() {
    return Expense.findAll({
      where: {
        is_recurring: true,
        parent_expense_id: null, // Only get templates, not instances
        status: { [Op.ne]: 'CANCELLED' }
      },
      include: [
        {
          model: ExpenseCategory,
          as: 'category',
          attributes: ['id', 'name', 'color_hex']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['expense_date', 'DESC']]
    });
  }

  /**
   * Create recurring instance from parent expense
   */
  async createRecurringInstance(parentId, userId) {
    const parent = await this.getExpenseById(parentId);

    if (!parent.is_recurring) {
      throw new BusinessError('This expense is not marked as recurring');
    }

    // Generate new expense date based on recurrence pattern
    const lastInstance = await Expense.findOne({
      where: { parent_expense_id: parentId },
      order: [['expense_date', 'DESC']]
    });

    const baseDate = lastInstance ? new Date(lastInstance.expense_date) : new Date(parent.expense_date);
    let newDate = new Date(baseDate);

    switch (parent.recurrence_pattern) {
      case 'MONTHLY':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        newDate.setMonth(newDate.getMonth() + 3);
        break;
      case 'YEARLY':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
      default:
        throw new BusinessError('Invalid recurrence pattern');
    }

    // Set to specified day if provided
    if (parent.recurrence_day) {
      newDate.setDate(parent.recurrence_day);
    }

    // Create new instance
    const newExpense = await this.createExpense({
      category_id: parent.category_id,
      branch_id: parent.branch_id,
      description: parent.description,
      amount: parent.amount,
      payment_method: parent.payment_method,
      vendor_name: parent.vendor_name,
      vendor_tax_id: parent.vendor_tax_id,
      expense_date: newDate.toISOString().split('T')[0],
      due_date: newDate.toISOString().split('T')[0],
      is_recurring: false,
      parent_expense_id: parentId,
      account_code: parent.account_code,
      is_tax_deductible: parent.is_tax_deductible
    }, userId);

    logger.info(`Recurring expense instance created from ${parent.expense_number} by user ${userId}`);
    return newExpense;
  }

  /**
   * Upload receipt for expense
   */
  async uploadReceipt(id, receiptUrl, userId) {
    const expense = await this.getExpenseById(id);

    await expense.update({ receipt_url: receiptUrl });

    logger.info(`Receipt uploaded for expense: ${expense.expense_number} by user ${userId}`);
    return this.getExpenseById(expense.id);
  }

  // ==================== EXPENSE CATEGORIES ====================

  /**
   * Get all expense categories
   */
  async getAllCategories(includeInactive = false) {
    const where = includeInactive ? {} : { is_active: true };

    return ExpenseCategory.findAll({
      where,
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id) {
    const category = await ExpenseCategory.findByPk(id);

    if (!category) {
      throw new NotFoundError('Expense category not found');
    }

    return category;
  }

  /**
   * Create expense category
   */
  async createCategory(data, userId) {
    const category = await ExpenseCategory.create({
      id: uuidv4(),
      ...data
    });

    logger.info(`Expense category created: ${category.name} by user ${userId}`);
    return category;
  }

  /**
   * Update expense category
   */
  async updateCategory(id, data, userId) {
    const category = await this.getCategoryById(id);

    if (category.is_system && data.is_active === false) {
      throw new BusinessError('Cannot deactivate system categories');
    }

    await category.update(data);

    logger.info(`Expense category updated: ${category.name} by user ${userId}`);
    return category;
  }

  /**
   * Delete expense category
   */
  async deleteCategory(id, userId) {
    const category = await this.getCategoryById(id);

    if (category.is_system) {
      throw new BusinessError('Cannot delete system categories');
    }

    // Check if category is used in any expenses
    const usageCount = await Expense.count({
      where: { category_id: id }
    });

    if (usageCount > 0) {
      throw new BusinessError(`Cannot delete category "${category.name}" - it is used in ${usageCount} expenses`);
    }

    await category.destroy();

    logger.info(`Expense category deleted: ${category.name} by user ${userId}`);
    return { success: true, message: 'Expense category deleted successfully' };
  }
}

module.exports = new ExpenseService();
