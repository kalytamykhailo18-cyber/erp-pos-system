const { v4: uuidv4 } = require('uuid');

/**
 * Centralized audit logging utility
 * Records all critical operations with before/after snapshots
 */

/**
 * Extract IP address from request
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
const getIpAddress = (req) => {
  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
};

/**
 * Extract user agent from request
 * @param {Object} req - Express request object
 * @returns {string} User agent string
 */
const getUserAgent = (req) => {
  return req.get('user-agent') || null;
};

/**
 * Sanitize sensitive data from objects before logging
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = [
    'password', 'pin_code', 'discount_approved_by_pin',
    'manager_pin', 'token', 'api_key', 'secret'
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {Object} params.req - Express request object
 * @param {string} params.action - Action performed (CREATE, UPDATE, DELETE, VOID, etc.)
 * @param {string} params.entity_type - Type of entity (SALE, SESSION, PRODUCT, etc.)
 * @param {string} params.entity_id - ID of the entity
 * @param {Object} params.old_values - State before change
 * @param {Object} params.new_values - State after change
 * @param {string} params.description - Human-readable description
 * @param {Object} params.transaction - Sequelize transaction (optional)
 * @returns {Promise<Object>} Created audit log entry
 */
const createAuditLog = async ({
  req,
  action,
  entity_type,
  entity_id = null,
  old_values = null,
  new_values = null,
  description = null,
  transaction = null
}) => {
  try {
    const { AuditLog } = req.app.get('models');

    const auditData = {
      id: uuidv4(),
      user_id: req.user?.id || null,
      user_email: req.user?.email || null,
      branch_id: req.user?.branch_id || null,
      ip_address: getIpAddress(req),
      user_agent: getUserAgent(req),
      action,
      entity_type,
      entity_id,
      old_values: old_values ? sanitizeData(old_values) : null,
      new_values: new_values ? sanitizeData(new_values) : null,
      description
    };

    const options = transaction ? { transaction } : {};
    const auditLog = await AuditLog.create(auditData, options);

    return auditLog;
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Failed to create audit log:', error);
    return null;
  }
};

/**
 * Log sale creation
 */
const logSaleCreate = async (req, sale, transaction) => {
  return createAuditLog({
    req,
    action: 'CREATE',
    entity_type: 'SALE',
    entity_id: sale.id,
    new_values: {
      sale_number: sale.sale_number,
      customer_id: sale.customer_id,
      subtotal: sale.subtotal_amount,
      discount_amount: sale.discount_amount,
      total: sale.total_amount,
      status: sale.status,
      items_count: sale.items?.length || 0
    },
    description: `Venta ${sale.sale_number} creada por ${req.user.first_name} ${req.user.last_name}`,
    transaction
  });
};

/**
 * Log sale void
 */
const logSaleVoid = async (req, oldSale, updatedSale, transaction) => {
  return createAuditLog({
    req,
    action: 'VOID',
    entity_type: 'SALE',
    entity_id: updatedSale.id,
    old_values: {
      status: oldSale.status,
      total: oldSale.total_amount,
      voided_at: oldSale.voided_at,
      voided_by: oldSale.voided_by
    },
    new_values: {
      status: updatedSale.status,
      total: updatedSale.total_amount,
      voided_at: updatedSale.voided_at,
      voided_by: updatedSale.voided_by,
      void_reason: updatedSale.void_reason,
      void_approved_by: updatedSale.void_approved_by
    },
    description: `Venta ${updatedSale.sale_number} anulada. Motivo: ${updatedSale.void_reason}`,
    transaction
  });
};

/**
 * Log register session open
 */
const logSessionOpen = async (req, session, transaction) => {
  return createAuditLog({
    req,
    action: 'OPEN',
    entity_type: 'REGISTER_SESSION',
    entity_id: session.id,
    new_values: {
      session_number: session.session_number,
      register_id: session.register_id,
      opening_cash: session.opening_cash,
      shift_type: session.shift_type,
      opened_by: session.opened_by,
      opened_at: session.opened_at
    },
    description: `Sesión ${session.session_number} abierta por ${req.user.first_name} ${req.user.last_name}`,
    transaction
  });
};

/**
 * Log register session close
 */
const logSessionClose = async (req, oldSession, updatedSession, transaction) => {
  return createAuditLog({
    req,
    action: 'CLOSE',
    entity_type: 'REGISTER_SESSION',
    entity_id: updatedSession.id,
    old_values: {
      status: oldSession.status,
      closed_at: oldSession.closed_at,
      closed_by: oldSession.closed_by
    },
    new_values: {
      status: updatedSession.status,
      closed_at: updatedSession.closed_at,
      closed_by: updatedSession.closed_by,
      expected_cash: updatedSession.expected_cash,
      declared_cash: updatedSession.declared_cash,
      discrepancy_cash: updatedSession.discrepancy_cash,
      total_discrepancy: updatedSession.total_discrepancy
    },
    description: `Sesión ${updatedSession.session_number} cerrada. Diferencia total: $${updatedSession.total_discrepancy || 0}`,
    transaction
  });
};

