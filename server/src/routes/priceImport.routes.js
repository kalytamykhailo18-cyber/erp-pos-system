const express = require('express');
const router = express.Router();
const multer = require('multer');
const priceImportController = require('../controllers/priceImport.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  stringField,
  booleanField,
  enumField,
  paginationQuery,
  query,
  body
} = require('../middleware/validate');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Excel, and CSV files are allowed.'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/prices/upload
 * @desc    Process price list file from Cloudinary URL (legacy)
 * @access  Private (can_import_prices)
 */
router.post(
  '/upload',
  requirePermission('canImportPrices'),
  [
    stringField('file_url', { required: true, maxLength: 500 }),
    stringField('file_name', { required: true, maxLength: 255 }),
    enumField('file_type', ['PDF', 'EXCEL', 'CSV'], { required: true }),
    body('file_size_bytes').isInt({ min: 0 }),
    body('supplier_id').optional().matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
    body('margin_percentage').optional().isFloat({ min: 0, max: 500 }),
    body('rounding_rule').optional().isIn(['NONE', 'UP', 'DOWN', 'NEAREST']),
    body('rounding_value').optional().isInt({ min: 0 }),
    validate
  ],
  priceImportController.uploadFile
);

/**
 * @route   POST /api/v1/prices/upload-file
 * @desc    Upload and process price list file directly
 * @access  Private (can_import_prices)
 */
router.post(
  '/upload-file',
  requirePermission('canImportPrices'),
  upload.single('file'),
  priceImportController.uploadFileDirect
);

/**
 * @route   GET /api/v1/prices/batch/:id
 * @desc    Get import batch details
 * @access  Private
 */
router.get(
  '/batch/:id',
  [uuidParam('id'), validate],
  priceImportController.getBatch
);

/**
 * @route   GET /api/v1/prices/batch/:id/items
 * @desc    Get import batch items
 * @access  Private
 */
router.get(
  '/batch/:id/items',
  [
    uuidParam('id'),
    ...paginationQuery,
    query('match_type').optional().isIn(['EXACT_CODE', 'SKU_EXACT', 'FUZZY_NAME', 'NAME_FUZZY', 'MANUAL', 'UNMATCHED', 'NOT_FOUND']),
    query('search').optional().isString(),
    validate
  ],
  priceImportController.getBatchItems
);

/**
 * @route   GET /api/v1/prices/batches
 * @desc    Get all import batches
 * @access  Private
 */
router.get(
  '/batches',
  [
    ...paginationQuery,
    query('status').optional().isIn(['PENDING', 'PROCESSING', 'PREVIEW', 'PENDING_REVIEW', 'APPLIED', 'FAILED', 'CANCELLED', 'REVERTED']),
    query('supplier_id').optional().matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    validate
  ],
  priceImportController.getBatches
);

/**
 * @route   PUT /api/v1/prices/batch/:id/config
 * @desc    Update batch configuration (margin, rounding)
 * @access  Private (can_import_prices)
 */
router.put(
  '/batch/:id/config',
  requirePermission('canImportPrices'),
  [
    uuidParam('id'),
    body('margin_percentage').optional().isFloat({ min: 0, max: 500 }),
    body('rounding_rule').optional().isIn(['NONE', 'UP', 'DOWN', 'NEAREST']),
    body('rounding_value').optional().isInt({ min: 0 }),
    validate
  ],
  priceImportController.updateBatchConfig
);

/**
 * @route   POST /api/v1/prices/batch/:id/recalculate
 * @desc    Recalculate prices with current config
 * @access  Private (can_import_prices)
 */
router.post(
  '/batch/:id/recalculate',
  requirePermission('canImportPrices'),
  [uuidParam('id'), validate],
  priceImportController.recalculate
);

/**
 * @route   PUT /api/v1/prices/item/:id/match
 * @desc    Match import item to product
 * @access  Private (can_import_prices)
 */
router.put(
  '/item/:id/match',
  requirePermission('canImportPrices'),
  [
    uuidParam('id'),
    uuidField('product_id'),
    validate
  ],
  priceImportController.matchItem
);

/**
 * @route   PUT /api/v1/prices/item/:id/select
 * @desc    Toggle item selection
 * @access  Private (can_import_prices)
 */
router.put(
  '/item/:id/select',
  requirePermission('canImportPrices'),
  [
    uuidParam('id'),
    booleanField('is_selected'),
    validate
  ],
  priceImportController.toggleItemSelection
);

/**
 * @route   PUT /api/v1/prices/batch/:id/select-all
 * @desc    Select/deselect all items in batch
 * @access  Private (can_import_prices)
 */
router.put(
  '/batch/:id/select-all',
  requirePermission('canImportPrices'),
  [
    uuidParam('id'),
    booleanField('is_selected'),
    body('match_type').optional().isIn(['EXACT_CODE', 'SKU_EXACT', 'FUZZY_NAME', 'NAME_FUZZY', 'MANUAL', 'UNMATCHED', 'NOT_FOUND']),
    validate
  ],
  priceImportController.selectAllItems
);

/**
 * @route   POST /api/v1/prices/batch/:id/apply
 * @desc    Apply selected price changes
 * @access  Private (can_import_prices)
 */
router.post(
  '/batch/:id/apply',
  requirePermission('canImportPrices'),
  [uuidParam('id'), validate],
  priceImportController.applyPrices
);

/**
 * @route   DELETE /api/v1/prices/batch/:id
 * @desc    Cancel/delete import batch
 * @access  Private (can_import_prices)
 */
router.delete(
  '/batch/:id',
  requirePermission('canImportPrices'),
  [uuidParam('id'), validate],
  priceImportController.cancelBatch
);

/**
 * @route   POST /api/v1/prices/batch/:id/revert
 * @desc    Revert applied prices
 * @access  Private (can_import_prices)
 */
router.post(
  '/batch/:id/revert',
  requirePermission('canImportPrices'),
  [uuidParam('id'), validate],
  priceImportController.revertPrices
);

/**
 * @route   GET /api/v1/prices/history
 * @desc    Get price change history
 * @access  Private
 */
router.get(
  '/history',
  [
    ...paginationQuery,
    query('product_id').optional().matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
    query('import_batch_id').optional().matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    validate
  ],
  priceImportController.getHistory
);

module.exports = router;
