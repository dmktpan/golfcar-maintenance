# สรุปวิธีการ Deploy ใหม่ (ไม่ใช้ ecosystem.config.js)

เนื่องจากไฟล์ `ecosystem.config.js` ไม่ได้ถูก push ไปยัง server เอกสารนี้จะแสดงวิธีการ deploy ใหม่ที่ง่ายและไม่ต้องพึ่งพาไฟล์ดังกล่าว

## 🚀 วิธีการ Deploy แบบใหม่

### วิธีที่ 1: ใช้ Script อัตโนมัติ (แนะนำ)

```bash
# Deploy แบบง่าย (แนะนำ)
./deploy-simple.sh
```

Script นี้จะ:
- ตรวจสอบ `.env.production`
- สร้าง directories ที่จำเป็น
- Install dependencies
- Build application
- เลือกใช้ PM2 หรือ npm start
- ทำ health check

### วิธีที่ 2: ใช้ npm scripts

```bash
# Build และ deploy ในคำสั่งเดียว
npm run deploy:simple

# หรือทำทีละขั้นตอน
npm run build:production
npm run server:start
```

### วิธีที่ 3: Manual Deploy

```bash
# 1. Build application
NODE_ENV=production npm run build

# 2. Start server
./start-server.sh

# 3. Stop server (เมื่อต้องการ)
./stop-server.sh
```

## 📋 npm Scripts ใหม่ที่เพิ่มเข้ามา

| Script | คำอธิบาย |
|--------|----------|
| `npm run build:production` | Build สำหรับ production |
| `npm run start:simple` | Start server แบบง่าย |
| `npm run deploy:simple` | Build + Start ในคำสั่งเดียว |
| `npm run server:start` | Start server ด้วย script |
| `npm run server:stop` | Stop server ด้วย script |

## 📁 ไฟล์ใหม่ที่สร้างขึ้น

### 1. `deploy-simple.sh`
- Script หลักสำหรับ deploy
- รองรับทั้ง PM2 และ npm start
- มี health check และ error handling

### 2. `start-server.sh`
- Start server แบบง่าย
- สร้าง PID file สำหรับจัดการ process
- มี health check

### 3. `stop-server.sh`
- Stop server อย่างปลอดภัย
- ลบ PID file
- ตรวจสอบ port ว่าว่างแล้ว

### 4. `DEPLOY-WITHOUT-ECOSYSTEM.md`
- คู่มือการ deploy แบบละเอียด
- รวมวิธีการใช้ Docker
- มี troubleshooting guide

## 🔧 การใช้งาน

### การ Deploy ครั้งแรก

```bash
# 1. ตรวจสอบว่ามี .env.production
ls -la .env.production

# 2. Deploy
./deploy-simple.sh

# 3. ตรวจสอบสถานะ
curl http://localhost:8080/api/health
```

### การจัดการ Server

```bash
# Start server
./start-server.sh
# หรือ
npm run server:start

# Stop server
./stop-server.sh
# หรือ
npm run server:stop

# ดู logs
tail -f logs/app.log

# ตรวจสอบ process
ps aux | grep node
```

### การใช้ PM2 (ถ้ามี)

```bash
# ถ้าเลือกใช้ PM2 ใน deploy-simple.sh
pm2 status
pm2 logs golfcart-app
pm2 restart golfcart-app
pm2 stop golfcart-app
```

## 🌐 URL และ Endpoints

- **Application**: http://golfcar.go2kt.com:8080
- **Health Check**: http://golfcar.go2kt.com:8080/api/health
- **Local Health Check**: http://localhost:8080/api/health

## 📊 การตรวจสอบสถานะ

### ตรวจสอบว่า Server ทำงาน

```bash
# ตรวจสอบ process
ps aux | grep node

# ตรวจสอบ port
lsof -i :8080

# ตรวจสอบ health
curl http://localhost:8080/api/health

# ดู logs
tail -f logs/app.log
```

### ตรวจสอบ PID file

```bash
# ดู PID ปัจจุบัน
cat server.pid

# ตรวจสอบว่า process ยังทำงานอยู่
kill -0 $(cat server.pid) && echo "Running" || echo "Not running"
```

## 🔧 การแก้ไขปัญหา

### ปัญหา Port ถูกใช้แล้ว

```bash
# หา process ที่ใช้ port 8080
lsof -i :8080

# Kill process
kill -9 <PID>

# หรือ kill ทุก process ที่ใช้ port 8080
lsof -ti :8080 | xargs kill -9
```

### ปัญหา Permission

```bash
# ให้สิทธิ์ execute scripts
chmod +x *.sh

# ให้สิทธิ์ upload directory
chmod -R 755 public/uploads
```

### ปัญหา Build Failed

```bash
# ลบ .next และ build ใหม่
rm -rf .next
npm run build:production
```

### ปัญหา Environment Variables

```bash
# ตรวจสอบ .env.production
cat .env.production

# ตรวจสอบว่า variables ถูก load
node -e "require('dotenv').config({path: '.env.production'}); console.log(process.env.NODE_ENV)"
```

## 📝 ข้อแตกต่างจากวิธีเดิม

| เดิม (ecosystem.config.js) | ใหม่ (scripts) |
|---------------------------|----------------|
| ต้องมี ecosystem.config.js | ไม่ต้องมี config file |
| ใช้ PM2 เท่านั้น | เลือกได้ PM2 หรือ npm start |
| ซับซ้อน | ง่ายและเข้าใจง่าย |
| ต้อง push config file | ใช้ scripts ใน package.json |

## ✅ ข้อดีของวิธีใหม่

1. **ไม่ต้องพึ่งพา ecosystem.config.js**
2. **ง่ายต่อการใช้งาน**
3. **มี error handling ที่ดี**
4. **รองรับทั้ง PM2 และ npm start**
5. **มี health check อัตโนมัติ**
6. **มี logging ที่ชัดเจน**
7. **ง่ายต่อการ debug**

## 🎯 แนะนำ

**สำหรับ Production Server ขนาดเล็ก**: ใช้ `./deploy-simple.sh` และเลือก npm start

**สำหรับ Production Server ที่ต้องการความเสถียร**: ใช้ `./deploy-simple.sh` และเลือก PM2

**สำหรับ Development/Testing**: ใช้ `npm run deploy:simple`

---

**หมายเหตุ**: วิธีการใหม่นี้จะทำให้การ deploy ง่ายขึ้นและไม่ต้องพึ่งพาไฟล์ ecosystem.config.js ที่อาจจะไม่ได้ถูก push ไปยัง server