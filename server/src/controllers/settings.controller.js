const { SystemSettings } = require('../database/models');
const { success } = require('../utils/apiResponse');
const { NotFoundError } = require('../middleware/errorHandler');

/**
 * Get system settings
 * GET /api/v1/settings
 */
exports.get = async (req, res, next) => {
  try {
    // Get the single settings row (or first one if multiple exist)
    let settings = await SystemSettings.findOne();

    // If no settings exist, create default
    if (!settings) {
      settings = await SystemSettings.create({
        company_name: 'Mi Empresa',
        currency: 'ARS',
        timezone: 'America/Argentina/Buenos_Aires',
        date_format: 'DD/MM/YYYY',
        enable_invoicing: true
      });
    }

    // Don't expose the API key in full - mask it
    const settingsData = settings.toJSON();
    if (settingsData.factuhoy_api_key) {
      settingsData.factuhoy_api_key_masked = '****' + settingsData.factuhoy_api_key.slice(-4);
      settingsData.has_factuhoy_api_key = true;
    } else {
      settingsData.has_factuhoy_api_key = false;
    }
    delete settingsData.factuhoy_api_key;

    return success(res, settingsData);
  } catch (error) {
    next(error);
  }
};

/**
 * Update system settings
 * PUT /api/v1/settings
 */
exports.update = async (req, res, next) => {
  try {
    // Get the single settings row
    let settings = await SystemSettings.findOne();

    if (!settings) {
      // Create if doesn't exist
      settings = await SystemSettings.create(req.body);
    } else {
      // Update existing
      await settings.update(req.body);
    }

    // Return masked response
    const settingsData = settings.toJSON();
    if (settingsData.factuhoy_api_key) {
      settingsData.factuhoy_api_key_masked = '****' + settingsData.factuhoy_api_key.slice(-4);
      settingsData.has_factuhoy_api_key = true;
    } else {
      settingsData.has_factuhoy_api_key = false;
    }
    delete settingsData.factuhoy_api_key;

    return success(res, settingsData);
  } catch (error) {
    next(error);
  }
};
