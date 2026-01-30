/**
 * Scale Client
 * Handles direct communication with Kretz scales (network and RS-232)
 */

const ftp = require('basic-ftp');
const net = require('net');
const http = require('http');
const { SerialPort } = require('serialport');
const logger = require('./logger');

class ScaleClient {
  constructor(timeout) {
    this.timeout = timeout || 60000;
  }

  /**
   * Test connection to scale
   */
  async testConnection(config) {
    const { ip, port, protocol, username, password } = config;

    if (protocol === 'serial') {
      logger.info(`Testing serial connection to ${ip} (timeout: ${this.timeout}ms)`);
      return await this.testSerial(ip, port);
    }

    logger.info(`Testing ${protocol} connection to ${ip}:${port} (timeout: ${this.timeout}ms)`);

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
    client.ftp.timeout = this.timeout;

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

      const req = http.get(url, { timeout: this.timeout }, (res) => {
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
      socket.setTimeout(this.timeout);

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
   * Test Serial (RS-232) connection
   * @param {string} comPort - COM port name (e.g., "COM1", "COM2")
   * @param {number} baudRate - Baud rate (default: 9600)
   */
  async testSerial(comPort, baudRate) {
    return new Promise((resolve, reject) => {
      const port = new SerialPort({
        path: comPort,
        baudRate: parseInt(baudRate) || 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        autoOpen: false,
      });

      const timeout = setTimeout(() => {
        port.close();
        reject(new Error('Serial port open timeout'));
      }, this.timeout);

      port.open((err) => {
        clearTimeout(timeout);

        if (err) {
          reject(new Error(`Serial port open failed: ${err.message}`));
          return;
        }

        port.close((closeErr) => {
          if (closeErr) {
            logger.warn(`Error closing serial port: ${closeErr.message}`);
          }

          resolve({
            connected: true,
            protocol: 'serial',
            comPort,
            baudRate: parseInt(baudRate) || 9600,
            message: 'Serial port connection successful',
          });
        });
      });
    });
  }

  /**
   * Upload price list to scale
   */
  async uploadPriceList(config, fileContent) {
    const { ip, port, protocol, username, password, uploadPath } = config;

    if (protocol === 'serial') {
      logger.info(`Uploading price list via serial to ${ip}`);
      return await this.uploadSerial(ip, port, fileContent);
    }

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
    client.ftp.timeout = this.timeout;

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

  /**
   * Upload via Serial (RS-232) - Kretz Report/Single protocol
   * @param {string} comPort - COM port name (e.g., "COM1")
   * @param {number} baudRate - Baud rate (default: 9600)
   * @param {string} fileContent - CSV price list
   */
  async uploadSerial(comPort, baudRate, fileContent) {
    return new Promise((resolve, reject) => {
      const port = new SerialPort({
        path: comPort,
        baudRate: parseInt(baudRate) || 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        autoOpen: false,
      });

      let uploadComplete = false;
      let responseData = '';

      const timeout = setTimeout(() => {
        if (!uploadComplete) {
          port.close();
          reject(new Error('Serial upload timeout'));
        }
      }, this.timeout);

      port.on('data', (data) => {
        responseData += data.toString();
        logger.info(`Serial response: ${data.toString()}`);
      });

      port.open((err) => {
        if (err) {
          clearTimeout(timeout);
          reject(new Error(`Serial port open failed: ${err.message}`));
          return;
        }

        logger.info(`Serial port ${comPort} opened at ${baudRate} baud`);

        // Kretz scales typically accept data line by line
        // Split CSV into lines and send with small delays
        const lines = fileContent.split('\n');
        let lineIndex = 0;

        const sendNextLine = () => {
          if (lineIndex >= lines.length) {
            // All lines sent
            uploadComplete = true;
            clearTimeout(timeout);

            setTimeout(() => {
              port.close((closeErr) => {
                if (closeErr) {
                  logger.warn(`Error closing serial port: ${closeErr.message}`);
                }

                logger.info(`Price list uploaded via serial: ${comPort}`);

                resolve({
                  success: true,
                  protocol: 'serial',
                  comPort,
                  baudRate: parseInt(baudRate) || 9600,
                  lines: lines.length,
                  size: fileContent.length,
                  timestamp: new Date().toISOString(),
                  response: responseData,
                });
              });
            }, 1000); // Wait 1 second before closing port
            return;
          }

          const line = lines[lineIndex];
          if (line.trim()) {
            logger.info(`Sending line ${lineIndex + 1}/${lines.length}: ${line.substring(0, 50)}...`);
            port.write(line + '\r\n', (writeErr) => {
              if (writeErr) {
                clearTimeout(timeout);
                port.close();
                reject(new Error(`Serial write failed: ${writeErr.message}`));
                return;
              }

              lineIndex++;
              // Small delay between lines (50ms)
              setTimeout(sendNextLine, 50);
            });
          } else {
            lineIndex++;
            setTimeout(sendNextLine, 10);
          }
        };

        // Start sending lines
        sendNextLine();
      });
    });
  }
}

module.exports = ScaleClient;
