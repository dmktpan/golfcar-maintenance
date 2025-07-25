# คำสั่งสำคัญสำหรับการอัปเดต Server 🚀

## 📋 คำสั่งพื้นฐานที่ต้องจำ

### 🔄 การอัปเดตโค้ดแบบง่าย (ใน Server)
```bash
# เข้าโฟลเดอร์โปรเจกต์
cd golfcar-maintenance

# อัปเดตโค้ดและรีสตาร์ท (คำสั่งเดียวจบ)
./update-server.sh
```

### 📥 การอัปเดตแบบ Manual
```bash
# 1. Pull โค้ดใหม่
git pull origin main

# 2. ติดตั้ง dependencies
npm install

# 3. Generate Prisma
npx prisma generate

# 4. Build
npm run build

# 5. รีสตาร์ท
pm2 restart golfcart-app
```

### 🚀 การ Deploy ครั้งแรก (ใน Server)
```bash
# Clone โปรเจกต์
git clone https://github.com/your-username/golfcar-maintenance.git
cd golfcar-maintenance

# รันสคริปต์ deploy ครั้งแรก
./first-time-deploy.sh
```

## 🔧 คำสั่ง PM2 ที่สำคัญ

```bash
# ดูสถานะ
pm2 status

# ดู logs
pm2 logs golfcart-app

# รีสตาร์ท
pm2 restart golfcart-app

# หยุด
pm2 stop golfcart-app

# เริ่ม
pm2 start golfcart-app

# ลบ process
pm2 delete golfcart-app

# Monitor แบบ real-time
pm2 monit
```

## 🗄️ คำสั่ง Database

```bash
# ดูฐานข้อมูล
npm run db:studio

# อัปเดต schema
npx prisma db push

# Generate client
npx prisma generate
```

## 🌐 การทดสอบ

```bash
# ทดสอบการเชื่อมต่อ
curl http://localhost:8080

# ทดสอบ API
curl http://localhost:8080/api/users
```

## 📝 ขั้นตอนการอัปเดตแบบสั้น

### ใน Local PC:
```bash
git add .
git commit -m "Update message"
git push origin main
```

### ใน Server:
```bash
cd golfcar-maintenance
./update-server.sh
```

## 🚨 แก้ไขปัญหาเร่งด่วน

### แอปไม่ทำงาน:
```bash
pm2 restart golfcart-app
```

### แอปยังไม่ทำงาน:
```bash
pm2 delete golfcart-app
npm run build
pm2 start npm --name golfcart-app -- run start
```

### Database ไม่เชื่อมต่อ:
```bash
sudo systemctl restart mongod
npx prisma generate
pm2 restart golfcart-app
```

## 📞 ตรวจสอบสถานะระบบ

```bash
# ตรวจสอบ PM2
pm2 status

# ตรวจสอบ MongoDB
sudo systemctl status mongod

# ตรวจสอบ Port
lsof -i :8080

# ดู logs
pm2 logs golfcart-app --lines 50
```