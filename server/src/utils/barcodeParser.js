/**
 * Barcode Parser Utility
 * Handles parsing of scale-generated barcodes (Kretz Aura and standard formats)
 *
 * Common Scale Barcode Formats:
 * 1. EAN-13 Price-Embedded: 2[PLU:5][Price:5][Check:1]
 * 2. EAN-13 Weight-Embedded: 2[PLU:5][Weight:5][Check:1]
 * 3. EAN-13 Standard: 2[PLU:4][Weight:6][Check:1] (more common in Argentina)
 *
 * Note: Actual Kretz Aura format must be confirmed by client
 */

class BarcodeParser {
  /**
   * Detect if barcode is from a weighing scale
   * Most scale barcodes start with digit 2 (for variable weight products)
   *
   * @param {String} barcode - Barcode string
   * @returns {Boolean} True if scale barcode
   */
  isScaleBarcode(barcode) {
    if (!barcode || typeof barcode !== 'string') {
      return false;
    }

    // Remove any whitespace
    barcode = barcode.trim();

    // Most scale barcodes are 13 digits and start with '2'
    // Some scales use 12 or 14 digits
    if (barcode.length < 12 || barcode.length > 14) {
      return false;
    }

    // Check if starts with '2' (standard for variable weight)
    if (!barcode.startsWith('2')) {
      return false;
    }

    // Check if all characters are digits
    if (!/^\d+$/.test(barcode)) {
      return false;
    }

    return true;
  }

  /**
   * Parse scale barcode and extract PLU, weight, and price
   * Attempts multiple format parsers until one succeeds
   *
   * @param {String} barcode - Scale barcode string
   * @returns {Object} Parsed data: { plu, weight, price, format, valid }
   */
  parseScaleBarcode(barcode) {
    if (!this.isScaleBarcode(barcode)) {
      return {
        valid: false,
        error: 'Not a valid scale barcode',
      };
    }

    barcode = barcode.trim();

    // Try different format parsers
    const parsers = [
      this.parseFormat1.bind(this), // EAN-13 with price embedded
      this.parseFormat2.bind(this), // EAN-13 with weight embedded
      this.parseFormat3.bind(this), // Alternative format
    ];

    for (const parser of parsers) {
      try {
        const result = parser(barcode);
        if (result.valid) {
          return result;
        }
      } catch (error) {
        // Continue to next parser
        continue;
      }
    }

    return {
      valid: false,
      error: 'Unable to parse barcode with known formats',
      barcode,
    };
  }

  /**
   * Format 1: EAN-13 Price-Embedded
   * Structure: 2[PLU:5][Price:5][Check:1]
   * Example: 2123451234567
   *   - Prefix: 2
   *   - PLU: 12345
   *   - Price: 12345 (means $123.45)
   *   - Check digit: 7
   *
   * @param {String} barcode - 13-digit barcode
   * @returns {Object} Parsed data
   */
  parseFormat1(barcode) {
    if (barcode.length !== 13) {
      return { valid: false };
    }

    const prefix = barcode.substring(0, 1); // '2'
    const plu = parseInt(barcode.substring(1, 6), 10); // 5 digits
    const priceEncoded = parseInt(barcode.substring(6, 11), 10); // 5 digits
    const checkDigit = barcode.substring(12, 13);

    // Validate check digit (EAN-13 algorithm)
    const calculatedCheck = this.calculateEAN13CheckDigit(barcode.substring(0, 12));
    if (calculatedCheck !== checkDigit) {
      return { valid: false, error: 'Invalid check digit' };
    }

    // Price is in cents/centavos (divide by 100)
    const price = priceEncoded / 100;

    return {
      valid: true,
      format: 'EAN-13-PRICE',
      plu,
      price,
      weight: null, // This format doesn't include weight
      barcode,
      raw: {
        prefix,
        plu_raw: barcode.substring(1, 6),
        price_raw: barcode.substring(6, 11),
        check_digit: checkDigit,
      },
    };
  }

  /**
   * Format 2: EAN-13 Weight-Embedded
   * Structure: 2[PLU:5][Weight:5][Check:1]
   * Example: 2123450015007
   *   - Prefix: 2
   *   - PLU: 12345
   *   - Weight: 00150 (means 1.50 kg or 150 grams, depending on scale config)
   *   - Check digit: 7
   *
   * @param {String} barcode - 13-digit barcode
   * @returns {Object} Parsed data
   */
  parseFormat2(barcode) {
    if (barcode.length !== 13) {
      return { valid: false };
    }

    const prefix = barcode.substring(0, 1); // '2'
    const plu = parseInt(barcode.substring(1, 6), 10); // 5 digits
    const weightEncoded = parseInt(barcode.substring(6, 11), 10); // 5 digits
    const checkDigit = barcode.substring(12, 13);

    // Validate check digit
    const calculatedCheck = this.calculateEAN13CheckDigit(barcode.substring(0, 12));
    if (calculatedCheck !== checkDigit) {
      return { valid: false, error: 'Invalid check digit' };
    }

    // Weight is typically in grams (divide by 1000 for kg)
    // Or it could be in kg with 3 decimal places (e.g., 1500 = 1.500 kg)
    // Client must confirm Kretz Aura weight encoding
    const weight = weightEncoded / 1000; // Assuming grams → kg

    return {
      valid: true,
      format: 'EAN-13-WEIGHT',
      plu,
      weight,
      price: null, // This format doesn't include price (calculated by POS)
      barcode,
      raw: {
        prefix,
        plu_raw: barcode.substring(1, 6),
        weight_raw: barcode.substring(6, 11),
        check_digit: checkDigit,
      },
    };
  }

