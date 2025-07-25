# คู่มือการอัปเดตโค้ดเข้า Server 🚀

## 📋 ขั้นตอนการอัปเดตโค้ดจาก Local ไปยัง Server

### ขั้นที่ 1: เตรียมโค้ดใน Local PC 💻

```bash
# 1. ตรวจสอบสถานะไฟล์ที่เปลี่ยนแปลง
git status

# 2. เพิ่มไฟล์ทั้งหมดที่เปลี่ยนแปลง
git add .

# 3. Commit การเปลี่ยนแปลงพร้อมข้อความอธิบาย
git commit -m "Update: [อธิบายการเปลี่ยนแปลง]"

# 4. Push ไปยัง Git repository
git push origin main
```

### ขั้นที่ 2: เชื่อมต่อ Server 🌐

```bash
# SSH เข้าสู่ server (แทนที่ด้วย IP และ username ของคุณ)
ssh username@192.168.1.54

# หรือถ้าใช้ key file
ssh -i /path/to/your-key.pem username@192.168.1.54
```

### ขั้นที่ 3: อัปเดตโค้ดใน Server 📥

```bash
# เข้าไปยังโฟลเดอร์โปรเจกต์
cd golfcar-maintenance

# Pull โค้ดใหม่จาก Git
git pull origin main

# ติดตั้ง dependencies ใหม่ (ถ้ามี)
npm install

# Generate Prisma client ใหม่
npx prisma generate

# Build application ใหม่
npm run build
```

### ขั้นที่ 4: รีสตาร์ทแอปพลิเคชัน 🔄

```bash
# หยุดแอปพลิเคชันที่รันอยู่
pm2 stop golfcart-app

# เริ่มแอปพลิเคชันใหม่
pm2 start golfcart-app

# หรือรีสตาร์ทแบบเดียว
pm2 restart golfcart-app
```

### ขั้นที่ 5: ตรวจสอบการทำงาน ✅

```bash
# ตรวจสอบสถานะ PM2
pm2 status

# ดู logs เพื่อตรวจสอบ error
pm2 logs golfcart-app

# ทดสอบการเชื่อมต่อ
curl http://localhost:8080
```

## 🚀 สคริปต์อัปเดตอัตโนมัติ

### สร้างสคริปต์อัปเดตง่ายๆ

สร้างไฟล์ `update-server.sh`:

```bash
#!/bin/bash
echo "🚀 Starting server update..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build application
echo "🔨 Building application..."
npm run build

# Restart application
echo "🔄 Restarting application..."
pm2 restart golfcart-app

# Check status
echo "✅ Checking application status..."
pm2 status

echo "🎉 Update completed successfully!"
echo "🌐 Application is running at: http://192.168.1.54:8080"
```

### วิธีใช้สคริปต์:

```bash
# ทำให้สคริปต์สามารถรันได้
chmod +x update-server.sh

# รันสคริปต์
./update-server.sh
```

## 🔧 คำสั่งที่มีประโยชน์

### ตรวจสอบสถานะ
```bash
# ดูสถานะ PM2
pm2 status

# ดู logs แบบ real-time
pm2 logs golfcart-app --lines 50

# ดูการใช้ memory และ CPU
pm2 monit
```

### จัดการ PM2
```bash
# รีสตาร์ทแอป
pm2 restart golfcart-app

# หยุดแอป
pm2 stop golfcart-app

# เริ่มแอป
pm2 start golfcart-app

# ลบแอปออกจาก PM2
pm2 delete golfcart-app
```

### ตรวจสอบฐานข้อมูล
```bash
# เปิด Prisma Studio
npm run db:studio

# ตรวจสอบ schema
npx prisma db pull
```

## 🚨 การแก้ไขปัญหาที่พบบ่อย

### ปัญหา: แอปไม่เริ่มต้น
```bash
# ลบ PM2 process เก่า
pm2 delete golfcart-app

# Build ใหม่
npm run build

# เริ่มใหม่
pm2 start npm --name golfcart-app -- run start
```

### ปัญหา: Database connection error
```bash
# ตรวจสอบ MongoDB
sudo systemctl status mongod

# รีสตาร์ท MongoDB
sudo systemctl restart mongod

# Generate Prisma client ใหม่
npx prisma generate
npx prisma db push
```

### ปัญหา: Port ถูกใช้งาน
```bash
# หา process ที่ใช้ port 8080
lsof -i :8080

# ฆ่า process (แทนที่ PID ด้วยเลขที่ได้)
kill -9 PID
```

## 📝 Checklist การอัปเดต

- [ ] Commit และ push โค้ดใน local
- [ ] SSH เข้า server
- [ ] Pull โค้ดใหม่
- [ ] npm install
- [ ] npx prisma generate
- [ ] npm run build
- [ ] pm2 restart golfcart-app
- [ ] ตรวจสอบ pm2 status
- [ ] ทดสอบเว็บไซต์ที่ http://192.168.1.54:8080

## 🎯 Tips สำหรับการอัปเดตที่ปลอดภัย

1. **Backup ก่อนอัปเดต**: สำรองฐานข้อมูลก่อนอัปเดตใหญ่
2. **ทดสอบใน Local**: ทดสอบให้แน่ใจว่าโค้ดทำงานใน local ก่อน
3. **อัปเดตในเวลาที่เหมาะสม**: หลีกเลี่ยงเวลาที่มีผู้ใช้งานเยอะ
4. **ตรวจสอบ logs**: ดู logs หลังอัปเดตเพื่อตรวจสอบ error
5. **มี rollback plan**: เตรียมแผนย้อนกลับถ้ามีปัญหา

## 📞 ติดต่อสำหรับความช่วยเหลือ

หากพบปัญหาในการอัปเดต สามารถ:
1. ตรวจสอบ logs: `pm2 logs golfcart-app`
2. ดูสถานะ: `pm2 status`
3. ตรวจสอบ MongoDB: `sudo systemctl status mongod`