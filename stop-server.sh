#!/bin/bash

# Simple Server Stop Script
# ใช้สำหรับ stop server

echo "🛑 Stopping Golf Car Maintenance System..."

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

# Check if server.pid exists
if [ ! -f "server.pid" ]; then
    print_error "server.pid file not found!"
    print_info "Server might not be running or was started differently"
    
    # Try to find node processes
    print_info "Looking for node processes..."
    NODE_PROCESSES=$(ps aux | grep "node .next/standalone/server.js\|npm start\|next start" | grep -v grep)
    
    if [ -n "$NODE_PROCESSES" ]; then
        echo "Found running processes:"
        echo "$NODE_PROCESSES"
        echo ""
        read -p "Do you want to kill these processes? (y/N): " confirm
        
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            print_info "Killing node processes..."
            pkill -f "node .next/standalone/server.js" 2>/dev/null || true
            pkill -f "npm start" 2>/dev/null || true
            pkill -f "next start" 2>/dev/null || true
            print_success "Processes killed"
        fi
    else
        print_info "No running node processes found"
    fi
    
    exit 0
fi

# Read PID from file
PID=$(cat server.pid)

print_info "Found server PID: $PID"

# Check if process is running
if kill -0 $PID 2>/dev/null; then
    print_info "Stopping server (PID: $PID)..."
    
    # Try graceful shutdown first
    kill $PID
    
    # Wait for graceful shutdown
    print_info "Waiting for graceful shutdown..."
    sleep 3
    
    # Check if still running
    if kill -0 $PID 2>/dev/null; then
        print_info "Process still running, force killing..."
        kill -9 $PID
        sleep 1
        
        # Final check
        if kill -0 $PID 2>/dev/null; then
            print_error "Failed to kill process $PID"
            exit 1
        else
            print_success "Process force killed"
        fi
    else
        print_success "Process stopped gracefully"
    fi
    
else
    print_info "Process $PID is not running"
fi

# Remove PID file
rm -f server.pid
print_success "PID file removed"

# Check if port is still in use
print_info "Checking if port 8080 is free..."
if lsof -i :8080 > /dev/null 2>&1; then
    print_error "Port 8080 is still in use!"
    echo "Processes using port 8080:"
    lsof -i :8080
    echo ""
    echo "You may need to manually kill these processes:"
    echo "lsof -ti :8080 | xargs kill -9"
else
    print_success "Port 8080 is now free"
fi

print_success "✅ Server stopped successfully!"

echo ""
echo "📊 Useful Commands:"
echo "   ./start-server.sh        # Start server again"
echo "   ps aux | grep node       # Check for any remaining node processes"
echo "   lsof -i :8080           # Check if port 8080 is free"
echo "   tail -f logs/app.log     # View last logs"
echo ""