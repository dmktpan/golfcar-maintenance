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
    
    # 1. Copy ทุกอย่างใน public ไปก่อน
    cp -r public .next/standalone/
    
    # 2. ลบโฟลเดอร์ uploads ทั้งหมดที่เพิ่ง copy ไป (เพราะเราไม่อยากได้สำเนาที่เสี่ยงต่อการโดน overwrite)
    rm -rf .next/standalone/public/uploads
    
    # 3. สร้างโฟลเดอร์เป้าหมายเตรียมไว้ (ถ้ายังไม่มี)
    mkdir -p $(pwd)/public/uploads
    
    # 4. สร้าง Symlink ตัวใหม่ที่ครอบคลุม 'ทุกอย่าง' ใน uploads แบบอัตโนมัติ
    ln -s $(pwd)/public/uploads .next/standalone/public/uploads
    
    echo "✅ Public files copied and Symlink created successfully"
else
    echo "⚠️  Warning: public directory not found"
fi

echo "🎉 Static files copy completed!"
echo "💡 You can now deploy the .next/standalone directory"