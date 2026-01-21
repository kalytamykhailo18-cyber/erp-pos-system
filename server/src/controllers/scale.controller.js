/**
 * Scale Controller
 * Handles API endpoints for Kretz Aura scale integration
 */

const scaleExportService = require('../services/scaleExport.service');
const barcodeParser = require('../utils/barcodeParser');
const { Product } = require('../database/models');
const { BusinessError } = require('../middleware/errorHandler');

class ScaleController {
  /**
   * Get all products marked for scale export
   * GET /api/v1/scales/products
   */
  async getExportableProducts(req, res, next) {
    try {
      const { branch_id } = req.query;

      const products = await scaleExportService.getExportableProducts({ branch_id });

      res.json({
        success: true,
        data: products,
        count: products.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export price list in Kretz Aura format
   * GET /api/v1/scales/export
   */
  async exportPriceList(req, res, next) {
    try {
      const { format = 'csv', branch_id } = req.query;

      let fileContent;
      let mimeType;
      let fileExtension;

      if (format === 'csv') {
        fileContent = await scaleExportService.exportToKretzAuraFormat({ branch_id });
        mimeType = 'text/csv';
        fileExtension = 'csv';
      } else if (format === 'txt') {
        fileContent = await scaleExportService.exportToAlternativeFormat({ branch_id });
        mimeType = 'text/plain';
        fileExtension = 'txt';
      } else {
        throw new BusinessError('Invalid format. Use "csv" or "txt"', 'E400');
      }

      const filename = scaleExportService.generateExportFilename(fileExtension);

      // Set headers for file download
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');

      res.send(fileContent);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Parse scale-printed barcode
   * POST /api/v1/scales/barcode/parse
   * Body: { barcode: "2123451234567" }
   */
  async parseBarcode(req, res, next) {
    try {
      const { barcode } = req.body;

      if (!barcode) {
        throw new BusinessError('Barcode is required', 'E400');
      }

      // Parse the barcode
      const parsed = barcodeParser.parseScaleBarcode(barcode);

      if (!parsed.valid) {
        return res.json({
          success: false,
          error: parsed.error || 'Invalid barcode format',
          barcode,
        });
      }

      // Try to find product by PLU
      let product = null;
      if (parsed.plu) {
        product = await Product.findOne({
          where: { scale_plu: parsed.plu, is_active: true },
          attributes: ['id', 'sku', 'name', 'scale_plu', 'selling_price', 'is_weighable', 'unit_id'],
        });
      }

      res.json({
        success: true,
        data: {
          ...parsed,
          product: product
            ? {
                id: product.id,
                sku: product.sku,
                name: product.name,
                scale_plu: product.scale_plu,
                unit_price: product.selling_price,
                is_weighable: product.is_weighable,
              }
            : null,
          product_found: !!product,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate PLU code uniqueness
   * POST /api/v1/scales/validate-plu
   * Body: { plu: 12345, product_id: "xxx" }
   */
  async validatePLU(req, res, next) {
    try {
      const { plu, product_id } = req.body;

      if (!plu) {
        throw new BusinessError('PLU code is required', 'E400');
      }

      const validation = await scaleExportService.validatePLUUniqueness(plu, product_id);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get scale export statistics
   * GET /api/v1/scales/statistics
   */
  async getStatistics(req, res, next) {
    try {
      const stats = await scaleExportService.getExportStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze barcode format (debugging utility)
   * POST /api/v1/scales/barcode/analyze
   * Body: { barcode: "2123451234567" }
   */
  async analyzeBarcode(req, res, next) {
    try {
      const { barcode } = req.body;

      if (!barcode) {
        throw new BusinessError('Barcode is required', 'E400');
      }

      const analysis = barcodeParser.analyzeBarcodeFormat(barcode);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Find product by PLU code
   * GET /api/v1/scales/products/plu/:plu
   */
  async getProductByPLU(req, res, next) {
    try {
      const { plu } = req.params;

      const product = await Product.findOne({
        where: { scale_plu: parseInt(plu, 10), is_active: true },
      });

      if (!product) {
        throw new BusinessError('Product not found with this PLU code', 'E404');
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ScaleController();
