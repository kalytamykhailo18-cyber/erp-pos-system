/**
 * Scale Client
 * Handles direct communication with Kretz Aura scale
 */

const ftp = require('basic-ftp');
const net = require('net');
const http = require('http');
const logger = require('./logger');

class ScaleClient {
  /**
   * Test connection to scale
   */
  async testConnection(config) {
    const { ip, port, protocol, username, password } = config;

    logger.info(`Testing ${protocol} connection to ${ip}:${port}`);

    switch (protocol) {
      case 'ftp':
        return await this.testFTP(ip, port, username, password);
      case 'http':
        return await this.testHTTP(ip, port);
      case 'tcp':
        return await this.testTCP(ip, port);
      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }
  }

  /**
   * Test FTP connection
   */
  async testFTP(ip, port, username, password) {
    const client = new ftp.Client();
    client.ftp.timeout = 5000;

    try {
      await client.access({
        host: ip,
        port: port || 21,
        user: username || 'anonymous',
        password: password || 'anonymous',
        secure: false,
      });

      // Try to list directory
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
      throw new Error(`FTP connection failed: ${error.message}`);
    }
  }

  /**
   * Test HTTP connection
   */
  async testHTTP(ip, port) {
    return new Promise((resolve, reject) => {
      const url = `http://${ip}:${port || 80}/`;

      const req = http.get(url, { timeout: 5000 }, (res) => {
        resolve({
          connected: true,
          protocol: 'http',
          ip,
          port: port || 80,
          message: 'HTTP connection successful',
          status: res.statusCode,
        });
      });

      req.on('error', (error) => {
        reject(new Error(`HTTP connection failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('HTTP connection timeout'));
      });
    });
  }

  /**
   * Test TCP connection
   */
  async testTCP(ip, port) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      socket.setTimeout(5000);

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
        reject(new Error('TCP connection timeout'));
      });

      socket.on('error', (error) => {
        socket.destroy();
        reject(new Error(`TCP connection failed: ${error.message}`));
      });

      socket.connect(port, ip);
    });
  }

  /**
   * Upload price list to scale
   */
  async uploadPriceList(config, fileContent) {
    const { ip, port, protocol, username, password, uploadPath } = config;

    logger.info(`Uploading price list via ${protocol} to ${ip}:${port}`);

    switch (protocol) {
      case 'ftp':
        return await this.uploadFTP(ip, port, username, password, uploadPath, fileContent);
      case 'http':
        return await this.uploadHTTP(ip, port, uploadPath, fileContent);
      case 'tcp':
        return await this.uploadTCP(ip, port, fileContent);
      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }
  }

  /**
   * Upload via FTP
   */
  async uploadFTP(ip, port, username, password, uploadPath, fileContent) {
    const client = new ftp.Client();
    client.ftp.timeout = 10000;

    try {
      await client.access({
        host: ip,
        port: port || 21,
        user: username || 'anonymous',
        password: password || 'anonymous',
        secure: false,
      });

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `pricelist_${timestamp}.csv`;
      const remotePath = `${uploadPath || '/'}/${filename}`;

      // Convert to buffer
      const buffer = Buffer.from(fileContent, 'utf-8');

      // Upload
      await client.uploadFrom(buffer, remotePath);
      await client.close();

      logger.info(`Price list uploaded: ${remotePath}`);

      return {
        success: true,
        protocol: 'ftp',
        filename,
        remotePath,
        size: buffer.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      client.close();
      throw new Error(`FTP upload failed: ${error.message}`);
    }
  }

  /**
   * Upload via HTTP POST
   */
  async uploadHTTP(ip, port, uploadPath, fileContent) {
    return new Promise((resolve, reject) => {
      const url = `http://${ip}:${port || 80}${uploadPath || '/upload'}`;
      const data = Buffer.from(fileContent, 'utf-8');

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'text/csv',
          'Content-Length': data.length,
        },
        timeout: 10000,
      };

      const req = http.request(url, options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          logger.info(`Price list uploaded via HTTP: ${url}`);

          resolve({
            success: true,
            protocol: 'http',
            url,
            status: res.statusCode,
            size: data.length,
            timestamp: new Date().toISOString(),
          });
        });
      });

      req.on('error', (error) => {
        reject(new Error(`HTTP upload failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('HTTP upload timeout'));
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Upload via TCP socket
   */
  async uploadTCP(ip, port, fileContent) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      socket.setTimeout(10000);

      socket.on('connect', () => {
        socket.write(fileContent);
        socket.end();
      });

      socket.on('close', () => {
        logger.info(`Price list uploaded via TCP: ${ip}:${port}`);

        resolve({
          success: true,
          protocol: 'tcp',
          ip,
          port,
          size: fileContent.length,
          timestamp: new Date().toISOString(),
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('TCP upload timeout'));
      });

      socket.on('error', (error) => {
        socket.destroy();
        reject(new Error(`TCP upload failed: ${error.message}`));
      });

      socket.connect(port, ip);
    });
  }
}

module.exports = ScaleClient;
