#!/bin/bash

# Start Koinos Wallet in iOS Simulator (Development Mode)
# This script starts the Expo development server and opens the iOS simulator

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting Koinos Wallet in iOS Simulator..."
echo ""

# Check if node_modules exists
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Boot simulator first to avoid timeout
echo "📱 Booting iOS Simulator..."
xcrun simctl boot "iPhone 16 Pro" 2>/dev/null || true
open -a Simulator

# Wait for simulator to be ready
echo "⏳ Waiting for simulator to be ready..."
sleep 5

# Start Expo with localhost (avoids network timeout issues)
echo "🔄 Starting Metro bundler..."
npx expo start --ios --localhost --go
