const express = require('express');
const router = express.Router();
const printerController = require('../controllers/printer.controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/printer/receipt/:saleId
 * @desc    Get receipt data for printing
 * @access  Private (any authenticated user)
 */
router.get('/receipt/:saleId', printerController.getReceipt);

/**
 * @route   POST /api/v1/printer/test/:branchId
 * @desc    Generate test print for branch
 * @access  Private (requires canManageSettings permission)
 */
router.post('/test/:branchId', printerController.testPrint);

module.exports = router;
