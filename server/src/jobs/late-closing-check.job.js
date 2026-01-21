const { RegisterSession, Branch, Alert } = require('../database/models');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { getIO } = require('../socket');

/**
 * Check for sessions that should have been closed but are still open
 * Runs periodically to detect late closings and create alerts
 */
class LateClosingCheckJob {
  constructor() {
    this.interval = null;
    this.gracePeriodMinutes = 30; // Alert if closing is more than 30 minutes late
  }

  /**
   * Check all open sessions for late closings
   */
  async checkLateSessions() {
    try {
      logger.info('Starting late closing check job');

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;

      // Find all open sessions
      const openSessions = await RegisterSession.findAll({
        where: { status: 'OPEN' },
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code', 'midday_closing_time', 'evening_closing_time', 'has_shift_change']
          }
        ]
      });

      if (openSessions.length === 0) {
        logger.info('No open sessions found');
        return { checked: 0, alertsCreated: 0 };
      }

      logger.info(`Checking ${openSessions.length} open sessions for late closings`);

      let alertsCreated = 0;

      for (const session of openSessions) {
        try {
          const isLate = await this.checkIfSessionIsLate(session, currentTimeMinutes);

          if (isLate) {
            // Check if alert already exists for this session to avoid duplicates
            const existingAlert = await Alert.findOne({
              where: {
                reference_type: 'SESSION',
                reference_id: session.id,
                alert_type: 'LATE_CLOSING',
                created_at: {
                  [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
              }
            });

            if (!existingAlert) {
              await this.createLateClosingAlert(session);
              alertsCreated++;
            }
          }
        } catch (error) {
          logger.error(`Error checking session ${session.id}:`, error);
        }
      }

      logger.info(`Late closing check complete: ${alertsCreated} alerts created`);

      return {
        checked: openSessions.length,
        alertsCreated
      };

    } catch (error) {
      logger.error('Error in late closing check job:', error);
      throw error;
    }
  }

  /**
   * Check if a session is late based on expected closing time
   * @param {RegisterSession} session - Session to check
   * @param {number} currentTimeMinutes - Current time in minutes since midnight
   * @returns {boolean} - True if session is late
   */
  async checkIfSessionIsLate(session, currentTimeMinutes) {
    const branch = session.branch;

    // Determine expected closing time based on shift type
    let expectedClosingTime;

    if (session.shift_type === 'MORNING' && branch.has_shift_change) {
      expectedClosingTime = branch.midday_closing_time;
    } else if (session.shift_type === 'AFTERNOON' || session.shift_type === 'FULL_DAY') {
      expectedClosingTime = branch.evening_closing_time;
    } else {
      // Default to evening closing time if shift type is unknown
      expectedClosingTime = branch.evening_closing_time;
    }

    if (!expectedClosingTime) {
      return false; // Can't determine if late without closing time
    }

    // Parse expected closing time (format: "HH:MM:SS")
    const [hours, minutes] = expectedClosingTime.split(':').map(Number);
    const expectedTimeMinutes = hours * 60 + minutes;

    // Add grace period
    const lateThresholdMinutes = expectedTimeMinutes + this.gracePeriodMinutes;

    // Check if current time is past the threshold
    return currentTimeMinutes > lateThresholdMinutes;
  }

  /**
   * Create late closing alert
   * @param {RegisterSession} session - Late session
   */
  async createLateClosingAlert(session) {
    const branch = session.branch;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let expectedClosingTime;
    if (session.shift_type === 'MORNING' && branch.has_shift_change) {
      expectedClosingTime = branch.midday_closing_time.substring(0, 5); // HH:MM
    } else {
      expectedClosingTime = branch.evening_closing_time.substring(0, 5); // HH:MM
    }

    const shiftTypeLabel = {
      MORNING: 'Turno Mañana',
      AFTERNOON: 'Turno Tarde',
      FULL_DAY: 'Turno Completo'
    }[session.shift_type] || session.shift_type;

    const alert = await Alert.create({
      id: uuidv4(),
      alert_type: 'LATE_CLOSING',
      severity: 'MEDIUM',
      branch_id: session.branch_id,
      title: 'Cierre tardío detectado',
      message: `${branch.name} (${branch.code}) - ${shiftTypeLabel}: La caja debía cerrarse a las ${expectedClosingTime}. Hora actual: ${currentTime}`,
      reference_type: 'SESSION',
      reference_id: session.id
    });

    logger.info(`Late closing alert created for session ${session.id} at branch ${branch.name}`);

    // Emit via WebSocket
    const io = getIO();
    if (io) {
      const alertData = {
        id: alert.id,
        alert_type: alert.alert_type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        branch_id: alert.branch_id,
        created_at: alert.created_at
      };

      // Emit to branch room
      io.to(`branch_${alert.branch_id}`).emit('ALERT_CREATED', alertData);

      // Emit to owners
      io.to('owners').emit('ALERT_CREATED', alertData);
    }

    return alert;
  }

  /**
   * Start the job on interval
   * @param {number} intervalMs - Interval in milliseconds (default: 1 hour)
   */
  start(intervalMs = 3600000) {
    logger.info(`Starting late closing check job with ${intervalMs}ms interval`);

    // Run immediately on start
    this.checkLateSessions().catch(error => {
      logger.error('Error in initial late closing check:', error);
    });

    // Then run on interval
    this.interval = setInterval(() => {
      this.checkLateSessions().catch(error => {
        logger.error('Error in scheduled late closing check:', error);
      });
    }, intervalMs);
  }

  /**
   * Stop the job
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('Stopped late closing check job');
    }
  }

  /**
   * Set grace period in minutes
   * @param {number} minutes - Grace period in minutes
   */
  setGracePeriod(minutes) {
    this.gracePeriodMinutes = minutes;
    logger.info(`Late closing grace period set to ${minutes} minutes`);
  }
}

module.exports = new LateClosingCheckJob();
