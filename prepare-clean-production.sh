#!/bin/bash
echo "🚀 Preparing clean application for production use..."

# Stop application (ถ้ารันอยู่)
echo "⏹️ Stopping existing application..."
pm2 stop golfcart-app 2>/dev/null || echo "No PM2 process to stop"

# Clear database (ลบข้อมูลทั้งหมด)
echo "🗑️ Clearing all data..."
npm run start &
APP_PID=$!
sleep 5

# เรียก API ล้างข้อมูล
curl -X POST http://localhost:8080/api/clear-data
echo ""

# Stop the temporary server
kill $APP_PID 2>/dev/null

# Clear uploads
echo "📁 Clearing uploads..."
rm -rf public/uploads/*
touch public/uploads/.gitkeep

# Clear logs
echo "📝 Clearing logs..."
mkdir -p logs
rm -f logs/*.log

# Clear cache and rebuild
echo "🧹 Clearing cache and rebuilding..."
rm -rf .next
npm run build

# Start application temporarily to seed admin account
echo "🔧 Setting up administrator account..."
npm run start &
APP_PID=$!
sleep 5

# Seed เฉพาะ administrator account
curl -X POST http://localhost:8080/api/seed-admin-only
echo ""

# Stop the temporary server
kill $APP_PID 2>/dev/null

echo ""
echo "✅ Clean application is now ready for production use!"
echo ""
echo "📋 Administrator Account Details:"
echo "   Code: admin000"
echo "   Name: administrator"
echo "   Role: admin"
echo ""
echo "📋 Next steps to start using the application:"
echo "1. Start the application: pm2 start npm --name golfcart-app -- run start"
echo "2. Open browser: http://localhost:8080"
echo "3. Login with administrator account (code: admin000)"
echo "4. Add your golf courses"
echo "5. Create users and assign roles"
echo "6. Register your golf carts"
echo "7. Add parts inventory"
echo "8. Start creating maintenance jobs"
echo ""
echo "🔧 Useful commands:"
echo "- View database: npm run db:studio"
echo "- Check PM2 status: pm2 status"
echo "- View logs: pm2 logs golfcart-app"
echo ""