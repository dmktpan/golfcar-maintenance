#!/usr/bin/env node

// Production startup script for standalone Next.js application
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if standalone server exists
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');

if (!fs.existsSync(standaloneServerPath)) {
  console.error('❌ Standalone server not found. Please run "npm run build" first.');
  process.exit(1);
}

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '8080';

console.log('🚀 Starting production server...');
console.log(`📍 Server will run on port: ${process.env.PORT}`);
console.log(`🌐 Environment: ${process.env.NODE_ENV}`);

// Start the standalone server
const server = spawn('node', [standaloneServerPath], {
  stdio: 'inherit',
  env: process.env
});

// Handle server events
server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`🔄 Server exited with code: ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

console.log('✅ Production server started successfully!');
console.log(`🌐 Access your application at: http://localhost:${process.env.PORT}`);