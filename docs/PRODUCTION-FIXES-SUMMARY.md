# สรุปการแก้ไขปัญหา Production

## ปัญหาที่พบ

### 1. Image Loading Errors (404)
```
⨯ upstream image response failed for `http://golfcar.go2kt.com:8080/api/uploads/maintenance/...` 404
```

### 2. Standalone Server Warning
```
⚠ "next start" does not work with "output: standalone" configuration. Use "node .next/standalone/server.js" instead.
```

## การแก้ไขที่ทำ

### 1. แก้ไขปัญหา Image Loading

#### อัปเดต `next.config.mjs`:
- เพิ่ม `remotePatterns` สำหรับ external images
- เพิ่ม `unoptimized: true` สำหรับ production
- เพิ่ม rewrites สำหรับ image proxy

#### สร้าง Image Proxy API:
- `/app/api/proxy/images/[...path]/route.ts` - API route สำหรับ proxy images
- รองรับ timeout และ error handling
- เพิ่ม cache headers

#### อัปเดต Middleware:
- เพิ่มการจัดการ `/proxy-image/` routes
- เพิ่ม CORS headers สำหรับ images

### 2. แก้ไขปัญหา Standalone Server

#### อัปเดต `ecosystem.config.js`:
- เปลี่ยนจาก `npm start` เป็น `.next/standalone/server.js`
- เพิ่ม environment variables ที่จำเป็น
- เพิ่ม `HOSTNAME=0.0.0.0` และ `EXTERNAL_API_BASE_URL`

#### เพิ่มสคริปต์ใหม่ใน `package.json`:
- `start:production` - รัน production script
- `start:standalone` - รัน standalone server โดยตรง

#### สร้าง `start-production.js`:
- Script สำหรับจัดการ standalone server
- รองรับ graceful shutdown
- เพิ่ม error handling และ logging

### 3. ไฟล์เอกสารและการ Deploy

#### สร้าง `PRODUCTION-DEPLOY.md`:
- คู่มือการ deploy production
- วิธีแก้ปัญหาที่อาจเกิดขึ้น
- คำสั่งสำหรับ monitoring

#### สร้าง `.env.production.example`:
- Template สำหรับ environment variables
- ค่าที่แนะนำสำหรับ production

## วิธีการ Deploy ใหม่

### 1. Build Application
```bash
npm run build
```

### 2. Deploy with PM2
```bash
# หยุด process เดิม
pm2 stop golfcart-app
pm2 delete golfcart-app

# เริ่ม process ใหม่
pm2 start ecosystem.config.js --env production

# ตรวจสอบ status
pm2 status
pm2 logs golfcart-app
```

### 3. Alternative Methods
```bash
# รันด้วย standalone server โดยตรง
node .next/standalone/server.js

# รันด้วย production script
npm run start:production
```

## การทดสอบ

### ทดสอบ Image Loading:
```bash
# ทดสอบ image proxy
curl http://localhost:8080/api/proxy/images/api/uploads/maintenance/[filename]

# ทดสอบ direct proxy
curl http://localhost:8080/proxy-image/api/uploads/maintenance/[filename]
```

### ทดสอบ Server:
```bash
# ทดสอบ health check
curl http://localhost:8080/api/health

# ทดสอบ main page
curl http://localhost:8080/
```

## Monitoring

```bash
# ดู logs แบบ real-time
pm2 logs golfcart-app --lines 50

# ดู resource usage
pm2 monit

# ดู detailed info
pm2 show golfcart-app
```

## หมายเหตุ

- การแก้ไขนี้จะแก้ปัญหา 404 errors สำหรับ images
- Standalone server จะทำงานได้อย่างถูกต้องโดยไม่มี warning
- Performance จะดีขึ้นเนื่องจากใช้ standalone mode
- Image caching จะทำงานได้ดีขึ้น