const { Op } = require('sequelize');
const { AuditLog, User, Branch } = require('../database/models');
const { success, paginated } = require('../utils/apiResponse');
const { parsePagination } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get audit logs with filters and pagination
 * GET /api/v1/audit/logs
 *
 * Query params:
 * - user_id: Filter by user
 * - entity_type: Filter by entity type (SALE, REGISTER_SESSION, etc.)
 * - entity_id: Filter by specific entity
 * - action: Filter by action (CREATE, UPDATE, DELETE, VOID, etc.)
 * - branch_id: Filter by branch
 * - start_date: Filter from date (ISO format)
 * - end_date: Filter to date (ISO format)
 * - page: Page number
 * - limit: Items per page
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const {
      user_id,
      entity_type,
      entity_id,
      action,
      branch_id,
      start_date,
      end_date
    } = req.query;

    const { page, limit, offset } = parsePagination(req.query);

    // Build where clause
    const where = {};

    if (user_id) {
      where.user_id = user_id;
    }

    if (entity_type) {
      where.entity_type = entity_type;
    }

    if (entity_id) {
      where.entity_id = entity_id;
    }

    if (action) {
      where.action = action;
    }

    if (branch_id) {
      where.branch_id = branch_id;
    }

    // Date range filtering
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) {
        where.created_at[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        where.created_at[Op.lte] = new Date(end_date);
      }
    }

    // Fetch audit logs with related data
    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    logger.info(`[AuditController] Retrieved ${logs.length} audit logs`, {
      filters: { user_id, entity_type, entity_id, action, branch_id },
      page,
      limit
    });

    return paginated(res, logs, page, limit, count);
  } catch (error) {
    logger.error('[AuditController] Error fetching audit logs:', error);
    next(error);
  }
};

/**
 * Get audit log details by ID
 * GET /api/v1/audit/logs/:id
 */
exports.getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found'
      });
    }

    return success(res, log);
  } catch (error) {
    logger.error('[AuditController] Error fetching audit log:', error);
    next(error);
  }
};

/**
 * Get audit trail for a specific entity
 * GET /api/v1/audit/entity/:entityType/:entityId
 */
exports.getEntityAuditTrail = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;

    const logs = await AuditLog.findAll({
      where: {
        entity_type: entityType,
        entity_id: entityId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    logger.info(`[AuditController] Retrieved audit trail for ${entityType} ${entityId}`, {
      count: logs.length
    });

    return success(res, {
      entity_type: entityType,
      entity_id: entityId,
      logs,
      count: logs.length
    });
  } catch (error) {
    logger.error('[AuditController] Error fetching entity audit trail:', error);
    next(error);
  }
};

/**
 * Get audit statistics
 * GET /api/v1/audit/stats
 */
exports.getAuditStats = async (req, res, next) => {
  try {
    const { start_date, end_date, branch_id } = req.query;

    const where = {};

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) {
        where.created_at[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        where.created_at[Op.lte] = new Date(end_date);
      }
    }

    if (branch_id) {
      where.branch_id = branch_id;
    }

    // Get counts by action type
    const actionCounts = await AuditLog.findAll({
      where,
      attributes: [
        'action',
        [require('../database/models').sequelize.fn('COUNT', require('../database/models').sequelize.col('id')), 'count']
      ],
      group: ['action']
    });

    // Get counts by entity type
    const entityCounts = await AuditLog.findAll({
      where,
      attributes: [
        'entity_type',
        [require('../database/models').sequelize.fn('COUNT', require('../database/models').sequelize.col('id')), 'count']
      ],
      group: ['entity_type']
    });

    // Get top users by activity
    const topUsers = await AuditLog.findAll({
      where,
      attributes: [
        'user_id',
        'user_email',
        [require('../database/models').sequelize.fn('COUNT', require('../database/models').sequelize.col('id')), 'count']
      ],
      group: ['user_id', 'user_email'],
      order: [[require('../database/models').sequelize.literal('count'), 'DESC']],
      limit: 10
    });

    return success(res, {
      action_counts: actionCounts,
      entity_counts: entityCounts,
      top_users: topUsers
    });
  } catch (error) {
    logger.error('[AuditController] Error fetching audit stats:', error);
    next(error);
  }
};

module.exports = {
  getAuditLogs: exports.getAuditLogs,
  getAuditLogById: exports.getAuditLogById,
  getEntityAuditTrail: exports.getEntityAuditTrail,
  getAuditStats: exports.getAuditStats
};
