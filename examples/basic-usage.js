const SerialWeightReader = require('../src/SerialWeightReader');

/**
 * Basic usage example of Serial Weight Reader
 */
async function basicExample() {
  console.log('📖 Serial Weight Reader - Basic Usage Example');
  console.log('════════════════════════════════════════════');
  
  // Get config file from command line argument or use default
  const configFile = process.argv[2] || './config.properties';
  console.log(`📁 Using config file: ${configFile}`);
  
  try {
    // Method 1: Using class directly
    console.log('\n🔧 Method 1: Using SerialWeightReader class');
    const reader = new SerialWeightReader(configFile);
    const result = await reader.readWeight();
    
    if (result.success) {
      console.log(`✅ Weight: ${result.weight} kg`);
      console.log(`📡 Protocol: ${result.protocol}`);
      console.log(`⏱️  Read time: ${result.readTime}ms`);
      console.log(`📄 Raw data: ${result.rawData.slice(0, 100)}${result.rawData.length > 100 ? '...' : ''}`);
    } else {
      console.log(`❌ Error: ${result.error}`);
    }
    
    // Method 2: Using helper function
    console.log('\n🔧 Method 2: Using helper function');
    const { readWeight } = require('../src/index');
    const quickResult = await readWeight(configFile);
    
    console.log('Quick result:', {
      success: quickResult.success,
      weight: quickResult.success ? quickResult.weight : 'N/A',
      error: quickResult.success ? null : quickResult.error
    });
    
    // Method 3: List available ports
    console.log('\n🔧 Method 3: List available ports');
    const { listPorts } = require('../src/index');
    const ports = await listPorts();
    
    console.log('Available ports:');
    if (ports.length > 0) {
      ports.forEach(port => {
        console.log(`  📍 ${port.path} - ${port.manufacturer || 'Unknown'}`);
      });
    } else {
      console.log('  No serial ports found');
    }
    
  } catch (error) {
    console.error('💥 Example failed:', error.message);
  }
}

/**
 * Advanced usage example with custom configuration
 */
async function advancedExample() {
  console.log('\n📖 Advanced Example - Single reading');
  console.log('═══════════════════════════════════════');
  
  // Get config file from command line argument or use default
  const configFile = process.argv[2] || './config.properties';
  
  try {
    const reader = new SerialWeightReader(configFile);
    
    // Take one reading - Keep it simple!
    console.log('\n📊 Single reading:');
    const result = await reader.readWeight();
    
    if (result.success) {
      console.log(`  ✅ Weight: ${result.weight} kg (${result.readTime}ms)`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }
    
  } catch (error) {
    console.error('💥 Advanced example failed:', error.message);
  }
}

// Run examples
async function runAllExamples() {
  await basicExample();
  await advancedExample();
  
  console.log('\n✅ Examples completed!');
  console.log('💡 To use in your project:');
  console.log('   const { readWeight } = require("./src/index");');
  console.log('   const result = await readWeight("./config.properties");');
}

runAllExamples();