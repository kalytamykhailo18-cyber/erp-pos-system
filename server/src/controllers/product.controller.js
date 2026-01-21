const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  Product, Category, UnitOfMeasure, BranchStock, ProductPriceHistory, sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError } = require('../middleware/errorHandler');
const { parsePagination, calculateMarginPercent } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset, sortBy, sortOrder } = parsePagination(req.query);
    const { category_id, is_active, is_weighable, search, branch_id } = req.query;

    const where = {};
    if (category_id) where.category_id = category_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (is_weighable !== undefined) where.is_weighable = is_weighable === 'true';
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { barcode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: UnitOfMeasure, as: 'unit' }
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.getForPOS = async (req, res, next) => {
  try {
    const { branch_id, category_id, search } = req.query;

    const where = { is_active: true };
    if (category_id) where.category_id = category_id;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { barcode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const products = await Product.findAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['name'] },
        { model: UnitOfMeasure, as: 'unit', attributes: ['code'] },
        {
          model: BranchStock,
          as: 'branch_stocks',
          where: { branch_id },
          required: false
        }
      ],
      order: [['name', 'ASC']],
      limit: 100
    });

    const posProducts = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      short_name: p.short_name,
      selling_price: p.selling_price,
      tax_rate: p.tax_rate,
      is_tax_included: p.is_tax_included,
      is_weighable: p.is_weighable,
      unit_code: p.unit?.code,
      category_name: p.category?.name,
      thumbnail_url: p.thumbnail_url,
      stock_quantity: p.branch_stocks?.[0]?.quantity || 0
    }));

    return success(res, posProducts);
  } catch (error) {
    next(error);
  }
};

exports.getByBarcode = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { barcode: req.params.barcode, is_active: true },
      include: [
        { model: Category, as: 'category' },
        { model: UnitOfMeasure, as: 'unit' }
      ]
    });

    if (!product) throw new NotFoundError('Product not found');
    return success(res, product);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: UnitOfMeasure, as: 'unit' }
      ]
    });

    if (!product) throw new NotFoundError('Product not found');
    return success(res, product);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const productData = { ...req.body, id: uuidv4() };

    // Calculate margin if cost and selling price provided
    if (productData.cost_price && productData.selling_price) {
      productData.margin_percent = calculateMarginPercent(
        productData.cost_price,
        productData.selling_price
      );
    }

    const product = await Product.create(productData);
    return created(res, product);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) throw new NotFoundError('Product not found');

    const updateData = { ...req.body };

    // Recalculate margin if prices changed
    if (updateData.cost_price || updateData.selling_price) {
      const costPrice = updateData.cost_price || product.cost_price;
      const sellingPrice = updateData.selling_price || product.selling_price;
      updateData.margin_percent = calculateMarginPercent(costPrice, sellingPrice);
    }

    await product.update(updateData);
    return success(res, product);
  } catch (error) {
    next(error);
  }
};

exports.deactivate = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) throw new NotFoundError('Product not found');
    await product.update({ is_active: false });
    return success(res, null, 'Product deactivated');
  } catch (error) {
    next(error);
  }
};

exports.getStock = async (req, res, next) => {
  try {
    const stocks = await BranchStock.findAll({
      where: { product_id: req.params.id },
      include: [{ model: require('../database/models').Branch, as: 'branch', attributes: ['id', 'name', 'code'] }]
    });

    return success(res, stocks);
  } catch (error) {
    next(error);
  }
};

