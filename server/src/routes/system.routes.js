/**
 * System routes
 * Health checks, status monitoring, and system information
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getIO } = require('../socket');

/**
 * GET /api/v1/system/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'connected', // Would check actual connection
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/v1/system/scale-bridges
 * Get status of all Scale Bridge connections
 * Requires authentication
 */
router.get('/scale-bridges', authenticate, (req, res) => {
  try {
    const io = getIO();
    const scaleBridge = io.scaleBridge;

    if (!scaleBridge) {
      return res.json({
        success: true,
        data: {
          bridges: [],
          total: 0,
          message: 'Scale Bridge handler not initialized'
        }
      });
    }

    const connectedBranches = scaleBridge.getConnectedBranches();

    res.json({
      success: true,
      data: {
        bridges: connectedBranches.map(branchId => ({
          branch_id: branchId,
          status: 'connected',
          connected_at: new Date().toISOString() // Would track actual connection time
        })),
        total: connectedBranches.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error getting Scale Bridge status'
    });
  }
});

module.exports = router;
