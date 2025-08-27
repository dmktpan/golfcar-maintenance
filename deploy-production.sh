#!/bin/bash

# Production Deployment Script for Golf Car Maintenance System
# This script handles deployment with proper environment setup

set -e  # Exit on any error

echo "🚀 Starting Production Deployment..."

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

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    print_warning "Please create .env.production with proper configuration"
    exit 1
fi

print_status "Checking environment configuration..."

# Check if NEXT_PUBLIC_BASE_URL is set
if ! grep -q "NEXT_PUBLIC_BASE_URL" .env.production; then
    print_error "NEXT_PUBLIC_BASE_URL not found in .env.production"
    print_warning "This is required for proper image display in production"
    exit 1
fi

print_success "Environment configuration looks good"

# Create uploads directory if it doesn't exist
print_status "Creating upload directories..."
mkdir -p public/uploads/maintenance
chmod 755 public/uploads/maintenance

print_success "Upload directories created"

# Install dependencies
print_status "Installing dependencies..."
npm ci --production=false

print_success "Dependencies installed"

# Build the application with static files copy
print_status "Building application for production..."
NODE_ENV=production npm run build:production

print_success "Application built successfully with static files copied"

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    print_status "Stopping existing PM2 processes..."
    pm2 stop all || true
    
    print_status "Starting application with PM2..."
    NODE_ENV=production pm2 start npm --name "golfcart-app" -- start
    
    print_status "Saving PM2 configuration..."
    pm2 save
    
    print_success "Application started with PM2"
else
    print_warning "PM2 not found. Starting application directly..."
    print_status "Starting production server..."
    NODE_ENV=production npm start &
    
    # Wait a moment for the server to start
    sleep 3
    
    print_success "Application started"
fi

# Health check
print_status "Performing health check..."
sleep 5

if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Health check passed"
else
    print_warning "Health check failed - application might still be starting"
fi

print_success "🎉 Production deployment completed!"
print_status "Application should be available at: http://golfcar.go2kt.com:3000"
print_status "API health check: http://golfcar.go2kt.com:3000/api/health"

echo ""
echo "📋 Next steps:"
echo "1. Test image upload functionality"
echo "2. Verify all features are working correctly"
echo "3. Monitor application logs for any issues"
echo ""

if command -v pm2 &> /dev/null; then
    echo "📊 PM2 Commands:"
    echo "  pm2 status          - Check application status"
    echo "  pm2 logs            - View application logs"
    echo "  pm2 restart all     - Restart application"
    echo "  pm2 stop all        - Stop application"
fi