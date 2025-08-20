#!/usr/bin/env node

// Production startup script for standalone Next.js application with static file serving
const express = require('express');
const next = require('next');
const path = require('path');
const fs = require('fs');

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '8080';

const port = parseInt(process.env.PORT, 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';

console.log('🚀 Starting production server with static file serving...');
console.log(`📍 Server will run on port: ${port}`);
console.log(`🌐 Environment: ${process.env.NODE_ENV}`);

// Check if standalone server exists
const standaloneDir = path.join(__dirname, '.next', 'standalone');
const standaloneServerPath = path.join(standaloneDir, 'server.js');

if (!fs.existsSync(standaloneServerPath)) {
  console.error('❌ Standalone server not found. Please run "npm run build" first.');
  process.exit(1);
}

// Create Express app
const app = express();

// Serve static files from main directory
const staticPath = path.join(__dirname, '.next', 'static');
const publicPath = path.join(__dirname, 'public');

if (fs.existsSync(staticPath)) {
  app.use('/_next/static', express.static(staticPath));
  console.log('✅ Static files served from:', staticPath);
}

if (fs.existsSync(publicPath)) {
  app.use('/public', express.static(publicPath));
  app.use('/', express.static(publicPath));
  console.log('✅ Public files served from:', publicPath);
}

// Start standalone server directly
console.log('🔄 Starting standalone Next.js server...');
process.chdir(standaloneDir);

// Set environment variables for standalone server
process.env.PORT = port.toString();
process.env.HOSTNAME = hostname;

// Require and start the standalone server
try {
  require(standaloneServerPath);
  console.log('✅ Standalone server started successfully!');
  console.log(`🌐 Access your application at: http://${hostname === '0.0.0.0' ? 'localhost' : hostname}:${port}`);
} catch (err) {
  console.error('❌ Failed to start standalone server:', err);
  process.exit(1);
}