# คู่มือเริ่มใช้งานระบบจริง (Production Setup Guide)

## 🚀 ขั้นตอนการเตรียมระบบให้พร้อมใช้งาน

### 1. ล้างข้อมูล Demo และเตรียมระบบ
```bash
./prepare-production.sh
```

### 2. เริ่มต้นระบบ
```bash
pm2 start npm --name golfcart-app -- run start
```

### 3. เปิดเว็บไซต์
```
http://localhost:8080
```

## 📋 ขั้นตอนการใส่ข้อมูลเริ่มต้น (ตามลำดับ)

### ขั้นที่ 1: เพิ่มสนามกอล์ฟ
1. เข้าเมนู **Admin Management**
2. เลือก **Golf Course Management**
3. กดปุ่ม **Add Golf Course**
4. ใส่ชื่อสนามกอล์ฟ เช่น "สนามกอล์ฟ ABC"

### ขั้นที่ 2: เพิ่มผู้ใช้งาน
1. เข้าเมนู **Admin Management**
2. เลือก **Manage Users**
3. กดปุ่ม **Add User**
4. ใส่ข้อมูล:
   - **รหัสพนักงาน**: เช่น EMP001
   - **ชื่อ**: เช่น นายสมชาย ใจดี
   - **บทบาท**: เลือก staff/supervisor/admin
   - **สนามกอล์ฟ**: เลือกสนามที่สร้างไว้

### ขั้นที่ 3: เพิ่มรถกอล์ฟ
1. เข้าเมนู **Admin Management**
2. เลือก **Vehicle Management** (หรือจากหน้าหลัก)
3. กดปุ่ม **Add Vehicle**
4. ใส่ข้อมูล:
   - **Serial Number**: เช่น GC001
   - **Vehicle Number**: เช่น 001
   - **สนามกอล์ฟ**: เลือกสนาม
   - **รุ่น**: เช่น Club Car
   - **Battery Serial**: เช่น BAT001

### ขั้นที่ 4: เพิ่มอะไหล่
1. เข้าเมนู **Admin Management**
2. เลือก **Parts Management**
3. กดปุ่ม **Add Part**
4. ใส่ข้อมูล:
   - **ชื่ออะไหล่**: เช่น แบตเตอรี่ 12V
   - **หน่วย**: เช่น ชิ้น
   - **จำนวนคงคลัง**: เช่น 10
   - **จำนวนขั้นต่ำ**: เช่น 2
   - **จำนวนสูงสุด**: เช่น 50

### ขั้นที่ 5: เริ่มสร้างงานซ่อมบำรุง
1. เข้าเมนู **Create Job**
2. เลือกประเภทงาน:
   - **PM** (Preventive Maintenance): งานซ่อมบำรุงเชิงป้องกัน
   - **BM** (Breakdown Maintenance): งานซ่อมแซมเมื่อเสีย
   - **Recondition**: งานปรับปรุงสภาพ
3. ใส่รายละเอียดงาน

## 🔧 คำสั่งที่มีประโยชน์

### ดูฐานข้อมูล
```bash
npm run db:studio
```

### ตรวจสอบสถานะแอป
```bash
pm2 status
```

### ดู logs
```bash
pm2 logs golfcart-app
```

### รีสตาร์ทแอป
```bash
pm2 restart golfcart-app
```

### หยุดแอป
```bash
pm2 stop golfcart-app
```

## 🎯 บทบาทผู้ใช้งาน

### Admin
- จัดการสนามกอล์ฟ
- จัดการผู้ใช้งาน
- จัดการรถกอล์ฟ
- จัดการอะไหล่
- ดูรายงานทั้งหมด

### Supervisor
- มอบหมายงานให้พนักงาน
- ตรวจสอบงานที่รอดำเนินการ
- อนุมัติงานที่เสร็จสิ้น
- ดูรายงานในสนามที่รับผิดชอบ

### Staff
- รับงานที่ได้รับมอบหมาย
- อัพเดทสถานะงาน
- บันทึกการใช้อะไหล่
- อัพโหลดรูปภาพ

## 🚨 ข้อควรระวัง

1. **MongoDB Standalone**: ระบบใช้ MongoDB แบบ standalone ไม่ใช่ replica set
2. **ไม่ใช้ deleteMany**: หลีกเลี่ยงการใช้ `deleteMany()` ใน Prisma
3. **Backup**: สำรองข้อมูลเป็นประจำ
4. **File Uploads**: ตรวจสอบพื้นที่ในโฟลเดอร์ `public/uploads`

## 📞 การแก้ไขปัญหา

### ถ้าแอปไม่เริ่มต้น
```bash
pm2 delete golfcart-app
npm run build
pm2 start npm --name golfcart-app -- run start
```

### ถ้าฐานข้อมูลมีปัญหา
```bash
npx prisma generate
npx prisma db push
```

### ล้างข้อมูลทั้งหมด (ระวัง!)
```bash
curl -X POST http://localhost:8080/api/clear-data
```