exports.getPriceHistory = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const { count, rows } = await ProductPriceHistory.findAndCountAll({
      where: { product_id: req.params.id },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.updatePrices = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) throw new NotFoundError('Product not found');

    const { cost_price, selling_price, reason } = req.body;

    // Save history
    await ProductPriceHistory.create({
      id: uuidv4(),
      product_id: product.id,
      old_cost_price: product.cost_price,
      new_cost_price: cost_price || product.cost_price,
      old_selling_price: product.selling_price,
      new_selling_price: selling_price || product.selling_price,
      change_reason: 'MANUAL',
      changed_by: req.user.id
    }, { transaction: t });

    // Update product
    const updateData = {};
    if (cost_price !== undefined) updateData.cost_price = cost_price;
    if (selling_price !== undefined) updateData.selling_price = selling_price;

    if (Object.keys(updateData).length) {
      updateData.margin_percent = calculateMarginPercent(
        cost_price || product.cost_price,
        selling_price || product.selling_price
      );
      await product.update(updateData, { transaction: t });
    }

    await t.commit();
    return success(res, product);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Bulk price update by margin percentage
exports.bulkUpdateByMargin = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      product_ids,
      category_id,
      supplier_id,
      margin_percentage,
      rounding_rule,
      rounding_value
    } = req.body;

    // Build where clause
    const where = { is_active: true };
    if (product_ids && product_ids.length > 0) {
      where.id = { [Op.in]: product_ids };
    }
    if (category_id) {
      where.category_id = category_id;
    }

    // Fetch products
    const products = await Product.findAll({ where });

    if (products.length === 0) {
      return success(res, { updated_count: 0, products: [] });
    }

    let updatedCount = 0;
    const updatedProducts = [];

    for (const product of products) {
      const costPrice = parseFloat(product.cost_price) || 0;
      if (costPrice <= 0) continue;

      // Calculate new selling price
      const marginMultiplier = 1 + (parseFloat(margin_percentage) / 100);
      let newSellingPrice = costPrice * marginMultiplier;

      // Apply rounding
      if (rounding_rule && rounding_value > 0) {
        const rv = parseInt(rounding_value);
        if (rounding_rule === 'UP') {
          newSellingPrice = Math.ceil(newSellingPrice / rv) * rv;
        } else if (rounding_rule === 'DOWN') {
          newSellingPrice = Math.floor(newSellingPrice / rv) * rv;
        } else if (rounding_rule === 'NEAREST') {
          newSellingPrice = Math.round(newSellingPrice / rv) * rv;
        }
      }

      // Record price history
      await ProductPriceHistory.create({
        id: uuidv4(),
        product_id: product.id,
        old_cost_price: product.cost_price,
        new_cost_price: product.cost_price,
        old_selling_price: product.selling_price,
        new_selling_price: newSellingPrice,
        change_reason: 'BULK_UPDATE',
        changed_by: req.user.id
      }, { transaction: t });

      // Update product
      await product.update({
        selling_price: newSellingPrice,
        margin_percent: margin_percentage
      }, { transaction: t });

      updatedCount++;
      updatedProducts.push({
        id: product.id,
        name: product.name,
        sku: product.sku,
        old_price: product.selling_price,
        new_price: newSellingPrice
      });
    }

    await t.commit();

    return success(res, {
      updated_count: updatedCount,
      products: updatedProducts
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getUnits = async (req, res, next) => {
  try {
    const units = await UnitOfMeasure.findAll({
      order: [['name', 'ASC']]
    });
    return success(res, units);
  } catch (error) {
    next(error);
  }
};

// Bulk price update by supplier
exports.bulkUpdateBySupplier = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      supplier_id,
      margin_percentage,
      rounding_rule,
      rounding_value,
      update_cost_prices
    } = req.body;

    const { SupplierProduct } = require('../database/models');

    // Get all products from this supplier
    const supplierProducts = await SupplierProduct.findAll({
      where: { supplier_id },
      include: [{ model: Product, as: 'product', where: { is_active: true } }]
    });

    if (supplierProducts.length === 0) {
      return success(res, { updated_count: 0, products: [] });
    }

    let updatedCount = 0;
    const updatedProducts = [];

    for (const sp of supplierProducts) {
      const product = sp.product;

      // Optionally update cost price from supplier
      let costPrice = parseFloat(product.cost_price) || 0;
      if (update_cost_prices && sp.last_cost_price) {
        costPrice = parseFloat(sp.last_cost_price);
      }

      if (costPrice <= 0) continue;

      // Calculate new selling price
      const marginMultiplier = 1 + (parseFloat(margin_percentage) / 100);
      let newSellingPrice = costPrice * marginMultiplier;

      // Apply rounding
      if (rounding_rule && rounding_value > 0) {
        const rv = parseInt(rounding_value);
        if (rounding_rule === 'UP') {
          newSellingPrice = Math.ceil(newSellingPrice / rv) * rv;
        } else if (rounding_rule === 'DOWN') {
          newSellingPrice = Math.floor(newSellingPrice / rv) * rv;
        } else if (rounding_rule === 'NEAREST') {
          newSellingPrice = Math.round(newSellingPrice / rv) * rv;
        }
      }

      // Record price history
      await ProductPriceHistory.create({
        id: uuidv4(),
        product_id: product.id,
        old_cost_price: product.cost_price,
        new_cost_price: update_cost_prices ? costPrice : product.cost_price,
        old_selling_price: product.selling_price,
        new_selling_price: newSellingPrice,
        change_reason: 'BULK_UPDATE',
        changed_by: req.user.id
      }, { transaction: t });

      // Update product
      const updateData = {
        selling_price: newSellingPrice,
        margin_percent: margin_percentage
      };
      if (update_cost_prices) {
        updateData.cost_price = costPrice;
      }

      await product.update(updateData, { transaction: t });

      updatedCount++;
      updatedProducts.push({
        id: product.id,
        name: product.name,
        sku: product.sku,
        old_price: product.selling_price,
        new_price: newSellingPrice
      });
    }

    await t.commit();

    return success(res, {
      updated_count: updatedCount,
      products: updatedProducts
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};
