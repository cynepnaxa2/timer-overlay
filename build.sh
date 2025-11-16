#!/bin/bash

echo "========================================"
echo "Building It's time! .exe file"
echo "========================================"
echo ""

echo "Installing dependencies..."
npm install

echo ""
echo "Cleaning previous build..."
rm -rf dist/win-unpacked
rm -f dist/*.exe

echo ""
echo "Building portable .exe..."
npm run build:portable

echo ""
echo "========================================"
echo "Build complete!"
echo ""
echo "The .exe file is in the 'dist' folder:"
echo "  its-time-portable.exe"
echo "========================================"

