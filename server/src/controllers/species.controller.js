const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { Species, Variety, Product } = require('../database/models');
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

    const { count, rows } = await Species.findAndCountAll({
      where,
      include: [
        {
          model: Variety,
          as: 'varieties',
          attributes: ['id', 'name', 'is_active'],
          where: { is_active: true },
          required: false
        }
      ],
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
    const species = await Species.findByPk(req.params.id, {
      include: [
        {
          model: Variety,
          as: 'varieties',
          order: [['sort_order', 'ASC']]
        }
      ]
    });

    if (!species) throw new NotFoundError('Species not found');
    return success(res, species);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, sort_order, is_active } = req.body;

    // Check if species with this name already exists
    const existing = await Species.findOne({ where: { name } });
    if (existing) {
      throw new BadRequestError(`Species with name "${name}" already exists`);
    }

    const species = await Species.create({
      id: uuidv4(),
      name,
      description,
      sort_order: sort_order || 0,
      is_active: is_active !== undefined ? is_active : true
    });

    return created(res, species, 'Species created successfully');
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const species = await Species.findByPk(req.params.id);
    if (!species) throw new NotFoundError('Species not found');

    const { name, description, sort_order, is_active } = req.body;

    // If name is being changed, check for duplicates
    if (name && name !== species.name) {
      const existing = await Species.findOne({
        where: {
          name,
          id: { [Op.ne]: species.id }
        }
      });
      if (existing) {
        throw new BadRequestError(`Species with name "${name}" already exists`);
      }
    }

    await species.update({
      name: name || species.name,
      description: description !== undefined ? description : species.description,
      sort_order: sort_order !== undefined ? sort_order : species.sort_order,
      is_active: is_active !== undefined ? is_active : species.is_active
    });

    return success(res, species, 'Species updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const species = await Species.findByPk(req.params.id);
    if (!species) throw new NotFoundError('Species not found');

    // Check if species has associated products
    const productCount = await Product.count({ where: { species_id: species.id } });
    if (productCount > 0) {
      throw new BadRequestError(
        `Cannot delete species. ${productCount} product(s) are associated with this species. Deactivate instead.`
      );
    }

    // Check if species has varieties
    const varietyCount = await Variety.count({ where: { species_id: species.id } });
    if (varietyCount > 0) {
      throw new BadRequestError(
        `Cannot delete species. ${varietyCount} varieties are associated with this species. Deactivate instead.`
      );
    }

    await species.destroy();
    return success(res, null, 'Species deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.activate = async (req, res, next) => {
  try {
    const species = await Species.findByPk(req.params.id);
    if (!species) throw new NotFoundError('Species not found');

    await species.update({ is_active: true });
    return success(res, species, 'Species activated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deactivate = async (req, res, next) => {
  try {
    const species = await Species.findByPk(req.params.id);
    if (!species) throw new NotFoundError('Species not found');

    await species.update({ is_active: false });
    return success(res, species, 'Species deactivated successfully');
  } catch (error) {
    next(error);
  }
};
