#!/bin/bash
echo "🗑️ Clearing application data..."

# Stop application (ถ้ารันอยู่)
# pkill -f "next start"

# Clear database
echo "📊 Resetting database..."
npx prisma db push --force-reset

# Clear uploads
echo "📁 Clearing uploads..."
rm -rf public/uploads/*
touch public/uploads/.gitkeep

# Clear logs
echo "📝 Clearing logs..."
rm -f logs/*.log

# Clear cache
echo "🧹 Clearing cache..."
rm -rf .next

# Rebuild
echo "🔨 Rebuilding application..."
npm run build

# Seed new data
echo "🌱 Seeding new data..."
npm run start &
sleep 5
curl -X POST http://localhost:8080/api/seed

echo "✅ Application reset complete!"