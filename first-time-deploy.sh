#!/bin/bash

echo "🚀 Golf Cart Maintenance System - First Time Deployment"
echo "======================================================="

# ตรวจสอบว่าอยู่ในโฟลเดอร์ที่ถูกต้องหรือไม่
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# ตรวจสอบว่ามี .env หรือไม่
if [ ! -f ".env" ]; then
    echo "⚠️ Warning: .env file not found."
    if [ -f ".env.example" ]; then
        echo "📋 Creating .env from .env.example..."
        cp .env.example .env
        echo "✅ .env file created. Please edit it with your MongoDB connection details."
        echo "   nano .env"
        echo ""
        echo "🔧 Required settings:"
        echo "   DATABASE_URL=\"mongodb://yourAdminUser:password@192.168.1.54:27017/golfcarmaintenance_db?replicaSet=rs0&authSource=admin\""
        echo "   MONGODB_URI=\"mongodb://yourAdminUser:password@192.168.1.54:27017/golfcarmaintenance_db?replicaSet=rs0&authSource=admin\""
        echo ""
        read -p "Press Enter after you have configured the .env file..."
    else
        echo "❌ Error: .env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
if ! npm install; then
    echo "❌ Error: Failed to install dependencies."
    exit 1
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    if ! npm install -g pm2; then
        echo "❌ Error: Failed to install PM2. You may need to run with sudo:"
        echo "   sudo npm install -g pm2"
        exit 1
    fi
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
if ! npx prisma generate; then
    echo "❌ Error: Failed to generate Prisma client."
    exit 1
fi

# Push database schema
echo "🗄️ Setting up database schema..."
if ! npx prisma db push; then
    echo "❌ Error: Failed to setup database schema. Please check your MongoDB connection."
    exit 1
fi

# Build application
echo "🔨 Building application..."
if ! npm run build; then
    echo "❌ Error: Failed to build application."
    exit 1
fi

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p public/uploads
touch public/uploads/.gitkeep

# Create logs directory
echo "📝 Creating logs directory..."
mkdir -p logs

# Stop any existing PM2 process
echo "🛑 Stopping any existing processes..."
pm2 stop golfcart-app 2>/dev/null || echo "   No existing process to stop"
pm2 delete golfcart-app 2>/dev/null || echo "   No existing process to delete"

# Start application with PM2
echo "🚀 Starting application with PM2..."
if ! pm2 start npm --name golfcart-app -- run start; then
    echo "❌ Error: Failed to start application with PM2."
    exit 1
fi

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
echo "🔧 Setting up PM2 startup script..."
pm2 startup

# Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 10

# Test application
echo "🧪 Testing application..."
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Application is responding successfully!"
else
    echo "⚠️ Warning: Application might not be responding on port 8080"
    echo "   Check logs: pm2 logs golfcart-app"
fi

# Choose deployment type
echo ""
echo "🎯 Choose deployment type:"
echo "1. Clean Production (recommended) - Empty system with admin account only"
echo "2. Demo Data - System with sample data for testing"
echo "3. Skip data setup - Manual setup later"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🧹 Setting up clean production environment..."
        if [ -f "prepare-clean-production.sh" ]; then
            chmod +x prepare-clean-production.sh
            ./prepare-clean-production.sh
        else
            echo "⚠️ prepare-clean-production.sh not found. Setting up manually..."
            # Start temporary server for API calls
            npm run start &
            TEMP_PID=$!
            sleep 5
            
            # Clear data and create admin
            curl -X POST http://localhost:8080/api/clear-data
            curl -X POST http://localhost:8080/api/seed-admin-only
            
            # Stop temporary server
            kill $TEMP_PID 2>/dev/null
            
            # Restart PM2
            pm2 restart golfcart-app
        fi
        ;;
    2)
        echo "🌱 Setting up demo data..."
        if [ -f "prepare-production.sh" ]; then
            chmod +x prepare-production.sh
            ./prepare-production.sh
        else
            echo "⚠️ prepare-production.sh not found. Setting up manually..."
            # Start temporary server for API calls
            npm run start &
            TEMP_PID=$!
            sleep 5
            
            # Seed initial data
            curl -X POST http://localhost:8080/api/seed-initial-data
            
            # Stop temporary server
            kill $TEMP_PID 2>/dev/null
            
            # Restart PM2
            pm2 restart golfcart-app
        fi
        ;;
    3)
        echo "⏭️ Skipping data setup. You can set up data manually later."
        ;;
    *)
        echo "⏭️ Invalid choice. Skipping data setup."
        ;;
esac

echo ""
echo "🎉 Deployment completed successfully!"
echo "======================================="
echo "📊 Application Status:"
pm2 status | grep golfcart-app
echo ""
echo "🌐 Access your application at:"
echo "   Local: http://localhost:8080"
echo "   Network: http://192.168.1.54:8080"
echo ""
echo "👤 Default Admin Account (if clean production):"
echo "   Code: admin000"
echo "   Name: administrator"
echo "   Role: admin"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: pm2 logs golfcart-app"
echo "   Monitor: pm2 monit"
echo "   Stop: pm2 stop golfcart-app"
echo "   Restart: pm2 restart golfcart-app"
echo "   Update: ./update-server.sh"
echo ""
echo "📚 Documentation:"
echo "   Production Guide: PRODUCTION_SETUP_GUIDE.md"
echo "   Update Guide: UPDATE_TO_SERVER_GUIDE.md"
echo ""
echo "✨ Your Golf Cart Maintenance System is ready to use!"