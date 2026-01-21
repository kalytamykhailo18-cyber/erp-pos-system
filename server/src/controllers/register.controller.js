const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  CashRegister, RegisterSession, Branch, User, Sale, SalePayment,
  PaymentMethod, DailyReport, Alert, CashWithdrawal, sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const { parsePagination, generateSessionNumber, getBusinessDate, isPastClosingTime, formatDecimal } = require('../utils/helpers');
const { EVENTS } = require('../socket');
const logger = require('../utils/logger');
const { logSessionOpen, logSessionClose, logSessionReopen, logCashWithdrawal } = require('../utils/auditLogger');

// ===== Helper Functions =====

/**
 * Calculate total from denomination breakdown (Argentina 2024 bills)
 */
const calculateDenominationTotal = (denominations) => {
  if (!denominations) return 0;

  return (
    (denominations.bills_20000 || 0) * 20000 +
    (denominations.bills_10000 || 0) * 10000 +
    (denominations.bills_2000 || 0) * 2000 +
    (denominations.bills_1000 || 0) * 1000 +
    (denominations.bills_500 || 0) * 500 +
    (denominations.bills_200 || 0) * 200 +
    (denominations.bills_100 || 0) * 100 +
    (denominations.bills_50 || 0) * 50 +
    parseFloat(denominations.coins || 0)
  );
};

// ===== Cash Register Controllers =====

/**
 * Get all cash registers
 * GET /api/v1/registers
 */
exports.getAllRegisters = async (req, res, next) => {
  try {
    const { branch_id, is_active } = req.query;

    const where = {};
    if (branch_id) where.branch_id = branch_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const registers = await CashRegister.findAll({
      where,
      include: [{ model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] }],
      order: [['branch_id', 'ASC'], ['register_number', 'ASC']]
    });

    return success(res, registers);
  } catch (error) {
    next(error);
  }
};

/**
 * Get cash register by ID
 * GET /api/v1/registers/:id
 */
exports.getRegisterById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const register = await CashRegister.findByPk(id, {
      include: [{ model: Branch, as: 'branch' }]
    });

    if (!register) {
      throw new NotFoundError('Cash register not found');
    }

    // Get current session
    const currentSession = await RegisterSession.findOne({
      where: { register_id: id, status: 'OPEN' },
      include: [{ model: User, as: 'opener', attributes: ['first_name', 'last_name'] }]
    });

    return success(res, {
      ...register.toJSON(),
      current_session: currentSession
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new cash register
 * POST /api/v1/registers
 */
exports.createRegister = async (req, res, next) => {
  try {
    const { branch_id, register_number, name } = req.body;

    const register = await CashRegister.create({
      id: uuidv4(),
      branch_id,
      register_number,
      name: name || `Caja ${register_number}`
    });

    return created(res, register);
  } catch (error) {
    next(error);
  }
};

/**
 * Update cash register
 * PUT /api/v1/registers/:id
 */
exports.updateRegister = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;

    const register = await CashRegister.findByPk(id);

    if (!register) {
      throw new NotFoundError('Cash register not found');
    }

    await register.update({ name, is_active });

    return success(res, register);
  } catch (error) {
    next(error);
  }
};

// ===== Register Session Controllers =====

/**
 * Get register sessions with filters
 * GET /api/v1/registers/sessions/list
 */
