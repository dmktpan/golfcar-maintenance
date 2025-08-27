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
    cp -r public .next/standalone/
    echo "✅ Public files copied successfully"
else
    echo "⚠️  Warning: public directory not found"
fi

echo "🎉 Static files copy completed!"
echo "💡 You can now deploy the .next/standalone directory"