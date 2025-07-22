# 🧪 Prisma + MongoDB Test Guide

## การตั้งค่าเบื้องต้น

### 1. ติดตั้ง MongoDB
```bash
# macOS (ใช้ Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# เริ่ม MongoDB service
brew services start mongodb-community

# หรือเริ่มแบบ manual
mongod --config /usr/local/etc/mongod.conf
```

### 2. ตั้งค่า Environment Variables
```bash
# คัดลอกไฟล์ตัวอย่าง
cp .env.example .env.local

# แก้ไข DATABASE_URL ใน .env.local
DATABASE_URL="mongodb://localhost:27017/golfcar-maintenance"

# สำหรับ MongoDB Atlas
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/golfcar-maintenance"
```

### 3. Setup Prisma
```bash
# ใช้สคริปต์ setup อัตโนมัติ
./setup-prisma.sh

# หรือทำแบบ manual
npm install
npx prisma generate
npx prisma db push
```

## การทดสอบ

### 1. ทดสอบผ่าน Web Interface
เปิดเบราว์เซอร์และไปที่:
```
http://localhost:3001/test-prisma
```

### 2. ทดสอบผ่าน API Endpoints

#### Basic Database Connection
```bash
curl http://localhost:3001/api/test-db
```

#### Model Tests
```bash
# User Model
curl http://localhost:3001/api/test-prisma/users

# Golf Course Model  
curl http://localhost:3001/api/test-prisma/golf-courses

# Vehicle Model
curl http://localhost:3001/api/test-prisma/vehicles

# Job Model
curl http://localhost:3001/api/test-prisma/jobs

# Parts Model
curl http://localhost:3001/api/test-prisma/parts

# CRUD Operations
curl http://localhost:3001/api/test-prisma/crud
```

### 3. ทดสอบผ่าน Prisma Studio
```bash
npx prisma studio
```

## การแก้ไขปัญหา

### ปัญหาการเชื่อมต่อ MongoDB
1. ตรวจสอบว่า MongoDB service ทำงานอยู่:
   ```bash
   brew services list | grep mongodb
   ```

2. ตรวจสอบ connection string ใน `.env.local`

3. ตรวจสอบ firewall และ network settings

### ปัญหา Prisma Schema
1. Re-generate Prisma client:
   ```bash
   npx prisma generate
   ```

2. Push schema ใหม่:
   ```bash
   npx prisma db push
   ```

3. Reset database (ระวัง: จะลบข้อมูลทั้งหมด):
   ```bash
   npx prisma db push --force-reset
   ```

## คำสั่งที่มีประโยชน์

```bash
# เริ่ม development server
npm run dev

# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Open Prisma Studio
npx prisma studio

# View database schema
npx prisma db pull

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

## โครงสร้างการทดสอบ

```
app/
├── test-prisma/           # หน้าทดสอบหลัก
│   ├── page.tsx
│   └── page.module.css
└── api/
    ├── test-db/           # ทดสอบการเชื่อมต่อพื้นฐาน
    │   └── route.ts
    └── test-prisma/       # ทดสอบแต่ละ model
        ├── users/
        ├── golf-courses/
        ├── vehicles/
        ├── jobs/
        ├── parts/
        └── crud/
```

## การ Deploy

### MongoDB Atlas (Production)
1. สร้าง cluster ใน MongoDB Atlas
2. อัปเดต DATABASE_URL ใน production environment
3. ตั้งค่า IP whitelist
4. ใช้ connection string ที่มี SSL

### Vercel Deployment
```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# Deploy
vercel

# ตั้งค่า environment variables
vercel env add DATABASE_URL
```

## Performance Tips

1. **Indexing**: สร้าง index สำหรับ fields ที่ค้นหาบ่อย
2. **Connection Pooling**: ใช้ connection pooling สำหรับ production
3. **Query Optimization**: ใช้ `select` เพื่อเลือกเฉพาะ fields ที่ต้องการ
4. **Pagination**: ใช้ `take` และ `skip` สำหรับข้อมูลจำนวนมาก

## Security Best Practices

1. ใช้ environment variables สำหรับ sensitive data
2. ตั้งค่า IP whitelist ใน MongoDB Atlas
3. ใช้ SSL/TLS สำหรับ production
4. Validate input data ก่อนส่งไปยัง database
5. ใช้ Prisma's built-in SQL injection protection