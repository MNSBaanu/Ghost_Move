#!/usr/bin/env bash
set -e

# Move to the folder where this script lives
cd "$(dirname "$0")"

echo ""
echo " ===================================="
echo "   PocketDev - Starting up..."
echo " ===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo " ERROR: Node.js is not installed."
    echo ""
    echo " Install it with:"
    echo "   Ubuntu/Debian : sudo apt install nodejs npm"
    echo "   Mac (Homebrew): brew install node"
    echo "   Or download   : https://nodejs.org"
    echo ""
    exit 1
fi

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo " Installing dependencies (first run only)..."
    npm install --silent
    echo " Done!"
    echo ""
fi

# Create .env from example if it doesn't exist
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp ".env.example" ".env"
    echo " Created .env file from template."
    echo " IMPORTANT: Edit .env and add your GROQ_API_KEY!"
    echo ""
fi

echo " Starting server..."
echo " Press Ctrl+C to stop."
echo ""

node server.js
