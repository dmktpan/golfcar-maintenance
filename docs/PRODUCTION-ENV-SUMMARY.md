# สรุปการตั้งค่า Environment Variables สำหรับ Production

## ✅ การแก้ไขที่ทำแล้ว

### 1. อัปเดตไฟล์ `.env.production`

ได้อัปเดตไฟล์ `.env.production` ให้ตรงกับการตั้งค่าที่ใช้ใน production server:

#### การเปลี่ยนแปลงสำคัญ:
- **Database Connection**: อัปเดต MongoDB connection string ให้ตรงกับ production database
- **Application URL**: เปลี่ยนจาก port 3000 เป็น 8080 ตาม production setup
- **CORS Settings**: อัปเดต ALLOWED_ORIGINS ให้ตรงกับ production URLs
- **Logging**: เปลี่ยน log level เป็น `info` และ log file เป็น `logs/app.log`

### 2. ไฟล์ที่สร้างใหม่

#### 📋 `ENV-SETUP-GUIDE.md`
- คู่มือการตั้งค่า environment variables ใน production server
- วิธีการสร้างและจัดการไฟล์ `.env.production`
- คำแนะนำด้านความปลอดภัย
- วิธีการ troubleshooting

#### 🚀 `setup-production-env.sh`
- Script อัตโนมัติสำหรับ copy `.env.production` ไปยัง production server
- ตั้งค่า permissions อัตโนมัติ
- รองรับการ restart PM2 process
- มี validation และ error handling

## 🔧 การตั้งค่าใน Production Server

### ไฟล์ที่จำเป็น:
```
/home/administrator/golfcar-maintenance-1/.env.production
```

### เนื้อหาไฟล์ `.env.production`:
```bash
# Environment
NODE_ENV="production"

# Database Configuration
DATABASE_URL="mongodb://yourAdminUser:KTP%40ssword@192.168.1.54:27017/golfcarmaintenance_db?replicaSet=rs0&authSource=admin"
MONGODB_URI="mongodb://yourAdminUser:KTP%40ssword@192.168.1.54:27017/golfcarmaintenance_db?replicaSet=rs0&authSource=admin"

# External API Configuration
EXTERNAL_API_BASE_URL="http://golfcar.go2kt.com:8080/api"
EXTERNAL_API_TIMEOUT=15000

# Application Base URL (สำคัญสำหรับการแสดงรูปภาพ)
NEXT_PUBLIC_BASE_URL="http://golfcar.go2kt.com:8080"

# Security Configuration (สำคัญสำหรับ CORS)
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

## 📝 ขั้นตอนการ Deploy

### วิธีที่ 1: ใช้ Script อัตโนมัติ
```bash
# รัน script เพื่อ copy .env.production ไปยัง production server
./setup-production-env.sh
```

### วิธีที่ 2: Manual Setup
```bash
# 1. Copy ไฟล์ไปยัง production server
scp .env.production administrator@golfcar.go2kt.com:/home/administrator/golfcar-maintenance-1/

# 2. SSH เข้า production server
ssh administrator@golfcar.go2kt.com

# 3. ตั้งค่า permissions
cd /home/administrator/golfcar-maintenance-1
chmod 600 .env.production
chown administrator:administrator .env.production

# 4. Restart PM2
pm2 restart golfcart-app
```

## 🔍 การตรวจสอบ

### ตรวจสอบไฟล์ใน Production Server:
```bash
ssh administrator@golfcar.go2kt.com
cd /home/administrator/golfcar-maintenance-1
ls -la .env.production
cat .env.production
```

### ตรวจสอบ PM2 Status:
```bash
pm2 status
pm2 logs golfcart-app
pm2 show golfcart-app
```

### ทดสอบ Application:
```bash
# ทดสอบ health check
curl http://golfcar.go2kt.com:8080/api/health

# ทดสอบ main page
curl http://golfcar.go2kt.com:8080/
```

## ⚠️ หมายเหตุสำคัญ

### ความปลอดภัย:
- ไฟล์ `.env.production` ประกอบด้วยข้อมูลสำคัญ (database credentials)
- ต้องตั้งค่า permissions เป็น 600 (read/write เฉพาะ owner)
- ไม่ควร commit เข้า git repository

### การอัปเดต:
- เมื่อมีการเปลี่ยนแปลง environment variables
- ต้อง restart PM2 process เพื่อให้การเปลี่ยนแปลงมีผล
- ควรทำ backup ไฟล์เก่าก่อนอัปเดต

### Troubleshooting:
ถ้ามีปัญหา:
1. ตรวจสอบ syntax ของไฟล์ `.env.production`
2. ตรวจสอบ permissions (ต้องเป็น 600)
3. ตรวจสอบ PM2 logs สำหรับ error messages
4. ทดสอบ database และ external API connections

## 🎯 ผลลัพธ์ที่คาดหวัง

หลังจากการตั้งค่านี้:
- Application จะใช้ database connection ที่ถูกต้อง
- Image loading จะทำงานได้อย่างถูกต้อง (ใช้ port 8080)
- CORS จะทำงานได้ถูกต้องสำหรับ production URLs
- Logging จะบันทึกข้อมูลที่เหมาะสมสำหรับ production
- Performance จะดีขึ้นเนื่องจากการตั้งค่าที่เหมาะสม