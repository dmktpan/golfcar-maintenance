#!/bin/bash
echo "🚀 Starting deployment with fresh seed data..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build application
echo "🔨 Building application..."
npm run build

# Stop existing application
echo "🛑 Stopping existing application..."
pkill -f "next start" || true
sleep 2

# Start new application
echo "▶️ Starting application..."
npm run start &
sleep 5

# Clear and seed database
echo "🌱 Clearing and seeding database..."
curl -X POST http://localhost:8080/api/seed

# Check migration status
echo "📊 Checking database status..."
curl http://localhost:8080/api/check-migration

# Test APIs
echo "🧪 Testing APIs..."
curl http://localhost:8080/api/test-prisma/users

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at: http://192.168.1.54:8080"