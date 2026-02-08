#!/bin/bash

# Start Koinos Wallet on Physical iPhone (Development Mode)
# This script builds the debug version, installs it on the device,
# and starts the Metro dev server for hot reload.
#
# Usage:
#   ./start-device.sh                  # Full build + dev server
#   ./start-device.sh --server-only    # Skip build, just start Metro

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DEVICE_ID="00008150-001545E00C04401C"

# Check if node_modules exists
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Get local IP for the iPhone to connect
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "unknown")

# Generate native project if ios/ doesn't exist
if [ ! -d "$SCRIPT_DIR/ios" ]; then
    echo "🔧 Generating native iOS project..."
    npx expo prebuild --platform ios --clean
fi

# Build and install unless --server-only
if [ "$1" != "--server-only" ]; then
    echo "🔨 Building and installing debug build on iPhone..."
    npx expo run:ios --device "$DEVICE_ID"
    echo ""
    echo "✅ App installed. Starting dev server..."
    echo ""
fi

echo "🚀 Starting Metro Dev Server..."
echo ""
echo "📱 Open the app on your iPhone."
echo "   If it shows 'No development servers found', enter:"
echo "   http://${LOCAL_IP}:8081"
echo ""

npx expo start --dev-client
