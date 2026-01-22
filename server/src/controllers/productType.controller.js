const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { ProductType, Product } = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset, sortBy, sortOrder } = parsePagination(req.query);
    const { is_active, search } = req.query;

    const where = {};
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await ProductType.findAndCountAll({
      where,
      order: [[sortBy || 'sort_order', sortOrder || 'ASC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const productType = await ProductType.findByPk(req.params.id);
    if (!productType) throw new NotFoundError('Product type not found');
    return success(res, productType);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, sort_order, is_active } = req.body;

    // Check if product type with this name already exists
    const existing = await ProductType.findOne({ where: { name } });
    if (existing) {
      throw new BadRequestError(`Product type with name "${name}" already exists`);
    }

    const productType = await ProductType.create({
      id: uuidv4(),
      name,
      description,
      sort_order: sort_order || 0,
      is_active: is_active !== undefined ? is_active : true
    });

    return created(res, productType, 'Product type created successfully');
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const productType = await ProductType.findByPk(req.params.id);
    if (!productType) throw new NotFoundError('Product type not found');

    const { name, description, sort_order, is_active } = req.body;

    // If name is being changed, check for duplicates
    if (name && name !== productType.name) {
      const existing = await ProductType.findOne({
        where: {
          name,
          id: { [Op.ne]: productType.id }
        }
      });
      if (existing) {
        throw new BadRequestError(`Product type with name "${name}" already exists`);
      }
    }

    await productType.update({
      name: name || productType.name,
      description: description !== undefined ? description : productType.description,
      sort_order: sort_order !== undefined ? sort_order : productType.sort_order,
      is_active: is_active !== undefined ? is_active : productType.is_active
    });

    return success(res, productType, 'Product type updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const productType = await ProductType.findByPk(req.params.id);
    if (!productType) throw new NotFoundError('Product type not found');

    // Check if product type has associated products
    const productCount = await Product.count({ where: { product_type_id: productType.id } });
    if (productCount > 0) {
      throw new BadRequestError(
        `Cannot delete product type. ${productCount} product(s) are associated with this type. Deactivate instead.`
      );
    }

    await productType.destroy();
    return success(res, null, 'Product type deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.activate = async (req, res, next) => {
  try {
    const productType = await ProductType.findByPk(req.params.id);
    if (!productType) throw new NotFoundError('Product type not found');

    await productType.update({ is_active: true });
    return success(res, productType, 'Product type activated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deactivate = async (req, res, next) => {
  try {
    const productType = await ProductType.findByPk(req.params.id);
    if (!productType) throw new NotFoundError('Product type not found');

    await productType.update({ is_active: false });
    return success(res, productType, 'Product type deactivated successfully');
  } catch (error) {
    next(error);
  }
};
