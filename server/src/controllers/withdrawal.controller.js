const { v4: uuidv4 } = require('uuid');
const { CashWithdrawal, RegisterSession, Branch, User, sequelize } = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');
const logger = require('../utils/logger');
const { logCashWithdrawal } = require('../utils/auditLogger');

/**
 * Create cash withdrawal
 * POST /api/v1/registers/sessions/:sessionId/withdrawals
 */
exports.createWithdrawal = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const {
      amount,
      withdrawal_type,
      recipient_name,
      reason,
      receipt_number,
      local_id
    } = req.body;

    // Validate session is open
    const session = await RegisterSession.findByPk(sessionId);

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.status !== 'OPEN') {
      throw new BusinessError('Cannot record withdrawal - session is not open', 'E402');
    }

    // Validate withdrawal amount
    if (amount <= 0) {
      throw new BusinessError('Withdrawal amount must be greater than zero', 'E405');
    }

    const withdrawal = await CashWithdrawal.create({
      id: uuidv4(),
      session_id: sessionId,
      branch_id: session.branch_id,
      amount,
      withdrawal_type,
      recipient_name,
      reason,
      receipt_number: receipt_number || null,
      created_by: req.user.id,
      local_id,
      synced_at: new Date()
    });

    // Fetch created withdrawal with associations
    const createdWithdrawal = await CashWithdrawal.findByPk(withdrawal.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] }
      ]
    });

    // Create audit log entry for cash withdrawal
    await logCashWithdrawal(req, withdrawal, null);

    logger.info(`Withdrawal created: ${amount} for ${recipient_name} by user ${req.user.id}`);

    return created(res, createdWithdrawal);
  } catch (error) {
    next(error);
  }
};

/**
 * Get withdrawals for a session
 * GET /api/v1/registers/sessions/:sessionId/withdrawals
 */
exports.getSessionWithdrawals = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Verify session exists
    const session = await RegisterSession.findByPk(sessionId);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    const withdrawals = await CashWithdrawal.findAll({
      where: { session_id: sessionId },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    // Calculate total
    const total = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount), 0);

    return success(res, {
      withdrawals,
      total,
      count: withdrawals.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get withdrawals for a branch (with pagination)
 * GET /api/v1/branches/:branchId/withdrawals
 */
exports.getBranchWithdrawals = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { start_date, end_date, withdrawal_type } = req.query;
    const { limit, offset } = parsePagination(req.query);

    const where = { branch_id: branchId };

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    if (withdrawal_type) {
      where.withdrawal_type = withdrawal_type;
    }

    const { count, rows: withdrawals } = await CashWithdrawal.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        { model: RegisterSession, as: 'session', attributes: ['id', 'session_number', 'business_date'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const total = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount), 0);

    return paginated(res, withdrawals, {
      page: Math.floor(offset / limit) + 1,
      limit,
      total_items: count,
      total_pages: Math.ceil(count / limit),
      total_amount: total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get withdrawal by ID
 * GET /api/v1/withdrawals/:id
 */
exports.getWithdrawalById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const withdrawal = await CashWithdrawal.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        { model: RegisterSession, as: 'session', attributes: ['id', 'session_number', 'business_date'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] }
      ]
    });

    if (!withdrawal) {
      throw new NotFoundError('Withdrawal not found');
    }

    return success(res, withdrawal);
  } catch (error) {
    next(error);
  }
};
