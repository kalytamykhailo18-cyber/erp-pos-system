/**
 * Scale Bridge WebSocket Handler
 *
 * Manages WebSocket connections from local Scale Bridge services.
 * Supports both single-branch and multi-branch modes.
 */

const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class ScaleBridgeHandler {
  constructor(io) {
    this.io = io;
    this.bridges = new Map(); // branch_id -> socket mapping
    this.multiBridgeSocket = null; // Single socket for multi-branch mode
    this.pendingRequests = new Map(); // request_id -> { resolve, reject, timeout }
    this.requestTimeout = 60000; // 60 seconds
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
      const mode = socket.handshake.auth.mode;

      // Validate connection
      if (type !== 'scale-bridge') {
        logger.warn('Invalid connection type:', type);
        socket.disconnect();
        return;
      }

      // Multi-branch mode
      if (mode === 'multi-branch') {
        logger.info('Scale Bridge connected in MULTI-BRANCH mode');
        this.multiBridgeSocket = socket;

        // Handle registration
        socket.on('bridge:register', (data) => {
          logger.info('Multi-branch bridge registered', data);
          socket.emit('bridge:registered', {
            success: true,
            mode: 'multi-branch',
            timestamp: new Date().toISOString(),
          });
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
          logger.info(`Multi-branch bridge disconnected, reason: ${reason}`);
          this.multiBridgeSocket = null;

          // Reject all pending requests
          this.pendingRequests.forEach((pending, requestId) => {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Bridge disconnected'));
            this.pendingRequests.delete(requestId);
          });
        });
      }
      // Single-branch mode (legacy)
      else {
        if (!branchId) {
          logger.warn('Bridge connection without branch_id');
          socket.disconnect();
          return;
        }

        logger.info(`Scale Bridge connected: ${branchId}`);
        this.bridges.set(branchId, socket);

        // Handle registration
        socket.on('bridge:register', (data) => {
          logger.info(`Bridge registered: ${branchId}`, data);
          socket.emit('bridge:registered', {
            success: true,
            timestamp: new Date().toISOString(),
          });
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
      }

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
    });

    // Periodic ping to keep connections alive
    setInterval(() => {
      if (this.multiBridgeSocket) {
        this.multiBridgeSocket.emit('ping');
      }
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
    // Check if specific branch has a bridge
    if (this.bridges.has(branchId)) {
      return true;
    }
    // Check if multi-branch mode is available
    if (this.multiBridgeSocket && this.multiBridgeSocket.connected) {
      return true;
    }
    return false;
  }

  /**
   * Get list of connected bridges
   */
  getConnectedBranches() {
    const branches = Array.from(this.bridges.keys());
    if (this.multiBridgeSocket && this.multiBridgeSocket.connected) {
      branches.push('multi-branch');
    }
    return branches;
  }

  /**
   * Get socket for a branch (prefers specific, falls back to multi-branch)
   */
  getSocketForBranch(branchId) {
    // First check for branch-specific socket
    const branchSocket = this.bridges.get(branchId);
    if (branchSocket) {
      return { socket: branchSocket, mode: 'single' };
    }

    // Fall back to multi-branch socket
    if (this.multiBridgeSocket && this.multiBridgeSocket.connected) {
      return { socket: this.multiBridgeSocket, mode: 'multi' };
    }

    return null;
  }

  /**
   * Test scale connection via bridge
   */
  async testConnection(branchId, config) {
    const bridgeInfo = this.getSocketForBranch(branchId);

    if (!bridgeInfo) {
      throw new Error(`No bridge connected for branch: ${branchId}. Please ensure Scale Bridge service is running.`);
    }

    const { socket, mode } = bridgeInfo;
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

      // Send request to bridge (include branch_id for multi-branch mode)
      socket.emit('scale:test-connection', {
        request_id: requestId,
        branch_id: branchId,
        config,
      });

      logger.info(`Test connection request sent to bridge (${mode} mode): ${branchId}, request_id: ${requestId}`);
    });
  }

  /**
   * Sync price list via bridge
   */
  async syncPriceList(branchId, config, fileContent) {
    const bridgeInfo = this.getSocketForBranch(branchId);

    if (!bridgeInfo) {
      throw new Error(`No bridge connected for branch: ${branchId}. Please ensure Scale Bridge service is running.`);
    }

    const { socket, mode } = bridgeInfo;
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

      // Send request to bridge (include branch_id for multi-branch mode)
      socket.emit('scale:sync', {
        request_id: requestId,
        branch_id: branchId,
        config,
        fileContent,
      });

      logger.info(`Sync request sent to bridge (${mode} mode): ${branchId}, request_id: ${requestId}`);
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
