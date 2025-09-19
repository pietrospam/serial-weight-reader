const SerialWeightReader = require('../src/SerialWeightReader');

/**
 * Example: Basic weight reading with anti-reset protection
 * This approach opens and closes the port for each reading but with anti-reset measures
 */
async function basicUsageExample() {
  console.log('=== Basic Usage Example with Anti-Reset Protection ===\n');
  
  const reader = new SerialWeightReader('./config.properties');
  
  try {
    // Read weight multiple times (each reading opens/closes port safely)
    for (let i = 1; i <= 3; i++) {
      console.log(`--- Reading ${i}/3 ---`);
      
      const result = await reader.readWeight();
      
      if (result.success) {
        console.log(`✅ Weight: ${result.weight} kg`);
        console.log(`   Read time: ${result.readTime} ms`);
        console.log(`   Protocol: ${result.protocol}`);
        console.log(`   Raw data: ${result.rawData.replace(/\r/g, '[CR]').replace(/\n/g, '[LF]').substring(0, 100)}...`);
      } else {
        console.error(`❌ Error: ${result.error}`);
      }
      
      console.log(''); // Empty line
      
      // Wait between readings
      if (i < 3) {
        console.log('Waiting 3 seconds before next reading...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
  } catch (error) {
    console.error('Example failed:', error.message);
  }
}

/**
 * Example: List available serial ports
 */
async function listAvailablePorts() {
  console.log('=== Available Serial Ports ===\n');
  
  try {
    const ports = await SerialWeightReader.getAvailablePorts();
    
    if (ports.length === 0) {
      console.log('No serial ports found.');
    } else {
      console.log('Available ports:');
      ports.forEach((port, index) => {
        console.log(`  ${index + 1}. ${port.path}`);
        if (port.manufacturer) console.log(`     Manufacturer: ${port.manufacturer}`);
        if (port.serialNumber) console.log(`     Serial Number: ${port.serialNumber}`);
        if (port.vendorId) console.log(`     Vendor ID: ${port.vendorId}`);
        if (port.productId) console.log(`     Product ID: ${port.productId}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Failed to list ports:', error.message);
  }
}

/**
 * Example: Single weight reading with detailed output
 */
async function singleReadingExample() {
  console.log('\n=== Single Reading Example ===\n');
  
  const reader = new SerialWeightReader('./config.properties');
  
  try {
    console.log('Reading weight from serial port...');
    const startTime = Date.now();
    
    const result = await reader.readWeight();
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n--- Results ---');
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
      console.log(`Weight: ${result.weight} kg`);
      console.log(`Protocol: ${result.protocol}`);
      console.log(`Read time: ${result.readTime} ms`);
      console.log(`Total time: ${totalTime} ms`);
      console.log(`Raw data length: ${result.rawData.length} characters`);
      console.log(`Raw data preview: ${result.rawData.replace(/\r/g, '[CR]').replace(/\n/g, '[LF]').replace(/\x02/g, '[STX]').replace(/\x03/g, '[ETX]').substring(0, 200)}...`);
    } else {
      console.log(`Error: ${result.error}`);
      console.log(`Read time: ${result.readTime} ms`);
      console.log(`Total time: ${totalTime} ms`);
    }
    
  } catch (error) {
    console.error('Single reading failed:', error.message);
  }
}

// Run examples
async function runExamples() {
  try {
    // First show available ports
    await listAvailablePorts();
    
    // Run single reading example
    await singleReadingExample();
    
    // Run basic usage example with multiple readings
    await basicUsageExample();
    
    console.log('=== Examples completed ===');
    
  } catch (error) {
    console.error('Failed to run examples:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  runExamples();
}

module.exports = { 
  basicUsageExample, 
  listAvailablePorts, 
  singleReadingExample 
};