exports.getSessions = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { branch_id, register_id, status, business_date } = req.query;

    const where = {};
    if (branch_id) where.branch_id = branch_id;
    if (register_id) where.register_id = register_id;
    if (status) where.status = status;
    if (business_date) where.business_date = business_date;

    const { count, rows } = await RegisterSession.findAndCountAll({
      where,
      include: [
        { model: CashRegister, as: 'register', attributes: ['register_number', 'name'] },
        { model: Branch, as: 'branch', attributes: ['name', 'code'] },
        { model: User, as: 'opener', attributes: ['first_name', 'last_name'] },
        { model: User, as: 'closer', attributes: ['first_name', 'last_name'] }
      ],
      order: [['opened_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current open session for register
 * GET /api/v1/registers/:registerId/current-session
 */
exports.getCurrentSession = async (req, res, next) => {
  try {
    const { registerId } = req.params;

    const session = await RegisterSession.findOne({
      where: { register_id: registerId, status: 'OPEN' },
      include: [
        { model: User, as: 'opener', attributes: ['first_name', 'last_name'] }
      ]
    });

    if (!session) {
      return success(res, null, 'No open session');
    }

    return success(res, session);
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's active session (cashier session)
 * GET /api/v1/registers/sessions/my-session
 */
exports.getMyCashierSession = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const session = await RegisterSession.findOne({
      where: {
        opened_by: userId,
        status: 'OPEN'
      },
      include: [
        { model: CashRegister, as: 'register', attributes: ['register_number', 'name'] },
        { model: Branch, as: 'branch', attributes: ['name', 'code'] },
        { model: User, as: 'opener', attributes: ['first_name', 'last_name'] }
      ],
      order: [['opened_at', 'DESC']]
    });

    if (!session) {
      return success(res, null, 'No active session for current user');
    }

    return success(res, session);
  } catch (error) {
    next(error);
  }
};

/**
 * Open a new register session
 * POST /api/v1/registers/:registerId/open
 */
exports.openSession = async (req, res, next) => {
  try {
    const { registerId } = req.params;
    const { shift_type, opening_cash, opening_notes, opening_denominations, local_id } = req.body;

    // Check register exists
    const register = await CashRegister.findByPk(registerId, {
      include: [{ model: Branch, as: 'branch' }]
    });

    if (!register) {
      throw new NotFoundError('Cash register not found');
    }

    // Check no open session exists
    const existingSession = await RegisterSession.findOne({
      where: { register_id: registerId, status: 'OPEN' }
    });

    if (existingSession) {
      throw new BusinessError('Register already has an open session', 'E401');
    }

    // Validate denomination breakdown matches total
    if (opening_denominations) {
      const denominationTotal = calculateDenominationTotal(opening_denominations);
      if (Math.abs(denominationTotal - opening_cash) > 0.01) {
        throw new BusinessError(
          `Denomination breakdown (${formatDecimal(denominationTotal)}) does not match opening cash total (${formatDecimal(opening_cash)})`,
          'E403'
        );
      }
    }

    // Validate opening cash meets petty cash requirement
    const pettyCashAmount = parseFloat(register.branch.petty_cash_amount || 0);
    let pettyCashWarning = null;

    if (opening_cash < pettyCashAmount) {
      pettyCashWarning = {
        type: 'PETTY_CASH_LOW',
        message: `Atención: El efectivo de apertura ($${formatDecimal(opening_cash)}) es menor que el fondo de caja mínimo ($${formatDecimal(pettyCashAmount)}). Asegúrese de que hay suficiente cambio.`,
        severity: 'warning',
        opening_cash,
        petty_cash_required: pettyCashAmount,
        deficit: pettyCashAmount - opening_cash
      };

      logger.warn('Register opened with insufficient petty cash', {
        register_id: registerId,
        branch_id: register.branch_id,
        opening_cash,
        petty_cash_amount: pettyCashAmount,
        deficit: pettyCashAmount - opening_cash
      });
    }

    const businessDate = getBusinessDate();

    const session = await RegisterSession.create({
      id: uuidv4(),
      register_id: registerId,
      branch_id: register.branch_id,
      session_number: generateSessionNumber(register.register_number, shift_type),
      shift_type,
      business_date: businessDate,
      opened_by: req.user.id,
      opened_at: new Date(),
      opening_cash,
      opening_notes,
      // Denomination breakdown (Argentina 2024 bills)
      opening_bills_20000: opening_denominations?.bills_20000 || 0,
      opening_bills_10000: opening_denominations?.bills_10000 || 0,
      opening_bills_2000: opening_denominations?.bills_2000 || 0,
      opening_bills_1000: opening_denominations?.bills_1000 || 0,
      opening_bills_500: opening_denominations?.bills_500 || 0,
      opening_bills_200: opening_denominations?.bills_200 || 0,
      opening_bills_100: opening_denominations?.bills_100 || 0,
      opening_bills_50: opening_denominations?.bills_50 || 0,
      opening_coins: opening_denominations?.coins || 0,
      status: 'OPEN',
      local_id,
      synced_at: new Date()
    });

    // Create audit log entry for session open
    await logSessionOpen(req, session, null);

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emitToBranch(register.branch_id, EVENTS.SESSION_OPENED, {
        session_id: session.id,
        register_name: register.name,
        opened_by: `${req.user.first_name} ${req.user.last_name}`,
        shift_type,
        petty_cash_warning: pettyCashWarning
      });
    }

    // Return session with warning if applicable
    const responseData = {
      ...session.toJSON(),
      petty_cash_warning: pettyCashWarning
    };

    return created(res, responseData, pettyCashWarning ? 'Session opened with petty cash warning' : 'Session opened successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Close register session (Blind Closing)
 * POST /api/v1/registers/sessions/:sessionId/close
 */
exports.closeSession = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { sessionId } = req.params;
    const {
      declared_cash,
      declared_card,
      declared_qr,
      declared_transfer,
      closing_notes,
      closing_denominations
    } = req.body;

    const session = await RegisterSession.findByPk(sessionId, {
      include: [
        { model: Branch, as: 'branch' },
        { model: CashRegister, as: 'register' }
      ]
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.status !== 'OPEN') {
      throw new BusinessError('Session is not open', 'E402');
    }

    // Validate closing denomination breakdown matches declared cash
    if (closing_denominations) {
      const denominationTotal = calculateDenominationTotal(closing_denominations);
      if (Math.abs(denominationTotal - declared_cash) > 0.01) {
        throw new BusinessError(
          `Closing denomination breakdown (${formatDecimal(denominationTotal)}) does not match declared cash (${formatDecimal(declared_cash)})`,
          'E404'
        );
      }
    }

    // Calculate expected amounts from sales
    const sales = await Sale.findAll({
      where: { session_id: sessionId, status: 'COMPLETED' },
      include: [{
        model: SalePayment,
        as: 'payments',
        include: [{ model: PaymentMethod, as: 'payment_method' }]
      }]
    });

    // Get withdrawals for this session
    const withdrawals = await CashWithdrawal.findAll({
      where: { session_id: sessionId }
    });
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount), 0);

    // Initialize expected amounts with opening cash
    let expected_cash = parseFloat(session.opening_cash);
    let expected_card = 0;
    let expected_qr = 0;
    let expected_transfer = 0;

    // Sum up payments by method
    for (const sale of sales) {
      for (const payment of sale.payments) {
        const code = payment.payment_method.code;
        const amount = parseFloat(payment.amount);

        switch (code) {
          case 'CASH':
            expected_cash += amount;
            break;
          case 'DEBIT':
          case 'CREDIT':
            expected_card += amount;
            break;
          case 'QR':
            expected_qr += amount;
            break;
          case 'TRANSFER':
            expected_transfer += amount;
            break;
        }
      }
    }

    // Subtract withdrawals from expected cash
    expected_cash -= totalWithdrawals;

    // Calculate loyalty totals from sales
    let total_points_earned = 0;
    let total_points_redeemed = 0;
    let total_credit_used = 0;
    let total_credit_given = 0;

    for (const sale of sales) {
      total_points_earned += sale.points_earned || 0;
      total_points_redeemed += sale.points_redeemed || 0;
      total_credit_used += parseFloat(sale.credit_used || 0);
      total_credit_given += parseFloat(sale.change_as_credit || 0);
    }

    // CRITICAL FIX: Subtract change given as credit from expected cash
    // When change is given as credit, that cash doesn't leave the register as physical money
    // but it's recorded in the payment amount, so we must subtract it from expected cash
    expected_cash -= total_credit_given;

    // Calculate discrepancies
    const discrepancy_cash = declared_cash - expected_cash;
    const discrepancy_card = declared_card - expected_card;
    const discrepancy_qr = declared_qr - expected_qr;
    const discrepancy_transfer = declared_transfer - expected_transfer;
    const total_discrepancy = discrepancy_cash + discrepancy_card + discrepancy_qr + discrepancy_transfer;

    // Check petty cash requirement (declared cash should keep petty cash amount)
    const branch = await Branch.findByPk(session.branch_id);
    const pettyCashAmount = parseFloat(branch.petty_cash_amount || 0);
    let pettyCashWarning = null;

    if (declared_cash < pettyCashAmount) {
      pettyCashWarning = {
        type: 'PETTY_CASH_LOW',
        message: `ATENCIÓN: El efectivo en caja ($${formatDecimal(declared_cash)}) es menor que el fondo de reserva inicial ($${formatDecimal(pettyCashAmount)}). Debe dejar al menos $${formatDecimal(pettyCashAmount)} para el próximo turno.`,
        severity: 'error',
        declared_cash,
        petty_cash_required: pettyCashAmount,
        deficit: pettyCashAmount - declared_cash
      };

      logger.error('Register closing with insufficient petty cash', {
        session_id: sessionId,
        branch_id: session.branch_id,
        declared_cash,
        petty_cash_amount: pettyCashAmount,
        deficit: pettyCashAmount - declared_cash
      });

      // Create alert for owner
      await Alert.create({
        id: uuidv4(),
        alert_type: 'LOW_PETTY_CASH',
        severity: 'HIGH',
        branch_id: session.branch_id,
        user_id: req.user.id,
        title: 'Efectivo insuficiente en cierre',
        message: `Cierre de caja con efectivo ($${formatDecimal(declared_cash)}) menor al fondo de reserva ($${formatDecimal(pettyCashAmount)}). Déficit: $${formatDecimal(pettyCashAmount - declared_cash)}`,
        reference_type: 'REGISTER_SESSION',
        reference_id: sessionId
      }, { transaction: t });
    }

    // Check if closing is after expected hours
    let afterHoursWarning = null;
    const closingTime = new Date();
    const closingHour = closingTime.getHours();
    const closingMinute = closingTime.getMinutes();
    const closingTimeString = `${String(closingHour).padStart(2, '0')}:${String(closingMinute).padStart(2, '0')}:00`;

    // Determine expected closing time based on shift type
    let expectedClosingTime = null;
    if (session.shift_type === 'MORNING') {
      expectedClosingTime = branch.midday_closing_time; // e.g., '14:00:00' or '14:30:00'
    } else if (session.shift_type === 'AFTERNOON') {
      expectedClosingTime = branch.evening_closing_time; // e.g., '20:00:00' or '20:30:00'
    } else if (session.shift_type === 'FULL_DAY') {
      expectedClosingTime = branch.evening_closing_time;
    }

    // Compare closing time with expected time (allow 30 minute grace period)
    if (expectedClosingTime) {
      const [expectedHour, expectedMinute] = expectedClosingTime.split(':').map(Number);
      const expectedMinutesFromMidnight = expectedHour * 60 + expectedMinute;
      const actualMinutesFromMidnight = closingHour * 60 + closingMinute;
      const gracePeriodMinutes = 30;
      const minutesDifference = actualMinutesFromMidnight - expectedMinutesFromMidnight;

      // Alert if closing is more than 30 minutes after expected time
      if (minutesDifference > gracePeriodMinutes) {
        const hoursLate = Math.floor(minutesDifference / 60);
        const minutesLate = minutesDifference % 60;
        const lateString = hoursLate > 0
          ? `${hoursLate} hora(s) ${minutesLate} minuto(s)`
          : `${minutesLate} minuto(s)`;

        afterHoursWarning = {
          type: 'AFTER_HOURS_CLOSING',
          message: `Cierre realizado fuera del horario esperado. Hora de cierre: ${closingTimeString}, hora esperada: ${expectedClosingTime}`,
          severity: 'warning',
          closing_time: closingTimeString,
          expected_closing_time: expectedClosingTime,
          minutes_late: minutesDifference,
          shift_type: session.shift_type
        };

        logger.warn('Register closed after expected hours', {
          session_id: sessionId,
          branch_id: session.branch_id,
          shift_type: session.shift_type,
          closing_time: closingTimeString,
          expected_time: expectedClosingTime,
          minutes_late: minutesDifference
        });

        // Create alert for owner
        const afterHoursAlert = await Alert.create({
          id: uuidv4(),
          alert_type: 'AFTER_HOURS_CLOSING',
          severity: 'MEDIUM',
          branch_id: session.branch_id,
          user_id: req.user.id,
          title: `Cierre fuera de horario en ${branch.name}`,
          message: `Sesión ${session.session_number} cerrada ${lateString} tarde. Hora de cierre: ${closingTimeString}, hora esperada: ${expectedClosingTime}`,
          reference_type: 'REGISTER_SESSION',
          reference_id: sessionId
        }, { transaction: t });

        // Store alert for WebSocket emission after commit
        afterHoursWarning.alertId = afterHoursAlert.id;
      }
    }

    // Capture old state before closing
    const oldSessionState = {
      status: session.status,
      closed_at: session.closed_at,
      closed_by: session.closed_by
    };

    // Update session with closing data
    await session.update({
      closed_by: req.user.id,
      closed_at: new Date(),
      declared_cash,
      declared_card,
      declared_qr,
      declared_transfer,
      expected_cash,
      expected_card,
      expected_qr,
      expected_transfer,
      discrepancy_cash,
      discrepancy_card,
      discrepancy_qr,
      discrepancy_transfer,
      total_discrepancy,
      // Closing denomination breakdown (Argentina 2024 bills)
      closing_bills_20000: closing_denominations?.bills_20000 || null,
      closing_bills_10000: closing_denominations?.bills_10000 || null,
      closing_bills_2000: closing_denominations?.bills_2000 || null,
      closing_bills_1000: closing_denominations?.bills_1000 || null,
      closing_bills_500: closing_denominations?.bills_500 || null,
      closing_bills_200: closing_denominations?.bills_200 || null,
      closing_bills_100: closing_denominations?.bills_100 || null,
      closing_bills_50: closing_denominations?.bills_50 || null,
      closing_coins: closing_denominations?.coins || null,
      status: 'CLOSED',
      closing_notes
    }, { transaction: t });

    // Update or create daily report
    const [dailyReport] = await DailyReport.findOrCreate({
      where: {
        branch_id: session.branch_id,
        business_date: session.business_date
      },
      defaults: {
        id: uuidv4(),
        branch_id: session.branch_id,
        business_date: session.business_date
      },
      transaction: t
    });

    // Update daily report totals
    await dailyReport.increment({
      total_cash: expected_cash - parseFloat(session.opening_cash),
      total_card: expected_card,
      total_qr: expected_qr,
      total_transfer: expected_transfer,
      total_discrepancy: total_discrepancy,
      transaction_count: sales.length,
      total_credit_used: total_credit_used,
      total_points_redeemed: total_points_redeemed
    }, { transaction: t });

    // Note: total_points_earned and total_credit_given are not in DailyReport schema
    // If needed for reporting, they should be added to the migration

    // Create audit log entry for session close
    await logSessionClose(req, oldSessionState, session, t);

    await t.commit();

    // Create alert if significant discrepancy
    if (Math.abs(total_discrepancy) > 100) {
      await Alert.create({
        id: uuidv4(),
        alert_type: 'CASH_DISCREPANCY',
        severity: Math.abs(total_discrepancy) > 500 ? 'CRITICAL' : 'HIGH',
        branch_id: session.branch_id,
        user_id: req.user.id,
        title: `Diferencia de caja: $${formatDecimal(total_discrepancy)}`,
        message: `Cierre de ${session.register.name} con diferencia de $${formatDecimal(total_discrepancy)}. Efectivo: $${formatDecimal(discrepancy_cash)}, Tarjeta: $${formatDecimal(discrepancy_card)}, QR: $${formatDecimal(discrepancy_qr)}, Transferencia: $${formatDecimal(discrepancy_transfer)}`,
        reference_type: 'SESSION',
        reference_id: session.id
      });

      // Emit alert to owners
      const io = req.app.get('io');
      if (io) {
        io.emitToOwners(EVENTS.ALERT_CREATED, {
          type: 'CASH_DISCREPANCY',
          severity: Math.abs(total_discrepancy) > 500 ? 'CRITICAL' : 'HIGH',
          branch_name: session.branch.name,
          amount: total_discrepancy
        }, session.branch_id);
      }
    }

    // Emit session closed event
    const io = req.app.get('io');
    if (io) {
      io.emitToBranch(session.branch_id, EVENTS.SESSION_CLOSED, {
        session_id: session.id,
        register_name: session.register.name,
        closed_by: `${req.user.first_name} ${req.user.last_name}`,
        has_discrepancy: Math.abs(total_discrepancy) > 0,
        petty_cash_warning: pettyCashWarning,
        after_hours_warning: afterHoursWarning
      });

      // Emit after-hours closing alert to owners if applicable
      if (afterHoursWarning && afterHoursWarning.alertId) {
        io.emitToOwners(EVENTS.ALERT_CREATED, {
          type: 'AFTER_HOURS_CLOSING',
          severity: 'MEDIUM',
          branch_name: session.branch.name,
          closing_time: afterHoursWarning.closing_time,
          expected_time: afterHoursWarning.expected_closing_time,
          minutes_late: afterHoursWarning.minutes_late,
          alert_id: afterHoursWarning.alertId
        }, session.branch_id);
      }
    }

    return success(res, {
      ...session.toJSON(),
      sales_count: sales.length,
      sales_total: sales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0),
      petty_cash_warning: pettyCashWarning,
      after_hours_warning: afterHoursWarning
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Reopen a closed session (requires manager authorization)
 * POST /api/v1/registers/sessions/:sessionId/reopen
 */
exports.reopenSession = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    const session = await RegisterSession.findByPk(sessionId, {
      include: [{ model: Branch, as: 'branch' }],
      transaction: t
    });

    if (!session) {
      await t.rollback();
      throw new NotFoundError('Session not found');
    }

    if (session.status !== 'CLOSED') {
      await t.rollback();
      throw new BusinessError('Only closed sessions can be reopened', 'E402');
    }

    // Store old state for audit
    const oldSessionState = {
      status: session.status,
      reopened_at: session.reopened_at,
      reopened_by: session.reopened_by,
      reopen_reason: session.reopen_reason
    };

    // Update session
    await session.update({
      status: 'REOPENED',
      reopened_by: req.authorized_by?.id || req.user.id,
      reopened_at: new Date(),
      reopen_reason: reason
    }, { transaction: t });

    // Create alert
    const reopenAlert = await Alert.create({
      id: uuidv4(),
      alert_type: 'REOPEN_REGISTER',
      severity: 'HIGH',
      branch_id: session.branch_id,
      user_id: req.user.id,
      title: `Caja reabierta en ${session.branch.name}`,
      message: `Sesión ${session.session_number} fue reabierta. Motivo: ${reason}`,
      reference_type: 'SESSION',
      reference_id: session.id
    }, { transaction: t });

    // CRITICAL: Log audit trail
    await logSessionReopen(req, oldSessionState, session, t);

    await t.commit();

    logger.info(`Session ${session.session_number} reopened by ${req.user.email}`, {
      session_id: session.id,
      reopened_by: req.authorized_by?.id || req.user.id,
      reason
    });

    // Emit alert to owners via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emitToOwners(EVENTS.ALERT_CREATED, {
        alert_id: reopenAlert.id,
        type: 'REOPEN_REGISTER',
        severity: 'HIGH',
        branch_name: session.branch.name,
        session_number: session.session_number,
        reason: reason,
        reopened_by: req.user.first_name + ' ' + req.user.last_name
      }, session.branch_id);
    }

    return success(res, session);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Force close a session (manager only)
 * POST /api/v1/registers/sessions/:sessionId/force-close
 */
exports.forceCloseSession = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    const session = await RegisterSession.findByPk(sessionId, {
      include: [
        { model: Branch, as: 'branch' },
        { model: CashRegister, as: 'register' }
      ]
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.status !== 'OPEN') {
      throw new BusinessError('Only open sessions can be force closed', 'E402');
    }

    // Force close with zero declared amounts (manager takes responsibility)
    const declared_cash = 0;
    const declared_card = 0;
    const declared_qr = 0;
    const declared_transfer = 0;

    // Calculate expected amounts from sales
    const sales = await Sale.findAll({
      where: { session_id: sessionId, status: 'COMPLETED' },
      include: [{
        model: SalePayment,
        as: 'payments',
        include: [{ model: PaymentMethod, as: 'payment_method' }]
      }]
    });

    // Get withdrawals
    const withdrawals = await CashWithdrawal.findAll({
      where: { session_id: sessionId }
    });
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount), 0);

    // Calculate expected amounts
    let expected_cash = parseFloat(session.opening_cash);
    let expected_card = 0;
    let expected_qr = 0;
    let expected_transfer = 0;

    for (const sale of sales) {
      for (const payment of sale.payments) {
        const code = payment.payment_method.code;
        const amount = parseFloat(payment.amount);

        switch (code) {
          case 'CASH':
            expected_cash += amount;
            break;
          case 'DEBIT':
          case 'CREDIT':
            expected_card += amount;
            break;
          case 'QR':
            expected_qr += amount;
            break;
          case 'TRANSFER':
            expected_transfer += amount;
            break;
        }
      }
    }

    expected_cash -= totalWithdrawals;

    // Calculate discrepancies (all negative since declared is 0)
    const discrepancy_cash = declared_cash - expected_cash;
    const discrepancy_card = declared_card - expected_card;
    const discrepancy_qr = declared_qr - expected_qr;
    const discrepancy_transfer = declared_transfer - expected_transfer;
    const total_discrepancy = discrepancy_cash + discrepancy_card + discrepancy_qr + discrepancy_transfer;

    // Update session
    await session.update({
      closed_by: req.authorized_by?.id || req.user.id,
      closed_at: new Date(),
      declared_cash,
      declared_card,
      declared_qr,
      declared_transfer,
      expected_cash,
      expected_card,
      expected_qr,
      expected_transfer,
      discrepancy_cash,
      discrepancy_card,
      discrepancy_qr,
      discrepancy_transfer,
      total_discrepancy,
      status: 'CLOSED',
      closing_notes: `FORZADO POR GERENTE: ${reason}`
    }, { transaction: t });

    // Update daily report
    const [dailyReport] = await DailyReport.findOrCreate({
      where: {
        branch_id: session.branch_id,
        business_date: session.business_date
      },
      defaults: {
        id: uuidv4(),
        branch_id: session.branch_id,
        business_date: session.business_date
      },
      transaction: t
    });

    await dailyReport.increment({
      total_cash: expected_cash - parseFloat(session.opening_cash),
      total_card: expected_card,
      total_qr: expected_qr,
      total_transfer: expected_transfer,
      total_discrepancy: total_discrepancy,
      transaction_count: sales.length
    }, { transaction: t });

    await t.commit();

    // Create alert for force close
    await Alert.create({
      id: uuidv4(),
      alert_type: 'REOPEN_REGISTER',
      severity: 'CRITICAL',
      branch_id: session.branch_id,
      user_id: req.user.id,
      title: `Cierre forzado de caja en ${session.branch.name}`,
      message: `Sesión ${session.session_number} fue cerrada forzosamente por gerente. Motivo: ${reason}. Diferencia total: $${formatDecimal(total_discrepancy)}`,
      reference_type: 'SESSION',
      reference_id: session.id
    });

    // Emit event
    const io = req.app.get('io');
    if (io) {
      io.emitToOwners(EVENTS.ALERT_CREATED, {
        type: 'FORCE_CLOSE',
        severity: 'CRITICAL',
        branch_name: session.branch.name,
        session_number: session.session_number,
        reason
      }, session.branch_id);
    }

    return success(res, {
      ...session.toJSON(),
      sales_count: sales.length,
      force_closed: true
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Get session by ID with details
 * GET /api/v1/registers/sessions/:sessionId
 */
exports.getSessionById = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await RegisterSession.findByPk(sessionId, {
      include: [
        { model: CashRegister, as: 'register' },
        { model: Branch, as: 'branch' },
        { model: User, as: 'opener', attributes: ['first_name', 'last_name'] },
        { model: User, as: 'closer', attributes: ['first_name', 'last_name'] },
        { model: User, as: 'reopener', attributes: ['first_name', 'last_name'] }
      ]
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    return success(res, session);
  } catch (error) {
    next(error);
  }
};

/**
 * Get session summary with payment breakdown
 * GET /api/v1/registers/sessions/:sessionId/summary
 */
exports.getSessionSummary = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await RegisterSession.findByPk(sessionId);

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Get sales summary
    const sales = await Sale.findAll({
      where: { session_id: sessionId },
      include: [{
        model: SalePayment,
        as: 'payments',
        include: [{ model: PaymentMethod, as: 'payment_method' }]
      }]
    });

    const completedSales = sales.filter((s) => s.status === 'COMPLETED');
    const voidedSales = sales.filter((s) => s.status === 'VOIDED');

    // Payment breakdown
    const paymentSummary = {};
    for (const sale of completedSales) {
      for (const payment of sale.payments) {
        const methodName = payment.payment_method.name;
        if (!paymentSummary[methodName]) {
          paymentSummary[methodName] = { expected: 0, declared: null, discrepancy: null };
        }
        paymentSummary[methodName].expected += parseFloat(payment.amount);
      }
    }

    // Add declared values if session is closed
    if (session.status === 'CLOSED') {
      if (paymentSummary['Efectivo'] || session.expected_cash > 0) {
        paymentSummary['Efectivo'] = paymentSummary['Efectivo'] || { expected: 0 };
        paymentSummary['Efectivo'].expected = parseFloat(session.expected_cash);
        paymentSummary['Efectivo'].declared = parseFloat(session.declared_cash);
        paymentSummary['Efectivo'].discrepancy = parseFloat(session.discrepancy_cash);
      }
    }

    return success(res, {
      session: session.toJSON(),
      sales_count: completedSales.length,
      sales_total: completedSales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0),
      voided_count: voidedSales.length,
      voided_total: voidedSales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0),
      payment_summary: Object.entries(paymentSummary).map(([method, data]) => ({
        payment_method: method,
        ...data
      }))
    });
  } catch (error) {
    next(error);
  }
};

