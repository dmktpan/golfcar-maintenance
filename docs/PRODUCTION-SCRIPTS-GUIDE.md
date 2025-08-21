# Production Scripts Guide

## การใช้งานสคริปสำหรับ Production

ไฟล์นี้อธิบายการใช้งานสคริปต่าง ๆ ที่ได้ปรับปรุงให้สอดคล้องกับ `ecosystem.config.js`

## สคริปหลักใน package.json

### การ Build และ Start
```bash
# Build application
npm run build

# Start server (ใช้ next start ธรรมดา)
npm start

# Start development server
npm run dev
```

### การใช้งาน PM2 (แนะนำสำหรับ production)
```bash
# Deploy และ start ด้วย PM2 (วิธีหลัก)
npm run deploy

# จัดการ PM2 processes
npm run pm2:start     # เริ่ม PM2
npm run pm2:stop      # หยุด PM2
npm run pm2:restart   # รีสตาร์ท PM2
npm run pm2:logs      # ดู logs
npm run pm2:status    # ตรวจสอบสถานะ
```

## การตั้งค่า Environment

### ไฟล์ที่จำเป็น
- `.env.production` - environment variables สำหรับ production
- `ecosystem.config.js` - การตั้งค่า PM2

### ตัวอย่าง .env.production
```env
NODE_ENV=production
PORT=8080
EXTERNAL_API_BASE_URL=http://golfcar.go2kt.com:8080
NEXT_PUBLIC_BASE_URL=http://golfcar.go2kt.com:8080
DATABASE_URL="your_database_url"
```

## วิธีการ Deploy

### วิธีที่ 1: ใช้ PM2 (แนะนำ)
```bash
# 1. Deploy แบบ one-command (build + start)
npm run deploy

# 2. ตรวจสอบสถานะ
npm run pm2:status

# 3. ดู logs
npm run pm2:logs
```

### วิธีที่ 2: Manual Step-by-Step
```bash
# 1. Build application
npm run build

# 2. Start ด้วย PM2
npm run pm2:start

# 3. ตรวจสอบสถานะ
npm run pm2:status
```

### วิธีที่ 3: Development
```bash
# 1. Start development server
npm run dev
```

## การตรวจสอบและ Troubleshooting

### ตรวจสอบสถานะ
```bash
# ตรวจสอบ PM2
npm run pm2:status

# ตรวจสอบ port
lsof -i :8080

# ตรวจสอบ process
ps aux | grep node
```

### ดู Logs
```bash
# PM2 logs
npm run pm2:logs

# Shell script logs
tail -f logs/app.log

# PM2 log files
tail -f logs/combined.log
tail -f logs/err.log
tail -f logs/out.log
```

### Health Check
```bash
# ตรวจสอบ API
curl http://localhost:8080/api/health

# ตรวจสอบ web interface
curl http://localhost:8080
```

## ข้อแตกต่างระหว่างวิธีการ

| วิธีการ | ข้อดี | ข้อเสีย | เหมาะสำหรับ |
|---------|-------|---------|-------------|
| PM2 (npm run deploy) | Auto-restart, Monitoring, One-command deploy | ต้องติดตั้ง PM2 | Production Server |
| Manual Step-by-Step | ควบคุมได้ทีละขั้นตอน | ต้องรันหลายคำสั่ง | Testing, Debugging |
| Development (npm run dev) | Hot reload, Fast development | ไม่เหมาะสำหรับ production | Development |

## คำแนะนำ

1. **สำหรับ Production Server**: ใช้ `npm run deploy` (build + PM2 start)
2. **สำหรับ Development**: ใช้ `npm run dev`
3. **สำหรับ Testing**: ใช้ Manual step-by-step
4. **สำหรับ Debugging**: ใช้ `npm run pm2:logs` เพื่อดู logs

## การอัพเดท

เมื่อมีการเปลี่ยนแปลงโค้ด:

```bash
# หยุด server
npm run pm2:stop

# Pull โค้ดใหม่
git pull

# Install dependencies (ถ้ามี)
npm install

# Deploy ใหม่ (build + start)
npm run deploy

# ตรวจสอบสถานะ
npm run pm2:status
```

### หรือใช้คำสั่งเดียว (Quick Update)
```bash
# Restart และ deploy ใหม่
npm run pm2:restart
```