#!/bin/bash

# Simple Production Deployment Script
# ไม่ต้องใช้ ecosystem.config.js

set -e  # Exit on any error

echo "🚀 Starting Simple Production Deployment..."

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

# Create necessary directories
print_status "Creating directories..."
mkdir -p logs
mkdir -p public/uploads/maintenance
chmod 755 public/uploads/maintenance
print_success "Directories created"

# Install dependencies
print_status "Installing dependencies..."
npm ci
print_success "Dependencies installed"

# Build the application
print_status "Building application for production..."
NODE_ENV=production npm run build
print_success "Application built successfully"

# Stop existing process if running
if [ -f "server.pid" ]; then
    print_status "Stopping existing server..."
    OLD_PID=$(cat server.pid)
    if kill -0 $OLD_PID 2>/dev/null; then
        print_status "Killing process $OLD_PID"
        kill $OLD_PID
        sleep 2
        # Force kill if still running
        if kill -0 $OLD_PID 2>/dev/null; then
            print_warning "Force killing process $OLD_PID"
            kill -9 $OLD_PID
        fi
    fi
    rm -f server.pid
    print_success "Existing server stopped"
fi

# Check if PM2 is available and user wants to use it
if command -v pm2 &> /dev/null; then
    echo ""
    echo "PM2 is available. Choose deployment method:"
    echo "1) Use PM2 (recommended for production)"
    echo "2) Use simple npm start"
    read -p "Enter choice (1 or 2): " choice
    
    if [ "$choice" = "1" ]; then
        print_status "Using PM2 for deployment..."
        
        # Stop existing PM2 process
        pm2 stop golfcart-app 2>/dev/null || true
        pm2 delete golfcart-app 2>/dev/null || true
        
        # Start with PM2
        print_status "Starting application with PM2..."
        NODE_ENV=production PORT=8080 HOSTNAME=0.0.0.0 pm2 start npm --name "golfcart-app" -- start
        
        # Save PM2 configuration
        pm2 save
        
        print_success "Application started with PM2"
        
        # Show PM2 status
        echo ""
        pm2 status
        
    else
        print_status "Using simple npm start..."
        
        # Set environment variables
        export NODE_ENV=production
        export PORT=8080
        export HOSTNAME=0.0.0.0
        
        # Start the server in background
        print_status "Starting server..."
        node .next/standalone/server.js > logs/app.log 2>&1 &
        
        # Get the process ID
        PID=$!
        echo $PID > server.pid
        
        print_success "Server started with PID: $PID"
        print_status "Logs are being written to: logs/app.log"
    fi
else
    print_status "PM2 not found. Using simple npm start..."
    
    # Set environment variables
    export NODE_ENV=production
    export PORT=8080
    export HOSTNAME=0.0.0.0
    
    # Start the server in background
    print_status "Starting server..."
    node .next/standalone/server.js > logs/app.log 2>&1 &
    
    # Get the process ID
    PID=$!
    echo $PID > server.pid
    
    print_success "Server started with PID: $PID"
    print_status "Logs are being written to: logs/app.log"
fi

# Wait for server to start
print_status "Waiting for server to start..."
sleep 5

# Health check
print_status "Performing health check..."
if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    print_success "Health check passed ✅"
else
    print_warning "Health check failed - application might still be starting"
    print_status "You can check logs with: tail -f logs/app.log"
fi

print_success "🎉 Production deployment completed!"
echo ""
echo "📋 Application Information:"
echo "   URL: http://golfcar.go2kt.com:8080"
echo "   Health Check: http://golfcar.go2kt.com:8080/api/health"
echo ""
echo "📊 Useful Commands:"
if command -v pm2 &> /dev/null && [ "$choice" = "1" ]; then
    echo "   pm2 status              - Check application status"
    echo "   pm2 logs golfcart-app   - View application logs"
    echo "   pm2 restart golfcart-app - Restart application"
    echo "   pm2 stop golfcart-app   - Stop application"
else
    echo "   tail -f logs/app.log    - View application logs"
    echo "   kill \$(cat server.pid)   - Stop application"
    echo "   ps aux | grep node      - Check running processes"
fi
echo "   curl http://localhost:8080/api/health - Test health endpoint"
echo ""
echo "🔧 Troubleshooting:"
echo "   - If port 8080 is busy: lsof -i :8080"
echo "   - Check logs: tail -f logs/app.log"
echo "   - Check process: ps aux | grep node"
echo ""