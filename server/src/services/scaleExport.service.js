/**
 * Scale Export Service
 * Handles price list export for Kretz Aura weighing scales
 */

const { Product, Category } = require('../database/models');
const { Op } = require('sequelize');

class ScaleExportService {
  /**
   * Get all products marked for scale export
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Products with scale PLU codes
   */
  async getExportableProducts(filters = {}) {
    const where = {
      export_to_scale: true,
      scale_plu: { [Op.not]: null },
      is_active: true,
    };

    // Optional branch filtering (if products are branch-specific in the future)
    if (filters.branch_id) {
      where.branch_id = filters.branch_id;
    }

    const products = await Product.findAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
      order: [['scale_plu', 'ASC']],
    });

    return products;
  }

  /**
   * Generate Kretz Aura format price list file
   * Format: CSV with columns: PLU,Description,Price,Unit,Tare
   *
   * Note: This is a standard format. Client must confirm exact Kretz Aura format.
   * Common variations:
   * - PLU,Name,Price (simple)
   * - PLU,Name,Price,Unit (with unit)
   * - PLU,Name,Price,Unit,Tare,Barcode (extended)
   *
   * @param {Object} options - Export options
   * @returns {Promise<String>} CSV content
   */
  async exportToKretzAuraFormat(options = {}) {
    const products = await this.getExportableProducts(options);

    if (products.length === 0) {
      throw new Error('No products marked for scale export');
    }

    // CSV Header
    let csv = 'PLU,Description,Price,Unit,Tare\r\n';

    for (const product of products) {
      const plu = this.formatPLU(product.scale_plu);
      const description = this.sanitizeDescription(product.name);
      const price = this.formatPrice(product.selling_price);
      const unit = product.is_weighable ? 'KG' : 'UN';
      const tare = '0'; // Tare weight (usually 0 for pet food)

      csv += `${plu},${description},${price},${unit},${tare}\r\n`;
    }

    return csv;
  }

  /**
   * Generate alternative format (if Kretz Aura uses different format)
   * Format: Fixed-width or tab-delimited
   *
   * @param {Object} options - Export options
   * @returns {Promise<String>} Formatted content
   */
  async exportToAlternativeFormat(options = {}) {
    const products = await this.getExportableProducts(options);

    if (products.length === 0) {
      throw new Error('No products marked for scale export');
    }

    // Tab-delimited format (another common scale format)
    let output = 'PLU\tDescription\tPrice\tUnit\r\n';

    for (const product of products) {
      const plu = this.formatPLU(product.scale_plu);
      const description = this.sanitizeDescription(product.name);
      const price = this.formatPrice(product.selling_price);
      const unit = product.is_weighable ? 'KG' : 'UN';

      output += `${plu}\t${description}\t${price}\t${unit}\r\n`;
    }

    return output;
  }

  /**
   * Format PLU code with leading zeros
   * Most scales expect 4-5 digit PLU codes with leading zeros
   *
   * @param {Number} plu - PLU code
   * @returns {String} Formatted PLU (e.g., "00123")
   */
  formatPLU(plu) {
    // Standard PLU format: 5 digits with leading zeros
    // Kretz Aura may use 4 or 6 digits - client must confirm
    return String(plu).padStart(5, '0');
  }

  /**
   * Format price for scale
   * Most scales expect prices without decimal point (e.g., 1250 for $12.50)
   * or with specific decimal separator
   *
   * @param {Number} price - Price in pesos
   * @returns {String} Formatted price
   */
  formatPrice(price) {
    // Convert to cents/centavos (multiply by 100 and remove decimal)
    // Example: 12.50 → 1250
    // Client must confirm if Kretz Aura expects this format or decimal format
    const priceInCents = Math.round(price * 100);
    return String(priceInCents);
  }

  /**
   * Sanitize product description for scale
   * Remove special characters that may cause issues in scale import
   *
   * @param {String} description - Product name/description
   * @returns {String} Sanitized description
   */
  sanitizeDescription(description) {
    // Remove or replace special characters
    // Most scales have character limits (20-40 characters)
    // Remove: quotes, commas, semicolons, line breaks
    let sanitized = description
      .replace(/[",;]/g, ' ')
      .replace(/[\r\n]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate to 40 characters (common scale limit)
    // Client must confirm Kretz Aura character limit
    if (sanitized.length > 40) {
      sanitized = sanitized.substring(0, 37) + '...';
    }

    return sanitized;
  }

  /**
   * Validate PLU uniqueness
   * Ensures no duplicate PLU codes
   *
   * @param {Number} plu - PLU code to check
   * @param {String} productId - Current product ID (for updates)
   * @returns {Promise<Boolean>} True if unique
   */
  async validatePLUUniqueness(plu, productId = null) {
    const where = {
      scale_plu: plu,
    };

    // Exclude current product when updating
    if (productId) {
      where.id = { [Op.not]: productId };
    }

    const existingProduct = await Product.findOne({
      where,
      attributes: ['id', 'name', 'scale_plu'],
    });

    if (existingProduct) {
      return {
        unique: false,
        conflict: {
          id: existingProduct.id,
          name: existingProduct.name,
          plu: existingProduct.scale_plu,
        },
      };
    }

    return { unique: true };
  }

  /**
   * Get scale export statistics
   * Returns counts and status information
   *
   * @returns {Promise<Object>} Statistics
   */
  async getExportStatistics() {
    const totalProducts = await Product.count({
      where: { is_active: true },
    });

    const weighableProducts = await Product.count({
      where: { is_active: true, is_weighable: true },
    });

    const productsWithPLU = await Product.count({
      where: { is_active: true, scale_plu: { [Op.not]: null } },
    });

    const exportableProducts = await Product.count({
      where: {
        is_active: true,
        export_to_scale: true,
        scale_plu: { [Op.not]: null },
      },
    });

    const missingPLU = await Product.count({
      where: {
        is_active: true,
        is_weighable: true,
        scale_plu: null,
      },
    });

    return {
      total_products: totalProducts,
      weighable_products: weighableProducts,
      products_with_plu: productsWithPLU,
      exportable_products: exportableProducts,
      missing_plu: missingPLU,
      export_ready: exportableProducts > 0,
    };
  }

  /**
   * Generate export filename with timestamp
   *
   * @param {String} format - Format type (csv, txt, etc.)
   * @returns {String} Filename
   */
  generateExportFilename(format = 'csv') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `kretz-aura-prices-${timestamp}.${format}`;
  }
}

module.exports = new ScaleExportService();
