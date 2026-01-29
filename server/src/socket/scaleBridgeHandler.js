/**
 * Scale Bridge WebSocket Handler
 *
 * Manages WebSocket connections from local Scale Bridge services at branches.
 * Allows backend to communicate with scales on branches' private networks.
 */

const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class ScaleBridgeHandler {
  constructor(io) {
    this.io = io;
    this.bridges = new Map(); // branch_id -> socket mapping
    this.pendingRequests = new Map(); // request_id -> { resolve, reject, timeout }
    this.requestTimeout = 30000; // 30 seconds
  }

  /**
   * Initialize scale bridge namespace
   */
  initialize() {
    // Create namespace for scale bridges
    const bridgeNamespace = this.io.of('/scale-bridge');

    bridgeNamespace.on('connection', (socket) => {
      const branchId = socket.handshake.auth.branch_id;
      const type = socket.handshake.auth.type;

      // Validate connection
      if (type !== 'scale-bridge') {
        logger.warn('Invalid connection type:', type);
        socket.disconnect();
        return;
      }

      if (!branchId) {
        logger.warn('Bridge connection without branch_id');
        socket.disconnect();
        return;
      }

      logger.info(`Scale Bridge connected: ${branchId}`);

      // Store bridge connection
      this.bridges.set(branchId, socket);

      // Handle registration
      socket.on('bridge:register', (data) => {
        logger.info(`Bridge registered: ${branchId}`, data);
        socket.emit('bridge:registered', {
          success: true,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle pong
      socket.on('pong', (data) => {
        // Keepalive response - no action needed
      });

      // Handle test connection result
      socket.on('scale:test-connection-result', (data) => {
        this.handleResponse(data.request_id, data);
      });

      // Handle sync result
      socket.on('scale:sync-result', (data) => {
        this.handleResponse(data.request_id, data);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`Bridge disconnected: ${branchId}, reason: ${reason}`);
        this.bridges.delete(branchId);

        // Reject any pending requests for this bridge
        this.pendingRequests.forEach((pending, requestId) => {
          if (pending.branchId === branchId) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Bridge disconnected'));
            this.pendingRequests.delete(requestId);
          }
        });
      });
    });

    // Periodic ping to keep connections alive
    setInterval(() => {
      this.bridges.forEach((socket, branchId) => {
        socket.emit('ping');
      });
    }, 30000); // Every 30 seconds

    logger.info('Scale Bridge handler initialized');
  }

  /**
   * Check if bridge is connected for a branch
   */
  isBridgeConnected(branchId) {
    return this.bridges.has(branchId);
  }

  /**
   * Get list of connected bridges
   */
  getConnectedBranches() {
    return Array.from(this.bridges.keys());
  }

  /**
   * Test scale connection via bridge
   */
  async testConnection(branchId, config) {
    const socket = this.bridges.get(branchId);

    if (!socket) {
      throw new Error(`No bridge connected for branch: ${branchId}. Please ensure Scale Bridge service is running at this branch.`);
    }

    const requestId = uuidv4();

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout - bridge did not respond'));
      }, this.requestTimeout);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
        branchId,
      });

      // Send request to bridge
      socket.emit('scale:test-connection', {
        request_id: requestId,
        config,
      });

      logger.info(`Test connection request sent to bridge: ${branchId}, request_id: ${requestId}`);
    });
  }

  /**
   * Sync price list via bridge
   */
  async syncPriceList(branchId, config, fileContent) {
    const socket = this.bridges.get(branchId);

    if (!socket) {
      throw new Error(`No bridge connected for branch: ${branchId}. Please ensure Scale Bridge service is running at this branch.`);
    }

    const requestId = uuidv4();

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout - bridge did not respond'));
      }, this.requestTimeout);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
        branchId,
      });

      // Send request to bridge
      socket.emit('scale:sync', {
        request_id: requestId,
        config,
        fileContent,
      });

      logger.info(`Sync request sent to bridge: ${branchId}, request_id: ${requestId}`);
    });
  }

  /**
   * Handle response from bridge
   */
  handleResponse(requestId, data) {
    const pending = this.pendingRequests.get(requestId);

    if (!pending) {
      logger.warn(`Received response for unknown request: ${requestId}`);
      return;
    }

    // Clear timeout
    clearTimeout(pending.timeout);
    this.pendingRequests.delete(requestId);

    // Resolve or reject based on response
    if (data.success) {
      logger.info(`Bridge request succeeded: ${requestId}`);
      pending.resolve(data.result);
    } else {
      logger.error(`Bridge request failed: ${requestId}`, data.error);
      pending.reject(new Error(data.error || 'Bridge request failed'));
    }
  }
}

module.exports = ScaleBridgeHandler;
