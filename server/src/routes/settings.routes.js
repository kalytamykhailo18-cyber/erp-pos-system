const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const {
  validate,
  stringField,
  booleanField
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/settings
 * @desc    Get system settings
 * @access  Private
 */
router.get('/', settingsController.get);

/**
 * @route   PUT /api/v1/settings
 * @desc    Update system settings
 * @access  Private (Owner only)
 */
router.put(
  '/',
  requireRole(['OWNER']),
  [
    stringField('company_name', { minLength: 1, maxLength: 200, required: false }),
    stringField('tax_id', { maxLength: 20, required: false }),
    stringField('address', { maxLength: 255, required: false }),
    stringField('phone', { maxLength: 50, required: false }),
    stringField('email', { maxLength: 100, required: false }),
    stringField('currency', { maxLength: 3, required: false }),
    stringField('timezone', { maxLength: 50, required: false }),
    stringField('date_format', { maxLength: 20, required: false }),
    booleanField('enable_invoicing'),
    stringField('factuhoy_api_key', { maxLength: 255, required: false }),
    validate
  ],
  settingsController.update
);

module.exports = router;
