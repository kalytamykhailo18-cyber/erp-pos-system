const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const os = require('os');
const {
  PriceImportBatch, PriceImportItem, Product, Supplier, ProductPriceHistory,
  sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BusinessError, ValidationError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');

// OCR Service for PDF text extraction
const extractTextFromFile = async (filePath, fileType) => {
  if (fileType !== 'PDF') {
    return { success: true, text: '', items: [] };
  }

  try {
    const pdf = require('pdf-parse');
    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdf(dataBuffer);

    // Parse text into structured format
    const items = parsePDFText(pdfData.text);

    return {
      success: true,
      text: pdfData.text,
      items,
      confidence: items.length > 0 ? 0.85 : 0
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      success: false,
      text: '',
      items: [],
      error: error.message
    };
  }
};

// Parse PDF text into structured price list items
const parsePDFText = (text) => {
  const items = [];
  const lines = text.split('\n').filter(line => line.trim());

  // Common patterns for price lists:
  // Pattern 1: "CODE123  Product Description  $1234.56"
  // Pattern 2: "CODE123 | Product Description | 1234.56"
  // Pattern 3: "CODE123\tProduct Description\t1234.56"

  let lineNumber = 0;
  for (const line of lines) {
    lineNumber++;

    // Skip header lines
    if (line.toLowerCase().includes('codigo') ||
        line.toLowerCase().includes('descripcion') ||
        line.toLowerCase().includes('precio') ||
        line.toLowerCase().includes('producto')) {
      continue;
    }

    // Try multiple parsing strategies
    let parsed = null;

    // Strategy 1: Tab-separated
    const tabParts = line.split('\t').filter(p => p.trim());
    if (tabParts.length >= 3) {
      parsed = {
        line_number: lineNumber,
        supplier_code: tabParts[0].trim(),
        description: tabParts[1].trim(),
        cost_price: parsePrice(tabParts[2])
      };
    }

    // Strategy 2: Pipe-separated
    if (!parsed) {
      const pipeParts = line.split('|').filter(p => p.trim());
      if (pipeParts.length >= 3) {
        parsed = {
          line_number: lineNumber,
          supplier_code: pipeParts[0].trim(),
          description: pipeParts[1].trim(),
          cost_price: parsePrice(pipeParts[2])
        };
      }
    }

    // Strategy 3: Multiple spaces (table-like format)
    if (!parsed) {
      const spaceParts = line.split(/\s{2,}/).filter(p => p.trim());
      if (spaceParts.length >= 3) {
        parsed = {
          line_number: lineNumber,
          supplier_code: spaceParts[0].trim(),
          description: spaceParts[1].trim(),
          cost_price: parsePrice(spaceParts[2])
        };
      }
    }

    // Strategy 4: Regex pattern matching
    if (!parsed) {
      // Pattern: starts with code (alphanumeric), has price at end
      const match = line.match(/^([A-Z0-9\-]+)\s+(.+?)\s+(\$?\d+[.,]?\d*)\s*$/i);
      if (match) {
        parsed = {
          line_number: lineNumber,
          supplier_code: match[1].trim(),
          description: match[2].trim(),
          cost_price: parsePrice(match[3])
        };
      }
    }

    if (parsed && parsed.supplier_code && parsed.cost_price > 0) {
      items.push(parsed);
    }
  }

  return items;
};

// Helper to parse price from string
const parsePrice = (priceStr) => {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;

  // Remove currency symbols and normalize
  const cleaned = priceStr
    .toString()
    .replace(/[$\s]/g, '')
    .replace(/,/g, '.');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// Download file from Cloudinary URL to temp location
const downloadFileFromCloudinary = async (fileUrl) => {
  const response = await axios({
    method: 'GET',
    url: fileUrl,
    responseType: 'arraybuffer'
  });

  const tempDir = os.tmpdir();
  const tempFileName = `price-import-${uuidv4()}${path.extname(fileUrl.split('?')[0])}`;
  const tempFilePath = path.join(tempDir, tempFileName);

  await fs.writeFile(tempFilePath, response.data);
  return tempFilePath;
};

// Excel parsing
const parseExcelFile = async (filePath) => {
  const xlsx = require('xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  return data.map((row, index) => ({
    line_number: index + 1,
    supplier_code: row.codigo || row.code || row.sku || '',
    description: row.descripcion || row.description || row.nombre || row.name || '',
    cost_price: parseFloat(row.precio || row.price || row.costo || row.cost || 0)
  }));
};

