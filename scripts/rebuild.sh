#!/bin/bash
#
# Portfolio Site Rebuild Script
# Run this via cron for automatic daily updates
#
# Example cron (daily at 6 AM):
#   0 6 * * * /path/to/StaticPortfolioGenerator/scripts/rebuild.sh >> /var/log/portfolio-rebuild.log 2>&1
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="$REPO_DIR/app"

# Optional: Container name if using Docker
CONTAINER_NAME="${CONTAINER_NAME:-portfolio}"

# Optional: Output directory if serving static files directly (e.g., with nginx)
# STATIC_OUTPUT_DIR="/var/www/portfolio"

echo "=========================================="
echo "Portfolio Rebuild - $(date)"
echo "=========================================="

cd "$REPO_DIR"

# Pull latest changes
echo "[1/4] Pulling latest changes..."
git pull origin main

# Install dependencies if needed
echo "[2/4] Checking dependencies..."
cd "$APP_DIR"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Fetch latest commits from GitHub
echo "[3/4] Fetching commits from GitHub..."
if [ -n "$GITHUB_TOKEN" ]; then
    npm run fetch-commits
else
    echo "Warning: GITHUB_TOKEN not set, skipping commit fetch"
fi

# Build the site
echo "[4/4] Building site..."
npm run build

# Deploy based on setup
if [ -n "$STATIC_OUTPUT_DIR" ]; then
    # Option A: Copy to static file directory (nginx/apache)
    echo "Copying build to $STATIC_OUTPUT_DIR..."
    rm -rf "$STATIC_OUTPUT_DIR"/*
    cp -r dist/spa/* "$STATIC_OUTPUT_DIR/"
    echo "Static files updated"

elif docker ps -q -f name="$CONTAINER_NAME" > /dev/null 2>&1; then
    # Option B: Rebuild and restart Docker container
    echo "Rebuilding Docker container..."
    docker build -t "$CONTAINER_NAME" .
    docker stop "$CONTAINER_NAME" || true
    docker rm "$CONTAINER_NAME" || true
    docker run -d --name "$CONTAINER_NAME" -p 80:80 "$CONTAINER_NAME"
    echo "Container restarted"

else
    echo "Build complete at: $APP_DIR/dist/spa"
    echo "Configure STATIC_OUTPUT_DIR or start a Docker container to deploy"
fi

echo ""
echo "Rebuild completed successfully at $(date)"
