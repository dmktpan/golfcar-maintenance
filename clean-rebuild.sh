#!/bin/bash

echo "🧹 เริ่มทำความสะอาดและ rebuild แอพพลิเคชัน..."

# หยุด server ที่กำลังรันอยู่ (ถ้ามี)
echo "⏹️  หยุด server ที่กำลังรันอยู่..."
pkill -f "next dev" || true
pkill -f "npm run dev" || true

# ลบ .next directory
echo "🗑️  ลบ .next directory..."
rm -rf .next

# ลบ node_modules
echo "🗑️  ลบ node_modules..."
rm -rf node_modules

# ลบ package-lock.json
echo "🗑️  ลบ package-lock.json..."
rm -f package-lock.json

# ลบ Prisma client ที่เก่า
echo "🗑️  ลบ Prisma client เก่า..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma

# ทำความสะอาด npm cache
echo "🧽 ทำความสะอาด npm cache..."
npm cache clean --force

# ติดตั้ง dependencies ใหม่
echo "📦 ติดตั้ง dependencies ใหม่..."
npm install

# สร้าง Prisma client ใหม่
echo "🔧 สร้าง Prisma client ใหม่..."
npx prisma generate

# ตรวจสอบการเชื่อมต่อ database
echo "🔍 ตรวจสอบการเชื่อมต่อ database..."
node -e "
const { prisma } = require('./lib/db/prisma');
prisma.\$connect()
  .then(() => {
    console.log('✅ เชื่อมต่อ database สำเร็จ');
    return prisma.\$disconnect();
  })
  .catch((error) => {
    console.error('❌ ไม่สามารถเชื่อมต่อ database:', error.message);
    process.exit(1);
  });
"

# Build แอพพลิเคชัน
echo "🏗️  Build แอพพลิเคชัน..."
npm run build

echo "✅ ทำความสะอาดและ rebuild เสร็จสิ้น!"
echo "🚀 สามารถเริ่ม server ด้วยคำสั่ง: npm run dev"