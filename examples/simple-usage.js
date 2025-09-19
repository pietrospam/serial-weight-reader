const SerialWeightReader = require('../src/SerialWeightReader');

/**
 * Simple usage example of Serial Weight Reader
 * Using Method 1: SerialWeightReader class ONLY
 * KEEP IT SIMPLE STUPID!
 */
async function simpleExample() {
  console.log('📖 Serial Weight Reader - Simple Usage');
  console.log('═════════════════════════════════════');
  
  // Get config file from command line argument or use default
  const configFile = process.argv[2] || './config.properties';
  console.log(`📁 Config: ${configFile}`);
  
  try {
    console.log('\n🔧 Reading weight...');
    const reader = new SerialWeightReader(configFile);
    const result = await reader.readWeight();
    
    if (result.success) {
      console.log(`✅ Weight: ${result.weight} kg`);
      console.log(`📡 Protocol: ${result.protocol}`);
      console.log(`⏱️  Time: ${result.readTime}ms`);
    } else {
      console.log(`❌ Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('💥 Failed:', error.message);
  }
}

// Run it
simpleExample().then(() => {
  console.log('\n✅ Done!');
}).catch(console.error);