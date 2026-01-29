/**
 * Scale Bridge Service
 *
 * This service runs locally at each branch and acts as a bridge between
 * the cloud backend and the local Kretz Aura scale.
 *
 * Architecture:
 * Cloud Backend <--WebSocket--> Local Bridge <--FTP/HTTP/TCP--> Scale
 *
 * Benefits:
 * - Backend on cloud can communicate with scale on private network
 * - No VPN or port forwarding required
 * - Outbound WebSocket connection (no firewall issues)
 * - Can run as Windows service
 */

require('dotenv').config();
const { io } = require('socket.io-client');
const ScaleClient = require('./scaleClient');
const logger = require('./logger');

class ScaleBridge {
  constructor() {
    this.socket = null;
    this.scaleClient = new ScaleClient();
    this.branchId = process.env.BRANCH_ID;
    this.backendUrl = process.env.BACKEND_URL || 'https://api.grettas-erp.com';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  /**
   * Start the bridge service
   */
  start() {
    logger.info('=== Scale Bridge Service Starting ===');
    logger.info(`Branch ID: ${this.branchId}`);
    logger.info(`Backend URL: ${this.backendUrl}`);

    if (!this.branchId) {
      logger.error('BRANCH_ID not configured! Please set BRANCH_ID in .env file');
      process.exit(1);
    }

    this.connectToBackend();
  }

  /**
   * Connect to backend via WebSocket
   */
  connectToBackend() {
    logger.info('Connecting to backend...');
    logger.info(`Target: ${this.backendUrl}/scale-bridge`);

    // Connect to the /scale-bridge namespace
    this.socket = io(`${this.backendUrl}/scale-bridge`, {
      transports: ['websocket'],
      auth: {
        branch_id: this.branchId,
        type: 'scale-bridge',
      },
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 30000,
      rejectUnauthorized: false, // For self-signed certificates in production
    });

    // Connection established
    this.socket.on('connect', () => {
      logger.info('✅ Connected to backend successfully');
      logger.info(`Socket ID: ${this.socket.id}`);
      this.reconnectAttempts = 0;

      // Register this bridge
      this.socket.emit('bridge:register', {
        branch_id: this.branchId,
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
      logger.info('Received test connection command');

      try {
        const result = await this.scaleClient.testConnection(data.config);

        this.socket.emit('scale:test-connection-result', {
          request_id: data.request_id,
          branch_id: this.branchId,
          success: true,
          result,
        });

        logger.info('Test connection completed successfully');
      } catch (error) {
        logger.error('Test connection failed:', error);

        this.socket.emit('scale:test-connection-result', {
          request_id: data.request_id,
          branch_id: this.branchId,
          success: false,
          error: error.message,
        });
      }
    });

    // Sync/upload command from backend
    this.socket.on('scale:sync', async (data) => {
      logger.info('Received sync command');

      try {
        const result = await this.scaleClient.uploadPriceList(data.config, data.fileContent);

        this.socket.emit('scale:sync-result', {
          request_id: data.request_id,
          branch_id: this.branchId,
          success: true,
          result,
        });

        logger.info('Sync completed successfully');
      } catch (error) {
        logger.error('Sync failed:', error);

        this.socket.emit('scale:sync-result', {
          request_id: data.request_id,
          branch_id: this.branchId,
          success: false,
          error: error.message,
        });
      }
    });

    // Ping/pong for keepalive
    this.socket.on('ping', () => {
      this.socket.emit('pong', {
        branch_id: this.branchId,
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
