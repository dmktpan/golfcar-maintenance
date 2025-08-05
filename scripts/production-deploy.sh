#!/bin/bash

# Production Deployment Script for Golf Car Maintenance System
# This script handles safe production deployment with health checks

set -e  # Exit on any error

echo "🚀 Starting Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HEALTH_CHECK_URL="http://localhost:3000/api/health"
MAX_HEALTH_CHECK_ATTEMPTS=30
HEALTH_CHECK_INTERVAL=2

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if required environment variables are set
check_environment() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "DATABASE_URL"
        "EXTERNAL_API_BASE_URL"
        "NODE_ENV"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Function to backup current deployment
backup_deployment() {
    print_status "Creating backup of current deployment..."
    
    if [ -d ".next" ]; then
        timestamp=$(date +%Y%m%d_%H%M%S)
        backup_dir="backups/deployment_$timestamp"
        mkdir -p "$backup_dir"
        
        cp -r .next "$backup_dir/"
        cp package.json "$backup_dir/"
        cp package-lock.json "$backup_dir/" 2>/dev/null || true
        
        print_success "Backup created at $backup_dir"
    else
        print_warning "No existing deployment found to backup"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing production dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci --only=production
    else
        npm install --only=production
    fi
    
    print_success "Dependencies installed"
}

# Function to build application
build_application() {
    print_status "Building application for production..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Build the application
    npm run build
    
    print_success "Application built successfully"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Generate Prisma client
    npx prisma generate
    
    # Push database schema (for MongoDB)
    npx prisma db push
    
    print_success "Database migrations completed"
}

# Function to start application
start_application() {
    print_status "Starting application..."
    
    # Kill existing process if running
    if pgrep -f "next start" > /dev/null; then
        print_warning "Stopping existing application..."
        pkill -f "next start" || true
        sleep 3
    fi
    
    # Start the application in background
    nohup npm start > logs/production.log 2>&1 &
    
    # Get the PID
    APP_PID=$!
    echo $APP_PID > .app.pid
    
    print_success "Application started with PID: $APP_PID"
}

# Function to perform health checks
health_check() {
    print_status "Performing health checks..."
    
    local attempt=1
    local max_attempts=$MAX_HEALTH_CHECK_ATTEMPTS
    
    while [ $attempt -le $max_attempts ]; do
        echo -n "  Attempt $attempt/$max_attempts: "
        
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            print_success "Health check passed"
            return 0
        else
            echo "Failed"
            sleep $HEALTH_CHECK_INTERVAL
            ((attempt++))
        fi
    done
    
    print_error "Health checks failed after $max_attempts attempts"
    return 1
}

# Function to verify external API connectivity
verify_external_api() {
    print_status "Verifying external API connectivity..."
    
    local health_response
    health_response=$(curl -s "$HEALTH_CHECK_URL" | jq -r '.checks.external_api.status' 2>/dev/null || echo "unknown")
    
    case $health_response in
        "healthy")
            print_success "External API is healthy"
            ;;
        "degraded")
            print_warning "External API is degraded but functional"
            ;;
        "unhealthy")
            print_error "External API is unhealthy"
            return 1
            ;;
        *)
            print_warning "Could not determine external API status"
            ;;
    esac
}

# Function to rollback deployment
rollback_deployment() {
    print_error "Deployment failed. Rolling back..."
    
    # Stop current application
    if [ -f ".app.pid" ]; then
        local pid=$(cat .app.pid)
        kill $pid 2>/dev/null || true
        rm .app.pid
    fi
    
    # Restore from backup if available
    local latest_backup=$(ls -t backups/ | head -n1 2>/dev/null || echo "")
    
    if [ -n "$latest_backup" ] && [ -d "backups/$latest_backup" ]; then
        print_status "Restoring from backup: $latest_backup"
        
        rm -rf .next
        cp -r "backups/$latest_backup/.next" .
        
        # Restart with backup
        start_application
        
        if health_check; then
            print_success "Rollback completed successfully"
        else
            print_error "Rollback failed. Manual intervention required."
            exit 1
        fi
    else
        print_error "No backup available for rollback"
        exit 1
    fi
}

# Function to cleanup old backups
cleanup_backups() {
    print_status "Cleaning up old backups..."
    
    if [ -d "backups" ]; then
        # Keep only the 5 most recent backups
        ls -t backups/ | tail -n +6 | xargs -I {} rm -rf "backups/{}" 2>/dev/null || true
        print_success "Old backups cleaned up"
    fi
}

# Function to setup logging
setup_logging() {
    print_status "Setting up logging..."
    
    mkdir -p logs
    
    # Rotate logs if they're too large (>100MB)
    if [ -f "logs/production.log" ] && [ $(stat -f%z "logs/production.log" 2>/dev/null || stat -c%s "logs/production.log" 2>/dev/null || echo 0) -gt 104857600 ]; then
        mv logs/production.log "logs/production.log.$(date +%Y%m%d_%H%M%S)"
        gzip "logs/production.log.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
    fi
    
    print_success "Logging setup completed"
}

# Main deployment function
main() {
    print_status "Golf Car Maintenance System - Production Deployment"
    print_status "=================================================="
    
    # Create necessary directories
    mkdir -p backups logs
    
    # Setup logging
    setup_logging
    
    # Check environment
    check_environment
    
    # Backup current deployment
    backup_deployment
    
    # Install dependencies
    install_dependencies
    
    # Run database migrations
    run_migrations
    
    # Build application
    build_application
    
    # Start application
    start_application
    
    # Wait a moment for startup
    sleep 5
    
    # Perform health checks
    if ! health_check; then
        rollback_deployment
        exit 1
    fi
    
    # Verify external API
    verify_external_api
    
    # Cleanup old backups
    cleanup_backups
    
    print_success "🎉 Production deployment completed successfully!"
    print_status "Application is running at: http://localhost:3000"
    print_status "Health check endpoint: $HEALTH_CHECK_URL"
    print_status "Logs are available at: logs/production.log"
    
    # Display final status
    echo ""
    echo "📊 Deployment Summary:"
    echo "====================="
    echo "✅ Environment: $NODE_ENV"
    echo "✅ Database: Connected"
    echo "✅ External API: $(curl -s "$HEALTH_CHECK_URL" | jq -r '.checks.external_api.status' 2>/dev/null || echo 'Unknown')"
    echo "✅ Application: Running (PID: $(cat .app.pid 2>/dev/null || echo 'Unknown'))"
    echo ""
}

# Trap errors and rollback
trap 'rollback_deployment' ERR

# Run main function
main "$@"