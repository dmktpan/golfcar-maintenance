// test-api-complete.js - ทดสอบ API ทั้งหมด
const BASE_URL = 'http://localhost:3000/api';

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`\n=== ${method} ${endpoint} ===`);
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 เริ่มทดสอบ API ทั้งหมด...\n');
  
  // 1. ทดสอบ Golf Courses
  console.log('📍 ทดสอบ Golf Courses API');
  await testAPI('/golf-courses');
  
  // 2. ทดสอบ Users
  console.log('\n👥 ทดสอบ Users API');
  await testAPI('/users');
  
  // 3. ทดสอบ Vehicles
  console.log('\n🚗 ทดสอบ Vehicles API');
  await testAPI('/vehicles');
  
  // 4. ทดสอบ Parts
  console.log('\n🔧 ทดสอบ Parts API');
  await testAPI('/parts');
  
  // 5. ทดสอบ Jobs
  console.log('\n📋 ทดสอบ Jobs API');
  await testAPI('/jobs');
  
  // 6. ทดสอบ Parts Usage Logs
  console.log('\n📊 ทดสอบ Parts Usage Logs API');
  await testAPI('/parts-usage-logs');
  
  // 7. ทดสอบ Serial History
  console.log('\n📜 ทดสอบ Serial History API');
  await testAPI('/serial-history');
  
  // 8. ทดสอบการสร้างงานใหม่ (ถ้ามีข้อมูลพื้นฐาน)
  console.log('\n✨ ทดสอบการสร้างงานใหม่');
  const newJob = {
    type: 'PM',
    status: 'pending',
    vehicle_id: '000000000000000000000001',
    vehicle_number: 'TEST-001',
    golf_course_id: '000000000000000000000001',
    user_id: '000000000000000000000001',
    userName: 'Test User',
    system: 'Engine',
    subTasks: ['Check oil', 'Check battery'],
    remarks: 'Test job creation',
    battery_serial: 'BAT-001',
    parts: [],
    partsNotes: 'No parts used',
    images: []
  };
  
  await testAPI('/jobs', 'POST', newJob);
  
  console.log('\n✅ การทดสอบ API เสร็จสิ้น!');
}

// รันการทดสอบ
runTests().catch(console.error);