#!/bin/bash

echo "========================================"
echo "Building Timer Overlay .exe file"
echo "========================================"
echo ""

echo "Installing dependencies..."
npm install

echo ""
echo "Building portable .exe..."
npm run build:portable

echo ""
echo "========================================"
echo "Build complete!"
echo ""
echo "The .exe file is in the 'dist' folder:"
echo "  timer-overlay-portable.exe"
echo "========================================"

