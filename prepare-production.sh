#!/bin/bash
echo "🚀 Preparing application for production use..."

# Stop application (ถ้ารันอยู่)
echo "⏹️ Stopping existing application..."
pm2 stop golfcart-app 2>/dev/null || echo "No PM2 process to stop"

# Clear database (ลบข้อมูล demo ทั้งหมด)
echo "🗑️ Clearing demo data..."
npm run start &
APP_PID=$!
sleep 5

# เรียก API ล้างข้อมูล
curl -X POST http://localhost:8080/api/clear-data
echo ""

# Stop the temporary server
kill $APP_PID 2>/dev/null

# Clear uploads
echo "📁 Clearing demo uploads..."
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

echo ""
echo "✅ Application is now ready for production use!"
echo ""
echo "📋 Next steps to start using the application:"
echo "1. Start the application: pm2 start npm --name golfcart-app -- run start"
echo "2. Open browser: http://localhost:8080"
echo "3. Begin by adding your first golf course"
echo "4. Add users and assign roles"
echo "5. Register your golf carts"
echo "6. Start creating maintenance jobs"
echo ""
echo "🔧 Useful commands:"
echo "- View database: npm run db:studio"
echo "- Check PM2 status: pm2 status"
echo "- View logs: pm2 logs golfcart-app"
echo ""