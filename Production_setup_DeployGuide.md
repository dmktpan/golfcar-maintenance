# คู่มือเริ่มใช้งานระบบจริง (Production Setup Guide)

## 🌐 ขั้นตอนการ Deploy จาก Local PC ไปยัง Remote Server

### ขั้นที่ 1: เตรียมโค้ดใน Local PC
```bash
# 1. เพิ่มไฟล์ทั้งหมดใน Git
git add .

# 2. Commit การเปลี่ยนแปลง
git commit -m "Ready for production deployment"

# 3. Push ไปยัง Git repository
git push origin main
```

### ขั้นที่ 2: เชื่อมต่อ Remote Server
```bash
# SSH เข้าสู่ server (แทนที่ด้วย IP และ username ของคุณ)
ssh username@your-server-ip

# หรือถ้าใช้ key file
ssh -i /path/to/your-key.pem username@your-server-ip
```

### ขั้นที่ 3: Clone หรือ Pull โค้ดใน Server
```bash
# ถ้าเป็นครั้งแรก - Clone repository
git clone https://github.com/your-username/golfcar-maintenance.git
cd golfcar-maintenance

# ถ้ามีโฟลเดอร์อยู่แล้ว - Pull อัพเดท
cd golfcar-maintenance
git pull origin main
```

### ขั้นที่ 4: ติดตั้ง Dependencies
```bash
# ติดตั้ง Node.js packages
npm install

# ติดตั้ง PM2 (ถ้ายังไม่มี)
npm install -g pm2
```

### ขั้นที่ 5: ตั้งค่า Environment Variables
```bash
# คัดลอกไฟล์ .env.example เป็น .env.local
cp .env.example .env.local

# แก้ไขไฟล์ .env.local ให้ตรงกับ server
nano .env.local
```

**ตัวอย่างการตั้งค่า .env.local:**
```env
DATABASE_URL="mongodb://localhost:27017/golfcar_maintenance"
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif
UPLOAD_PATH=./public/uploads
API_RATE_LIMIT=100
API_TIMEOUT=30000
LOG_LEVEL=info
LOG_FILE=./logs/app.log
PORT=8080
```

### ขั้นที่ 6: ตั้งค่า MongoDB
```bash
# ตรวจสอบว่า MongoDB รันอยู่หรือไม่
sudo systemctl status mongod

# ถ้ายังไม่รัน ให้เริ่ม MongoDB
sudo systemctl start mongod

# ตั้งให้เริ่มอัตโนมัติเมื่อ server boot
sudo systemctl enable mongod
```

### ขั้นที่ 7: Generate Prisma Schema และ Push ไปยัง MongoDB
```bash
# Generate Prisma Client
npx prisma generate

# Push schema ไปยัง MongoDB
npx prisma db push

# ตรวจสอบการเชื่อมต่อ
npx prisma db pull
```

### ขั้นที่ 8: Build Application
```bash
# Build Next.js application
npm run build
```

## 🚀 ขั้นตอนการเตรียมระบบให้พร้อมใช้งาน

### 1. เลือกประเภทการ Deploy

#### Option A: Clean Production (แนะนำ) - ระบบสะอาดพร้อม Administrator
```bash
# ทำให้ script สามารถรันได้
chmod +x prepare-clean-production.sh

# รันสคริปต์เตรียมระบบแบบ clean
./prepare-clean-production.sh
```

#### Option B: Demo Data - ระบบพร้อมข้อมูลตัวอย่าง
```bash
# ทำให้ script สามารถรันได้
chmod +x prepare-production.sh

# รันสคริปต์เตรียมระบบพร้อมข้อมูล demo
./prepare-production.sh
```

### 2. เริ่มต้นระบบด้วย PM2
```bash
# เริ่มแอปพลิเคชันด้วย PM2
pm2 start npm --name golfcart-app -- run start

# บันทึกการตั้งค่า PM2
pm2 save

# ตั้งให้ PM2 เริ่มอัตโนมัติเมื่อ server restart
pm2 startup
```

### 3. ตรวจสอบสถานะ
```bash
# ตรวจสอบสถานะ PM2
pm2 status

# ตรวจสอบ logs
pm2 logs golfcart-app

# ทดสอบการเชื่อมต่อ
curl http://localhost:8080
```

### 4. เปิดเว็บไซต์

เมื่อระบบพร้อมใช้งานแล้ว สามารถเข้าใช้งานได้ที่:
- **URL**: http://localhost:8080 (หรือ domain ของคุณ)

#### สำหรับ Clean Production:
- **Administrator Account**:
  - Code: `admin000`
  - Name: `administrator`
  - Role: `admin`
  - สิทธิ์: จัดการระบบทั้งหมด

#### ขั้นตอนการใช้งานครั้งแรก (Clean Production):
1. เข้าสู่ระบบด้วย administrator account
2. เพิ่มสนามกอล์ฟของคุณ
3. สร้าง user accounts และกำหนด roles
4. ลงทะเบียนรถกอล์ฟ
5. เพิ่มคลังอะไหล่
6. เริ่มสร้างงานซ่อมบำรุง

### 5. ทดสอบระบบ

#### สำหรับ Clean Production:
```bash
# ทำให้ script สามารถรันได้
chmod +x test-clean-production.sh

# ทดสอบระบบ
./test-clean-production.sh
```

#### สำหรับ Demo Data:
```bash
# ทำให้ script สามารถรันได้
chmod +x test-api.sh

# ทดสอบระบบ
./test-api.sh
```