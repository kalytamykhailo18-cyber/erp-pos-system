/**
 * Scale Connection Service
 * Handles communication with Kretz Aura scale via FTP, HTTP, or TCP
 */

const ftp = require('basic-ftp');
const net = require('net');
const axios = require('axios');
const logger = require('../utils/logger');

class ScaleConnectionService {
  /**
   * Test connection to scale
   * @param {Object} config - Connection configuration
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection(config) {
    const { ip, port, protocol, username, password, uploadPath } = config;

    try {
      switch (protocol) {
        case 'ftp':
          return await this.testFTPConnection(ip, port, username, password);
        case 'http':
          return await this.testHTTPConnection(ip, port);
        case 'tcp':
          return await this.testTCPConnection(ip, port);
        default:
          throw new Error(`Unsupported protocol: ${protocol}`);
      }
    } catch (error) {
      logger.error('Scale connection test failed:', error);
      return {
        connected: false,
        error: error.message,
        protocol,
        ip,
        port,
      };
    }
  }

  /**
   * Test FTP connection
   */
  async testFTPConnection(ip, port, username, password) {
    const client = new ftp.Client();
    client.ftp.timeout = 5000; // 5 second timeout

    try {
      await client.access({
        host: ip,
        port: port || 21,
        user: username || 'anonymous',
        password: password || 'anonymous',
        secure: false,
      });

      // Try to list directory to ensure we have access
      await client.list();

      await client.close();

      return {
        connected: true,
        protocol: 'ftp',
        ip,
        port: port || 21,
        message: 'FTP connection successful',
      };
    } catch (error) {
      client.close();
      throw error;
    }
  }

  /**
   * Test HTTP connection
   */
  async testHTTPConnection(ip, port) {
    try {
      const url = `http://${ip}:${port || 80}/`;
      const response = await axios.get(url, { timeout: 5000 });

      return {
        connected: true,
        protocol: 'http',
        ip,
        port: port || 80,
        message: 'HTTP connection successful',
        status: response.status,
      };
    } catch (error) {
      // Even if we get 404, it means the server is reachable
      if (error.response && error.response.status) {
        return {
          connected: true,
          protocol: 'http',
          ip,
          port: port || 80,
          message: 'HTTP server reachable',
          status: error.response.status,
        };
      }
      throw error;
    }
  }

  /**
   * Test TCP connection
   */
  async testTCPConnection(ip, port) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const timeout = 5000;

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        socket.destroy();
        resolve({
          connected: true,
          protocol: 'tcp',
          ip,
          port,
          message: 'TCP connection successful',
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });

      socket.on('error', (error) => {
        socket.destroy();
        reject(error);
      });

      socket.connect(port, ip);
    });
  }

  /**
   * Upload price list to scale
   * @param {Object} config - Upload configuration
   * @returns {Promise<Object>} Upload result
   */
  async uploadPriceList(config) {
    const { ip, port, protocol, username, password, uploadPath, fileContent } = config;

    try {
      switch (protocol) {
        case 'ftp':
          return await this.uploadViaFTP(ip, port, username, password, uploadPath, fileContent);
        case 'http':
          return await this.uploadViaHTTP(ip, port, uploadPath, fileContent);
        case 'tcp':
          return await this.uploadViaTCP(ip, port, fileContent);
        default:
          throw new Error(`Unsupported protocol: ${protocol}`);
      }
    } catch (error) {
      logger.error('Scale upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload via FTP
   */
  async uploadViaFTP(ip, port, username, password, uploadPath, fileContent) {
    const client = new ftp.Client();
    client.ftp.timeout = 10000; // 10 second timeout

    try {
      await client.access({
        host: ip,
        port: port || 21,
        user: username || 'anonymous',
        password: password || 'anonymous',
        secure: false,
      });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `pricelist_${timestamp}.csv`;
      const remotePath = `${uploadPath || '/'}/${filename}`;

      // Convert string to buffer
      const buffer = Buffer.from(fileContent, 'utf-8');

      // Upload file
      await client.uploadFrom(buffer, remotePath);

      await client.close();

      logger.info(`Price list uploaded successfully via FTP: ${remotePath}`);

      return {
        success: true,
        protocol: 'ftp',
        filename,
        remotePath,
        size: buffer.length,
        timestamp: new Date(),
      };
    } catch (error) {
      client.close();
      throw error;
    }
  }

  /**
   * Upload via HTTP POST
   */
  async uploadViaHTTP(ip, port, uploadPath, fileContent) {
    try {
      const url = `http://${ip}:${port || 80}${uploadPath || '/upload'}`;

      const response = await axios.post(url, fileContent, {
        headers: {
          'Content-Type': 'text/csv',
        },
        timeout: 10000,
      });

      logger.info(`Price list uploaded successfully via HTTP: ${url}`);

      return {
        success: true,
        protocol: 'http',
        url,
        status: response.status,
        size: fileContent.length,
        timestamp: new Date(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload via TCP socket
   */
  async uploadViaTCP(ip, port, fileContent) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const timeout = 10000;

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        // Send file content
        socket.write(fileContent);
        socket.end();
      });

      socket.on('close', () => {
        logger.info(`Price list uploaded successfully via TCP: ${ip}:${port}`);
        resolve({
          success: true,
          protocol: 'tcp',
          ip,
          port,
          size: fileContent.length,
          timestamp: new Date(),
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Upload timeout'));
      });

      socket.on('error', (error) => {
        socket.destroy();
        reject(error);
      });

      socket.connect(port, ip);
    });
  }
}

module.exports = new ScaleConnectionService();
