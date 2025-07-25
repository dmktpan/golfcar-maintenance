#!/bin/bash

echo "🚀 Starting Golf Cart Maintenance System Update..."
echo "=================================================="

# ตรวจสอบว่าอยู่ในโฟลเดอร์ที่ถูกต้องหรือไม่
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# ตรวจสอบ Git status
echo "📋 Checking Git status..."
if ! git status &>/dev/null; then
    echo "❌ Error: This is not a Git repository."
    exit 1
fi

# Pull latest code
echo "📥 Pulling latest code from Git..."
if ! git pull origin main; then
    echo "❌ Error: Failed to pull latest code. Please check your Git configuration."
    exit 1
fi

# Install/Update dependencies
echo "📦 Installing/Updating dependencies..."
if ! npm install; then
    echo "❌ Error: Failed to install dependencies."
    exit 1
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
if ! npx prisma generate; then
    echo "❌ Error: Failed to generate Prisma client."
    exit 1
fi

# Push database schema (if needed)
echo "🗄️ Updating database schema..."
if ! npx prisma db push; then
    echo "⚠️ Warning: Database schema update failed. This might be normal if no changes were made."
fi

# Build application
echo "🔨 Building application..."
if ! npm run build; then
    echo "❌ Error: Failed to build application."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ Error: PM2 is not installed. Please install PM2 first:"
    echo "   npm install -g pm2"
    exit 1
fi

# Restart application with PM2
echo "🔄 Restarting application..."
if pm2 list | grep -q "golfcart-app"; then
    echo "   Restarting existing PM2 process..."
    pm2 restart golfcart-app
else
    echo "   Starting new PM2 process..."
    pm2 start npm --name golfcart-app -- run start
fi

# Wait a moment for the application to start
echo "⏳ Waiting for application to start..."
sleep 5

# Check PM2 status
echo "✅ Checking application status..."
pm2 status

# Test application
echo "🧪 Testing application..."
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Application is responding successfully!"
else
    echo "⚠️ Warning: Application might not be responding on port 8080"
fi

echo ""
echo "🎉 Update completed successfully!"
echo "=================================================="
echo "📊 Application Status:"
pm2 status | grep golfcart-app
echo ""
echo "🌐 Access your application at:"
echo "   Local: http://localhost:8080"
echo "   Network: http://192.168.1.54:8080"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: pm2 logs golfcart-app"
echo "   Monitor: pm2 monit"
echo "   Stop: pm2 stop golfcart-app"
echo "   Restart: pm2 restart golfcart-app"
echo ""
echo "✨ Update process completed!"