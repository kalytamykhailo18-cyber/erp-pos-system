const express = require('express');
const router = express.Router();
const speciesController = require('../controllers/species.controller');
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
 * @route   GET /api/v1/species
 * @desc    Get all species with filters
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
  speciesController.getAll
);

/**
 * @route   GET /api/v1/species/:id
 * @desc    Get species by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  speciesController.getById
);

/**
 * @route   POST /api/v1/species
 * @desc    Create new species
 * @access  Private (Owner only)
 */
router.post(
  '/',
  [
    requirePermission('canManageProducts'),
    stringField('name', { min: 1, max: 100, required: true }),
    stringField('description', { max: 1000, required: false }),
    integerField('sort_order', { min: 0, required: false }),
    booleanField('is_active', false),
    validate
  ],
  speciesController.create
);

/**
 * @route   PUT /api/v1/species/:id
 * @desc    Update species
 * @access  Private (Owner only)
 */
router.put(
  '/:id',
  [
    requirePermission('canManageProducts'),
    uuidParam('id'),
    stringField('name', { min: 1, max: 100, required: false }),
    stringField('description', { max: 1000, required: false }),
    integerField('sort_order', { min: 0, required: false }),
    booleanField('is_active', false),
    validate
  ],
  speciesController.update
);

/**
 * @route   DELETE /api/v1/species/:id
 * @desc    Delete species
 * @access  Private (Owner only)
 */
router.delete(
  '/:id',
  [requirePermission('canManageProducts'), uuidParam('id'), validate],
  speciesController.delete
);

/**
 * @route   PATCH /api/v1/species/:id/activate
 * @desc    Activate species
 * @access  Private (Owner only)
 */
router.patch(
  '/:id/activate',
  [requirePermission('canManageProducts'), uuidParam('id'), validate],
  speciesController.activate
);

/**
 * @route   PATCH /api/v1/species/:id/deactivate
 * @desc    Deactivate species
 * @access  Private (Owner only)
 */
router.patch(
  '/:id/deactivate',
  [requirePermission('canManageProducts'), uuidParam('id'), validate],
  speciesController.deactivate
);

module.exports = router;