exports.uploadFile = async (req, res, next) => {
  const t = await sequelize.transaction();
  let tempFilePath = null;

  try {
    const {
      file_url,
      file_name,
      file_type,
      file_size_bytes,
      supplier_id,
      margin_percentage,
      rounding_rule,
      rounding_value
    } = req.body;

    if (!file_url) {
      throw new ValidationError('file_url is required');
    }

    // Download file from Cloudinary to temporary location
    tempFilePath = await downloadFileFromCloudinary(file_url);

    // Create batch record
    const batch = await PriceImportBatch.create({
      id: uuidv4(),
      supplier_id: supplier_id || null,
      file_name,
      file_url,
      file_type,
      file_size_bytes: parseInt(file_size_bytes) || 0,
      status: 'PROCESSING',
      ocr_required: file_type === 'PDF',
      ocr_engine: file_type === 'PDF' ? 'pdf-parse' : null,
      margin_type: 'PERCENTAGE',
      margin_value: parseFloat(margin_percentage) || 30,
      margin_percentage: parseFloat(margin_percentage) || 30,
      rounding_rule: rounding_rule || 'NEAREST',
      rounding_value: parseInt(rounding_value) || 10,
      uploaded_by: req.user.id
    }, { transaction: t });

    // Extract items from file
    let extractedItems = [];
    let extraction_confidence = null;

    if (file_type === 'EXCEL' || file_type === 'CSV') {
      extractedItems = await parseExcelFile(tempFilePath);
      extraction_confidence = 1.0; // Perfect for structured files
    } else if (file_type === 'PDF') {
      const ocrResult = await extractTextFromFile(tempFilePath, 'PDF');
      extractedItems = ocrResult.items || [];
      extraction_confidence = ocrResult.confidence || 0;

      // Update batch with OCR confidence
      await batch.update({ extraction_confidence }, { transaction: t });
    }

    // Match products and create import items
    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const item of extractedItems) {
      // Try to match by supplier code or SKU
      let matchedProduct = null;
      let matchStatus = 'NOT_FOUND';
      let confidence = 0;

      if (item.supplier_code) {
        // Try exact match on SKU or barcode
        matchedProduct = await Product.findOne({
          where: {
            [Op.or]: [
              { sku: item.supplier_code },
              { barcode: item.supplier_code }
            ]
          }
        });

        if (matchedProduct) {
          matchStatus = 'MATCHED';
          confidence = 100;
        } else {
          // Try fuzzy match on name
          matchedProduct = await Product.findOne({
            where: {
              name: { [Op.iLike]: `%${item.description}%` }
            }
          });

          if (matchedProduct) {
            matchStatus = 'SUGGESTED';
            confidence = 60;
          }
        }
      }

      // Calculate suggested sell price with margin
      const marginMultiplier = 1 + (batch.margin_percentage / 100);
      let suggestedPrice = item.cost_price * marginMultiplier;

      // Apply rounding
      if (batch.rounding_rule !== 'NONE' && batch.rounding_value > 0) {
        const rv = batch.rounding_value;
        if (batch.rounding_rule === 'UP') {
          suggestedPrice = Math.ceil(suggestedPrice / rv) * rv;
        } else if (batch.rounding_rule === 'DOWN') {
          suggestedPrice = Math.floor(suggestedPrice / rv) * rv;
        } else { // NEAREST
          suggestedPrice = Math.round(suggestedPrice / rv) * rv;
        }
      }

      // Calculate price change percentage
      let priceChangePercentage = 0;
      if (matchedProduct && matchedProduct.selling_price > 0) {
        priceChangePercentage = ((suggestedPrice - matchedProduct.selling_price) / matchedProduct.selling_price) * 100;
      }

      // Validation errors
      const validationErrors = [];
      if (!item.supplier_code) validationErrors.push('Missing supplier code');
      if (!item.cost_price || item.cost_price <= 0) validationErrors.push('Invalid price');
      if (Math.abs(priceChangePercentage) > 50) validationErrors.push('Large price change (>50%)');

      await PriceImportItem.create({
        id: uuidv4(),
        batch_id: batch.id,
        row_number: item.line_number,
        extracted_code: item.supplier_code || '',
        extracted_description: item.description || '',
        extracted_price: item.cost_price || 0,
        product_id: matchedProduct?.id || null,
        match_type: matchStatus === 'NOT_FOUND' ? 'UNMATCHED' : (matchStatus === 'MATCHED' ? 'EXACT_CODE' : 'FUZZY_NAME'),
        match_confidence: confidence,
        current_cost_price: matchedProduct?.cost_price || null,
        new_cost_price: item.cost_price || 0,
        current_selling_price: matchedProduct?.selling_price || null,
        new_selling_price: suggestedPrice,
        price_change_percent: priceChangePercentage,
        status: (matchStatus === 'MATCHED' || matchStatus === 'SUGGESTED') && validationErrors.length === 0 ? 'APPROVED' : 'PENDING'
      }, { transaction: t });

      if (matchStatus === 'MATCHED') matchedCount++;
      else unmatchedCount++;
    }

    await batch.update({
      status: 'PREVIEW',
      total_rows_extracted: extractedItems.length,
      rows_matched: matchedCount,
      rows_unmatched: unmatchedCount
    }, { transaction: t });

    await t.commit();

    // Clean up temporary file
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }
    }

    const result = await PriceImportBatch.findByPk(batch.id, {
      include: [{ model: Supplier, as: 'supplier', attributes: ['name', 'code'] }]
    });

    return created(res, result);
  } catch (error) {
    await t.rollback();

    // Clean up temporary file on error
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }
    }

    next(error);
  }
};

