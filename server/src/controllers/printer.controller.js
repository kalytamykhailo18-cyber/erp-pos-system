const { success } = require('../utils/apiResponse');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const printerService = require('../services/printer.service');
const logger = require('../utils/logger');

/**
 * Get receipt data for a sale
 * GET /api/v1/printer/receipt/:saleId
 */
exports.getReceipt = async (req, res, next) => {
  try {
    const { saleId } = req.params;

    logger.info(`Generating receipt for sale: ${saleId}`);

    const receiptData = await printerService.generateReceipt(saleId);

    return success(res, receiptData, 'Receipt generated successfully');

  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new NotFoundError(error.message));
    }
    logger.error('Error generating receipt:', error);
    next(error);
  }
};

/**
 * Generate test print for branch
 * POST /api/v1/printer/test/:branchId
 */
exports.testPrint = async (req, res, next) => {
  try {
    const { branchId } = req.params;

    logger.info(`Generating test print for branch: ${branchId}`);

    const testReceipt = await printerService.generateTestReceipt(branchId);

    return success(res, testReceipt, 'Test receipt generated successfully');

  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new NotFoundError(error.message));
    }
    logger.error('Error generating test receipt:', error);
    next(error);
  }
};
