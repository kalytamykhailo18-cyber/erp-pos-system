const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { Variety, Species, Product } = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');

exports.getBySpecies = async (req, res, next) => {
  try {
    const { speciesId } = req.params;
    const { is_active } = req.query;

    const where = { species_id: speciesId };
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const varieties = await Variety.findAll({
      where,
      include: [
        {
          model: Species,
          as: 'species',
          attributes: ['id', 'name']
        }
      ],
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    return success(res, varieties);
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { species_id, is_active, search, sort_by, sort_order } = req.query;

    const where = {};
    if (species_id) where.species_id = species_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Variety.findAndCountAll({
      where,
      include: [
        {
          model: Species,
          as: 'species',
          attributes: ['id', 'name']
        }
      ],
      order: [[sort_by || 'updated_at', sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
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
    const variety = await Variety.findByPk(req.params.id, {
      include: [
        {
          model: Species,
          as: 'species',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!variety) throw new NotFoundError('Variety not found');
    return success(res, variety);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { species_id, name, description, sort_order, is_active } = req.body;

    if (!species_id) {
      throw new BadRequestError('species_id is required');
    }

    // Verify species exists
    const species = await Species.findByPk(species_id);
    if (!species) {
      throw new NotFoundError('Species not found');
    }

    // Check if variety with this name already exists for this species
    const existing = await Variety.findOne({
      where: { species_id, name }
    });
    if (existing) {
      throw new BadRequestError(
        `Variety with name "${name}" already exists for species "${species.name}"`
      );
    }

    const variety = await Variety.create({
      id: uuidv4(),
      species_id,
      name,
      description,
      sort_order: sort_order || 0,
      is_active: is_active !== undefined ? is_active : true
    });

    // Reload with species included
    await variety.reload({
      include: [{ model: Species, as: 'species', attributes: ['id', 'name'] }]
    });

    return created(res, variety, 'Variety created successfully');
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const variety = await Variety.findByPk(req.params.id);
    if (!variety) throw new NotFoundError('Variety not found');

    const { species_id, name, description, sort_order, is_active } = req.body;

    // If species is being changed, verify new species exists
    if (species_id && species_id !== variety.species_id) {
      const species = await Species.findByPk(species_id);
      if (!species) {
        throw new NotFoundError('Species not found');
      }
    }

    // If name or species is being changed, check for duplicates
    if ((name && name !== variety.name) || (species_id && species_id !== variety.species_id)) {
      const existing = await Variety.findOne({
        where: {
          species_id: species_id || variety.species_id,
          name: name || variety.name,
          id: { [Op.ne]: variety.id }
        }
      });
      if (existing) {
        throw new BadRequestError('A variety with this name already exists for this species');
      }
    }

    await variety.update({
      species_id: species_id || variety.species_id,
      name: name || variety.name,
      description: description !== undefined ? description : variety.description,
      sort_order: sort_order !== undefined ? sort_order : variety.sort_order,
      is_active: is_active !== undefined ? is_active : variety.is_active
    });

    // Reload with species included
    await variety.reload({
      include: [{ model: Species, as: 'species', attributes: ['id', 'name'] }]
    });

    return success(res, variety, 'Variety updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const variety = await Variety.findByPk(req.params.id);
    if (!variety) throw new NotFoundError('Variety not found');

    // Check if variety has associated products
    const productCount = await Product.count({ where: { variety_id: variety.id } });
    if (productCount > 0) {
      throw new BadRequestError(
        `Cannot delete variety. ${productCount} product(s) are associated with this variety. Deactivate instead.`
      );
    }

    await variety.destroy();
    return success(res, null, 'Variety deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.activate = async (req, res, next) => {
  try {
    const variety = await Variety.findByPk(req.params.id);
    if (!variety) throw new NotFoundError('Variety not found');

    await variety.update({ is_active: true });
    return success(res, variety, 'Variety activated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deactivate = async (req, res, next) => {
  try {
    const variety = await Variety.findByPk(req.params.id);
    if (!variety) throw new NotFoundError('Variety not found');

    await variety.update({ is_active: false });
    return success(res, variety, 'Variety deactivated successfully');
  } catch (error) {
    next(error);
  }
};
