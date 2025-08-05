#!/usr/bin/env node

// Test External API Connection Script
// ใช้สำหรับทดสอบการเชื่อมต่อ External API

const https = require('https');
const http = require('http');

// อ่าน Environment Variables
require('dotenv').config();

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api';
const TIMEOUT = parseInt(process.env.EXTERNAL_API_TIMEOUT) || 15000;

console.log('🧪 Testing External API Connection');
console.log('=====================================');
console.log(`🌐 API Base URL: ${EXTERNAL_API_BASE}`);
console.log(`⏱️  Timeout: ${TIMEOUT}ms`);
console.log('');

// Test endpoints
const endpoints = [
  '/vehicles',
  '/golf-courses', 
  '/users',
  '/jobs',
  '/parts'
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${EXTERNAL_API_BASE}${endpoint}`;
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    console.log(`🔍 Testing: ${endpoint}`);
    
    const startTime = Date.now();
    
    const req = client.get(url, { timeout: TIMEOUT }, (res) => {
      const duration = Date.now() - startTime;
      
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Duration: ${duration}ms`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.data && Array.isArray(parsed.data)) {
            console.log(`   ✅ Success - ${parsed.data.length} items`);
          } else {
            console.log(`   ✅ Success - Response received`);
          }
        } catch (e) {
          console.log(`   ⚠️  Success but invalid JSON`);
        }
        resolve({ success: true, status: res.statusCode, duration });
      });
    });
    
    req.on('timeout', () => {
      console.log(`   ❌ Timeout after ${TIMEOUT}ms`);
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`   ❌ Error: ${error.message}`);
      console.log(`   Duration: ${duration}ms`);
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(TIMEOUT);
  });
}

async function runTests() {
  console.log('🚀 Starting API tests...\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ endpoint, ...result });
    console.log(''); // Empty line between tests
  }
  
  // Summary
  console.log('📊 Test Summary');
  console.log('===============');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed endpoints:');
    failed.forEach(f => {
      console.log(`   ${f.endpoint}: ${f.error}`);
    });
  }
  
  if (successful.length > 0) {
    console.log('\n✅ Successful endpoints:');
    successful.forEach(s => {
      console.log(`   ${s.endpoint}: ${s.status} (${s.duration}ms)`);
    });
  }
  
  console.log('\n🏁 Test completed');
  
  // Exit with error code if any tests failed
  process.exit(failed.length > 0 ? 1 : 0);
}

runTests().catch(console.error);