exports.getBatch = async (req, res, next) => {
  try {
    const batch = await PriceImportBatch.findByPk(req.params.id, {
      include: [
        { model: Supplier, as: 'supplier', attributes: ['name', 'code'] },
        {
          model: require('../database/models').User,
          as: 'uploaded_by_user',
          attributes: ['first_name', 'last_name']
        }
      ]
    });

    if (!batch) throw new NotFoundError('Batch not found');
    return success(res, batch);
  } catch (error) {
    next(error);
  }
};

exports.getBatchItems = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { match_status, search } = req.query;

    const where = { batch_id: req.params.id };
    if (match_status) where.match_type = match_status;
    if (search) {
      where[Op.or] = [
        { extracted_code: { [Op.iLike]: `%${search}%` } },
        { extracted_description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await PriceImportItem.findAndCountAll({
      where,
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'sku', 'selling_price', 'cost_price']
      }],
      order: [['row_number', 'ASC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.getBatches = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status, supplier_id, start_date, end_date } = req.query;

    const where = {};
    if (status) where.status = status;
    if (supplier_id) where.supplier_id = supplier_id;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const { count, rows } = await PriceImportBatch.findAndCountAll({
      where,
      include: [{ model: Supplier, as: 'supplier', attributes: ['name', 'code'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.updateBatchConfig = async (req, res, next) => {
  try {
    const batch = await PriceImportBatch.findByPk(req.params.id);
    if (!batch) throw new NotFoundError('Batch not found');
    if (batch.status === 'APPLIED') throw new BusinessError('Cannot modify applied batch');

    const { margin_percentage, rounding_rule, rounding_value } = req.body;

    await batch.update({
      margin_percentage: margin_percentage !== undefined ? margin_percentage : batch.margin_percentage,
      rounding_rule: rounding_rule || batch.rounding_rule,
      rounding_value: rounding_value !== undefined ? rounding_value : batch.rounding_value
    });

    return success(res, batch);
  } catch (error) {
    next(error);
  }
};

exports.recalculate = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const batch = await PriceImportBatch.findByPk(req.params.id);
    if (!batch) throw new NotFoundError('Batch not found');
    if (batch.status === 'APPLIED') throw new BusinessError('Cannot recalculate applied batch');

    const items = await PriceImportItem.findAll({
      where: { batch_id: batch.id },
      include: [{ model: Product, as: 'product' }]
    });

    const marginMultiplier = 1 + (batch.margin_percentage / 100);

    for (const item of items) {
      let suggestedPrice = item.extracted_price * marginMultiplier;

      // Apply rounding
      if (batch.rounding_rule !== 'NONE' && batch.rounding_value > 0) {
        const rv = batch.rounding_value;
        if (batch.rounding_rule === 'UP') {
          suggestedPrice = Math.ceil(suggestedPrice / rv) * rv;
        } else if (batch.rounding_rule === 'DOWN') {
          suggestedPrice = Math.floor(suggestedPrice / rv) * rv;
        } else {
          suggestedPrice = Math.round(suggestedPrice / rv) * rv;
        }
      }

      let priceChangePercentage = 0;
      if (item.product && item.product.selling_price > 0) {
        priceChangePercentage = ((suggestedPrice - item.product.selling_price) / item.product.selling_price) * 100;
      }

      // Update validation errors
      const validationErrors = [...(item.validation_errors || [])].filter(e => e !== 'Large price change (>50%)');
      if (Math.abs(priceChangePercentage) > 50) validationErrors.push('Large price change (>50%)');

      await item.update({
        new_selling_price: suggestedPrice,
        price_change_percent: priceChangePercentage
      }, { transaction: t });
    }

    await t.commit();
    return success(res, batch);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.matchItem = async (req, res, next) => {
  try {
    const item = await PriceImportItem.findByPk(req.params.id);
    if (!item) throw new NotFoundError('Item not found');

    const product = await Product.findByPk(req.body.product_id);
    if (!product) throw new NotFoundError('Product not found');

    // Recalculate price change percentage
    const batch = await PriceImportBatch.findByPk(item.batch_id);
    const marginMultiplier = 1 + (batch.margin_percentage / 100);
    let suggestedPrice = item.cost_price * marginMultiplier;

    if (batch.rounding_rule !== 'NONE' && batch.rounding_value > 0) {
      const rv = batch.rounding_value;
      if (batch.rounding_rule === 'UP') suggestedPrice = Math.ceil(suggestedPrice / rv) * rv;
      else if (batch.rounding_rule === 'DOWN') suggestedPrice = Math.floor(suggestedPrice / rv) * rv;
      else suggestedPrice = Math.round(suggestedPrice / rv) * rv;
    }

    let priceChangePercentage = 0;
    if (product.selling_price > 0) {
      priceChangePercentage = ((suggestedPrice - product.selling_price) / product.selling_price) * 100;
    }

    await item.update({
      product_id: product.id,
      current_cost_price: product.cost_price,
      new_cost_price: item.extracted_price,
      current_selling_price: product.selling_price,
      new_selling_price: suggestedPrice,
      price_change_percent: priceChangePercentage,
      match_type: 'MANUAL',
      match_confidence: 100
    });

    // Update batch counts
    await updateBatchCounts(item.batch_id);

    const updatedItem = await PriceImportItem.findByPk(item.id, {
      include: [{ model: Product, as: 'product' }]
    });

    return success(res, updatedItem);
  } catch (error) {
    next(error);
  }
};

exports.toggleItemSelection = async (req, res, next) => {
  try {
    const item = await PriceImportItem.findByPk(req.params.id);
    if (!item) throw new NotFoundError('Item not found');

    const newStatus = req.body.is_selected ? 'APPROVED' : 'PENDING';
    await item.update({ status: newStatus });
    return success(res, item);
  } catch (error) {
    next(error);
  }
};

exports.selectAllItems = async (req, res, next) => {
  try {
    const { is_selected, match_type } = req.body;

    const where = { batch_id: req.params.id };
    if (match_type) where.match_type = match_type;

    const newStatus = is_selected ? 'APPROVED' : 'PENDING';
    const [count] = await PriceImportItem.update(
      { status: newStatus },
      { where }
    );

    return success(res, { updated_count: count });
  } catch (error) {
    next(error);
  }
};

exports.applyPrices = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const batch = await PriceImportBatch.findByPk(req.params.id);
    if (!batch) throw new NotFoundError('Batch not found');
    if (batch.status !== 'PREVIEW') throw new BusinessError('Batch is not ready to apply');

    const selectedItems = await PriceImportItem.findAll({
      where: {
        batch_id: batch.id,
        status: 'APPROVED',
        product_id: { [Op.ne]: null }
      },
      include: [{ model: Product, as: 'product' }]
    });

    let appliedCount = 0;
    let skippedCount = 0;

    for (const item of selectedItems) {
      if (!item.product_id) {
        skippedCount++;
        continue;
      }

      const product = item.product;

      // Record price history
      await ProductPriceHistory.create({
        id: uuidv4(),
        product_id: product.id,
        old_cost_price: product.cost_price,
        new_cost_price: item.new_cost_price,
        old_selling_price: product.selling_price,
        new_selling_price: item.new_selling_price,
        change_reason: 'OCR_IMPORT',
        import_batch_id: batch.id,
        changed_by: req.user.id
      }, { transaction: t });

      // Update product prices
      await product.update({
        cost_price: item.new_cost_price,
        selling_price: item.new_selling_price
      }, { transaction: t });

      await item.update({ status: 'APPLIED' }, { transaction: t });

      appliedCount++;
    }

    await batch.update({
      status: 'APPLIED',
      rows_applied: appliedCount,
      applied_by: req.user.id,
      applied_at: new Date()
    }, { transaction: t });

    await t.commit();

    return success(res, {
      batch: await PriceImportBatch.findByPk(batch.id),
      applied_count: appliedCount,
      skipped_count: skippedCount
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.cancelBatch = async (req, res, next) => {
  try {
    const batch = await PriceImportBatch.findByPk(req.params.id);
    if (!batch) throw new NotFoundError('Batch not found');
    if (batch.status === 'APPLIED') throw new BusinessError('Cannot cancel applied batch');

    await batch.update({ status: 'CANCELLED' });

    // Delete file if exists
    if (batch.file_path) {
      try {
        await fs.unlink(batch.file_path);
      } catch (e) { /* ignore */ }
    }

    return success(res, null, 'Batch cancelled');
  } catch (error) {
    next(error);
  }
};

exports.revertPrices = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const batch = await PriceImportBatch.findByPk(req.params.id);
    if (!batch) throw new NotFoundError('Batch not found');
    if (batch.status !== 'APPLIED') throw new BusinessError('Can only revert applied batches');

    const priceHistories = await ProductPriceHistory.findAll({
      where: { import_batch_id: batch.id }
    });

    for (const history of priceHistories) {
      await Product.update({
        cost_price: history.old_cost_price,
        selling_price: history.old_selling_price
      }, {
        where: { id: history.product_id },
        transaction: t
      });
    }

    await batch.update({ status: 'REVERTED' }, { transaction: t });

    await t.commit();
    return success(res, { reverted_count: priceHistories.length });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { product_id, import_batch_id, start_date, end_date } = req.query;

    const where = {};
    if (product_id) where.product_id = product_id;
    if (import_batch_id) where.import_batch_id = import_batch_id;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const User = require('../database/models').User;

    const { count, rows } = await ProductPriceHistory.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['name', 'sku'] },
        { model: User, as: 'changed_by_user', attributes: ['first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

// Helper function
async function updateBatchCounts(batchId) {
  const items = await PriceImportItem.findAll({ where: { batch_id: batchId } });
  const matched = items.filter(i => i.match_type === 'EXACT_CODE' || i.match_type === 'FUZZY_NAME' || i.match_type === 'MANUAL').length;
  const unmatched = items.filter(i => i.match_type === 'UNMATCHED' || !i.match_type).length;

  await PriceImportBatch.update(
    { rows_matched: matched, rows_unmatched: unmatched, total_rows_extracted: items.length },
    { where: { id: batchId } }
  );
}
