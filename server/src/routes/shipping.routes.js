const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shipping.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  stringField,
  booleanField,
  decimalField,
  integerField,
  query
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/shipping/zones
 * @desc    Get all shipping zones with neighborhood mappings
 * @access  Private
 */
router.get(
  '/zones',
  [
    query('include_inactive').optional().isBoolean(),
    validate
  ],
  shippingController.getAllZones
);

/**
 * @route   GET /api/v1/shipping/zones/:id
 * @desc    Get a single shipping zone by ID
 * @access  Private
 */
router.get(
  '/zones/:id',
  [uuidParam('id'), validate],
  shippingController.getZoneById
);

/**
 * @route   POST /api/v1/shipping/zones
 * @desc    Create a new shipping zone
 * @access  Private (Owner/Manager only)
 */
router.post(
  '/zones',
  requirePermission('canManageProducts'), // Re-use product management permission or create a new one
  [
    stringField('name', { minLength: 1, maxLength: 100 }),
    stringField('description', { required: false }),
    decimalField('base_rate', { min: 0 }),
    decimalField('free_shipping_threshold', { min: 0, required: false }),
    decimalField('weight_surcharge_per_kg', { min: 0, required: false }),
    decimalField('express_surcharge', { min: 0, required: false }),
    integerField('estimated_delivery_hours', { min: 1, required: false }),
    booleanField('is_active'),
    integerField('sort_order', { required: false }),
    validate
  ],
  shippingController.createZone
);

/**
 * @route   PUT /api/v1/shipping/zones/:id
 * @desc    Update an existing shipping zone
 * @access  Private (Owner/Manager only)
 */
router.put(
  '/zones/:id',
  requirePermission('canManageProducts'),
  [
    uuidParam('id'),
    stringField('name', { minLength: 1, maxLength: 100, required: false }),
    stringField('description', { required: false }),
    decimalField('base_rate', { min: 0, required: false }),
    decimalField('free_shipping_threshold', { min: 0, required: false }),
    decimalField('weight_surcharge_per_kg', { min: 0, required: false }),
    decimalField('express_surcharge', { min: 0, required: false }),
    integerField('estimated_delivery_hours', { min: 1, required: false }),
    booleanField('is_active'),
    integerField('sort_order', { required: false }),
    validate
  ],
  shippingController.updateZone
);

/**
 * @route   DELETE /api/v1/shipping/zones/:id
 * @desc    Delete a shipping zone (soft delete)
 * @access  Private (Owner/Manager only)
 */
router.delete(
  '/zones/:id',
  requirePermission('canManageProducts'),
  [uuidParam('id'), validate],
  shippingController.deleteZone
);

/**
 * @route   GET /api/v1/shipping/neighborhoods
 * @desc    Get all neighborhood mappings
 * @access  Private
 */
router.get(
  '/neighborhoods',
  [
    query('zone_id').optional().isUUID(4),
    validate
  ],
  shippingController.getAllNeighborhoods
);

/**
 * @route   POST /api/v1/shipping/neighborhoods
 * @desc    Create a new neighborhood mapping
 * @access  Private (Owner/Manager only)
 */
router.post(
  '/neighborhoods',
  requirePermission('canManageProducts'),
  [
    stringField('neighborhood_name', { minLength: 1, maxLength: 100 }),
    stringField('postal_code', { maxLength: 20, required: false }),
    stringField('postal_code_pattern', { maxLength: 50, required: false }),
    uuidField('shipping_zone_id'),
    stringField('city', { maxLength: 100, required: false }),
    stringField('province', { maxLength: 100, required: false }),
    validate
  ],
  shippingController.createNeighborhoodMapping
);

/**
 * @route   PUT /api/v1/shipping/neighborhoods/:id
 * @desc    Update a neighborhood mapping
 * @access  Private (Owner/Manager only)
 */
router.put(
  '/neighborhoods/:id',
  requirePermission('canManageProducts'),
  [
    uuidParam('id'),
    stringField('neighborhood_name', { minLength: 1, maxLength: 100, required: false }),
    stringField('postal_code', { maxLength: 20, required: false }),
    stringField('postal_code_pattern', { maxLength: 50, required: false }),
    uuidField('shipping_zone_id', false),
    stringField('city', { maxLength: 100, required: false }),
    stringField('province', { maxLength: 100, required: false }),
    booleanField('is_active'),
    validate
  ],
  shippingController.updateNeighborhoodMapping
);

/**
 * @route   DELETE /api/v1/shipping/neighborhoods/:id
 * @desc    Delete a neighborhood mapping
 * @access  Private (Owner/Manager only)
 */
router.delete(
  '/neighborhoods/:id',
  requirePermission('canManageProducts'),
  [uuidParam('id'), validate],
  shippingController.deleteNeighborhoodMapping
);

/**
 * @route   GET /api/v1/shipping/find-zone
 * @desc    Find shipping zone for a location (neighborhood or postal code)
 * @access  Private
 */
router.get(
  '/find-zone',
  [
    query('neighborhood').optional().isString(),
    query('postal_code').optional().isString(),
    validate
  ],
  shippingController.findZoneForLocation
);

/**
 * @route   POST /api/v1/shipping/calculate
 * @desc    Calculate shipping cost for an order
 * @access  Private
 */
router.post(
  '/calculate',
  [
    stringField('neighborhood', { minLength: 1, maxLength: 100 }),
    stringField('postal_code', { maxLength: 20, required: false }),
    decimalField('subtotal', { min: 0 }),
    decimalField('weight', { min: 0, required: false }),
    booleanField('is_express'),
    validate
  ],
  shippingController.calculateShipping
);

/**
 * @route   POST /api/v1/shipping/sales/:sale_id
 * @desc    Create shipping record for a sale
 * @access  Private
 */
router.post(
  '/sales/:sale_id',
  [
    uuidParam('sale_id'),
    uuidField('customer_id', false),
    stringField('delivery_address', { minLength: 1, maxLength: 255, required: false }),
    stringField('delivery_neighborhood', { minLength: 1, maxLength: 100, required: false }),
    stringField('delivery_city', { maxLength: 100, required: false }),
    stringField('delivery_postal_code', { maxLength: 20, required: false }),
    stringField('delivery_notes', { required: false }),
    decimalField('weight_kg', { min: 0, required: false }),
    booleanField('is_express'),
    validate
  ],
  shippingController.createSaleShipping
);

/**
 * @route   GET /api/v1/shipping/sales/:sale_id
 * @desc    Get shipping details for a sale
 * @access  Private
 */
router.get(
  '/sales/:sale_id',
  [uuidParam('sale_id'), validate],
  shippingController.getShippingBySaleId
);

/**
 * @route   PUT /api/v1/shipping/:id/status
 * @desc    Update delivery status for a shipment
 * @access  Private
 */
router.put(
  '/:id/status',
  [
    uuidParam('id'),
    stringField('status', { minLength: 1, maxLength: 20 }),
    stringField('signature', { required: false }),
    stringField('photo', { required: false }),
    validate
  ],
  shippingController.updateDeliveryStatus
);

/**
 * @route   GET /api/v1/shipping
 * @desc    Get all shipments with optional filters
 * @access  Private
 */
router.get(
  '/',
  [
    query('status').optional().isString(),
    query('zone_id').optional().isUUID(4),
    query('customer_id').optional().isUUID(4),
    query('from_date').optional().isISO8601(),
    query('to_date').optional().isISO8601(),
    validate
  ],
  shippingController.getAllShipments
);

module.exports = router;
