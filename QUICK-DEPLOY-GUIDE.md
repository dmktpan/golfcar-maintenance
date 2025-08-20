# 🚀 คู่มือ Deploy ด่วน (ไม่ใช้ ecosystem.config.js)

## ⚡ Deploy ในคำสั่งเดียว

```bash
./deploy-simple.sh
```

**หรือ**

```bash
npm run deploy:simple
```

## 📋 ขั้นตอนการ Deploy

### 1. ตรวจสอบไฟล์ที่จำเป็น

```bash
# ตรวจสอบว่ามี .env.production
ls -la .env.production

# ถ้าไม่มี ให้ copy จาก .env.production.example
cp .env.production.example .env.production
```

### 2. Deploy Application

```bash
# วิธีที่ 1: ใช้ script อัตโนมัติ (แนะนำ)
./deploy-simple.sh

# วิธีที่ 2: ใช้ npm script
npm run deploy:simple

# วิธีที่ 3: ทำทีละขั้นตอน
npm run build:production
./start-server.sh
```

### 3. ตรวจสอบการทำงาน

```bash
# ตรวจสอบ health
curl http://localhost:8080/api/health

# ดู logs
tail -f logs/app.log

# ตรวจสอบ process
ps aux | grep node
```

## 🎛️ การจัดการ Server

### Start Server

```bash
./start-server.sh
# หรือ
npm run server:start
```

### Stop Server

```bash
./stop-server.sh
# หรือ
npm run server:stop
```

### Restart Server

```bash
./stop-server.sh && ./start-server.sh
```

## 📊 การตรวจสอบสถานะ

### ตรวจสอบว่า Server ทำงาน

```bash
# วิธีที่ 1: Health check
curl http://localhost:8080/api/health

# วิธีที่ 2: ตรวจสอบ process
ps aux | grep node

# วิธีที่ 3: ตรวจสอบ port
lsof -i :8080

# วิธีที่ 4: ตรวจสอบ PID
cat server.pid && kill -0 $(cat server.pid) && echo " - Running" || echo " - Not running"
```

### ดู Logs

```bash
# ดู logs แบบ real-time
tail -f logs/app.log

# ดู logs ล่าสุด 50 บรรทัด
tail -n 50 logs/app.log

# ค้นหา error ใน logs
grep -i error logs/app.log
```

## 🔧 การแก้ไขปัญหาด่วน

### ปัญหา: Port 8080 ถูกใช้แล้ว

```bash
# หา process ที่ใช้ port
lsof -i :8080

# Kill process
kill -9 <PID>

# หรือ kill ทุก process ที่ใช้ port 8080
lsof -ti :8080 | xargs kill -9
```

### ปัญหา: Permission denied

```bash
# ให้สิทธิ์ execute scripts
chmod +x *.sh

# ให้สิทธิ์ upload directory
chmod -R 755 public/uploads
```

### ปัญหา: Build failed

```bash
# ลบ cache และ build ใหม่
rm -rf .next node_modules
npm install
npm run build:production
```

### ปัญหา: Server ไม่ start

```bash
# ตรวจสอบ logs
tail -f logs/app.log

# ตรวจสอบ .env.production
cat .env.production

# ตรวจสอบว่า build สำเร็จ
ls -la .next
```

## 🌐 URLs สำคัญ

- **Application**: http://golfcar.go2kt.com:8080
- **Health Check**: http://golfcar.go2kt.com:8080/api/health
- **Local Health**: http://localhost:8080/api/health

## 📱 คำสั่งที่ใช้บ่อย

```bash
# Deploy ใหม่
./deploy-simple.sh

# ดูสถานะ
curl http://localhost:8080/api/health

# ดู logs
tail -f logs/app.log

# Stop server
./stop-server.sh

# Start server
./start-server.sh

# ตรวจสอบ process
ps aux | grep node

# ตรวจสอบ port
lsof -i :8080
```

## 🎯 Tips

1. **ใช้ `./deploy-simple.sh` สำหรับ deploy ครั้งแรก**
2. **ใช้ `./start-server.sh` และ `./stop-server.sh` สำหรับจัดการ server**
3. **ตรวจสอบ logs เสมอหากมีปัญหา: `tail -f logs/app.log`**
4. **ใช้ health check เพื่อตรวจสอบว่า server ทำงาน: `curl http://localhost:8080/api/health`**
5. **หาก port 8080 ถูกใช้ ให้ kill process ก่อน: `lsof -ti :8080 | xargs kill -9`**

---

**🎉 เสร็จแล้ว! Server ควรจะทำงานที่ http://golfcar.go2kt.com:8080**