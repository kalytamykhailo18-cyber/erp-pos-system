const { DenominationConfig } = require('../database/models');
const { success, created } = require('../utils/apiResponse');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

/**
 * PART 16: Get all bill denominations
 */
exports.getAllDenominations = async (req, res, next) => {
  try {
    const { include_inactive } = req.query;

    const where = {};
    if (include_inactive !== 'true') {
      where.is_active = true;
    }

    const denominations = await DenominationConfig.findAll({
      where,
      order: [['display_order', 'ASC'], ['value', 'DESC']]
    });

    return success(res, denominations, 'Denominations retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PART 16: Get a single denomination by ID
 */
exports.getDenominationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const denomination = await DenominationConfig.findByPk(id);

    if (!denomination) {
      throw new NotFoundError('Denomination not found');
    }

    return success(res, denomination, 'Denomination retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PART 16: Create a new denomination
 */
exports.createDenomination = async (req, res, next) => {
  try {
    const { value, label, is_active, display_order } = req.body;

    // Validation
    if (!value || value <= 0) {
      throw new ValidationError('Valid denomination value is required');
    }
    if (!label) {
      throw new ValidationError('Denomination label is required');
    }
    if (display_order === undefined || display_order === null) {
      throw new ValidationError('Display order is required');
    }

    // Check if denomination value already exists
    const existing = await DenominationConfig.findOne({
      where: { value: parseFloat(value) }
    });

    if (existing) {
      throw new ValidationError(`Denomination with value ${value} already exists`);
    }

    const denomination = await DenominationConfig.create({
      value: parseFloat(value),
      label,
      is_active: is_active !== undefined ? is_active : true,
      display_order: parseInt(display_order)
    });

    return created(res, denomination, 'Denomination created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PART 16: Update an existing denomination
 */
exports.updateDenomination = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { value, label, is_active, display_order } = req.body;

    const denomination = await DenominationConfig.findByPk(id);

    if (!denomination) {
      throw new NotFoundError('Denomination not found');
    }

    // If changing value, check for duplicates
    if (value !== undefined && parseFloat(value) !== parseFloat(denomination.value)) {
      const existing = await DenominationConfig.findOne({
        where: {
          value: parseFloat(value),
          id: { [Op.ne]: id }
        }
      });

      if (existing) {
        throw new ValidationError(`Denomination with value ${value} already exists`);
      }
    }

    // Update fields
    if (value !== undefined) denomination.value = parseFloat(value);
    if (label !== undefined) denomination.label = label;
    if (is_active !== undefined) denomination.is_active = is_active;
    if (display_order !== undefined) denomination.display_order = parseInt(display_order);

    await denomination.save();

    return success(res, denomination, 'Denomination updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PART 16: Delete a denomination (soft delete - set is_active = false)
 */
exports.deleteDenomination = async (req, res, next) => {
  try {
    const { id } = req.params;

    const denomination = await DenominationConfig.findByPk(id);

    if (!denomination) {
      throw new NotFoundError('Denomination not found');
    }

    // Soft delete - just mark as inactive
    denomination.is_active = false;
    await denomination.save();

    return success(res, { id: denomination.id, is_active: false }, 'Denomination deactivated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PART 16: Reorder denominations (bulk update display_order)
 * Request body should contain an array of {id, display_order} objects
 */
exports.reorderDenominations = async (req, res, next) => {
  try {
    const { denominations } = req.body;

    if (!Array.isArray(denominations) || denominations.length === 0) {
      throw new ValidationError('Denominations array is required');
    }

    // Validate all IDs exist before updating
    const ids = denominations.map(d => d.id);
    const existingDenominations = await DenominationConfig.findAll({
      where: { id: { [Op.in]: ids } }
    });

    if (existingDenominations.length !== ids.length) {
      throw new NotFoundError('One or more denominations not found');
    }

    // Update display_order for each denomination
    const updatePromises = denominations.map(({ id, display_order }) =>
      DenominationConfig.update(
        { display_order: parseInt(display_order) },
        { where: { id } }
      )
    );

    await Promise.all(updatePromises);

    // Fetch updated denominations
    const updated = await DenominationConfig.findAll({
      where: { id: { [Op.in]: ids } },
      order: [['display_order', 'ASC']]
    });

    return success(res, updated, 'Denominations reordered successfully');
  } catch (error) {
    next(error);
  }
};
