const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticate, requirePermission } = require('../middleware/auth');

/**
 * Audit Logs Routes
 * All routes require authentication and manager-level permissions
 */

/**
 * GET /api/v1/audit/logs
 * Get audit logs with filters and pagination
 * Requires: Manager or Owner role
 */
router.get(
  '/logs',
  [authenticate, requirePermission('canViewReports')],
  auditController.getAuditLogs
);

/**
 * GET /api/v1/audit/logs/:id
 * Get specific audit log details
 * Requires: Manager or Owner role
 */
router.get(
  '/logs/:id',
  [authenticate, requirePermission('canViewReports')],
  auditController.getAuditLogById
);

/**
 * GET /api/v1/audit/entity/:entityType/:entityId
 * Get complete audit trail for a specific entity
 * Requires: Manager or Owner role
 */
router.get(
  '/entity/:entityType/:entityId',
  [authenticate, requirePermission('canViewReports')],
  auditController.getEntityAuditTrail
);

/**
 * GET /api/v1/audit/stats
 * Get audit statistics
 * Requires: Owner role
 */
router.get(
  '/stats',
  [authenticate, requirePermission('canViewReports')],
  auditController.getAuditStats
);

module.exports = router;
