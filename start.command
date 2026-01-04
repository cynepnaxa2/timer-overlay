#!/bin/bash
# Script to start Timer Overlay on macOS

# Navigate to the project directory (directory where the script is located)
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "node_modules not found. Installing dependencies..."
    npm install
fi

# Start the application
echo "Starting Timer Overlay..."
npm start

