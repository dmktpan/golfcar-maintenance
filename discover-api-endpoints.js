#!/usr/bin/env node

// Discover Available API Endpoints
// ค้นหา endpoint ทั้งหมดที่มีใน External API

const http = require('http');
require('dotenv').config();

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api';

console.log('🔍 Discovering Available API Endpoints');
console.log('======================================');
console.log(`🌐 API Base: ${EXTERNAL_API_BASE}`);
console.log('');

// Common API endpoints to test
const commonEndpoints = [
  // Basic endpoints
  '/',
  '/health',
  '/status',
  '/info',
  
  // Data endpoints
  '/golf-courses',
  '/users', 
  '/jobs',
  '/parts',
  '/vehicles',
  '/maintenance',
  '/serial-history',
  '/parts-usage-logs',
  
  // Alternative naming
  '/golfcourses',
  '/course',
  '/courses',
  '/user',
  '/job',
  '/part',
  '/vehicle',
  '/car',
  '/cars',
  '/golfcar',
  '/golfcars',
  '/cart',
  '/carts',
  '/history',
  '/logs',
  '/log',
  
  // Possible vehicle-related endpoints
  '/fleet',
  '/equipment',
  '/assets',
  '/inventory'
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${EXTERNAL_API_BASE}${endpoint}`;
    
    const req = http.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let itemCount = 'N/A';
        let hasData = false;
        
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.data && Array.isArray(parsed.data)) {
              itemCount = parsed.data.length;
              hasData = true;
            } else if (parsed.success !== undefined) {
              hasData = true;
            }
          } catch (e) {
            // Invalid JSON
          }
        }
        
        resolve({ 
          endpoint, 
          status: res.statusCode, 
          itemCount,
          hasData,
          dataSize: data.length
        });
      });
    });
    
    req.on('error', () => {
      resolve({ endpoint, status: 'ERROR', itemCount: 'N/A', hasData: false });
    });
    
    req.setTimeout(5000);
    req.on('timeout', () => {
      req.destroy();
      resolve({ endpoint, status: 'TIMEOUT', itemCount: 'N/A', hasData: false });
    });
  });
}

async function runDiscovery() {
  console.log('🚀 Testing endpoints...\n');
  
  const results = [];
  
  // Test endpoints in batches to avoid overwhelming the server
  const batchSize = 5;
  for (let i = 0; i < commonEndpoints.length; i += batchSize) {
    const batch = commonEndpoints.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(testEndpoint));
    results.push(...batchResults);
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Sort and categorize results
  const working = results.filter(r => r.status === 200).sort((a, b) => b.itemCount - a.itemCount);
  const notFound = results.filter(r => r.status === 404);
  const errors = results.filter(r => r.status !== 200 && r.status !== 404);
  
  console.log('✅ Working Endpoints (Status 200):');
  console.log('==================================');
  if (working.length > 0) {
    working.forEach(w => {
      console.log(`   ${w.endpoint.padEnd(20)} | ${w.itemCount.toString().padStart(6)} items | ${w.dataSize} bytes`);
    });
  } else {
    console.log('   None found');
  }
  
  console.log('\n⚠️  Other Status Codes:');
  console.log('========================');
  if (errors.length > 0) {
    errors.forEach(e => {
      console.log(`   ${e.endpoint.padEnd(20)} | Status: ${e.status}`);
    });
  } else {
    console.log('   None');
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Working: ${working.length}`);
  console.log(`   ❌ Not Found: ${notFound.length}`);
  console.log(`   ⚠️  Errors: ${errors.length}`);
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (working.length > 0) {
    console.log('   Use these working endpoints in your application:');
    working.forEach(w => {
      if (w.itemCount > 0) {
        console.log(`   - ${w.endpoint} (${w.itemCount} items available)`);
      }
    });
  }
  
  if (working.filter(w => w.endpoint.includes('vehicle') || w.endpoint.includes('car')).length === 0) {
    console.log('   ⚠️  No vehicle-related endpoints found!');
    console.log('   🔧 Consider using local database for vehicle data or check API documentation');
  }
}

runDiscovery().catch(console.error);