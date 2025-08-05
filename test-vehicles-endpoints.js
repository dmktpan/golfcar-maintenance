#!/usr/bin/env node

// Test Different Vehicle Endpoints
// ทดสอบ endpoint ต่างๆ สำหรับรถกอล์ฟ

const http = require('http');
require('dotenv').config();

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api';

console.log('🚗 Testing Vehicle Endpoints');
console.log('============================');
console.log(`🌐 API Base: ${EXTERNAL_API_BASE}`);
console.log('');

// Possible vehicle endpoints
const vehicleEndpoints = [
  '/vehicles',
  '/vehicle', 
  '/cars',
  '/car',
  '/golfcars',
  '/golfcar',
  '/golf-cars',
  '/golf-car',
  '/carts',
  '/cart'
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${EXTERNAL_API_BASE}${endpoint}`;
    
    console.log(`🔍 Testing: ${endpoint}`);
    
    const req = http.get(url, { timeout: 10000 }, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.data && Array.isArray(parsed.data)) {
              console.log(`   ✅ SUCCESS - ${parsed.data.length} items found!`);
              console.log(`   📋 Sample data:`, JSON.stringify(parsed.data.slice(0, 2), null, 2));
            } else {
              console.log(`   ✅ SUCCESS - Response received`);
            }
          } catch (e) {
            console.log(`   ⚠️  Status 200 but invalid JSON`);
          }
        } else if (res.statusCode === 404) {
          console.log(`   ❌ Not Found`);
        } else {
          console.log(`   ⚠️  Status: ${res.statusCode}`);
        }
        resolve({ endpoint, status: res.statusCode, success: res.statusCode === 200 });
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      resolve({ endpoint, error: error.message, success: false });
    });
    
    req.setTimeout(10000);
    req.on('timeout', () => {
      console.log(`   ❌ Timeout`);
      req.destroy();
      resolve({ endpoint, error: 'timeout', success: false });
    });
  });
}

async function runTests() {
  console.log('🚀 Starting vehicle endpoint tests...\n');
  
  const results = [];
  
  for (const endpoint of vehicleEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    console.log(''); // Empty line
  }
  
  // Summary
  console.log('📊 Results Summary');
  console.log('==================');
  
  const working = results.filter(r => r.success);
  const notFound = results.filter(r => r.status === 404);
  const errors = results.filter(r => r.error);
  
  if (working.length > 0) {
    console.log('✅ Working endpoints:');
    working.forEach(w => console.log(`   ${w.endpoint}`));
  } else {
    console.log('❌ No working vehicle endpoints found!');
  }
  
  console.log(`\n📈 Stats: ${working.length} working, ${notFound.length} not found, ${errors.length} errors`);
}

runTests().catch(console.error);