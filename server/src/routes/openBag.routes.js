const express = require('express');
const router = express.Router();
const openBagController = require('../controllers/openBag.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  decimalField,
  stringField,
  paginationQuery,
  query
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/open-bags
 * @desc    Get all open bags with filters
 * @access  Private
 */
router.get(
  '/',
  [
    ...paginationQuery,
    query('branch_id').optional().isUUID(4),
    query('product_id').optional().isUUID(4),
    query('status').optional().isIn(['OPEN', 'EMPTY']),
    validate
  ],
  openBagController.getAll
);

/**
 * @route   GET /api/v1/open-bags/branch/:branchId
 * @desc    Get all open bags for a branch
 * @access  Private
 */
router.get(
  '/branch/:branchId',
  [uuidParam('branchId'), validate],
  openBagController.getOpenBagsByBranch
);

/**
 * @route   GET /api/v1/open-bags/low-stock
 * @desc    Get all open bags with low stock
 * @access  Private
 */
router.get(
  '/low-stock',
  [query('branch_id').optional().isUUID(4), validate],
  openBagController.getLowStockBags
);

/**
 * @route   GET /api/v1/open-bags/:id
 * @desc    Get open bag by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  openBagController.getById
);

/**
 * @route   POST /api/v1/open-bags
 * @desc    Open a sealed bag for loose sales
 * @access  Private (Cashier, Manager, Owner)
 */
router.post(
  '/',
  [
    requireRole(['CASHIER', 'MANAGER', 'OWNER']),
    uuidField('branch_id', { required: true }),
    uuidField('product_id', { required: true }),
    decimalField('original_weight', { min: 0.001, required: true }),
    decimalField('low_stock_threshold', { min: 0, required: false }),
    stringField('notes', { max: 500, required: false }),
    validate
  ],
  openBagController.create
);

/**
 * @route   PATCH /api/v1/open-bags/:id/deduct
 * @desc    Deduct quantity from open bag (on loose sale)
 * @access  Private (Cashier, Manager, Owner)
 */
router.patch(
  '/:id/deduct',
  [
    requireRole(['CASHIER', 'MANAGER', 'OWNER']),
    uuidParam('id'),
    decimalField('quantity', { min: 0.001, required: true }),
    uuidField('sale_id', { required: false }),
    validate
  ],
  openBagController.deduct
);

/**
 * @route   PATCH /api/v1/open-bags/:id/close
 * @desc    Close an open bag (mark as empty)
 * @access  Private (Manager, Owner)
 */
router.patch(
  '/:id/close',
  [
    requireRole(['MANAGER', 'OWNER']),
    uuidParam('id'),
    stringField('notes', { max: 500, required: false }),
    validate
  ],
  openBagController.close
);

module.exports = router;