/**
 * Log register session reopen
 */
const logSessionReopen = async (req, oldSession, updatedSession, transaction) => {
  return createAuditLog({
    req,
    action: 'REOPEN',
    entity_type: 'REGISTER_SESSION',
    entity_id: updatedSession.id,
    old_values: {
      status: oldSession.status,
      reopened_at: oldSession.reopened_at,
      reopened_by: oldSession.reopened_by
    },
    new_values: {
      status: updatedSession.status,
      reopened_at: updatedSession.reopened_at,
      reopened_by: updatedSession.reopened_by,
      reopen_reason: updatedSession.reopen_reason
    },
    description: `Sesión ${updatedSession.session_number} reabierta. Motivo: ${updatedSession.reopen_reason}`,
    transaction
  });
};

/**
 * Log discount application
 */
const logDiscountApply = async (req, sale, discountAmount, discountPercent, reason, approvedBy, transaction) => {
  return createAuditLog({
    req,
    action: 'APPLY_DISCOUNT',
    entity_type: 'SALE',
    entity_id: sale.id,
    new_values: {
      sale_number: sale.sale_number,
      discount_amount: discountAmount,
      discount_percent: discountPercent,
      discount_reason: reason,
      discount_applied_by: req.user.id,
      discount_approved_by: approvedBy,
      requires_approval: !!approvedBy
    },
    description: `Descuento de ${discountPercent}% ($${discountAmount}) aplicado a venta ${sale.sale_number}. Motivo: ${reason}`,
    transaction
  });
};

/**
 * Log cash withdrawal
 */
const logCashWithdrawal = async (req, withdrawal, transaction) => {
  return createAuditLog({
    req,
    action: 'WITHDRAW',
    entity_type: 'CASH_WITHDRAWAL',
    entity_id: withdrawal.id,
    new_values: {
      amount: withdrawal.amount,
      withdrawal_type: withdrawal.withdrawal_type,
      recipient_name: withdrawal.recipient_name,
      reason: withdrawal.reason,
      receipt_number: withdrawal.receipt_number
    },
    description: `Retiro de $${withdrawal.amount} (${withdrawal.withdrawal_type}). Destinatario: ${withdrawal.recipient_name}`,
    transaction
  });
};

/**
 * Log product update
 */
const logProductUpdate = async (req, oldProduct, newProduct, transaction) => {
  const changes = {};
  const fields = ['name', 'sku', 'selling_price', 'cost_price', 'is_active', 'is_featured'];

  for (const field of fields) {
    if (oldProduct[field] !== newProduct[field]) {
      changes[field] = {
        old: oldProduct[field],
        new: newProduct[field]
      };
    }
  }

  return createAuditLog({
    req,
    action: 'UPDATE',
    entity_type: 'PRODUCT',
    entity_id: newProduct.id,
    old_values: oldProduct.toJSON ? oldProduct.toJSON() : oldProduct,
    new_values: newProduct.toJSON ? newProduct.toJSON() : newProduct,
    description: `Producto ${newProduct.name} actualizado. Campos modificados: ${Object.keys(changes).join(', ')}`,
    transaction
  });
};

/**
 * Log user login
 */
const logUserLogin = async (req, user) => {
  return createAuditLog({
    req,
    action: 'LOGIN',
    entity_type: 'USER',
    entity_id: user.id,
    new_values: {
      email: user.email,
      role_name: user.role_name,
      branch_id: user.branch_id
    },
    description: `Usuario ${user.email} inició sesión`,
    transaction: null
  });
};

/**
 * Log user logout
 */
const logUserLogout = async (req, user) => {
  return createAuditLog({
    req,
    action: 'LOGOUT',
    entity_type: 'USER',
    entity_id: user.id,
    old_values: {
      session_active: true
    },
    new_values: {
      session_active: false
    },
    description: `Usuario ${user.email} cerró sesión`,
    transaction: null
  });
};

module.exports = {
  createAuditLog,
  logSaleCreate,
  logSaleVoid,
  logSessionOpen,
  logSessionClose,
  logSessionReopen,
  logDiscountApply,
  logCashWithdrawal,
  logProductUpdate,
  logUserLogin,
  logUserLogout,
  getIpAddress,
  getUserAgent,
  sanitizeData
};
