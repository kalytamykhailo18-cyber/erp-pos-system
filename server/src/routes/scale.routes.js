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
  query('branch_id').optional().isUUID().withMessage('Invalid branch ID'),
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
  query('branch_id').optional().isUUID().withMessage('Invalid branch ID'),
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
  body('product_id').optional().isUUID().withMessage('Invalid product ID'),
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

module.exports = router;
