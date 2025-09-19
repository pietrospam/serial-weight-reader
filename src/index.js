// Main library export
const SerialWeightReader = require('./SerialWeightReader');

module.exports = {
  SerialWeightReader,
  
  /**
   * Helper function for quick weight reading
   * @param {string} configPath - Path to configuration file
   * @returns {Promise<Object>} Weight reading result
   */
  readWeight: async (configPath) => {
    const reader = new SerialWeightReader(configPath);
    return await reader.readWeight();
  },
  
  /**
   * Helper function to list available ports
   * @returns {Promise<Array>} List of available serial ports
   */
  listPorts: () => {
    return SerialWeightReader.getAvailablePorts();
  },

  /**
   * Create a new SerialWeightReader instance
   * @param {string} configPath - Path to configuration file
   * @returns {SerialWeightReader} New reader instance
   */
  createReader: (configPath) => {
    return new SerialWeightReader(configPath);
  }
};