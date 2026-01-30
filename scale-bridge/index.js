/**
 * Scale Bridge Service - Multi-Branch Dynamic Version
 *
 * This service handles scale communication for ALL branches dynamically.
 * No hardcoded branch_id required.
 *
 * Architecture:
 * Cloud Backend <--WebSocket--> Scale Bridge <--FTP/HTTP/TCP--> Any Branch Scale
 */

require('dotenv').config();
const { io } = require('socket.io-client');
const ScaleClient = require('./scaleClient');
const logger = require('./logger');

class ScaleBridge {
  constructor() {
    this.socket = null;
    this.backendUrl = process.env.BACKEND_URL || 'https://api.grettas-erp.com';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = parseInt(process.env.MAX_RECONNECTION_ATTEMPTS) || 20;
    this.reconnectionDelay = parseInt(process.env.RECONNECTION_DELAY) || 10000;
    this.reconnectionDelayMax = parseInt(process.env.RECONNECTION_DELAY_MAX) || 60000;
    this.requestTimeout = parseInt(process.env.REQUEST_TIMEOUT) || 60000;
    this.scaleClient = new ScaleClient(this.requestTimeout);
  }

  /**
   * Start the bridge service
   */
  start() {
    logger.info('=== Scale Bridge Service Starting (Multi-Branch Mode) ===');
    logger.info(`Backend URL: ${this.backendUrl}`);
    logger.info('This bridge will handle requests for ALL branches dynamically');

    this.connectToBackend();
  }

  /**
   * Connect to backend via WebSocket
   */
  connectToBackend() {
    logger.info('Connecting to backend...');
    logger.info(`Target: ${this.backendUrl}/scale-bridge`);
    logger.info(`Reconnection delay: ${this.reconnectionDelay}ms, Max: ${this.reconnectionDelayMax}ms`);
    logger.info(`Request timeout: ${this.requestTimeout}ms, Max attempts: ${this.maxReconnectAttempts}`);

    // Connect to the /scale-bridge namespace
    this.socket = io(`${this.backendUrl}/scale-bridge`, {
      transports: ['websocket'],
      auth: {
        type: 'scale-bridge',
        mode: 'multi-branch',
      },
      reconnection: true,
      reconnectionDelay: this.reconnectionDelay,
      reconnectionDelayMax: this.reconnectionDelayMax,
      rejectUnauthorized: false,
    });

    // Connection established
    this.socket.on('connect', () => {
      logger.info('Connected to backend successfully');
      logger.info(`Socket ID: ${this.socket.id}`);
      this.reconnectAttempts = 0;

      // Register this bridge as multi-branch handler
      this.socket.emit('bridge:register', {
        mode: 'multi-branch',
        timestamp: new Date().toISOString(),
      });
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      logger.error(`Connection error (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}):`);
      logger.error(`Error type: ${error.type}`);
      logger.error(`Error message: ${error.message}`);
      logger.error(`Error description: ${error.description || 'N/A'}`);
      if (error.data) {
        logger.error(`Error data: ${JSON.stringify(error.data)}`);
      }

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('Max reconnection attempts reached. Exiting...');
        process.exit(1);
      }
    });

    // Disconnection
    this.socket.on('disconnect', (reason) => {
      logger.warn(`Disconnected from backend: ${reason}`);
    });

    // Test connection command from backend
    this.socket.on('scale:test-connection', async (data) => {
      const { request_id, branch_id, config } = data;
      logger.info(`Received test connection command for branch: ${branch_id}`);

      try {
        const result = await this.scaleClient.testConnection(config);

        this.socket.emit('scale:test-connection-result', {
          request_id,
          branch_id,
          success: true,
          result,
        });

        logger.info(`Test connection completed for branch: ${branch_id}`);
      } catch (error) {
        logger.error(`Test connection failed for branch ${branch_id}:`, error);

        this.socket.emit('scale:test-connection-result', {
          request_id,
          branch_id,
          success: false,
          error: error.message,
        });
      }
    });

    // Sync/upload command from backend
    this.socket.on('scale:sync', async (data) => {
      const { request_id, branch_id, config, fileContent } = data;
      logger.info(`Received sync command for branch: ${branch_id}`);

      try {
        const result = await this.scaleClient.uploadPriceList(config, fileContent);

        this.socket.emit('scale:sync-result', {
          request_id,
          branch_id,
          success: true,
          result,
        });

        logger.info(`Sync completed for branch: ${branch_id}`);
      } catch (error) {
        logger.error(`Sync failed for branch ${branch_id}:`, error);

        this.socket.emit('scale:sync-result', {
          request_id,
          branch_id,
          success: false,
          error: error.message,
        });
      }
    });

    // Ping/pong for keepalive
    this.socket.on('ping', () => {
      this.socket.emit('pong', {
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Stop the bridge service
   */
  stop() {
    logger.info('Stopping Scale Bridge Service...');

    if (this.socket) {
      this.socket.disconnect();
    }

    logger.info('Service stopped');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT signal');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM signal');
  process.exit(0);
});

// Start the service
const bridge = new ScaleBridge();
bridge.start();

module.exports = ScaleBridge;
