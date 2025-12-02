#!/bin/bash

# Script to copy static files to standalone directory after Next.js build
# This ensures that static assets are available in production standalone mode

echo "🔄 Copying static files to standalone directory..."

# Check if standalone directory exists
if [ ! -d ".next/standalone" ]; then
    echo "❌ Error: .next/standalone directory not found. Make sure you've run 'npm run build' first."
    exit 1
fi

# Create .next directory in standalone if it doesn't exist
mkdir -p .next/standalone/.next

# Copy static files
if [ -d ".next/static" ]; then
    echo "📁 Copying .next/static to standalone..."
    cp -r .next/static .next/standalone/.next/
    echo "✅ Static files copied successfully"
else
    echo "⚠️  Warning: .next/static directory not found"
fi

# Copy public files
if [ -d "public" ]; then
    echo "📁 Copying public directory to standalone..."
    
    # 1. Copy ทุกอย่างใน public ไปก่อน (แต่ยกเว้น uploads/maintenance ถ้าทำได้ แต่ cp -r มันแยกยาก)
    cp -r public .next/standalone/
    
    # 2. ลบโฟลเดอร์ maintenance ที่เพิ่ง copy ไป (เพราะเราไม่อยากได้สำเนา)
    rm -rf .next/standalone/public/uploads/maintenance
    
    # 3. สร้าง Symlink ชี้กลับมาที่โฟลเดอร์จริง (ที่เรา Mount ไว้)
    # หมายเหตุ: ใช้ path เต็ม (/home/...) หรือ path สัมพัทธ์ก็ได้ แต่ path เต็มชัวร์สุด
    ln -s /home/administrator/golfcar-maintenance/public/uploads/maintenance .next/standalone/public/uploads/maintenance
    
    echo "✅ Public files copied and Symlink created successfully"
else
    echo "⚠️  Warning: public directory not found"
fi

echo "🎉 Static files copy completed!"
echo "💡 You can now deploy the .next/standalone directory"