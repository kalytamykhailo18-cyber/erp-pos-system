/**
 * Scale Routes
 * API endpoints for Kretz Aura scale integration
 */

const express = require('express');
const router = express.Router();
const scaleController = require('../controllers/scale.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { body, query, param } = require('express-validator');
const { validate } = require('../middleware/validate');

/**
 * Get products marked for scale export
 * GET /api/v1/scales/products
 * Query: ?branch_id=xxx
 */
router.get(
  '/products',
  authenticate,
  requireRole(['OWNER', 'MANAGER']),
  query('branch_id').optional().matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('Invalid branch ID'),
  validate,
  scaleController.getExportableProducts
);

/**
 * Export price list for scale
 * GET /api/v1/scales/export
 * Query: ?format=csv&branch_id=xxx
 * Returns: File download (CSV or TXT)
 */
router.get(
  '/export',
  authenticate,
  requireRole(['OWNER', 'MANAGER']),
  query('format').optional().isIn(['csv', 'txt']).withMessage('Format must be "csv" or "txt"'),
  query('branch_id').optional().matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('Invalid branch ID'),
  validate,
  scaleController.exportPriceList
);

/**
 * Parse scale barcode
 * POST /api/v1/scales/barcode/parse
 * Body: { barcode: "2123451234567" }
 * Returns: { plu, weight, price, product }
 */
router.post(
  '/barcode/parse',
  authenticate,
  body('barcode')
    .notEmpty()
    .withMessage('Barcode is required')
    .isString()
    .withMessage('Barcode must be a string')
    .matches(/^\d{12,14}$/)
    .withMessage('Barcode must be 12-14 digits'),
  validate,
  scaleController.parseBarcode
);

/**
 * Validate PLU code uniqueness
 * POST /api/v1/scales/validate-plu
 * Body: { plu: 12345, product_id?: "xxx" }
 */
router.post(
  '/validate-plu',
  authenticate,
  requireRole(['OWNER', 'MANAGER']),
  body('plu')
    .notEmpty()
    .withMessage('PLU code is required')
    .isInt({ min: 1, max: 99999 })
    .withMessage('PLU must be between 1 and 99999'),
  body('product_id').optional().matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('Invalid product ID'),
  validate,
  scaleController.validatePLU
);

/**
 * Get scale export statistics
 * GET /api/v1/scales/statistics
 */
router.get(
  '/statistics',
  authenticate,
  requireRole(['OWNER', 'MANAGER']),
  scaleController.getStatistics
);

/**
 * Analyze barcode format (debugging)
 * POST /api/v1/scales/barcode/analyze
 * Body: { barcode: "2123451234567" }
 */
router.post(
  '/barcode/analyze',
  authenticate,
  body('barcode').notEmpty().withMessage('Barcode is required'),
  validate,
  scaleController.analyzeBarcode
);

/**
 * Get product by PLU code
 * GET /api/v1/scales/products/plu/:plu
 */
router.get(
  '/products/plu/:plu',
  authenticate,
  param('plu')
    .notEmpty()
    .withMessage('PLU is required')
    .isInt({ min: 1, max: 99999 })
    .withMessage('PLU must be between 1 and 99999'),
  validate,
  scaleController.getProductByPLU
);

/**
 * Get scale configuration
 * GET /api/v1/scales/config?branch_id=xxx
 */
router.get(
  '/config',
  authenticate,
  requireRole(['OWNER', 'MANAGER']),
  query('branch_id').optional().matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('Invalid branch ID'),
  validate,
  scaleController.getConfiguration
);

/**
 * Update scale configuration
 * PUT /api/v1/scales/config
 * Body: { scale_ip, scale_port, scale_enabled, scale_sync_frequency, etc. }
 */
router.put(
  '/config',
  authenticate,
  requireRole(['OWNER']),
  body('scale_ip').optional({ values: 'null' }).custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    // Allow IP addresses (192.168.1.100) OR COM port names (COM1, COM2, etc.)
    const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(value);
    const isCOMPort = /^COM\d+$/i.test(value);
    if (!isIP && !isCOMPort) {
      throw new Error('Must be valid IP address or COM port (e.g., COM1)');
    }
    return true;
  }),
  body('scale_port').optional({ values: 'null' }).isInt({ min: 1, max: 65535 }).withMessage('Port must be between 1 and 65535'),
  body('scale_enabled').optional({ values: 'null' }).isBoolean().withMessage('scale_enabled must be boolean'),
  body('scale_sync_frequency').optional({ values: 'null' }).isIn(['manual', 'hourly', 'daily']).withMessage('Invalid sync frequency'),
  body('scale_connection_protocol').optional({ values: 'null' }).isIn(['serial', 'ftp', 'http', 'tcp']).withMessage('Invalid protocol'),
  body('scale_ftp_username').optional({ values: 'null' }).isString().withMessage('Username must be string'),
  body('scale_ftp_password').optional({ values: 'null' }).isString().withMessage('Password must be string'),
  body('scale_upload_path').optional({ values: 'null' }).isString().withMessage('Upload path must be string'),
  body('branch_id').optional({ values: 'null' }).matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('Invalid branch ID'),
  validate,
  scaleController.updateConfiguration
);

/**
 * Test connection to scale
 * POST /api/v1/scales/connection/test?branch_id=xxx
 * Body: { branch_id?: "xxx" }
 */
router.post(
  '/connection/test',
  authenticate,
  requireRole(['OWNER', 'MANAGER']),
  query('branch_id').optional().matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('Invalid branch ID'),
  body('branch_id').optional({ values: 'null' }).matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('Invalid branch ID'),
  validate,
  scaleController.testConnection
);

/**
 * Synchronize products with scale now
 * POST /api/v1/scales/sync?branch_id=xxx
 * Body: { branch_id?: "xxx" }
 */
router.post(
  '/sync',
  authenticate,
  requireRole(['OWNER', 'MANAGER']),
  query('branch_id').optional().matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('Invalid branch ID'),
  body('branch_id').optional({ values: 'null' }).matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('Invalid branch ID'),
  validate,
  scaleController.syncNow
);

module.exports = router;
