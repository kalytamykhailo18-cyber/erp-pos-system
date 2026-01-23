const express = require('express');
const router = express.Router();
const denominationController = require('../controllers/denomination.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  decimalField,
  stringField,
  booleanField,
  integerField,
  query,
  arrayField
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/denominations
 * @desc    Get all bill denominations
 * @access  Private
 */
router.get(
  '/',
  [
    query('include_inactive').optional().isBoolean(),
    validate
  ],
  denominationController.getAllDenominations
);

/**
 * @route   GET /api/v1/denominations/:id
 * @desc    Get a single denomination by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  denominationController.getDenominationById
);

/**
 * @route   POST /api/v1/denominations
 * @desc    Create a new denomination
 * @access  Private (Owner/Manager only)
 */
router.post(
  '/',
  requirePermission('canManageProducts'), // Re-use product management permission
  [
    decimalField('value', { min: 0 }),
    stringField('label', { minLength: 1, maxLength: 50 }),
    booleanField('is_active'),
    integerField('display_order', { min: 0 }),
    validate
  ],
  denominationController.createDenomination
);

/**
 * @route   PUT /api/v1/denominations/:id
 * @desc    Update an existing denomination
 * @access  Private (Owner/Manager only)
 */
router.put(
  '/:id',
  requirePermission('canManageProducts'),
  [
    uuidParam('id'),
    decimalField('value', { min: 0, required: false }),
    stringField('label', { minLength: 1, maxLength: 50, required: false }),
    booleanField('is_active', { required: false }),
    integerField('display_order', { min: 0, required: false }),
    validate
  ],
  denominationController.updateDenomination
);

/**
 * @route   DELETE /api/v1/denominations/:id
 * @desc    Deactivate a denomination (soft delete)
 * @access  Private (Owner/Manager only)
 */
router.delete(
  '/:id',
  requirePermission('canManageProducts'),
  [uuidParam('id'), validate],
  denominationController.deleteDenomination
);

/**
 * @route   POST /api/v1/denominations/reorder
 * @desc    Reorder denominations (bulk update display_order)
 * @access  Private (Owner/Manager only)
 */
router.post(
  '/reorder',
  requirePermission('canManageProducts'),
  [
    arrayField('denominations'),
    validate
  ],
  denominationController.reorderDenominations
);

module.exports = router;