// ===== Daily Report Controllers =====

/**
 * Get daily reports
 * GET /api/v1/registers/daily-reports/list
 */
exports.getDailyReports = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { branch_id, from_date, to_date, is_finalized } = req.query;

    const where = {};
    if (branch_id) where.branch_id = branch_id;
    if (is_finalized !== undefined) where.is_finalized = is_finalized === 'true';

    if (from_date || to_date) {
      where.business_date = {};
      if (from_date) where.business_date[Op.gte] = from_date;
      if (to_date) where.business_date[Op.lte] = to_date;
    }

    const { count, rows } = await DailyReport.findAndCountAll({
      where,
      include: [{ model: Branch, as: 'branch', attributes: ['name', 'code'] }],
      order: [['business_date', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

/**
 * Get daily report for specific branch and date
 * GET /api/v1/registers/daily-reports/:branchId/:date
 */
exports.getDailyReportByDate = async (req, res, next) => {
  try {
    const { branchId, date } = req.params;

    const report = await DailyReport.findOne({
      where: { branch_id: branchId, business_date: date },
      include: [{ model: Branch, as: 'branch' }]
    });

    if (!report) {
      throw new NotFoundError('Daily report not found');
    }

    // Get sessions for this day
    const sessions = await RegisterSession.findAll({
      where: { branch_id: branchId, business_date: date },
      include: [
        { model: CashRegister, as: 'register' },
        { model: User, as: 'opener', attributes: ['first_name', 'last_name'] },
        { model: User, as: 'closer', attributes: ['first_name', 'last_name'] }
      ],
      order: [['opened_at', 'ASC']]
    });

    return success(res, {
      ...report.toJSON(),
      sessions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Finalize daily report
 * POST /api/v1/registers/daily-reports/:branchId/:date/finalize
 */
exports.finalizeDailyReport = async (req, res, next) => {
  try {
    const { branchId, date } = req.params;

    const report = await DailyReport.findOne({
      where: { branch_id: branchId, business_date: date }
    });

    if (!report) {
      throw new NotFoundError('Daily report not found');
    }

    // Check all sessions are closed
    const openSessions = await RegisterSession.count({
      where: { branch_id: branchId, business_date: date, status: 'OPEN' }
    });

    if (openSessions > 0) {
      throw new BusinessError('Cannot finalize report with open sessions', 'E401');
    }

    await report.update({
      is_finalized: true,
      finalized_at: new Date(),
      finalized_by: req.user.id
    });

    return success(res, report);
  } catch (error) {
    next(error);
  }
};
