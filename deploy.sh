#!/bin/bash

# KosMan Deployment Script
# Run this script on your Linux server

set -e

APP_NAME="kosman"
APP_DIR="/var/www/kosman"
SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"

echo "=== KosMan Deployment Script ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo ./deploy.sh)"
  exit 1
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# Create app directory
echo "Creating application directory..."
mkdir -p ${APP_DIR}
mkdir -p ${APP_DIR}/data

# Copy application files (assumes you've uploaded them to /tmp/kosman)
if [ -d "/tmp/kosman" ]; then
  echo "Copying application files..."
  cp -r /tmp/kosman/* ${APP_DIR}/
fi

# Set ownership
chown -R www-data:www-data ${APP_DIR}

# Install dependencies and build
echo "Installing dependencies..."
cd ${APP_DIR}
npm ci --production=false

echo "Building application..."
npm run build

# Copy systemd service
echo "Setting up systemd service..."
cp ${APP_DIR}/kosman.service ${SERVICE_FILE}

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable ${APP_NAME}
systemctl restart ${APP_NAME}

echo ""
echo "=== Deployment Complete ==="
echo "Application is running on port 3004"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status ${APP_NAME}   - Check status"
echo "  sudo systemctl restart ${APP_NAME}  - Restart app"
echo "  sudo systemctl stop ${APP_NAME}     - Stop app"
echo "  sudo journalctl -u ${APP_NAME} -f   - View logs"
