// test-job-creation.js - ทดสอบการสร้างงานใหม่
const BASE_URL = 'http://localhost:3000/api';

async function testJobCreation() {
  try {
    console.log('🧪 ทดสอบการสร้างงานใหม่...\n');
    
    // ทดสอบการสร้างงานแบบง่าย (ไม่มี parts)
    const simpleJob = {
      type: 'PM',
      status: 'pending',
      vehicle_id: '000000000000000000000001',
      vehicle_number: 'TEST-001',
      golf_course_id: '000000000000000000000001',
      user_id: '000000000000000000000001',
      userName: 'Test User',
      system: 'Engine',
      subTasks: ['Check oil', 'Check battery'],
      remarks: 'Test job creation without parts',
      battery_serial: 'BAT-001',
      partsNotes: 'No parts used',
      images: []
    };
    
    console.log('📝 ทดสอบการสร้างงานแบบง่าย (ไม่มี parts)');
    const response1 = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simpleJob)
    });
    
    const result1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(result1, null, 2));
    
    if (response1.status === 201) {
      console.log('✅ การสร้างงานแบบง่ายสำเร็จ!');
      
      // ทดสอบการสร้างงานที่มี parts
      console.log('\n📝 ทดสอบการสร้างงานที่มี parts');
      const jobWithParts = {
        ...simpleJob,
        vehicle_number: 'TEST-002',
        remarks: 'Test job creation with parts',
        parts: [
          {
            part_id: 1,
            part_name: 'Engine Oil',
            quantity_used: 2
          },
          {
            part_id: 2,
            part_name: 'Air Filter',
            quantity_used: 1
          }
        ]
      };
      
      const response2 = await fetch(`${BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobWithParts)
      });
      
      const result2 = await response2.json();
      console.log('Status:', response2.status);
      console.log('Response:', JSON.stringify(result2, null, 2));
      
      if (response2.status === 201) {
        console.log('✅ การสร้างงานที่มี parts สำเร็จ!');
      } else {
        console.log('❌ การสร้างงานที่มี parts ล้มเหลว');
      }
    } else {
      console.log('❌ การสร้างงานแบบง่ายล้มเหลว');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// รันการทดสอบ
testJobCreation();