#!/bin/bash

# PM2 Server Management Script
# สคริปต์สำหรับจัดการ server ด้วย PM2

echo "🔄 เริ่มต้นการจัดการ PM2 Server..."

# ตรวจสอบว่า PM2 ติดตั้งแล้วหรือไม่
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 ยังไม่ได้ติดตั้ง กำลังติดตั้ง..."
    npm install -g pm2
    echo "✅ ติดตั้ง PM2 เสร็จสิ้น"
fi

echo "📋 แสดงสถานะ PM2 ปัจจุบัน:"
pm2 list

echo ""
echo "🛑 หยุด PM2 processes ทั้งหมด..."
pm2 stop all

echo ""
echo "🗑️  ลบ PM2 processes ทั้งหมด..."
pm2 delete all

echo ""
echo "🧹 ทำความสะอาด PM2 logs..."
pm2 flush

echo ""
echo "🔧 ทำความสะอาดและ rebuild แอปพลิเคชัน..."

# ลบ .next และ node_modules
echo "   - ลบ .next directory..."
rm -rf .next

echo "   - ลบ node_modules..."
rm -rf node_modules

echo "   - ลบ package-lock.json..."
rm -f package-lock.json

echo "   - ทำความสะอาด npm cache..."
npm cache clean --force

echo ""
echo "📦 ติดตั้ง dependencies ใหม่..."
npm install

echo ""
echo "🏗️  Build แอปพลิเคชัน..."
npm run build

echo ""
echo "🚀 เริ่ม server ด้วย PM2..."

# สร้าง ecosystem.config.js ถ้ายังไม่มี
if [ ! -f "ecosystem.config.js" ]; then
    echo "📝 สร้างไฟล์ ecosystem.config.js..."
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'golfcar-maintenance',
    script: 'npm',
    args: 'start',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF
fi

# สร้าง logs directory ถ้ายังไม่มี
mkdir -p logs

echo ""
echo "🎯 เริ่ม application ด้วย PM2..."
pm2 start ecosystem.config.js

echo ""
echo "💾 บันทึกการตั้งค่า PM2..."
pm2 save

echo ""
echo "⚙️  ตั้งค่า PM2 startup (auto-start on boot)..."
pm2 startup

echo ""
echo "📊 แสดงสถานะ PM2 หลังเริ่มงาน:"
pm2 list

echo ""
echo "📝 แสดง logs แบบ real-time (กด Ctrl+C เพื่อออก):"
echo "   คำสั่งดู logs: pm2 logs golfcar-maintenance"
echo "   คำสั่งดู status: pm2 status"
echo "   คำสั่งรีสตาร์ท: pm2 restart golfcar-maintenance"
echo "   คำสั่งหยุด: pm2 stop golfcar-maintenance"

echo ""
echo "✅ PM2 Server Management เสร็จสิ้น!"
echo "🌐 แอปพลิเคชันควรทำงานที่: http://localhost:8080"

# แสดง logs สำหรับ 10 วินาทีแรก
echo ""
echo "📋 แสดง logs เริ่มต้น (10 วินาที)..."
timeout 10 pm2 logs golfcar-maintenance --lines 20 || true

echo ""
echo "🎉 เสร็จสิ้น! ใช้คำสั่ง 'pm2 logs golfcar-maintenance' เพื่อดู logs ต่อ"