# File Upload Fix for Standalone Server

## ปัญหาที่แก้ไข

### 1. ปัญหา "next start" ไม่ทำงานกับ "output: standalone"
- **อาการ**: เกิด warning `"next start" does not work with "output: standalone" configuration`
- **สาเหตุ**: การใช้ `next start` กับ standalone output ไม่ถูกต้อง
- **การแก้ไข**: เปลี่ยนเป็นใช้ `node .next/standalone/server.js`

### 2. ปัญหา 404 errors สำหรับไฟล์อัปโหลด
- **อาการ**: `upstream image response failed` กับ status 404
- **สาเหตุ**: ไม่มี API route สำหรับให้บริการไฟล์ที่อัปโหลดแล้ว
- **การแก้ไข**: สร้าง API routes ใหม่สำหรับให้บริการไฟล์

## ไฟล์ที่แก้ไข

### 1. package.json
```json
{
  "scripts": {
    "start": "node .next/standalone/server.js",
    "start:dev": "next start -p ${PORT:-8080}",
    "start:simple": "NODE_ENV=production node .next/standalone/server.js"
  }
}
```

### 2. start-server.sh
- เปลี่ยนจาก `npm start` เป็น `node .next/standalone/server.js`

### 3. stop-server.sh
- เพิ่มการค้นหา process `node .next/standalone/server.js`

### 4. deploy-simple.sh
- อัปเดตให้ใช้ `node .next/standalone/server.js`

## API Routes ใหม่

### 1. `/app/api/uploads/[...path]/route.ts`
- **วัตถุประสงค์**: ให้บริการไฟล์ที่อัปโหลดแล้วจาก local storage
- **รองรับ**: ไฟล์ทุกประเภทใน `/public/uploads/`
- **ความปลอดภัย**: ตรวจสอบ path traversal attacks
- **Cache**: Cache ไฟล์ 1 ปี

### 2. `/app/api/uploads/external/[...path]/route.ts`
- **วัตถุประสงค์**: Proxy ไฟล์จาก External API
- **รองรับ**: Multiple fallback URLs
- **Timeout**: 10 วินาที
- **Error handling**: จัดการ timeout และ network errors

## การปรับปรุง next.config.mjs

### เพิ่ม Rewrite Rules
```javascript
{
  source: '/api/uploads/external/:path*',
  destination: `${process.env.EXTERNAL_API_BASE_URL}/api/uploads/:path*`
}
```

## การปรับปรุง middleware.ts

### Image Proxy
- เปลี่ยนจาก redirect เป็น rewrite
- ใช้ `/api/proxy/images/` สำหรับ proxy images

## การทดสอบ

### 1. ทดสอบ Local File Serving
```bash
# อัปโหลดไฟล์ผ่าน API
curl -X POST http://localhost:8080/api/upload/maintenance \
  -F "files=@test-image.jpg"

# ทดสอบการเข้าถึงไฟล์
curl -I http://localhost:8080/api/uploads/maintenance/filename.jpg
```

### 2. ทดสอบ External API Proxy
```bash
# ทดสอบ external file proxy
curl -I http://localhost:8080/api/uploads/external/maintenance/filename.jpg
```

### 3. ทดสอบ Server Start
```bash
# ทดสอบ standalone server
node .next/standalone/server.js

# ตรวจสอบ process
ps aux | grep "node .next/standalone/server.js"
```

## URL Patterns

### Local Files
- **Pattern**: `http://domain:port/api/uploads/maintenance/filename.jpg`
- **Example**: `http://golfcar.go2kt.com:8080/api/uploads/maintenance/1755577795507-3cdc32be95d9-a55b37c1.jpg`

### External API Files
- **Pattern**: `http://domain:port/api/uploads/external/maintenance/filename.jpg`
- **Fallback URLs**:
  - `http://external-api:8080/api/uploads/maintenance/filename.jpg`
  - `http://external-api:8080/uploads/maintenance/filename.jpg`
  - `http://external-api:8080/maintenance/filename.jpg`

## การ Deploy

### 1. Build Application
```bash
npm run build:production
```

### 2. Start Server
```bash
# ใช้ script ใหม่
./deploy-simple.sh

# หรือ manual
node .next/standalone/server.js
```

### 3. ตรวจสอบ Status
```bash
# ตรวจสอบ health
curl http://localhost:8080/api/health

# ตรวจสอบ process
ps aux | grep server.js

# ตรวจสอบ port
lsof -i :8080
```

## Troubleshooting

### ปัญหา: ไฟล์ไม่แสดง (404)
1. ตรวจสอบว่าไฟล์อยู่ใน `/public/uploads/maintenance/`
2. ตรวจสอบ permissions ของไฟล์
3. ตรวจสอบ API route `/api/uploads/maintenance/filename.jpg`

### ปัญหา: External API ไม่ทำงาน
1. ตรวจสอบ `EXTERNAL_API_BASE_URL` ใน `.env.production`
2. ทดสอบ connectivity ไปยัง external API
3. ตรวจสอบ logs สำหรับ timeout errors

### ปัญหา: Server ไม่ start
1. ตรวจสอบว่า build เสร็จแล้ว: `ls -la .next/standalone/`
2. ตรวจสอบ environment variables
3. ตรวจสอบ port conflicts: `lsof -i :8080`

## สรุป

การแก้ไขนี้จะทำให้:
1. ✅ แก้ปัญหา "next start" warning
2. ✅ แก้ปัญหา 404 errors สำหรับไฟล์อัปโหลด
3. ✅ รองรับทั้ง local และ external file serving
4. ✅ ปรับปรุง error handling และ fallback mechanisms
5. ✅ อัปเดต deployment scripts ให้ทำงานถูกต้อง