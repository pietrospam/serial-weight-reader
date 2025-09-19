const { SerialPort } = require('serialport');
const PropertiesReader = require('properties-reader');
const winston = require('winston');
const fs = require('fs');

/**
 * Serial Weight Reader Library
 * Extracts weight data from weighbridge systems using serial communication
 */
class SerialWeightReader {
  constructor(configPath = './config.properties') {
    this.configPath = configPath;
    this.config = null;
    this.logger = null;
    this.port = null;
    this.dataBuffer = '';
    
    this.initializeLogger();
    this.loadConfiguration();
  }

  /**
   * Initialize Winston logger
   */
  initializeLogger() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level.toUpperCase()}] ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }

  /**
   * Load configuration from properties file
   */
  loadConfiguration() {
    try {
      if (!fs.existsSync(this.configPath)) {
        throw new Error(`Configuration file not found: ${this.configPath}`);
      }

      const properties = PropertiesReader(this.configPath);
      
      this.config = {
        // Serial port settings
        port: properties.get('serial.port') || 'COM3',
        baudRate: parseInt(properties.get('serial.baudRate')) || 9600,
        dataBits: parseInt(properties.get('serial.dataBits')) || 8,
        parity: properties.get('serial.parity') || 'none',
        stopBits: parseInt(properties.get('serial.stopBits')) || 1,
        
        // Anti-reset settings
        rtscts: properties.get('serial.rtscts') === 'true' ? true : false,
        xon: properties.get('serial.xon') === 'true' ? true : false,
        xoff: properties.get('serial.xoff') === 'true' ? true : false,
        xany: properties.get('serial.xany') === 'true' ? true : false,
        dtr: properties.get('serial.dtr') === 'true' ? true : false,
        rts: properties.get('serial.rts') === 'true' ? true : false,
        hupcl: properties.get('serial.hupcl') === 'true' ? true : false,
        
        // Timing settings for sensitive devices
        openDelay: parseInt(properties.get('serial.openDelay')) || 50,
        closeDelay: parseInt(properties.get('serial.closeDelay')) || 50,
        
        // Protocol settings
        protocolType: properties.get('protocol.type') || 'frame',
        regexFilter: properties.get('regex.filter') || '(\\d+)',
        
        // Timeout settings
        readTimeout: parseInt(properties.get('read.timeout')) || 3000,
        
        // Logging
        logLevel: properties.get('log.level') || 'info'
      };
      
      this.logger.level = this.config.logLevel;
      this.logger.info(`Configuration loaded successfully from: ${this.configPath}`);
      this.logger.debug('Config:', this.config);
      
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  /**
   * Read weight from serial port
   * @returns {Promise<Object>} Result object with weight data
   */
  async readWeight() {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Opening serial port: ${this.config.port}`);
      
      // Create serial port with anti-reset configuration from config file
      this.port = new SerialPort({
        path: this.config.port,
        baudRate: this.config.baudRate,
        dataBits: this.config.dataBits,
        parity: this.config.parity,
        stopBits: this.config.stopBits,
        rtscts: this.config.rtscts,     // Use config value
        xon: this.config.xon,           // Use config value
        xoff: this.config.xoff,         // Use config value
        xany: this.config.xany,         // Use config value
        hupcl: this.config.hupcl,       // Use config value (hang up on close)
        autoOpen: false
      });

      // Promise-based port opening with enhanced anti-reset measures
      await new Promise((resolve, reject) => {
        this.port.open((error) => {
          if (error) {
            reject(new Error(`Failed to open port ${this.config.port}: ${error.message}`));
          } else {
            // Immediately set DTR and RTS to configured values to prevent device reset
            this.port.set({ 
              dtr: this.config.dtr, 
              rts: this.config.rts,
              brk: false  // Ensure BREAK signal is off
            }, (setError) => {
              if (setError) {
                this.logger.warn(`Warning: Could not set DTR/RTS signals: ${setError.message}`);
              } else {
                this.logger.debug(`DTR/RTS signals set - DTR: ${this.config.dtr}, RTS: ${this.config.rts} (anti-reset)`);
              }
              
              // Add delay for sensitive devices like Coquimbito
              setTimeout(() => {
                this.logger.debug(`Port stabilized after ${this.config.openDelay}ms delay`);
                resolve();
              }, this.config.openDelay);
            });
          }
        });
      });

      this.logger.info(`Port opened successfully. Reading for ${this.config.readTimeout}ms...`);

      // Setup data collection
      const result = await this.collectData();
      
      // Close port
      await this.closePort();
      
      const readTime = Date.now() - startTime;
      
      return {
        success: true,
        weight: result.weight,
        protocol: this.config.protocolType,
        rawData: result.rawData,
        readTime: readTime
      };

    } catch (error) {
      this.logger.error(`Read weight failed: ${error.message}`);
      await this.closePort();
      
      return {
        success: false,
        error: error.message,
        readTime: Date.now() - startTime
      };
    }
  }

  /**
   * Collect and process data from serial port
   * @returns {Promise<Object>} Processed weight data
   */
  async collectData() {
    return new Promise((resolve, reject) => {
      this.dataBuffer = '';
      let weightExtracted = null;
      let lastValidWeight = null;
      
      const timeout = setTimeout(() => {
        if (lastValidWeight !== null) {
          this.logger.info(`Timeout reached. Using last valid weight: ${lastValidWeight}`);
          resolve({
            weight: lastValidWeight,
            rawData: this.dataBuffer
          });
        } else {
          reject(new Error(`Timeout: No valid weight data received in ${this.config.readTimeout}ms`));
        }
      }, this.config.readTimeout);

      // Data event handler
      this.port.on('data', (data) => {
        const textData = data.toString();
        this.dataBuffer += textData;
        
        this.logger.debug(`Raw data received: ${this.formatControlChars(textData)}`);
        
        // Process data based on protocol type
        if (this.config.protocolType === 'frame') {
          weightExtracted = this.processFrameProtocol(textData);
        } else {
          weightExtracted = this.processLineProtocol(textData);
        }
        
        if (weightExtracted !== null) {
          lastValidWeight = weightExtracted;
          this.logger.info(`Weight extracted: ${weightExtracted} kg`);
          
          // For frame protocol, stop immediately after first valid reading
          if (this.config.protocolType === 'frame') {
            clearTimeout(timeout);
            this.port.removeAllListeners('data');
            this.port.removeAllListeners('error');
            resolve({
              weight: weightExtracted,
              rawData: this.dataBuffer
            });
            return;
          }
          
          clearTimeout(timeout);
          resolve({
            weight: weightExtracted,
            rawData: this.dataBuffer
          });
        }
      });

      // Error event handler
      this.port.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Serial port error: ${error.message}`));
      });
    });
  }

  /**
   * Process frame-based protocol (STX/ETX)
   * @param {string} data - Incoming data
   * @returns {number|null} Extracted weight or null
   */
  processFrameProtocol(data) {
    // Look for the most recent STX to start a new frame
    const lastStxIndex = this.dataBuffer.lastIndexOf('\x02'); // Last STX
    
    if (lastStxIndex !== -1) {
      // Clear buffer up to the last STX to start fresh frame
      const frameBuffer = this.dataBuffer.substring(lastStxIndex);
      
      // Look for ETX after the last STX
      const etxIndex = frameBuffer.indexOf('\x03'); // ETX
      
      this.logger.debug(`Frame detection: Last STX at ${lastStxIndex}, ETX at ${etxIndex}, frame buffer length: ${frameBuffer.length}`);
      
      if (etxIndex !== -1) {
        // Extract complete frame including STX and ETX
        const frame = frameBuffer.substring(0, etxIndex + 1);
        this.logger.debug('Complete frame detected:', this.formatControlChars(frame));
        
        // Process the frame and extract weight
        const weight = this.applyRegexFilter(frame);
        
        if (weight !== null) {
          // Remove processed frame from buffer and keep any remaining data
          this.dataBuffer = this.dataBuffer.substring(lastStxIndex + etxIndex + 1);
          return weight;
        }
      }
    }
    
    // If buffer gets too large without finding complete frame, clear old data
    if (this.dataBuffer.length > 1000) {
      this.logger.debug('Buffer too large, clearing old data');
      // Keep only recent data that might contain start of new frame
      const recentStx = this.dataBuffer.lastIndexOf('\x02');
      if (recentStx !== -1) {
        this.dataBuffer = this.dataBuffer.substring(recentStx);
      } else {
        this.dataBuffer = '';
      }
    }
    
    return null;
  }

  /**
   * Process line-based protocol
   * @param {string} data - Incoming data
   * @returns {number|null} Extracted weight or null
   */
  processLineProtocol(data) {
    // Check for complete line (ends with \r)
    if (data.includes('\r')) {
      this.logger.debug('Complete line detected');
      const lines = this.dataBuffer.split('\r');
      for (const line of lines) {
        if (line.trim()) {
          const weight = this.applyRegexFilter(line + '\r');
          if (weight !== null) {
            return weight;
          }
        }
      }
    }
    return null;
  }

  /**
   * Apply regex filter to extract weight
   * @param {string} data - Data to process
   * @returns {number|null} Extracted weight or null
   */
  applyRegexFilter(data) {
    try {
      if (!this.config.regexFilter) {
        this.logger.debug('No regex filter configured');
        return null;
      }

      this.logger.debug(`Trying regex "${this.config.regexFilter}" on data: "${this.formatControlChars(data)}"`);
      
      const regex = new RegExp(this.config.regexFilter, 'gms');
      const match = regex.exec(data);
      
      if (match) {
        const weightStr = match[1] || match[0];
        const weight = parseInt(weightStr, 10);
        
        if (!isNaN(weight)) {
          this.logger.debug(`Regex match: "${match[0]}" -> Weight: ${weight}`);
          return weight;
        } else {
          this.logger.debug(`Regex matched "${match[0]}" but weight "${weightStr}" is not a valid number`);
        }
      } else {
        this.logger.debug(`No regex match found in data: "${this.formatControlChars(data)}"`);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Regex error: ${error.message}`);
      return null;
    }
  }

  /**
   * Format control characters for logging
   * @param {string} data - Raw data
   * @returns {string} Formatted string
   */
  formatControlChars(data) {
    return data
      .replace(/\x02/g, '[STX]')
      .replace(/\x03/g, '[ETX]')
      .replace(/\r/g, '[CR]')
      .replace(/\n/g, '[LF]');
  }

  /**
   * Close serial port safely with delay for sensitive devices
   */
  async closePort() {
    if (this.port && this.port.isOpen) {
      try {
        // Maintain signals before closing for sensitive devices
        if (this.config.closeDelay > 0) {
          this.port.set({ 
            dtr: this.config.dtr, 
            rts: this.config.rts 
          }, () => {
            this.logger.debug(`Maintaining signals for ${this.config.closeDelay}ms before closing`);
          });
          
          // Wait before closing
          await new Promise(resolve => setTimeout(resolve, this.config.closeDelay));
        }
        
        await new Promise((resolve) => {
          this.port.close(() => {
            this.logger.debug('Serial port closed gracefully');
            resolve();
          });
        });
      } catch (error) {
        this.logger.error(`Error closing port: ${error.message}`);
      }
    }
  }

  /**
   * Get available serial ports
   * @returns {Promise<Array>} List of available ports
   */
  static async getAvailablePorts() {
    try {
      const ports = await SerialPort.list();
      return ports.map(port => ({
        path: port.path,
        manufacturer: port.manufacturer,
        serialNumber: port.serialNumber,
        vendorId: port.vendorId,
        productId: port.productId
      }));
    } catch (error) {
      throw new Error(`Failed to list ports: ${error.message}`);
    }
  }
}

module.exports = SerialWeightReader;