# Production Deployment Guide

## ปัญหาที่แก้ไข

### 1. Image Loading Issues (404 errors)
- เพิ่ม `remotePatterns` ใน `next.config.mjs` สำหรับ external images
- สร้าง API route `/api/proxy/images/[...path]/route.ts` สำหรับ image proxy
- เพิ่ม rewrites สำหรับ image proxy
- ตั้งค่า `unoptimized: true` สำหรับ production

### 2. Standalone Server Configuration
- อัปเดต `ecosystem.config.js` ให้ใช้ `.next/standalone/server.js`
- เพิ่มสคริปต์ `start:production` และ `start:standalone` ใน `package.json`
- สร้าง `start-production.js` สำหรับจัดการ standalone server

## การ Deploy

### 1. Build Application
```bash
npm run build
```

### 2. Start with PM2 (Production)
```bash
# หยุด process เดิม (ถ้ามี)
pm2 stop golfcart-app
pm2 delete golfcart-app

# เริ่ม process ใหม่
pm2 start ecosystem.config.js --env production

# ดู logs
pm2 logs golfcart-app

# ดู status
pm2 status
```

### 3. Alternative Start Methods

#### ใช้ standalone server โดยตรง:
```bash
node .next/standalone/server.js
```

#### ใช้ production script:
```bash
npm run start:production
```

## Environment Variables

ตรวจสอบให้แน่ใจว่ามี environment variables ต่อไปนี้:

```bash
NODE_ENV=production
PORT=8080
HOSTNAME=0.0.0.0
EXTERNAL_API_BASE_URL=http://golfcar.go2kt.com:8080
```

## Image Proxy

รูปภาพจาก external server จะถูก proxy ผ่าน:
- `/api/proxy/images/[...path]` - สำหรับ image proxy
- `/proxy-image/[...path]` - สำหรับ direct image proxy

## Troubleshooting

### ถ้ายังมีปัญหา image loading:
1. ตรวจสอบ logs: `pm2 logs golfcart-app`
2. ตรวจสอบว่า external API server ทำงานปกติ
3. ทดสอบ image URL โดยตรง: `curl http://golfcar.go2kt.com:8080/api/uploads/maintenance/[filename]`

### ถ้า standalone server ไม่ทำงาน:
1. ตรวจสอบว่า build เสร็จสมบูรณ์: `ls -la .next/standalone/`
2. ตรวจสอบ permissions: `chmod +x .next/standalone/server.js`
3. ทดสอบรันโดยตรง: `node .next/standalone/server.js`

## Performance Monitoring

```bash
# ดู resource usage
pm2 monit

# ดู detailed info
pm2 show golfcart-app

# Restart if needed
pm2 restart golfcart-app
```

## Logs Location

- Error logs: `./logs/err.log`
- Output logs: `./logs/out.log`
- Combined logs: `./logs/combined.log`