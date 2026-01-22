const express = require('express');
const router = express.Router();
const productTypeController = require('../controllers/productType.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  stringField,
  booleanField,
  integerField,
  paginationQuery,
  query
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/product-types
 * @desc    Get all product types with filters
 * @access  Private
 */
router.get(
  '/',
  [
    ...paginationQuery,
    query('is_active').optional().isBoolean(),
    query('search').optional().isString(),
    validate
  ],
  productTypeController.getAll
);

/**
 * @route   GET /api/v1/product-types/:id
 * @desc    Get product type by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  productTypeController.getById
);

/**
 * @route   POST /api/v1/product-types
 * @desc    Create new product type
 * @access  Private (Owner only)
 */
router.post(
  '/',
  [
    requirePermission('OWNER'),
    stringField('name', { min: 1, max: 100, required: true }),
    stringField('description', { max: 1000, required: false }),
    integerField('sort_order', { min: 0, required: false }),
    booleanField('is_active', { required: false }),
    validate
  ],
  productTypeController.create
);

/**
 * @route   PUT /api/v1/product-types/:id
 * @desc    Update product type
 * @access  Private (Owner only)
 */
router.put(
  '/:id',
  [
    requirePermission('OWNER'),
    uuidParam('id'),
    stringField('name', { min: 1, max: 100, required: false }),
    stringField('description', { max: 1000, required: false }),
    integerField('sort_order', { min: 0, required: false }),
    booleanField('is_active', { required: false }),
    validate
  ],
  productTypeController.update
);

/**
 * @route   DELETE /api/v1/product-types/:id
 * @desc    Delete product type
 * @access  Private (Owner only)
 */
router.delete(
  '/:id',
  [requirePermission('OWNER'), uuidParam('id'), validate],
  productTypeController.delete
);

/**
 * @route   PATCH /api/v1/product-types/:id/activate
 * @desc    Activate product type
 * @access  Private (Owner only)
 */
router.patch(
  '/:id/activate',
  [requirePermission('OWNER'), uuidParam('id'), validate],
  productTypeController.activate
);

/**
 * @route   PATCH /api/v1/product-types/:id/deactivate
 * @desc    Deactivate product type
 * @access  Private (Owner only)
 */
router.patch(
  '/:id/deactivate',
  [requirePermission('OWNER'), uuidParam('id'), validate],
  productTypeController.deactivate
);

module.exports = router;
