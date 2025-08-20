# การ Deploy แบบใหม่ (ไม่ใช้ ecosystem.config.js)

เนื่องจากไฟล์ `ecosystem.config.js` ไม่ได้ถูก push ไปยัง server คู่มือนี้จะแสดงวิธีการ deploy แบบใหม่ที่ไม่ต้องพึ่งพาไฟล์ดังกล่าว

## วิธีที่ 1: ใช้ npm scripts (แนะนำ)

### 1. อัปเดต package.json

เพิ่ม scripts ใหม่ใน `package.json`:

```json
{
  "scripts": {
    "build:production": "NODE_ENV=production next build",
    "start:production": "NODE_ENV=production next start -p 8080 -H 0.0.0.0",
    "deploy:production": "npm run build:production && npm run start:production"
  }
}
```

### 2. สร้างไฟล์ start-server.sh

```bash
#!/bin/bash

# Production Server Startup Script
echo "🚀 Starting Golf Car Maintenance System..."

# Set environment
export NODE_ENV=production
export PORT=8080
export HOSTNAME=0.0.0.0

# Create logs directory
mkdir -p logs

# Start the server
echo "Starting server on port 8080..."
npm run start:production > logs/app.log 2>&1 &

# Get the process ID
PID=$!
echo "Server started with PID: $PID"
echo $PID > server.pid

echo "✅ Server is running!"
echo "📊 Check logs: tail -f logs/app.log"
echo "🛑 Stop server: kill \$(cat server.pid)"
```

### 3. คำสั่งการ Deploy

```bash
# 1. Build application
npm run build:production

# 2. Start server
chmod +x start-server.sh
./start-server.sh
```

## วิธีที่ 2: ใช้ PM2 แบบง่าย (ไม่ใช้ ecosystem.config.js)

### 1. Install PM2 (ถ้ายังไม่มี)

```bash
npm install -g pm2
```

### 2. Start แบบง่าย

```bash
# Build application
NODE_ENV=production npm run build

# Start with PM2
NODE_ENV=production PORT=8080 HOSTNAME=0.0.0.0 pm2 start npm --name "golfcart-app" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### 3. คำสั่งจัดการ PM2

```bash
# ดูสถานะ
pm2 status

# ดู logs
pm2 logs golfcart-app

# Restart
pm2 restart golfcart-app

# Stop
pm2 stop golfcart-app

# Delete
pm2 delete golfcart-app
```

## วิธีที่ 3: ใช้ Docker (สำหรับ Advanced Users)

### 1. สร้าง Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 8080

# Start application
CMD ["npm", "start"]
```

### 2. Build และ Run Docker

```bash
# Build image
docker build -t golfcart-app .

# Run container
docker run -d \
  --name golfcart-container \
  -p 8080:8080 \
  --env-file .env.production \
  golfcart-app
```

## การตั้งค่า Environment Variables

### สร้างไฟล์ .env.production

```bash
NODE_ENV="production"
PORT=8080
HOSTNAME="0.0.0.0"

# Database
DATABASE_URL="mongodb://yourAdminUser:KTP%40ssword@192.168.1.54:27017/golfcarmaintenance_db?replicaSet=rs0&authSource=admin"
MONGODB_URI="mongodb://yourAdminUser:KTP%40ssword@192.168.1.54:27017/golfcarmaintenance_db?replicaSet=rs0&authSource=admin"

# External API
EXTERNAL_API_BASE_URL="http://golfcar.go2kt.com:8080"
EXTERNAL_API_TIMEOUT=30000

# Application URLs
NEXT_PUBLIC_BASE_URL="http://golfcar.go2kt.com:8080"
ALLOWED_ORIGINS="http://golfcar.go2kt.com:8080,http://golfcar.go2kt.com:3000"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR="public/uploads"

# API Settings
API_TIMEOUT=30000
API_RETRY_ATTEMPTS=3

# Logging
LOG_LEVEL="info"
LOG_FILE="logs/app.log"

# Performance
NODE_OPTIONS="--max-old-space-size=2048"
```

## Script การ Deploy อัตโนมัติ

สร้างไฟล์ `deploy-simple.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 Starting Simple Production Deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Check .env.production
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found!"
    exit 1
fi

# Create directories
print_info "Creating directories..."
mkdir -p logs
mkdir -p public/uploads/maintenance
chmod 755 public/uploads/maintenance

# Install dependencies
print_info "Installing dependencies..."
npm ci

# Build application
print_info "Building application..."
NODE_ENV=production npm run build

# Stop existing process if running
if [ -f "server.pid" ]; then
    print_info "Stopping existing server..."
    kill $(cat server.pid) 2>/dev/null || true
    rm -f server.pid
fi

# Start new process
print_info "Starting server..."
export NODE_ENV=production
export PORT=8080
export HOSTNAME=0.0.0.0

npm start > logs/app.log 2>&1 &
PID=$!
echo $PID > server.pid

print_success "Server started with PID: $PID"
print_success "🎉 Deployment completed!"

echo ""
echo "📋 Useful commands:"
echo "  tail -f logs/app.log    # View logs"
echo "  kill \$(cat server.pid)   # Stop server"
echo "  curl http://localhost:8080/api/health  # Health check"
```

## การทดสอบ

### 1. Health Check

```bash
curl http://localhost:8080/api/health
```

### 2. ตรวจสอบ Logs

```bash
# ดู logs แบบ real-time
tail -f logs/app.log

# ดู logs ล่าสุด
tail -n 100 logs/app.log
```

### 3. ตรวจสอบ Process

```bash
# ดู process ที่รัน
ps aux | grep node

# ดู port ที่ใช้
lsof -i :8080
```

## การแก้ไขปัญหา

### ปัญหา Port ถูกใช้แล้ว

```bash
# หา process ที่ใช้ port 8080
lsof -i :8080

# Kill process
kill -9 <PID>
```

### ปัญหา Permission

```bash
# ให้สิทธิ์ execute script
chmod +x deploy-simple.sh
chmod +x start-server.sh

# ให้สิทธิ์ upload directory
chmod -R 755 public/uploads
```

### ปัญหา Memory

```bash
# เพิ่ม memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
```

## สรุป

**แนะนำให้ใช้วิธีที่ 1 (npm scripts)** เพราะ:
- ง่ายที่สุด
- ไม่ต้องพึ่งพา ecosystem.config.js
- ควบคุมได้ง่าย
- เหมาะสำหรับ server ขนาดเล็ก

หากต้องการความเสถียรมากขึ้น ให้ใช้วิธีที่ 2 (PM2) แต่แบบง่าย ๆ ไม่ต้องใช้ config file