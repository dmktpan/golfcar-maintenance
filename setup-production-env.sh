#!/bin/bash

# Script สำหรับตั้งค่า Environment Variables ใน Production Server
# ใช้สำหรับ copy .env.production ไปยัง production server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔧 Production Environment Setup Script"
echo "======================================"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    print_status "Please create .env.production file first."
    exit 1
fi

print_success "Found .env.production file"

# Display current .env.production content (without sensitive data)
print_status "Current .env.production configuration:"
echo "--------------------------------------"
grep -E "^[A-Z_]+=" .env.production | sed 's/=.*/=***/' || true
echo "--------------------------------------"

# Ask for confirmation
read -p "Do you want to copy this configuration to production server? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Operation cancelled."
    exit 0
fi

# Production server details
PROD_SERVER="administrator@golfcar.go2kt.com"
PROD_PATH="/home/administrator/golfcar-maintenance-1"

print_status "Copying .env.production to production server..."

# Copy .env.production to production server
scp .env.production "$PROD_SERVER:$PROD_PATH/.env.production"

if [ $? -eq 0 ]; then
    print_success "Successfully copied .env.production to production server"
else
    print_error "Failed to copy .env.production to production server"
    exit 1
fi

# Set proper permissions on production server
print_status "Setting proper permissions on production server..."
ssh "$PROD_SERVER" "cd $PROD_PATH && chmod 600 .env.production && chown administrator:administrator .env.production"

if [ $? -eq 0 ]; then
    print_success "Successfully set permissions for .env.production"
else
    print_warning "Failed to set permissions. Please check manually."
fi

# Verify the file on production server
print_status "Verifying .env.production on production server..."
ssh "$PROD_SERVER" "cd $PROD_PATH && ls -la .env.production"

# Ask if user wants to restart PM2
read -p "Do you want to restart PM2 process to apply new environment variables? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Restarting PM2 process..."
    ssh "$PROD_SERVER" "cd $PROD_PATH && pm2 restart golfcart-app"
    
    if [ $? -eq 0 ]; then
        print_success "Successfully restarted PM2 process"
        print_status "Checking PM2 status..."
        ssh "$PROD_SERVER" "pm2 status"
    else
        print_error "Failed to restart PM2 process"
    fi
fi

print_success "🎉 Production environment setup completed!"
print_status "Next steps:"
echo "  1. Verify application is running: ssh $PROD_SERVER 'pm2 status'"
echo "  2. Check logs: ssh $PROD_SERVER 'pm2 logs golfcart-app'"
echo "  3. Test application: curl http://golfcar.go2kt.com:8080/"