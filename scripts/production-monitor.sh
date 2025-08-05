#!/bin/bash

# Production Monitoring Script for Golf Car Maintenance System
# This script monitors the application health and performance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HEALTH_CHECK_URL="http://localhost:3000/api/health"
SIMPLE_HEALTH_URL="http://localhost:3000/api/health?simple=true"
LOG_FILE="logs/monitor.log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=80
ALERT_THRESHOLD_RESPONSE_TIME=2000

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

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Function to check application health
check_application_health() {
    local start_time=$(date +%s%3N)
    local response
    local http_code
    local response_time
    
    # Make health check request
    response=$(curl -s -w "%{http_code}" "$HEALTH_CHECK_URL" 2>/dev/null || echo "000")
    http_code="${response: -3}"
    response_body="${response%???}"
    
    local end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))
    
    echo "🏥 Application Health Check"
    echo "=========================="
    
    if [ "$http_code" = "200" ]; then
        print_success "Application is healthy (HTTP $http_code)"
        
        # Parse response for detailed status
        if command -v jq >/dev/null 2>&1 && [ -n "$response_body" ]; then
            local overall_status=$(echo "$response_body" | jq -r '.status' 2>/dev/null || echo "unknown")
            local db_status=$(echo "$response_body" | jq -r '.checks.database.status' 2>/dev/null || echo "unknown")
            local api_status=$(echo "$response_body" | jq -r '.checks.external_api.status' 2>/dev/null || echo "unknown")
            local memory_status=$(echo "$response_body" | jq -r '.checks.memory.status' 2>/dev/null || echo "unknown")
            local uptime=$(echo "$response_body" | jq -r '.checks.uptime.uptime_human' 2>/dev/null || echo "unknown")
            
            echo "  Overall Status: $overall_status"
            echo "  Database: $db_status"
            echo "  External API: $api_status"
            echo "  Memory: $memory_status"
            echo "  Uptime: $uptime"
            echo "  Response Time: ${response_time}ms"
            
            # Check for warnings
            if [ "$response_time" -gt "$ALERT_THRESHOLD_RESPONSE_TIME" ]; then
                print_warning "Slow response time: ${response_time}ms (threshold: ${ALERT_THRESHOLD_RESPONSE_TIME}ms)"
                log_message "WARNING: Slow response time: ${response_time}ms"
            fi
            
            if [ "$api_status" = "unhealthy" ]; then
                print_warning "External API is unhealthy"
                log_message "WARNING: External API is unhealthy"
            fi
        fi
        
        log_message "Health check passed - HTTP $http_code, Response time: ${response_time}ms"
        return 0
    else
        print_error "Application health check failed (HTTP $http_code)"
        log_message "ERROR: Health check failed - HTTP $http_code"
        return 1
    fi
}

# Function to check system resources
check_system_resources() {
    echo ""
    echo "💻 System Resources"
    echo "=================="
    
    # Check CPU usage
    if command -v top >/dev/null 2>&1; then
        local cpu_usage
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            cpu_usage=$(top -l 1 -s 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
        else
            # Linux
            cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
        fi
        
        if [ -n "$cpu_usage" ]; then
            echo "  CPU Usage: ${cpu_usage}%"
            
            if (( $(echo "$cpu_usage > $ALERT_THRESHOLD_CPU" | bc -l 2>/dev/null || echo 0) )); then
                print_warning "High CPU usage: ${cpu_usage}% (threshold: ${ALERT_THRESHOLD_CPU}%)"
                log_message "WARNING: High CPU usage: ${cpu_usage}%"
            fi
        fi
    fi
    
    # Check memory usage
    if command -v free >/dev/null 2>&1; then
        # Linux
        local mem_info=$(free | grep Mem)
        local total_mem=$(echo $mem_info | awk '{print $2}')
        local used_mem=$(echo $mem_info | awk '{print $3}')
        local mem_percentage=$((used_mem * 100 / total_mem))
        
        echo "  Memory Usage: ${mem_percentage}% (${used_mem}/${total_mem})"
        
        if [ "$mem_percentage" -gt "$ALERT_THRESHOLD_MEMORY" ]; then
            print_warning "High memory usage: ${mem_percentage}% (threshold: ${ALERT_THRESHOLD_MEMORY}%)"
            log_message "WARNING: High memory usage: ${mem_percentage}%"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        local mem_pressure=$(memory_pressure 2>/dev/null | grep "System-wide memory free percentage" | awk '{print $5}' | sed 's/%//' || echo "")
        if [ -n "$mem_pressure" ]; then
            local mem_used=$((100 - mem_pressure))
            echo "  Memory Usage: ${mem_used}%"
            
            if [ "$mem_used" -gt "$ALERT_THRESHOLD_MEMORY" ]; then
                print_warning "High memory usage: ${mem_used}% (threshold: ${ALERT_THRESHOLD_MEMORY}%)"
                log_message "WARNING: High memory usage: ${mem_used}%"
            fi
        fi
    fi
    
    # Check disk usage
    local disk_usage=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    echo "  Disk Usage: ${disk_usage}%"
    
    if [ "$disk_usage" -gt 85 ]; then
        print_warning "High disk usage: ${disk_usage}%"
        log_message "WARNING: High disk usage: ${disk_usage}%"
    fi
}

# Function to check application process
check_application_process() {
    echo ""
    echo "🔄 Application Process"
    echo "====================="
    
    if [ -f ".app.pid" ]; then
        local pid=$(cat .app.pid)
        
        if ps -p "$pid" > /dev/null 2>&1; then
            print_success "Application is running (PID: $pid)"
            
            # Get process info
            if command -v ps >/dev/null 2>&1; then
                local process_info
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    process_info=$(ps -p "$pid" -o pid,ppid,pcpu,pmem,etime,command | tail -1)
                else
                    process_info=$(ps -p "$pid" -o pid,ppid,pcpu,pmem,etime,cmd | tail -1)
                fi
                echo "  Process Info: $process_info"
            fi
            
            log_message "Application process is running (PID: $pid)"
            return 0
        else
            print_error "Application process not found (PID: $pid)"
            log_message "ERROR: Application process not found (PID: $pid)"
            return 1
        fi
    else
        print_error "No PID file found (.app.pid)"
        log_message "ERROR: No PID file found"
        return 1
    fi
}

# Function to check log files
check_log_files() {
    echo ""
    echo "📋 Log Files"
    echo "==========="
    
    local log_files=("logs/production.log" "logs/error.log" "logs/access.log")
    
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ]; then
            local file_size=$(du -h "$log_file" | cut -f1)
            local last_modified=$(stat -c %y "$log_file" 2>/dev/null || stat -f %Sm "$log_file" 2>/dev/null || echo "unknown")
            
            echo "  $log_file: $file_size (modified: $last_modified)"
            
            # Check for recent errors
            local recent_errors=$(tail -100 "$log_file" | grep -i "error\|exception\|fatal" | wc -l | tr -d ' ')
            if [ "$recent_errors" -gt 0 ]; then
                print_warning "Found $recent_errors recent errors in $log_file"
                log_message "WARNING: Found $recent_errors recent errors in $log_file"
            fi
        else
            echo "  $log_file: Not found"
        fi
    done
}

