const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  stringField,
  enumField,
  paginationQuery,
  query,
  body
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/invoices
 * @desc    Get invoices with filters
 * @access  Private
 */
router.get(
  '/',
  [
    ...paginationQuery,
    query('branch_id').optional().isUUID(4),
    query('invoice_type_id').optional().isUUID(4),
    query('status').optional().isIn(['PENDING', 'ISSUED', 'FAILED', 'CANCELLED']),
    query('from_date').optional().isISO8601(),
    query('to_date').optional().isISO8601(),
    query('customer_document_number').optional().isString(),
    validate
  ],
  invoiceController.getAll
);

/**
 * @route   GET /api/v1/invoices/stats
 * @desc    Get invoice statistics
 * @access  Private
 */
router.get(
  '/stats',
  [
    query('branch_id').optional().isUUID(4),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    validate
  ],
  invoiceController.getStats
);

/**
 * @route   GET /api/v1/invoices/types
 * @desc    Get invoice types (A, B, C)
 * @access  Private
 */
router.get('/types', invoiceController.getInvoiceTypes);

/**
 * @route   GET /api/v1/invoices/status/pending
 * @desc    Get pending invoices that need attention
 * @access  Private
 */
router.get('/status/pending', [
  ...paginationQuery,
  query('branch_id').optional().isUUID(4),
  validate
], invoiceController.getPendingInvoices);

/**
 * @route   GET /api/v1/invoices/status/failed
 * @desc    Get failed invoices
 * @access  Private
 */
router.get('/status/failed', [
  ...paginationQuery,
  query('branch_id').optional().isUUID(4),
  validate
], invoiceController.getFailedInvoices);

/**
 * @route   POST /api/v1/invoices/retry-pending
 * @desc    Retry all pending invoices (batch operation)
 * @access  Private
 */
router.post(
  '/retry-pending',
  [
    stringField('branch_id', { required: false }),
    validate
  ],
  invoiceController.retryPendingBatch
);

/**
 * @route   GET /api/v1/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  invoiceController.getById
);

/**
 * @route   GET /api/v1/invoices/:id/pdf
 * @desc    Get invoice PDF
 * @access  Private
 */
router.get(
  '/:id/pdf',
  [uuidParam('id'), validate],
  invoiceController.getPrintData
);

/**
 * @route   POST /api/v1/invoices/:id/retry
 * @desc    Retry failed invoice
 * @access  Private
 */
router.post(
  '/:id/retry',
  [uuidParam('id'), validate],
  invoiceController.submitToAFIP
);

/**
 * @route   POST /api/v1/invoices/:id/cancel
 * @desc    Cancel invoice (issue credit note)
 * @access  Private (Owner/Manager)
 */
router.post(
  '/:id/cancel',
  requirePermission('canVoidSale'),
  [
    uuidParam('id'),
    stringField('reason', { minLength: 1, maxLength: 255 }),
    // CRITICAL FIX #8: Validate items array for partial credit notes
    body('items').optional().isArray().withMessage('items must be an array'),
    body('items.*.amount').optional().isFloat({ min: 0.01 }).withMessage('item amount must be positive'),
    body('items.*.amount').optional().custom((value) => {
      if (value === null || value === undefined) return true;
      const strValue = String(value);
      const decimalMatch = strValue.match(/\.(\d+)/);
      if (decimalMatch && decimalMatch[1].length > 2) {
        throw new Error('item amount cannot have more than 2 decimal places');
      }
      return true;
    }),
    validate
  ],
  invoiceController.createCreditNote
);

/**
 * @route   GET /api/v1/invoices/credit-notes
 * @desc    Get credit notes
 * @access  Private
 */
router.get(
  '/credit-notes/list',
  [
    ...paginationQuery,
    query('branch_id').optional().isUUID(4),
    query('status').optional().isIn(['PENDING', 'ISSUED', 'FAILED', 'CANCELLED']),
    query('from_date').optional().isISO8601(),
    query('to_date').optional().isISO8601(),
    validate
  ],
  invoiceController.getCreditNotes
);

/**
 * @route   POST /api/v1/invoices/credit-notes/:id/retry
 * @desc    Retry failed credit note
 * @access  Private
 */
router.post(
  '/credit-notes/:id/retry',
  [uuidParam('id'), validate],
  invoiceController.retryCreditNote
);

/**
 * @route   GET /api/v1/invoices/credit-notes/:id
 * @desc    Get credit note by ID
 * @access  Private
 */
router.get(
  '/credit-notes/:id',
  [uuidParam('id'), validate],
  invoiceController.getCreditNoteById
);

module.exports = router;
