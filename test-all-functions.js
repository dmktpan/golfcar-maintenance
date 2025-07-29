const API_BASE = 'http://localhost:3000/api';

// ฟังก์ชันสำหรับทดสอบ API
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

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`\n${method} ${endpoint}:`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', result);
    
    return { status: response.status, data: result };
  } catch (error) {
    console.error(`Error testing ${method} ${endpoint}:`, error);
    return { status: 500, error: error.message };
  }
}

// ทดสอบฟังก์ชันทั้งหมด
async function testAllFunctions() {
  console.log('🚀 เริ่มทดสอบฟังก์ชันทั้งหมด...\n');

  // 1. ทดสอบการดึงข้อมูลทั้งหมด (GET)
  console.log('📋 ทดสอบการดึงข้อมูล (GET APIs)');
  console.log('='.repeat(50));
  
  await testAPI('/users');
  await testAPI('/golf-courses');
  await testAPI('/vehicles');
  await testAPI('/parts');
  await testAPI('/jobs');
  await testAPI('/parts-usage-logs');
  await testAPI('/serial-history');

  // 2. ทดสอบการสร้างข้อมูลใหม่ (POST)
  console.log('\n📝 ทดสอบการสร้างข้อมูลใหม่ (POST APIs)');
  console.log('='.repeat(50));

  // สร้าง Golf Course ใหม่
  const newGolfCourse = {
    name: 'สนามทดสอบ Test Course'
  };
  const golfCourseResult = await testAPI('/golf-courses', 'POST', newGolfCourse);
  const golfCourseId = golfCourseResult.data?.data?.id;

  // สร้าง User ใหม่
  const newUser = {
    code: 'TEST001',
    username: 'testuser',
    name: 'ผู้ใช้ทดสอบ',
    role: 'staff',
    golf_course_id: golfCourseId || '1',
    golf_course_name: 'สนามทดสอบ Test Course'
  };
  const userResult = await testAPI('/users', 'POST', newUser);
  const userId = userResult.data?.data?.id;

  // สร้าง Vehicle ใหม่
  const newVehicle = {
    serial_number: 'TEST-SERIAL-001',
    vehicle_number: 'TEST-001',
    golf_course_id: golfCourseId || '1',
    golf_course_name: 'สนามทดสอบ Test Course',
    model: 'EZGO Test Model',
    battery_serial: 'BAT-TEST-001',
    status: 'active'
  };
  const vehicleResult = await testAPI('/vehicles', 'POST', newVehicle);
  const vehicleId = vehicleResult.data?.data?.id;

  // สร้าง Part ใหม่
  const newPart = {
    name: 'อะไหล่ทดสอบ',
    unit: 'ชิ้น',
    stock_qty: 100,
    min_qty: 10,
    max_qty: 200
  };
  const partResult = await testAPI('/parts', 'POST', newPart);
  const partId = partResult.data?.data?.id;

  // สร้าง Job ใหม่ (PM)
  const newJobPM = {
    type: 'PM',
    status: 'pending',
    vehicle_id: vehicleId || '1',
    vehicle_number: 'TEST-001',
    golf_course_id: golfCourseId || '1',
    user_id: userId || '1',
    userName: 'ผู้ใช้ทดสอบ',
    system: 'brake',
    subTasks: ['ตรวจเช็คผ้าเบรก', 'ทำความสะอาดระบบเบรก'],
    remarks: 'งาน PM ทดสอบ',
    battery_serial: 'BAT-TEST-001',
    parts: [
      {
        part_id: partId || '1',
        part_name: 'อะไหล่ทดสอบ',
        quantity_used: 2
      }
    ],
    partsNotes: 'ใช้อะไหล่ทดสอบ 2 ชิ้น',
    images: []
  };
  const jobPMResult = await testAPI('/jobs', 'POST', newJobPM);
  const jobPMId = jobPMResult.data?.data?.id;

  // สร้าง Job ใหม่ (BM)
  const newJobBM = {
    type: 'BM',
    status: 'pending',
    vehicle_id: vehicleId || '1',
    vehicle_number: 'TEST-001',
    golf_course_id: golfCourseId || '1',
    user_id: userId || '1',
    userName: 'ผู้ใช้ทดสอบ',
    bmCause: 'breakdown',
    remarks: 'งาน BM ทดสอบ - เบรกเสีย',
    battery_serial: 'BAT-TEST-001',
    parts: [],
    partsNotes: '',
    images: []
  };
  const jobBMResult = await testAPI('/jobs', 'POST', newJobBM);
  const jobBMId = jobBMResult.data?.data?.id;

  // สร้าง Parts Usage Log
  const newPartsUsageLog = {
    jobId: jobPMId || '1',
    partName: 'อะไหล่ทดสอบ',
    partId: partId || '1',
    quantityUsed: 2,
    usedDate: new Date().toISOString().split('T')[0],
    usedBy: 'ผู้ใช้ทดสอบ',
    vehicleNumber: 'TEST-001',
    vehicleSerial: 'TEST-SERIAL-001',
    golfCourseName: 'สนามทดสอบ Test Course',
    jobType: 'PM',
    system: 'brake',
    notes: 'ทดสอบการบันทึกการใช้อะไหล่'
  };
  await testAPI('/parts-usage-logs', 'POST', newPartsUsageLog);

  // สร้าง Serial History
  const newSerialHistory = {
    serial_number: 'TEST-SERIAL-001',
    vehicle_id: vehicleId || '1',
    vehicle_number: 'TEST-001',
    action_type: 'maintenance',
    action_date: new Date().toISOString(),
    details: 'ทดสอบการบันทึกประวัติ',
    performed_by: 'ผู้ใช้ทดสอบ',
    performed_by_id: userId || '1',
    golf_course_id: golfCourseId || '1',
    golf_course_name: 'สนามทดสอบ Test Course',
    is_active: true,
    related_job_id: jobPMId || '1',
    job_type: 'PM',
    status: 'completed'
  };
  await testAPI('/serial-history', 'POST', newSerialHistory);

  // 3. ทดสอบการอัปเดตข้อมูล (PUT)
  console.log('\n🔄 ทดสอบการอัปเดตข้อมูล (PUT APIs)');
  console.log('='.repeat(50));

  if (jobPMId) {
    const updatedJob = {
      ...newJobPM,
      status: 'completed',
      remarks: 'งาน PM ทดสอบ - เสร็จสิ้นแล้ว',
      parts: [
        {
          part_id: partId || '1',
          part_name: 'อะไหล่ทดสอบ',
          quantity_used: 3
        }
      ]
    };
    await testAPI(`/jobs/${jobPMId}`, 'PUT', updatedJob);
  }

  if (userId) {
    const updatedUser = {
      ...newUser,
      name: 'ผู้ใช้ทดสอบ (อัปเดตแล้ว)',
      role: 'supervisor'
    };
    await testAPI(`/users/${userId}`, 'PUT', updatedUser);
  }

  if (vehicleId) {
    const updatedVehicle = {
      ...newVehicle,
      status: 'inactive',
      model: 'EZGO Test Model (อัปเดตแล้ว)'
    };
    await testAPI(`/vehicles/${vehicleId}`, 'PUT', updatedVehicle);
  }

  if (partId) {
    const updatedPart = {
      ...newPart,
      stock_qty: 95,
      name: 'อะไหล่ทดสอบ (อัปเดตแล้ว)'
    };
    await testAPI(`/parts/${partId}`, 'PUT', updatedPart);
  }

  if (golfCourseId) {
    const updatedGolfCourse = {
      name: 'สนามทดสอบ Test Course (อัปเดตแล้ว)'
    };
    await testAPI(`/golf-courses/${golfCourseId}`, 'PUT', updatedGolfCourse);
  }

  // 4. ทดสอบการดึงข้อมูลเฉพาะ (GET by ID)
  console.log('\n🔍 ทดสอบการดึงข้อมูลเฉพาะ (GET by ID)');
  console.log('='.repeat(50));

  if (jobPMId) await testAPI(`/jobs/${jobPMId}`);
  if (userId) await testAPI(`/users/${userId}`);
  if (vehicleId) await testAPI(`/vehicles/${vehicleId}`);
  if (partId) await testAPI(`/parts/${partId}`);
  if (golfCourseId) await testAPI(`/golf-courses/${golfCourseId}`);

  // 5. ทดสอบ Authentication
  console.log('\n🔐 ทดสอบ Authentication');
  console.log('='.repeat(50));

  // ทดสอบ Staff Login
  const staffLoginData = {
    identifier: 'admin000',
    loginType: 'staff'
  };
  await testAPI('/auth/login', 'POST', staffLoginData);

  // ทดสอบ Admin Login
  const adminLoginData = {
    identifier: 'admin000',
    password: '123456',
    loginType: 'admin'
  };
  await testAPI('/auth/login', 'POST', adminLoginData);

  // 6. ทดสอบ Special Endpoints
  console.log('\n⚙️ ทดสอบ Special Endpoints');
  console.log('='.repeat(50));

  await testAPI('/check-migration');
  await testAPI('/maintenance');

  // 7. ทดสอบการลบข้อมูล (DELETE) - ทำในลำดับที่ถูกต้อง
  console.log('\n🗑️ ทดสอบการลบข้อมูล (DELETE APIs)');
  console.log('='.repeat(50));

  // ลบ Jobs ก่อน (เพราะมี foreign key ไปยัง users, vehicles)
  if (jobPMId) await testAPI(`/jobs/${jobPMId}`, 'DELETE');
  if (jobBMId) await testAPI(`/jobs/${jobBMId}`, 'DELETE');

  // ลบ Parts, Users, Vehicles
  if (partId) await testAPI(`/parts/${partId}`, 'DELETE');
  if (userId) await testAPI(`/users/${userId}`, 'DELETE');
  if (vehicleId) await testAPI(`/vehicles/${vehicleId}`, 'DELETE');

  // ลบ Golf Course สุดท้าย
  if (golfCourseId) await testAPI(`/golf-courses/${golfCourseId}`, 'DELETE');

  // 8. ทดสอบการดึงข้อมูลหลังลบ
  console.log('\n📊 ทดสอบการดึงข้อมูลหลังลบ');
  console.log('='.repeat(50));

  await testAPI('/users');
  await testAPI('/golf-courses');
  await testAPI('/vehicles');
  await testAPI('/parts');
  await testAPI('/jobs');

  console.log('\n✅ ทดสอบฟังก์ชันทั้งหมดเสร็จสิ้น!');
  console.log('='.repeat(50));
}

// รันการทดสอบ
testAllFunctions().catch(console.error);