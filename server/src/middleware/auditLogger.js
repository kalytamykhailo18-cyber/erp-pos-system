const { Op } = require('sequelize');
const { AuditLog } = require('../database/models');
const logger = require('../utils/logger');

/**
 * Audit Logger Middleware
 *
 * Provides utility functions to create audit trail entries for all critical actions.
 * Captures: user, action, entity type, entity ID, old/new values, IP address, user agent
 *
 * Usage:
 *   const { logAudit } = require('../middleware/auditLogger');
 *   await logAudit(req, {
 *     action: 'VOID_SALE',
 *     entityType: 'SALE',
 *     entityId: sale.id,
 *     oldValues: { status: 'COMPLETED' },
 *     newValues: { status: 'VOIDED', void_reason: reason },
 *     description: `Sale ${sale.sale_number} voided`
 *   });
 */

/**
 * Create an audit log entry
 *
 * @param {Object} req - Express request object (contains user, ip, headers)
 * @param {Object} options - Audit log options
 * @param {string} options.action - Action performed (e.g., 'CREATE_SALE', 'VOID_SALE', 'REOPEN_SESSION')
 * @param {string} options.entityType - Type of entity (e.g., 'SALE', 'REGISTER_SESSION', 'DISCOUNT')
 * @param {string} options.entityId - ID of the entity affected
 * @param {Object} [options.oldValues] - Previous values (for updates/deletes)
 * @param {Object} [options.newValues] - New values (for creates/updates)
 * @param {string} [options.description] - Human-readable description
 * @returns {Promise<AuditLog>} Created audit log entry
 */
async function logAudit(req, options) {
  try {
    const {
      action,
      entityType,
      entityId,
      oldValues = null,
      newValues = null,
      description = null
    } = options;

    // Validate required fields
    if (!action || !entityType || !entityId) {
      logger.error('[AuditLogger] Missing required fields:', { action, entityType, entityId });
      throw new Error('action, entityType, and entityId are required for audit logging');
    }

    // Extract user information
    const userId = req.user?.id || null;
    const userEmail = req.user?.email || null;
    const branchId = req.user?.branch_id || req.body?.branch_id || null;

    // Extract IP address (handle proxies)
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                      req.headers['x-real-ip'] ||
                      req.connection?.remoteAddress ||
                      req.socket?.remoteAddress ||
                      req.ip ||
                      'UNKNOWN';

    // Extract user agent
    const userAgent = req.headers['user-agent'] || 'UNKNOWN';

    // Create audit log entry
    const auditLog = await AuditLog.create({
      user_id: userId,
      user_email: userEmail,
      branch_id: branchId,
      ip_address: ipAddress,
      user_agent: userAgent,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      description
    });

    logger.info('[AuditLogger] Audit log created:', {
      id: auditLog.id,
      action,
      entityType,
      entityId,
      userId,
      userEmail
    });

    return auditLog;
  } catch (error) {
    // Log error but don't throw - audit logging should not break business logic
    logger.error('[AuditLogger] Failed to create audit log:', {
      error: error.message,
      stack: error.stack,
      options
    });

    // Return null to indicate failure without breaking the main transaction
    return null;
  }
}

/**
 * Express middleware to automatically log all requests
 * (Optional - can be applied globally or to specific routes)
 *
 * Usage:
 *   router.post('/sales/:id/void', [authenticate, auditMiddleware], saleController.voidSale);
 */
function auditMiddleware(req, res, next) {
  // Store original res.json to intercept response
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    // Only log successful operations (2xx status codes)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Extract action from route and method
      const action = `${req.method}_${req.route?.path || req.path}`.toUpperCase();

      // Try to extract entity info from params or body
      const entityId = req.params?.id || req.params?.saleId || req.params?.sessionId || data?.data?.id;
      const entityType = extractEntityType(req.route?.path || req.path);

      if (entityId && entityType) {
        // Log asynchronously without blocking response
        setImmediate(async () => {
          await logAudit(req, {
            action,
            entityType,
            entityId,
            oldValues: null,
            newValues: req.body,
            description: `${req.method} ${req.path}`
          });
        });
      }
    }

    return originalJson(data);
  };

  next();
}

/**
 * Extract entity type from route path
 */
function extractEntityType(path) {
  if (!path) return 'UNKNOWN';

  if (path.includes('/sales')) return 'SALE';
  if (path.includes('/sessions')) return 'REGISTER_SESSION';
  if (path.includes('/customers')) return 'CUSTOMER';
  if (path.includes('/products')) return 'PRODUCT';
  if (path.includes('/users')) return 'USER';
  if (path.includes('/branches')) return 'BRANCH';

  return 'UNKNOWN';
}

/**
 * Create audit logs for bulk operations
 *
 * @param {Object} req - Express request object
 * @param {Array} operations - Array of audit log options
 * @returns {Promise<Array<AuditLog>>} Created audit log entries
 */
async function logBulkAudit(req, operations) {
  try {
    const results = await Promise.allSettled(
      operations.map(operation => logAudit(req, operation))
    );

    const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = results.filter(r => r.status === 'rejected');

    if (failed.length > 0) {
      logger.warn('[AuditLogger] Some bulk audit logs failed:', {
        successful: successful.length,
        failed: failed.length
      });
    }

    return successful;
  } catch (error) {
    logger.error('[AuditLogger] Failed to create bulk audit logs:', error);
    return [];
  }
}

/**
 * Query audit logs with filters
 *
 * @param {Object} filters - Query filters
 * @param {string} [filters.userId] - Filter by user ID
 * @param {string} [filters.action] - Filter by action
 * @param {string} [filters.entityType] - Filter by entity type
 * @param {string} [filters.entityId] - Filter by entity ID
 * @param {string} [filters.branchId] - Filter by branch ID
 * @param {Date} [filters.startDate] - Filter by start date
 * @param {Date} [filters.endDate] - Filter by end date
 * @param {number} [filters.limit=50] - Limit results
 * @param {number} [filters.offset=0] - Offset for pagination
 * @returns {Promise<{rows: Array<AuditLog>, count: number}>} Audit logs with count
 */
async function queryAuditLogs(filters = {}) {
  try {
    const {
      userId,
      action,
      entityType,
      entityId,
      branchId,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = filters;

    const where = {};

    if (userId) where.user_id = userId;
    if (action) where.action = action;
    if (entityType) where.entity_type = entityType;
    if (entityId) where.entity_id = entityId;
    if (branchId) where.branch_id = branchId;

    // Date range filter
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = startDate;
      if (endDate) where.created_at[Op.lte] = endDate;
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return { rows, count };
  } catch (error) {
    logger.error('[AuditLogger] Failed to query audit logs:', error);
    throw error;
  }
}

module.exports = {
  logAudit,
  auditMiddleware,
  logBulkAudit,
  queryAuditLogs
};
