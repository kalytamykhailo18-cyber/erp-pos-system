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

  /**
   * Get scale configuration
   * GET /api/v1/scales/config
   */
  async getConfiguration(req, res, next) {
    try {
      const { SystemSettings } = require('../database/models');

      const settings = await SystemSettings.findOne();

      if (!settings) {
        throw new BusinessError('System settings not found', 'E404');
      }

      // Don't expose FTP password
      const config = {
        scale_ip: settings.scale_ip,
        scale_port: settings.scale_port,
        scale_enabled: settings.scale_enabled,
        scale_sync_frequency: settings.scale_sync_frequency,
        scale_last_sync: settings.scale_last_sync,
        scale_connection_protocol: settings.scale_connection_protocol,
        scale_ftp_username: settings.scale_ftp_username,
        scale_upload_path: settings.scale_upload_path,
      };

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update scale configuration
   * PUT /api/v1/scales/config
   */
  async updateConfiguration(req, res, next) {
    try {
      const { SystemSettings } = require('../database/models');
      const {
        scale_ip,
        scale_port,
        scale_enabled,
        scale_sync_frequency,
        scale_connection_protocol,
        scale_ftp_username,
        scale_ftp_password,
        scale_upload_path,
      } = req.body;

      const settings = await SystemSettings.findOne();

      if (!settings) {
        throw new BusinessError('System settings not found', 'E404');
      }

      // Update fields
      if (scale_ip !== undefined) settings.scale_ip = scale_ip;
      if (scale_port !== undefined) settings.scale_port = scale_port;
      if (scale_enabled !== undefined) settings.scale_enabled = scale_enabled;
      if (scale_sync_frequency !== undefined) settings.scale_sync_frequency = scale_sync_frequency;
      if (scale_connection_protocol !== undefined) settings.scale_connection_protocol = scale_connection_protocol;
      if (scale_ftp_username !== undefined) settings.scale_ftp_username = scale_ftp_username;
      if (scale_ftp_password !== undefined) settings.scale_ftp_password = scale_ftp_password;
      if (scale_upload_path !== undefined) settings.scale_upload_path = scale_upload_path;

      await settings.save();

      res.json({
        success: true,
        message: 'Scale configuration updated successfully',
        data: {
          scale_ip: settings.scale_ip,
          scale_port: settings.scale_port,
          scale_enabled: settings.scale_enabled,
          scale_sync_frequency: settings.scale_sync_frequency,
          scale_connection_protocol: settings.scale_connection_protocol,
          scale_ftp_username: settings.scale_ftp_username,
          scale_upload_path: settings.scale_upload_path,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test connection to scale
   * POST /api/v1/scales/connection/test
   */
  async testConnection(req, res, next) {
    try {
      const scaleConnectionService = require('../services/scaleConnection.service');
      const { SystemSettings } = require('../database/models');

      const settings = await SystemSettings.findOne();

      if (!settings) {
        throw new BusinessError('System settings not found', 'E404');
      }

      if (!settings.scale_ip) {
        throw new BusinessError('Scale IP address not configured', 'E400');
      }

      const result = await scaleConnectionService.testConnection({
        ip: settings.scale_ip,
        port: settings.scale_port,
        protocol: settings.scale_connection_protocol,
        username: settings.scale_ftp_username,
        password: settings.scale_ftp_password,
        uploadPath: settings.scale_upload_path,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Synchronize products with scale
   * POST /api/v1/scales/sync
   */
  async syncNow(req, res, next) {
    try {
      const scaleConnectionService = require('../services/scaleConnection.service');
      const { SystemSettings } = require('../database/models');

      const settings = await SystemSettings.findOne();

      if (!settings) {
        throw new BusinessError('System settings not found', 'E404');
      }

      if (!settings.scale_ip) {
        throw new BusinessError('Scale IP address not configured', 'E400');
      }

      // Generate price list
      const fileContent = await scaleExportService.exportToKretzAuraFormat({});

      // Upload to scale
      const result = await scaleConnectionService.uploadPriceList({
        ip: settings.scale_ip,
        port: settings.scale_port,
        protocol: settings.scale_connection_protocol,
        username: settings.scale_ftp_username,
        password: settings.scale_ftp_password,
        uploadPath: settings.scale_upload_path,
        fileContent,
      });

      // Update last sync time
      settings.scale_last_sync = new Date();
      await settings.save();

      res.json({
        success: true,
        message: 'Products synchronized successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ScaleController();
