const express = require('express');
const router = express.Router();
const varietyController = require('../controllers/variety.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  stringField,
  booleanField,
  integerField,
  paginationQuery,
  query
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/varieties
 * @desc    Get all varieties with filters
 * @access  Private
 */
router.get(
  '/',
  [
    ...paginationQuery,
    query('species_id').optional().matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
    query('is_active').optional().isBoolean(),
    query('search').optional().isString(),
    validate
  ],
  varietyController.getAll
);

/**
 * @route   GET /api/v1/species/:speciesId/varieties
 * @desc    Get varieties for a specific species
 * @access  Private
 */
router.get(
  '/by-species/:speciesId',
  [
    uuidParam('speciesId'),
    query('is_active').optional().isBoolean(),
    validate
  ],
  varietyController.getBySpecies
);

/**
 * @route   GET /api/v1/varieties/:id
 * @desc    Get variety by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  varietyController.getById
);

/**
 * @route   POST /api/v1/varieties
 * @desc    Create new variety
 * @access  Private (Owner only)
 */
router.post(
  '/',
  [
    requirePermission('canManageProducts'),
    uuidField('species_id', true),
    stringField('name', { min: 1, max: 100, required: true }),
    stringField('description', { max: 1000, required: false }),
    integerField('sort_order', { min: 0, required: false }),
    booleanField('is_active', false),
    validate
  ],
  varietyController.create
);

/**
 * @route   PUT /api/v1/varieties/:id
 * @desc    Update variety
 * @access  Private (Owner only)
 */
router.put(
  '/:id',
  [
    requirePermission('canManageProducts'),
    uuidParam('id'),
    uuidField('species_id', false),
    stringField('name', { min: 1, max: 100, required: false }),
    stringField('description', { max: 1000, required: false }),
    integerField('sort_order', { min: 0, required: false }),
    booleanField('is_active', false),
    validate
  ],
  varietyController.update
);

/**
 * @route   DELETE /api/v1/varieties/:id
 * @desc    Delete variety
 * @access  Private (Owner only)
 */
router.delete(
  '/:id',
  [requirePermission('canManageProducts'), uuidParam('id'), validate],
  varietyController.delete
);

/**
 * @route   PATCH /api/v1/varieties/:id/activate
 * @desc    Activate variety
 * @access  Private (Owner only)
 */
router.patch(
  '/:id/activate',
  [requirePermission('canManageProducts'), uuidParam('id'), validate],
  varietyController.activate
);

/**
 * @route   PATCH /api/v1/varieties/:id/deactivate
 * @desc    Deactivate variety
 * @access  Private (Owner only)
 */
router.patch(
  '/:id/deactivate',
  [requirePermission('canManageProducts'), uuidParam('id'), validate],
  varietyController.deactivate
);

module.exports = router;
