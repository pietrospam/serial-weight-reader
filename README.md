# Serial Weight Reader

A Node.js library for reading weight data from weighbridge systems via serial communication with **anti-reset protection** to prevent device restarts.

## 🚀 Features

- **Anti-Reset Protection**: Prevents weighbridge device from restarting when connecting
- **Cross-platform**: Works on Windows and Linux
- **Multiple protocols**: Supports frame-based (STX/ETX) and line-based protocols
- **Configurable**: All settings via `config.properties` file
- **Robust**: Automatic timeout handling and error recovery
- **Flexible**: Customizable regex patterns for different scale manufacturers
- **CLI & Library**: Use as command-line tool or integrate into your project

## 📦 Installation

```bash
# Clone or copy the project
git clone https://github.com/your-repo/serial-weight-reader.git
cd serial-weight-reader

# Install dependencies
npm install

# Make CLI globally available (optional)
npm link
```

## 🔧 Configuration

Edit `config.properties` to match your weighbridge system:

```properties
# Serial port configuration
serial.port=COM3
serial.baudRate=9600
serial.dataBits=8
serial.parity=none
serial.stopBits=1

# Anti-reset protection (prevents device restart)
serial.rtscts=false
serial.xon=false
serial.xoff=false
serial.xany=false
serial.dtr=false
serial.rts=false

# Protocol configuration
protocol.type=frame
regex.filter=1\\r\\n\\s*(\\d+)\\s*\\r\\n\\s*0

# Timeout for reading data (milliseconds)
read.timeout=10000

# Logging
log.level=info
```

## ⚠️ Anti-Reset Protection

Many weighbridge devices restart when a serial connection is established due to DTR/RTS signal changes. This library includes **automatic anti-reset protection** that:

- Disables flow control (RTS/CTS, XON/XOFF)
- Sets DTR and RTS signals to LOW immediately after opening the port
- Prevents unwanted device resets during connection

### How it works:
1. Port opens with flow control disabled
2. DTR and RTS signals are immediately set to LOW
3. Device stays operational without restart
4. Weight data is read normally
5. Port closes gracefully

### Supported Protocols

#### Frame Protocol (STX/ETX)
Used by scales like San Juan scale that send data with STX/ETX delimiters:
```
[STX]1\r\n 20450 \r\n0[ETX]
```

Configuration:
```properties
protocol.type=frame
regex.filter=1\\r\\n\\s*(\\d+)\\s*\\r\\n\\s*0
```

#### Line Protocol
Used by scales like Coquimbito scale that send line-based data:
```
@DF023456\r
```

Configuration:
```properties
protocol.type=line
regex.filter=[@DF](\\d+)(?=\\r)
```

## 🖥️ CLI Usage

### Basic usage
```bash
# Use default config.properties
npm start

# Use custom config file
npm start my-config.properties
node src/cli.js my-config.properties
```

### Example output
```
🔧 Serial Weight Reader CLI v1.0.0
📁 Loading config from: config.properties
─────────────────────────────────────
⚖️  Weight: 20450 kg
📡 Protocol: frame
⏱️  Read time: 1250ms
📄 Raw data: [STX]1\r\n 20450 \r\n0[ETX]
```

### Help
```bash
node src/cli.js --help
```

## 📚 Library Usage

### Quick Start

```javascript
const { readWeight } = require('./src/index');

async function getWeight() {
  const result = await readWeight('./config.properties');
  
  if (result.success) {
    console.log(`Weight: ${result.weight} kg`);
  } else {
    console.error(`Error: ${result.error}`);
  }
}

getWeight();
```

### Advanced Usage

```javascript
const { SerialWeightReader } = require('./src/index');

async function advancedExample() {
  // Create reader instance
  const reader = new SerialWeightReader('./config.properties');
  
  try {
    // Read weight
    const result = await reader.readWeight();
    
    if (result.success) {
      console.log('Weight data:', {
        weight: result.weight,
        protocol: result.protocol,
        readTime: result.readTime,
        rawData: result.rawData
      });
    } else {
      console.error('Read failed:', result.error);
    }
  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}
```

### List Available Ports

```javascript
const { listPorts } = require('./src/index');

async function showPorts() {
  const ports = await listPorts();
  
  console.log('Available serial ports:');
  ports.forEach(port => {
    console.log(`- ${port.path} (${port.manufacturer || 'Unknown'})`);
  });
}

showPorts();
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run example
npm run example
```

## 📁 Project Structure

```
serial-weight-reader/
├── src/
│   ├── SerialWeightReader.js    # Main library class
│   ├── cli.js                   # Command line interface
│   └── index.js                 # Library entry point
├── examples/
│   └── basic-usage.js           # Usage examples
├── test/
│   └── SerialWeightReader.test.js # Tests
├── config.properties            # Configuration file
├── package.json
└── README.md
```

## ⚙️ Configuration Reference

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `serial.port` | string | `COM3` | Serial port path |
| `serial.baudRate` | number | `9600` | Baud rate |
| `serial.dataBits` | number | `8` | Data bits |
| `serial.parity` | string | `none` | Parity (none/even/odd) |
| `serial.stopBits` | number | `1` | Stop bits |
| `protocol.type` | string | `frame` | Protocol type (frame/line) |
| `regex.filter` | string | `(\\d+)` | Regex to extract weight |
| `read.timeout` | number | `3000` | Read timeout in milliseconds |
| `log.level` | string | `info` | Log level (error/warn/info/debug) |

## 🚨 Error Handling

The library handles various error conditions:

- **Port not found**: Returns error with available ports suggestion
- **Timeout**: Returns error after configured timeout period
- **Invalid data**: Logs debug info and continues reading
- **Connection lost**: Automatically closes port and returns error

## 🔍 Debugging

Enable debug logging to troubleshoot issues:

```properties
log.level=debug
```

This will show:
- Raw serial data received
- Protocol detection
- Regex matching attempts
- Port operations

## 📋 Use Cases

### Integration into existing applications

```javascript
// In your main application
const { SerialWeightReader } = require('./path/to/serial-weight-reader/src');

class WeighbridgeService {
  constructor() {
    this.reader = new SerialWeightReader('./weighbridge-config.properties');
  }
  
  async getCurrentWeight() {
    const result = await this.reader.readWeight();
    return result.success ? result.weight : null;
  }
}
```

### Batch processing

```javascript
const { readWeight } = require('./src/index');

async function collectWeights(count = 10) {
  const weights = [];
  
  for (let i = 0; i < count; i++) {
    const result = await readWeight('./config.properties');
    if (result.success) {
      weights.push({
        weight: result.weight,
        timestamp: new Date(),
        readTime: result.readTime
      });
    }
    
    // Wait between readings
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return weights;
}
```

## 🛠️ Development

### Requirements
- Node.js >= 16.0.0
- Serial port device for testing

### Setup
```bash
npm install
npm run lint    # Check code style
npm test        # Run tests
```

## 📄 License

MIT License - feel free to use in your projects!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the configuration reference
2. Enable debug logging
3. Review the examples
4. Create an issue with debug output