# Function to check external dependencies
check_external_dependencies() {
    echo ""
    echo "🌐 External Dependencies"
    echo "======================="
    
    # Check external API
    local external_api_url="${EXTERNAL_API_BASE_URL:-http://golfcar.go2kt.com:8080/api}"
    echo "  External API: $external_api_url"
    
    local start_time=$(date +%s%3N)
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$external_api_url/health" --connect-timeout 5 --max-time 10 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    if [ "$response_code" = "200" ]; then
        print_success "External API is accessible (HTTP $response_code, ${response_time}ms)"
        log_message "External API check passed - HTTP $response_code, Response time: ${response_time}ms"
    else
        print_error "External API is not accessible (HTTP $response_code)"
        log_message "ERROR: External API check failed - HTTP $response_code"
    fi
    
    # Check database connectivity (through health endpoint)
    echo "  Database: Checking through health endpoint..."
    local db_status=$(curl -s "$SIMPLE_HEALTH_URL" | jq -r '.status' 2>/dev/null || echo "unknown")
    
    if [ "$db_status" = "ok" ]; then
        print_success "Database is accessible"
        log_message "Database check passed"
    else
        print_error "Database connectivity issue"
        log_message "ERROR: Database check failed"
    fi
}

# Function to generate summary report
generate_summary() {
    echo ""
    echo "📊 Monitoring Summary"
    echo "===================="
    echo "  Timestamp: $(date)"
    echo "  Environment: ${NODE_ENV:-development}"
    echo "  Health Check URL: $HEALTH_CHECK_URL"
    echo "  Log File: $LOG_FILE"
    echo ""
    
    # Count recent log entries
    if [ -f "$LOG_FILE" ]; then
        local total_entries=$(wc -l < "$LOG_FILE" | tr -d ' ')
        local recent_warnings=$(tail -100 "$LOG_FILE" | grep -c "WARNING" || echo 0)
        local recent_errors=$(tail -100 "$LOG_FILE" | grep -c "ERROR" || echo 0)
        
        echo "  Log Entries: $total_entries total"
        echo "  Recent Warnings: $recent_warnings (last 100 entries)"
        echo "  Recent Errors: $recent_errors (last 100 entries)"
    fi
}

# Function to run continuous monitoring
continuous_monitor() {
    local interval=${1:-60}  # Default 60 seconds
    
    print_status "Starting continuous monitoring (interval: ${interval}s)"
    print_status "Press Ctrl+C to stop"
    
    while true; do
        clear
        echo "🔍 Golf Car Maintenance System - Production Monitor"
        echo "=================================================="
        echo ""
        
        check_application_health
        check_application_process
        check_system_resources
        check_external_dependencies
        generate_summary
        
        echo ""
        echo "Next check in ${interval} seconds..."
        sleep "$interval"
    done
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -c, --continuous [SEC]  Run continuous monitoring (default: 60 seconds)"
    echo "  -q, --quick             Run quick health check only"
    echo "  -s, --summary           Show summary report only"
    echo ""
    echo "Examples:"
    echo "  $0                      Run single monitoring check"
    echo "  $0 -c 30               Run continuous monitoring every 30 seconds"
    echo "  $0 --quick             Quick health check"
}

# Main function
main() {
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    case "${1:-}" in
        -h|--help)
            show_usage
            exit 0
            ;;
        -c|--continuous)
            continuous_monitor "${2:-60}"
            ;;
        -q|--quick)
            check_application_health
            ;;
        -s|--summary)
            generate_summary
            ;;
        "")
            # Default: run all checks once
            echo "🔍 Golf Car Maintenance System - Production Monitor"
            echo "=================================================="
            echo ""
            
            check_application_health
            check_application_process
            check_system_resources
            check_external_dependencies
            check_log_files
            generate_summary
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"