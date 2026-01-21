const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  stringField,
  booleanField,
  decimalField,
  integerField,
  dateField,
  enumField,
  query
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

// ==================== EXPENSES ====================

/**
 * @route   GET /api/v1/expenses
 * @desc    Get all expenses with filters
 * @access  Private
 */
router.get(
  '/',
  [
    query('from_date').optional().isDate(),
    query('to_date').optional().isDate(),
    query('category_id').optional().isUUID(),
    query('branch_id').optional().isUUID(),
    query('status').optional().isIn(['PENDING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED']),
    query('search').optional().isString(),
    validate
  ],
  expenseController.getAllExpenses
);

/**
 * @route   GET /api/v1/expenses/stats
 * @desc    Get expense statistics
 * @access  Private
 */
router.get(
  '/stats',
  [
    query('from_date').optional().isDate(),
    query('to_date').optional().isDate(),
    query('branch_id').optional().isUUID(),
    validate
  ],
  expenseController.getExpenseStats
);

/**
 * @route   GET /api/v1/expenses/recurring
 * @desc    Get all recurring expense templates
 * @access  Private
 */
router.get(
  '/recurring',
  expenseController.getRecurringExpenses
);

/**
 * @route   GET /api/v1/expenses/:id
 * @desc    Get expense by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  expenseController.getExpenseById
);

/**
 * @route   POST /api/v1/expenses
 * @desc    Create a new expense
 * @access  Private (canManageExpenses permission)
 */
router.post(
  '/',
  requirePermission('canManageExpenses'),
  [
    uuidField('category_id'),
    uuidField('branch_id', false),
    stringField('description', { minLength: 1, maxLength: 1000 }),
    decimalField('amount', { min: 0 }),
    enumField('payment_method', ['CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'DEBIT_CARD']),
    stringField('vendor_name', { required: false, maxLength: 200 }),
    stringField('vendor_tax_id', { required: false, maxLength: 20 }),
    stringField('invoice_number', { required: false, maxLength: 50 }),
    dateField('expense_date'),
    dateField('due_date', false),
    booleanField('is_recurring', false),
    enumField('recurrence_pattern', ['MONTHLY', 'QUARTERLY', 'YEARLY'], false),
    integerField('recurrence_day', { min: 1, max: 31, required: false }),
    stringField('account_code', { required: false, maxLength: 20 }),
    booleanField('is_tax_deductible', false),
    integerField('tax_year', { required: false }),
    stringField('notes', { required: false }),
    validate
  ],
  expenseController.createExpense
);

/**
 * @route   POST /api/v1/expenses/recurring-instance
 * @desc    Create a new instance from recurring expense
 * @access  Private (canManageExpenses permission)
 */
router.post(
  '/recurring-instance',
  requirePermission('canManageExpenses'),
  [
    uuidField('parent_id'),
    validate
  ],
  expenseController.createRecurringInstance
);

/**
 * @route   POST /api/v1/expenses/:id/receipt
 * @desc    Upload receipt for expense
 * @access  Private (canManageExpenses permission)
 */
router.post(
  '/:id/receipt',
  requirePermission('canManageExpenses'),
  [
    uuidParam('id'),
    stringField('receipt_url', { minLength: 1 }),
    validate
  ],
  expenseController.uploadReceipt
);

/**
 * @route   PUT /api/v1/expenses/:id
 * @desc    Update an existing expense
 * @access  Private (canManageExpenses permission)
 */
router.put(
  '/:id',
  requirePermission('canManageExpenses'),
  [
    uuidParam('id'),
    uuidField('category_id', false),
    uuidField('branch_id', false),
    stringField('description', { required: false, maxLength: 1000 }),
    decimalField('amount', { min: 0, required: false }),
    enumField('payment_method', ['CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'DEBIT_CARD'], false),
    stringField('vendor_name', { required: false, maxLength: 200 }),
    stringField('vendor_tax_id', { required: false, maxLength: 20 }),
    stringField('invoice_number', { required: false, maxLength: 50 }),
    dateField('expense_date', false),
    dateField('due_date', false),
    stringField('account_code', { required: false, maxLength: 20 }),
    booleanField('is_tax_deductible', false),
    stringField('notes', { required: false }),
    validate
  ],
  expenseController.updateExpense
);

/**
 * @route   PUT /api/v1/expenses/:id/approve
 * @desc    Approve expense
 * @access  Private (canApproveExpenses permission)
 */
router.put(
  '/:id/approve',
  requirePermission('canApproveExpenses'),
  [uuidParam('id'), validate],
  expenseController.approveExpense
);

/**
 * @route   PUT /api/v1/expenses/:id/reject
 * @desc    Reject expense
 * @access  Private (canApproveExpenses permission)
 */
router.put(
  '/:id/reject',
  requirePermission('canApproveExpenses'),
  [
    uuidParam('id'),
    stringField('reason', { minLength: 1, maxLength: 500 }),
    validate
  ],
  expenseController.rejectExpense
);

/**
 * @route   PUT /api/v1/expenses/:id/mark-paid
 * @desc    Mark expense as paid
 * @access  Private (canManageExpenses permission)
 */
router.put(
  '/:id/mark-paid',
  requirePermission('canManageExpenses'),
  [
    uuidParam('id'),
    dateField('paid_date', false),
    validate
  ],
  expenseController.markAsPaid
);

/**
 * @route   DELETE /api/v1/expenses/:id
 * @desc    Delete expense (cancel)
 * @access  Private (canManageExpenses permission)
 */
router.delete(
  '/:id',
  requirePermission('canManageExpenses'),
  [uuidParam('id'), validate],
  expenseController.deleteExpense
);

// ==================== EXPENSE CATEGORIES ====================

/**
 * @route   GET /api/v1/expenses/categories
 * @desc    Get all expense categories
 * @access  Private
 */
router.get(
  '/categories/all',
  [
    query('include_inactive').optional().isBoolean(),
    validate
  ],
  expenseController.getAllCategories
);

/**
 * @route   GET /api/v1/expenses/categories/:id
 * @desc    Get expense category by ID
 * @access  Private
 */
router.get(
  '/categories/:id',
  [uuidParam('id'), validate],
  expenseController.getCategoryById
);

/**
 * @route   POST /api/v1/expenses/categories
 * @desc    Create expense category
 * @access  Private (canManageExpenses permission)
 */
router.post(
  '/categories',
  requirePermission('canManageExpenses'),
  [
    stringField('name', { minLength: 1, maxLength: 100 }),
    stringField('description', { required: false }),
    stringField('color_hex', { required: false, minLength: 7, maxLength: 7 }),
    booleanField('is_system', false),
    booleanField('is_active', false),
    validate
  ],
  expenseController.createCategory
);

/**
 * @route   PUT /api/v1/expenses/categories/:id
 * @desc    Update expense category
 * @access  Private (canManageExpenses permission)
 */
router.put(
  '/categories/:id',
  requirePermission('canManageExpenses'),
  [
    uuidParam('id'),
    stringField('name', { required: false, maxLength: 100 }),
    stringField('description', { required: false }),
    stringField('color_hex', { required: false, minLength: 7, maxLength: 7 }),
    booleanField('is_active', false),
    validate
  ],
  expenseController.updateCategory
);

/**
 * @route   DELETE /api/v1/expenses/categories/:id
 * @desc    Delete expense category
 * @access  Private (canManageExpenses permission)
 */
router.delete(
  '/categories/:id',
  requirePermission('canManageExpenses'),
  [uuidParam('id'), validate],
  expenseController.deleteCategory
);

module.exports = router;
