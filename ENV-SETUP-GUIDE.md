# คู่มือการตั้งค่า Environment Variables สำหรับ Production

## ไฟล์ที่จำเป็นใน Production Server

### 1. ไฟล์ `.env.production` (บังคับ)

ใน production server ต้องมีไฟล์ `.env.production` ที่ root directory ของโปรเจค:

```bash
/home/administrator/golfcar-maintenance-1/.env.production
```

### 2. เนื้อหาไฟล์ `.env.production`

```bash
# Production Environment Configuration

# Environment
NODE_ENV="production"

# Database Configuration (⚠️ REQUIRED)
# MongoDB connection string
# Format: mongodb://username:password@host:port/database
DATABASE_URL="mongodb://yourAdminUser:KTP%40ssword@192.168.1.54:27017/golfcarmaintenance_db?replicaSet=rs0&authSource=admin"
MONGODB_URI="mongodb://yourAdminUser:KTP%40ssword@192.168.1.54:27017/golfcarmaintenance_db?replicaSet=rs0&authSource=admin"

# External API Configuration
EXTERNAL_API_BASE_URL="http://golfcar.go2kt.com:8080/api"
EXTERNAL_API_TIMEOUT=15000

# Application Base URL (🔥 สำคัญสำหรับการแสดงรูปภาพ!)
NEXT_PUBLIC_BASE_URL="http://golfcar.go2kt.com:8080"

# Security Configuration (🔒 สำคัญสำหรับ CORS)
ALLOWED_ORIGINS="http://golfcar.go2kt.com:8080,http://golfcar.go2kt.com:3000"

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
UPLOAD_PATH=public/uploads

# API Configuration
API_RATE_LIMIT=100
API_TIMEOUT=30000

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## วิธีการตั้งค่าใน Production Server

### 1. สร้างไฟล์ `.env.production`

```bash
# เข้าไปยัง directory ของโปรเจค
cd /home/administrator/golfcar-maintenance-1

# สร้างไฟล์ .env.production
nano .env.production

# คัดลอกเนื้อหาข้างต้นลงในไฟล์
# กด Ctrl+X, Y, Enter เพื่อบันทึก
```

### 2. ตรวจสอบไฟล์

```bash
# ตรวจสอบว่าไฟล์ถูกสร้างแล้ว
ls -la .env.production

# ดูเนื้อหาไฟล์
cat .env.production
```

### 3. ตั้งค่า Permissions

```bash
# ตั้งค่า permissions ให้ปลอดภัย
chmod 600 .env.production
chown administrator:administrator .env.production
```

## การใช้งานกับ PM2

### 1. PM2 จะอ่านไฟล์ `.env.production` อัตโนมัติ

```bash
# เริ่ม application ด้วย production environment
pm2 start ecosystem.config.js --env production
```

### 2. ตรวจสอบ Environment Variables

```bash
# ดู environment variables ที่ PM2 ใช้
pm2 show golfcart-app

# ดู logs เพื่อตรวจสอบการโหลด env
pm2 logs golfcart-app
```

## การทดสอบ

### 1. ทดสอบ Database Connection

```bash
# ทดสอบการเชื่อมต่อ MongoDB
mongosh "mongodb://yourAdminUser:KTP%40ssword@192.168.1.54:27017/golfcarmaintenance_db?replicaSet=rs0&authSource=admin"
```

### 2. ทดสอบ External API

```bash
# ทดสอบ external API
curl http://golfcar.go2kt.com:8080/api/health
```

### 3. ทดสอบ Application

```bash
# ทดสอบ application health
curl http://localhost:8080/api/health

# ทดสอบ main page
curl http://localhost:8080/
```

## หมายเหตุสำคัญ

### 1. ความปลอดภัย
- ไม่ควร commit ไฟล์ `.env.production` เข้า git
- ตั้งค่า permissions ให้เหมาะสม (600)
- เก็บ backup ของไฟล์ไว้ในที่ปลอดภัย

### 2. การอัปเดต
- เมื่อมีการเปลี่ยนแปลง environment variables
- ต้อง restart PM2 process

```bash
pm2 restart golfcart-app
```

### 3. Troubleshooting

ถ้ามีปัญหา:
1. ตรวจสอบ syntax ของไฟล์ `.env.production`
2. ตรวจสอบ permissions
3. ตรวจสอบ PM2 logs
4. ทดสอบ database และ external API connections

```bash
# ดู PM2 logs แบบ real-time
pm2 logs golfcart-app --lines 50

# ดู environment variables ที่ application ใช้
pm2 env golfcart-app
```