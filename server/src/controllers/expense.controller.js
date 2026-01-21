const expenseService = require('../services/expense.service');
const { success, created, paginated } = require('../utils/apiResponse');
const { parsePagination } = require('../utils/helpers');

/**
 * Get all expenses with filters and pagination
 */
exports.getAllExpenses = async (req, res, next) => {
  try {
    const { page, limit, offset, sortBy, sortOrder } = parsePagination(req.query);

    const filters = {
      from_date: req.query.from_date,
      to_date: req.query.to_date,
      category_id: req.query.category_id,
      branch_id: req.query.branch_id,
      status: req.query.status,
      search: req.query.search
    };

    const { rows: expenses, count: total } = await expenseService.getAllExpenses(filters, { limit, offset, sortBy, sortOrder });
    return paginated(res, expenses, { page, limit, total_items: total });
  } catch (error) {
    next(error);
  }
};

/**
 * Get expense by ID
 */
exports.getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await expenseService.getExpenseById(id);
    return success(res, expense, 'Expense retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create new expense
 */
exports.createExpense = async (req, res, next) => {
  try {
    const expenseData = {
      category_id: req.body.category_id,
      branch_id: req.body.branch_id,
      description: req.body.description,
      amount: req.body.amount,
      payment_method: req.body.payment_method,
      vendor_name: req.body.vendor_name,
      vendor_tax_id: req.body.vendor_tax_id,
      invoice_number: req.body.invoice_number,
      expense_date: req.body.expense_date,
      due_date: req.body.due_date,
      is_recurring: req.body.is_recurring,
      recurrence_pattern: req.body.recurrence_pattern,
      recurrence_day: req.body.recurrence_day,
      account_code: req.body.account_code,
      is_tax_deductible: req.body.is_tax_deductible,
      tax_year: req.body.tax_year,
      notes: req.body.notes
    };

    const expense = await expenseService.createExpense(expenseData, req.user.id);
    return created(res, expense, 'Expense created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update expense
 */
exports.updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expenseData = {
      category_id: req.body.category_id,
      branch_id: req.body.branch_id,
      description: req.body.description,
      amount: req.body.amount,
      payment_method: req.body.payment_method,
      vendor_name: req.body.vendor_name,
      vendor_tax_id: req.body.vendor_tax_id,
      invoice_number: req.body.invoice_number,
      expense_date: req.body.expense_date,
      due_date: req.body.due_date,
      account_code: req.body.account_code,
      is_tax_deductible: req.body.is_tax_deductible,
      notes: req.body.notes
    };

    const expense = await expenseService.updateExpense(id, expenseData, req.user.id);
    return success(res, expense, 'Expense updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete expense
 */
exports.deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await expenseService.deleteExpense(id, req.user.id);
    return success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * Approve expense
 */
exports.approveExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await expenseService.approveExpense(id, req.user.id);
    return success(res, expense, 'Expense approved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reject expense
 */
exports.rejectExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const expense = await expenseService.rejectExpense(id, reason, req.user.id);
    return success(res, expense, 'Expense rejected');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark expense as paid
 */
exports.markAsPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paid_date } = req.body;
    const expense = await expenseService.markAsPaid(id, paid_date, req.user.id);
    return success(res, expense, 'Expense marked as paid');
  } catch (error) {
    next(error);
  }
};

/**
 * Get expense statistics
 */
exports.getExpenseStats = async (req, res, next) => {
  try {
    const filters = {
      from_date: req.query.from_date,
      to_date: req.query.to_date,
      branch_id: req.query.branch_id
    };

    const stats = await expenseService.getExpenseStats(filters);
    return success(res, stats, 'Expense statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get recurring expenses
 */
exports.getRecurringExpenses = async (req, res, next) => {
  try {
    const expenses = await expenseService.getRecurringExpenses();
    return success(res, expenses, 'Recurring expenses retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create recurring instance
 */
exports.createRecurringInstance = async (req, res, next) => {
  try {
    const { parent_id } = req.body;
    const expense = await expenseService.createRecurringInstance(parent_id, req.user.id);
    return created(res, expense, 'Recurring expense instance created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload receipt
 */
exports.uploadReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { receipt_url } = req.body;
    const expense = await expenseService.uploadReceipt(id, receipt_url, req.user.id);
    return success(res, expense, 'Receipt uploaded successfully');
  } catch (error) {
    next(error);
  }
};

// ==================== EXPENSE CATEGORIES ====================

/**
 * Get all expense categories
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    const { include_inactive } = req.query;
    const categories = await expenseService.getAllCategories(include_inactive === 'true');
    return success(res, categories, 'Expense categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await expenseService.getCategoryById(id);
    return success(res, category, 'Expense category retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create expense category
 */
exports.createCategory = async (req, res, next) => {
  try {
    const categoryData = {
      name: req.body.name,
      description: req.body.description,
      color_hex: req.body.color_hex,
      is_system: req.body.is_system,
      is_active: req.body.is_active
    };

    const category = await expenseService.createCategory(categoryData, req.user.id);
    return created(res, category, 'Expense category created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update expense category
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoryData = {
      name: req.body.name,
      description: req.body.description,
      color_hex: req.body.color_hex,
      is_active: req.body.is_active
    };

    const category = await expenseService.updateCategory(id, categoryData, req.user.id);
    return success(res, category, 'Expense category updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete expense category
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await expenseService.deleteCategory(id, req.user.id);
    return success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};
