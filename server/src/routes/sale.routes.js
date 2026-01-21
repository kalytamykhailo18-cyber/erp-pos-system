const express = require('express');
const router = express.Router();
const saleController = require('../controllers/sale.controller');
const { authenticate, requirePermission, verifyManagerPin } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  stringField,
  decimalField,
  integerField,
  arrayField,
  enumField,
  paginationQuery,
  query,
  body
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/sales
 * @desc    Get all sales with filters
 * @access  Private
 */
router.get(
  '/',
  [
    ...paginationQuery,
    query('branch_id').optional().isUUID(4),
    query('session_id').optional().isUUID(4),
    query('customer_id').optional().isUUID(4),
    query('status').optional().isIn(['PENDING', 'COMPLETED', 'VOIDED', 'RETURNED']),
    query('from_date').optional().isISO8601(),
    query('to_date').optional().isISO8601(),
    query('search').optional().isString(),
    validate
  ],
  saleController.getAll
);

/**
 * @route   GET /api/v1/sales/:id
 * @desc    Get sale by ID with full details
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  saleController.getById
);

/**
 * @route   POST /api/v1/sales
 * @desc    Create new sale
 * @access  Private
 */
router.post(
  '/',
  [
    uuidField('branch_id'),
    uuidField('register_id'),
    uuidField('session_id'),
    uuidField('customer_id', false),
    uuidField('seller_id', false),
    decimalField('discount_percent', { min: 0, max: 100, required: false }),
    decimalField('discount_amount', { min: 0, required: false }),
    enumField('discount_type', ['PERCENT', 'FIXED'], false),
    decimalField('discount_value', { min: 0, required: false }),
    integerField('points_redeemed', { min: 0, required: false }),
    decimalField('credit_used', { min: 0, required: false }),
    decimalField('change_as_credit', { min: 0, required: false }),
    arrayField('items', { minLength: 1 }),
    body('items.*.product_id').isUUID(4).withMessage('product_id must be a valid UUID'),
    body('items.*.quantity').isFloat({ min: 0.001 }).withMessage('quantity must be greater than 0'),
    body('items.*.unit_price').isFloat({ min: 0 }).withMessage('unit_price must be a valid number'),
    body('items.*.discount_percent').optional().isFloat({ min: 0, max: 100 }),
    body('items.*.notes').optional().isString().isLength({ max: 255 }),
    arrayField('payments', { minLength: 1 }),
    body('payments.*.payment_method_id').isUUID(4).withMessage('payment_method_id must be a valid UUID'),
    body('payments.*.amount').isFloat({ min: 0 }).withMessage('amount must be a valid number'),
    body('payments.*.reference_number').optional().isString().isLength({ max: 100 }),
    body('payments.*.authorization_code').optional().isString().isLength({ max: 50 }),
    body('payments.*.card_last_four').optional().isString().isLength({ min: 4, max: 4 }),
    body('payments.*.card_brand').optional().isString().isLength({ max: 20 }),
    body('payments.*.qr_provider').optional().isString().isLength({ max: 50 }),
    body('payments.*.qr_transaction_id').optional().isString().isLength({ max: 100 }),
    stringField('local_id', { maxLength: 50, required: false }),
    // Invoice override validation (CRITICAL FIX #1)
    body('invoice_override').optional().isObject().withMessage('invoice_override must be an object'),
    body('invoice_override.invoice_type')
      .optional()
      .isIn(['A', 'B', 'C'])
      .withMessage('invoice_override.invoice_type must be A, B, or C'),
    body('invoice_override.customer_cuit')
      .optional()
      .matches(/^\d{2}-\d{8}-\d{1}$/)
      .withMessage('invoice_override.customer_cuit must be in format XX-XXXXXXXX-X'),
    body('invoice_override.customer_tax_condition')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .isLength({ max: 100 })
      .withMessage('invoice_override.customer_tax_condition must be a non-empty string'),
    body('invoice_override.customer_address')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .isLength({ max: 255 })
      .withMessage('invoice_override.customer_address must be a non-empty string'),
    // Type A validation: if invoice_type is 'A', customer_cuit, tax_condition, and address are required
    body('invoice_override').custom((value, { req }) => {
      if (value && value.invoice_type === 'A') {
        if (!value.customer_cuit || !value.customer_cuit.trim()) {
          throw new Error('invoice_override.customer_cuit is required for Type A invoices');
        }
        if (!value.customer_tax_condition || !value.customer_tax_condition.trim()) {
          throw new Error('invoice_override.customer_tax_condition is required for Type A invoices');
        }
        if (!value.customer_address || !value.customer_address.trim()) {
          throw new Error('invoice_override.customer_address is required for Type A invoices');
        }
      }
      return true;
    }),
    validate
  ],
  saleController.create
);

/**
 * @route   POST /api/v1/sales/:id/void
 * @desc    Void a sale
 * @access  Private (can_void_sale or manager authorization)
 */
router.post(
  '/:id/void',
  [
    uuidParam('id'),
    stringField('reason', { minLength: 1, maxLength: 255 }),
    stringField('manager_pin', { minLength: 4, maxLength: 6, required: false }),
    validate
  ],
  saleController.voidSale
);

/**
 * @route   GET /api/v1/sales/:id/receipt
 * @desc    Get receipt data for printing
 * @access  Private
 */
router.get(
  '/:id/receipt',
  [uuidParam('id'), validate],
  saleController.getReceipt
);

/**
 * @route   POST /api/v1/sales/:id/invoice
 * @desc    Issue invoice for sale
 * @access  Private
 */
router.post(
  '/:id/invoice',
  [
    uuidParam('id'),
    enumField('invoice_type_code', ['A', 'B', 'C']),
    stringField('customer_name', { maxLength: 200, required: false }),
    enumField('customer_document_type', ['DNI', 'CUIT', 'CUIL', 'PASSPORT', 'OTHER'], false),
    stringField('customer_document_number', { maxLength: 20, required: false }),
    enumField('customer_tax_condition', ['CONSUMIDOR_FINAL', 'MONOTRIBUTO', 'RESP_INSCRIPTO', 'EXENTO'], false),
    stringField('customer_address', { maxLength: 255, required: false }),
    validate
  ],
  saleController.issueInvoice
);

/**
 * @route   GET /api/v1/sales/session/:sessionId
 * @desc    Get all sales for a register session
 * @access  Private
 */
router.get(
  '/session/:sessionId',
  [
    uuidParam('sessionId'),
    ...paginationQuery,
    validate
  ],
  saleController.getBySession
);

/**
 * @route   GET /api/v1/sales/report/summary
 * @desc    Get sales summary report
 * @access  Private (can_view_reports)
 */
router.get(
  '/report/summary',
  requirePermission('canViewReports'),
  [
    query('branch_id').optional().isUUID(4),
    query('from_date').isISO8601().withMessage('from_date is required'),
    query('to_date').isISO8601().withMessage('to_date is required'),
    validate
  ],
  saleController.getSummaryReport
);

module.exports = router;
