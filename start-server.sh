#!/bin/bash

# Simple Server Startup Script
# ใช้สำหรับ start server แบบง่าย ๆ

echo "🚀 Starting Golf Car Maintenance System..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    echo "Please create .env.production file first"
    exit 1
fi

# Check if application is built
if [ ! -d ".next" ]; then
    print_error "Application not built yet!"
    echo "Please run: npm run build first"
    exit 1
fi

# Stop existing server if running
if [ -f "server.pid" ]; then
    OLD_PID=$(cat server.pid)
    if kill -0 $OLD_PID 2>/dev/null; then
        print_info "Stopping existing server (PID: $OLD_PID)..."
        kill $OLD_PID
        sleep 2
        # Force kill if still running
        if kill -0 $OLD_PID 2>/dev/null; then
            print_info "Force killing process $OLD_PID"
            kill -9 $OLD_PID
        fi
    fi
    rm -f server.pid
fi

# Create logs directory
mkdir -p logs

# Set environment variables
export NODE_ENV=production
export PORT=8080
export HOSTNAME=0.0.0.0

# Load environment variables from .env.production
if [ -f ".env.production" ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

print_info "Starting server on port 8080..."

# Start the server in background
node .next/standalone/server.js > logs/app.log 2>&1 &

# Get the process ID
PID=$!
echo $PID > server.pid

print_success "Server started with PID: $PID"
print_info "Logs are being written to: logs/app.log"

# Wait a moment for server to start
sleep 3

# Check if process is still running
if kill -0 $PID 2>/dev/null; then
    print_success "✅ Server is running successfully!"
    
    # Try health check
    print_info "Performing health check..."
    sleep 2
    
    if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
        print_success "✅ Health check passed!"
    else
        print_info "Health check pending... (server might still be starting)"
    fi
    
else
    print_error "❌ Server failed to start!"
    print_info "Check logs: tail -f logs/app.log"
    exit 1
fi

echo ""
echo "📋 Server Information:"
echo "   PID: $PID"
echo "   Port: 8080"
echo "   URL: http://golfcar.go2kt.com:8080"
echo "   Health: http://golfcar.go2kt.com:8080/api/health"
echo ""
echo "📊 Useful Commands:"
echo "   tail -f logs/app.log     # View logs in real-time"
echo "   kill \$(cat server.pid)    # Stop server"
echo "   ps aux | grep node       # Check running processes"
echo "   curl http://localhost:8080/api/health  # Test health"
echo ""
echo "🔧 Troubleshooting:"
echo "   - Check logs: tail -f logs/app.log"
echo "   - Check if port is free: lsof -i :8080"
echo "   - Check process: ps aux | grep $PID"
echo ""