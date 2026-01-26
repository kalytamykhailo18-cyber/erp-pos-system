const express = require('express');
const router = express.Router();
const nonSalesDeductionController = require('../controllers/nonSalesDeduction.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  decimalField,
  stringField,
  enumField,
  paginationQuery,
  query
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/non-sales-deductions
 * @desc    Get all non-sales deductions with filters
 * @access  Private
 */
router.get(
  '/',
  [
    ...paginationQuery,
    query('branch_id').optional().matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
    query('approval_status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED']),
    query('deduction_type').optional().isIn(['FREE_SAMPLE', 'DONATION']),
    validate
  ],
  nonSalesDeductionController.getAll
);

/**
 * @route   GET /api/v1/non-sales-deductions/pending
 * @desc    Get pending non-sales deductions
 * @access  Private (Manager, Owner)
 */
router.get(
  '/pending',
  [
    requireRole(['MANAGER', 'OWNER']),
    query('branch_id').optional().matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
    validate
  ],
  nonSalesDeductionController.getPending
);

/**
 * @route   GET /api/v1/non-sales-deductions/:id
 * @desc    Get non-sales deduction by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  nonSalesDeductionController.getById
);

/**
 * @route   POST /api/v1/non-sales-deductions
 * @desc    Create non-sales deduction request
 * @access  Private (Cashier, Manager, Owner)
 */
router.post(
  '/',
  [
    requireRole(['CASHIER', 'MANAGER', 'OWNER']),
    uuidField('branch_id', { required: true }),
    uuidField('product_id', { required: true }),
    decimalField('quantity', { min: 0.001, required: true }),
    enumField('deduction_type', ['FREE_SAMPLE', 'DONATION'], { required: true }),
    stringField('reason', { max: 500, required: false }),
    stringField('recipient', { max: 255, required: false }),
    validate
  ],
  nonSalesDeductionController.create
);

/**
 * @route   PATCH /api/v1/non-sales-deductions/:id/approve
 * @desc    Approve non-sales deduction
 * @access  Private (Manager, Owner)
 */
router.patch(
  '/:id/approve',
  [
    requireRole(['MANAGER', 'OWNER']),
    uuidParam('id'),
    validate
  ],
  nonSalesDeductionController.approve
);

/**
 * @route   PATCH /api/v1/non-sales-deductions/:id/reject
 * @desc    Reject non-sales deduction
 * @access  Private (Manager, Owner)
 */
router.patch(
  '/:id/reject',
  [
    requireRole(['MANAGER', 'OWNER']),
    uuidParam('id'),
    stringField('rejection_reason', { max: 500, required: false }),
    validate
  ],
  nonSalesDeductionController.reject
);

module.exports = router;
