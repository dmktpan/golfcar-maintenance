# 🖼️ แก้ไขปัญหาการแสดงรูปภาพใน Production

## 📋 สรุปปัญหา

ปัญหาที่พบ: รูปภาพที่อัปโหลดใน Production แสดงผลผิดตำแหน่งหรือไม่แสดงผล

## 🔍 สาเหตุของปัญหา

1. **ไม่มีการตั้งค่า `NEXT_PUBLIC_BASE_URL`** ใน production environment
2. **การใช้ `localhost` ใน production** ทำให้ URL ของรูปภาพไม่ถูกต้อง
3. **การจำแนก External API และ Local Storage** ไม่ทำงานถูกต้องใน production

## ✅ วิธีแก้ไข

### 1. ตั้งค่า Environment Variables

ใน `.env.production` เพิ่ม:

```bash
# Application Base URL (⚠️ REQUIRED for image display)
NEXT_PUBLIC_BASE_URL="http://golfcar.go2kt.com:3000"

# Security Configuration
ALLOWED_ORIGINS="http://golfcar.go2kt.com:3000,http://golfcar.go2kt.com:8080"
```

### 2. อัปเดตโค้ดการตรวจสอบ URL

ในไฟล์ `app/api/upload/maintenance/route.ts` แก้ไข:

```typescript
// เดิม (ผิด)
const externalUploads = uploadedFiles.filter(url => !url.includes('localhost'));
const localFallbacks = uploadedFiles.filter(url => url.includes('localhost'));

// ใหม่ (ถูกต้อง)
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const localDomain = baseUrl.includes('localhost') ? 'localhost' : new URL(baseUrl).hostname;
const externalUploads = uploadedFiles.filter(url => !url.includes(localDomain));
const localFallbacks = uploadedFiles.filter(url => url.includes(localDomain));
```

### 3. ตรวจสอบ API Route สำหรับการเสิร์ฟไฟล์

ไฟล์ `app/api/uploads/maintenance/[filename]/route.ts` ต้องมีการตั้งค่าที่ถูกต้อง:

```typescript
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'maintenance');
```

### 4. อัปเดต Next.js Image Configuration

ใน `next.config.mjs` ตรวจสอบ:

```javascript
images: {
  domains: ['localhost', 'golfcar.go2kt.com'],
  formats: ['image/webp', 'image/avif'],
},
```

## 🚀 การ Deploy

### วิธีที่ 1: ใช้สคริปต์อัตโนมัติ

```bash
./deploy-production.sh
```

### วิธีที่ 2: Manual Deploy

```bash
# 1. ตรวจสอบ environment variables
cat .env.production

# 2. Build application
NODE_ENV=production npm run build

# 3. Start production server
NODE_ENV=production npm start

# หรือใช้ PM2
NODE_ENV=production pm2 start npm --name "golfcar-maintenance" -- start
```

## 🔧 การตรวจสอบหลัง Deploy

### 1. Health Check

```bash
curl http://golfcar.go2kt.com:3000/api/health
```

### 2. ทดสอบการอัปโหลดรูปภาพ

1. เข้าไปที่หน้าเพิ่มงานซ่อมบำรุง
2. อัปโหลดรูปภาพ
3. ตรวจสอบว่ารูปภาพแสดงผลถูกต้อง

### 3. ตรวจสอบ URL ของรูปภาพ

รูปภาพที่อัปโหลดควรมี URL ในรูปแบบ:
- **External API**: `http://golfcar.go2kt.com:8080/uploads/maintenance/filename.jpg`
- **Local Fallback**: `http://golfcar.go2kt.com:3000/api/uploads/maintenance/filename.jpg`

## 🐛 การแก้ไขปัญหาเพิ่มเติม

### ปัญหา: รูปภาพยังไม่แสดง

1. **ตรวจสอบ Console Logs**:
   ```bash
   pm2 logs golfcar-maintenance
   ```

2. **ตรวจสอบไฟล์ที่อัปโหลด**:
   ```bash
   ls -la public/uploads/maintenance/
   ```

3. **ทดสอบ API Route**:
   ```bash
   curl http://golfcar.go2kt.com:3000/api/uploads/maintenance/[filename]
   ```

### ปัญหา: CORS Error

ตรวจสอบ `ALLOWED_ORIGINS` ใน `.env.production`:
```bash
ALLOWED_ORIGINS="http://golfcar.go2kt.com:3000,http://golfcar.go2kt.com:8080"
```

### ปัญหา: External API ไม่ทำงาน

1. ตรวจสอบการเชื่อมต่อ External API:
   ```bash
   curl http://golfcar.go2kt.com:8080/api/health
   ```

2. ระบบจะใช้ Local Storage เป็น fallback อัตโนมัติ

## 📊 การ Monitor

### PM2 Commands

```bash
pm2 status              # ดูสถานะ
pm2 logs               # ดู logs
pm2 restart all        # restart application
pm2 stop all           # หยุด application
```

### Log Files

- Application logs: `pm2 logs`
- Error logs: ดูใน console เมื่อมีปัญหา

## 🎯 สรุป

การแก้ไขปัญหาการแสดงรูปภาพใน Production ต้องการ:

1. ✅ ตั้งค่า `NEXT_PUBLIC_BASE_URL` ใน `.env.production`
2. ✅ แก้ไขโค้ดการตรวจสอบ URL ใน upload route
3. ✅ ตรวจสอบ API route สำหรับการเสิร์ฟไฟล์
4. ✅ Deploy ด้วยการตั้งค่าที่ถูกต้อง
5. ✅ ทดสอบการทำงานหลัง deploy

หลังจากทำตามขั้นตอนเหล่านี้ รูปภาพควรแสดงผลถูกต้องใน Production แล้ว