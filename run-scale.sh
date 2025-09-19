#!/bin/bash
# Serial Weight Reader - Linux/macOS Launcher
# Usage: ./run-scale.sh [config-file]

echo ""
echo "========================================"
echo "   Serial Weight Reader v1.0.0"
echo "========================================"
echo ""

# Make executable if not already
chmod +x dist/serial-weight-reader 2>/dev/null

if [ -z "$1" ]; then
    echo "Using default config.properties..."
    ./dist/serial-weight-reader config.properties
else
    echo "Using config file: $1"
    ./dist/serial-weight-reader "$1"
fi

echo ""
echo "Press Enter to exit..."
read