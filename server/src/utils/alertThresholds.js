const { AlertConfig } = require('../database/models');

/**
 * Get alert threshold value for a specific alert type and branch
 * Falls back to global configuration if branch-specific config not found
 * @param {string} branchId - Branch UUID
 * @param {string} alertType - Alert type (LARGE_DISCOUNT, HIGH_VALUE_SALE, etc.)
 * @param {number} defaultValue - Default value if no config found
 * @returns {Promise<number>} Threshold value
 */
async function getAlertThreshold(branchId, alertType, defaultValue) {
  try {
    // Try branch-specific config first
    let config = await AlertConfig.findOne({
      where: {
        branch_id: branchId,
        alert_type: alertType,
        is_active: true
      }
    });

    // Fall back to global config
    if (!config) {
      config = await AlertConfig.findOne({
        where: {
          branch_id: null,
          alert_type: alertType,
          is_active: true
        }
      });
    }

    // Return threshold or default
    return config?.threshold ? parseFloat(config.threshold) : defaultValue;
  } catch (error) {
    console.error(`Error fetching alert threshold for ${alertType}:`, error);
    return defaultValue;
  }
}

/**
 * Check if an alert type is enabled for a branch
 * @param {string} branchId - Branch UUID
 * @param {string} alertType - Alert type
 * @returns {Promise<boolean>} Whether alert is enabled
 */
async function isAlertEnabled(branchId, alertType) {
  try {
    // Check branch-specific config first
    let config = await AlertConfig.findOne({
      where: {
        branch_id: branchId,
        alert_type: alertType
      }
    });

    // Fall back to global config
    if (!config) {
      config = await AlertConfig.findOne({
        where: {
          branch_id: null,
          alert_type: alertType
        }
      });
    }

    // Return is_active status (default to true if no config)
    return config ? config.is_active : true;
  } catch (error) {
    console.error(`Error checking alert enabled status for ${alertType}:`, error);
    return true; // Default to enabled on error
  }
}

/**
 * Get multiple alert thresholds at once (optimized with single query)
 * @param {string} branchId - Branch UUID
 * @param {string[]} alertTypes - Array of alert types
 * @returns {Promise<Object>} Map of alertType to threshold value
 */
async function getAlertThresholds(branchId, alertTypes) {
  try {
    const configs = await AlertConfig.findAll({
      where: {
        branch_id: [branchId, null], // Get both branch-specific and global
        alert_type: alertTypes,
        is_active: true
      }
    });

    const thresholds = {};

    // Build map with branch-specific taking priority over global
    for (const alertType of alertTypes) {
      const branchConfig = configs.find(c => c.branch_id === branchId && c.alert_type === alertType);
      const globalConfig = configs.find(c => c.branch_id === null && c.alert_type === alertType);

      const config = branchConfig || globalConfig;
      thresholds[alertType] = config?.threshold ? parseFloat(config.threshold) : null;
    }

    return thresholds;
  } catch (error) {
    console.error('Error fetching multiple alert thresholds:', error);
    return {};
  }
}

module.exports = {
  getAlertThreshold,
  isAlertEnabled,
  getAlertThresholds
};
