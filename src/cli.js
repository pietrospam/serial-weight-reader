#!/usr/bin/env node

const SerialWeightReader = require('./SerialWeightReader');
const path = require('path');

/**
 * CLI Application for Serial Weight Reader
 * Usage: node cli.js [config-file]
 */
async function main() {
  try {
    // Get config file path from command line or use default
    const configPath = process.argv[2] || path.join(__dirname, '..', 'config.properties');
    
    console.log('🔧 Serial Weight Reader CLI v1.0.0');
    console.log(`📁 Loading config from: ${configPath}`);
    console.log('─────────────────────────────────────');
    
    // Create reader instance
    const reader = new SerialWeightReader(configPath);
    
    // Read weight with configured timeout
    const result = await reader.readWeight();
    
    if (result.success) {
      console.log(`⚖️  Weight: ${result.weight} kg`);
      console.log(`📡 Protocol: ${result.protocol}`);
      console.log(`⏱️  Read time: ${result.readTime}ms`);
      console.log(`📄 Raw data: ${result.rawData.slice(0, 100)}${result.rawData.length > 100 ? '...' : ''}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`💥 Fatal Error: ${error.message}`);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Process interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Process terminated');
  process.exit(0);
});

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔧 Serial Weight Reader CLI v1.0.0

USAGE:
  node src/cli.js [config-file]
  npm start [config-file]

EXAMPLES:
  node src/cli.js                          # Use default config.properties
  node src/cli.js my-config.properties     # Use custom config file
  npm start                                # Use default config
  npm start my-config.properties           # Use custom config

OPTIONS:
  --help, -h    Show this help message

CONFIG FILE:
  The config file should contain serial port settings and protocol configuration.
  See config.properties.example for reference.
  `);
  process.exit(0);
}

main();