  /**
   * Format 3: Alternative EAN-13 Format
   * Structure: 2[PLU:4][Weight:6][Check:1]
   * Example: 2123400015007
   *   - Prefix: 2
   *   - PLU: 1234 (4 digits)
   *   - Weight: 000150 (6 digits, means 150 grams = 0.15 kg)
   *   - Check digit: 7
   *
   * This format is common in some Latin American scales
   *
   * @param {String} barcode - 13-digit barcode
   * @returns {Object} Parsed data
   */
  parseFormat3(barcode) {
    if (barcode.length !== 13) {
      return { valid: false };
    }

    const prefix = barcode.substring(0, 1); // '2'
    const plu = parseInt(barcode.substring(1, 5), 10); // 4 digits
    const weightEncoded = parseInt(barcode.substring(5, 11), 10); // 6 digits
    const checkDigit = barcode.substring(12, 13);

    // Validate check digit
    const calculatedCheck = this.calculateEAN13CheckDigit(barcode.substring(0, 12));
    if (calculatedCheck !== checkDigit) {
      return { valid: false, error: 'Invalid check digit' };
    }

    // Weight in grams (divide by 1000 for kg)
    const weight = weightEncoded / 1000;

    return {
      valid: true,
      format: 'EAN-13-ALT',
      plu,
      weight,
      price: null,
      barcode,
      raw: {
        prefix,
        plu_raw: barcode.substring(1, 5),
        weight_raw: barcode.substring(5, 11),
        check_digit: checkDigit,
      },
    };
  }

  /**
   * Calculate EAN-13 check digit
   * Algorithm: Sum odd positions * 1 + even positions * 3, then 10 - (sum % 10)
   *
   * @param {String} barcode - First 12 digits of barcode
   * @returns {String} Check digit
   */
  calculateEAN13CheckDigit(barcode) {
    if (barcode.length !== 12) {
      throw new Error('Barcode must be 12 digits for check digit calculation');
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode[i], 10);
      // Odd positions (1st, 3rd, 5th...) multiply by 1
      // Even positions (2nd, 4th, 6th...) multiply by 3
      sum += i % 2 === 0 ? digit : digit * 3;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return String(checkDigit);
  }

  /**
   * Validate barcode check digit
   *
   * @param {String} barcode - Full barcode with check digit
   * @returns {Boolean} True if valid
   */
  validateCheckDigit(barcode) {
    if (barcode.length !== 13) {
      return false;
    }

    const calculatedCheck = this.calculateEAN13CheckDigit(barcode.substring(0, 12));
    const providedCheck = barcode.substring(12, 13);

    return calculatedCheck === providedCheck;
  }

  /**
   * Format parsed weight for display
   *
   * @param {Number} weight - Weight in kg
   * @returns {String} Formatted weight (e.g., "1.50 kg")
   */
  formatWeight(weight) {
    if (!weight) return '0.00 kg';
    return `${weight.toFixed(3)} kg`;
  }

  /**
   * Format parsed price for display
   *
   * @param {Number} price - Price in pesos
   * @returns {String} Formatted price (e.g., "$123.45")
   */
  formatPrice(price) {
    if (!price) return '$0.00';
    return `$${price.toFixed(2)}`;
  }

  /**
   * Get barcode format information for debugging
   *
   * @param {String} barcode - Barcode to analyze
   * @returns {Object} Format analysis
   */
  analyzeBarcodeFormat(barcode) {
    return {
      barcode,
      length: barcode.length,
      is_numeric: /^\d+$/.test(barcode),
      starts_with_2: barcode.startsWith('2'),
      is_scale_barcode: this.isScaleBarcode(barcode),
      check_digit_valid: barcode.length === 13 ? this.validateCheckDigit(barcode) : null,
      possible_formats: this.getPossibleFormats(barcode),
    };
  }

  /**
   * Determine which formats could apply to this barcode
   *
   * @param {String} barcode - Barcode to check
   * @returns {Array} List of possible formats
   */
  getPossibleFormats(barcode) {
    const formats = [];

    if (barcode.length === 13 && barcode.startsWith('2')) {
      formats.push('EAN-13-PRICE', 'EAN-13-WEIGHT', 'EAN-13-ALT');
    }

    return formats;
  }
}

module.exports = new BarcodeParser();
