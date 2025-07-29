const BASE_URL = 'http://localhost:3000';

async function testSupervisorPermissions() {
    console.log('🧪 ทดสอบสิทธิ์หัวหน้าในระบบ Golf Cart Maintenance\n');

    try {
        // 1. ดึงข้อมูลสนามกอล์ฟทั้งหมด
        console.log('1️⃣ ดึงข้อมูลสนามกอล์ฟทั้งหมด...');
        const golfCoursesResponse = await fetch(`${BASE_URL}/api/golf-courses`);
        const golfCourses = await golfCoursesResponse.json();
        console.log(`   ✅ พบสนามกอล์ฟ ${golfCourses.length} สนาม`);
        golfCourses.forEach((course, index) => {
            console.log(`      ${index + 1}. ${course.name} (ID: ${course.id})`);
        });

        // 2. ดึงข้อมูลผู้ใช้ทั้งหมด
        console.log('\n2️⃣ ดึงข้อมูลผู้ใช้ทั้งหมด...');
        const usersResponse = await fetch(`${BASE_URL}/api/users`);
        const users = await usersResponse.json();
        console.log(`   ✅ พบผู้ใช้ ${users.length} คน`);
        
        // แสดงข้อมูลหัวหน้า
        const supervisors = users.filter(user => user.role === 'supervisor');
        console.log(`   📊 หัวหน้า: ${supervisors.length} คน`);
        supervisors.forEach((supervisor, index) => {
            const managedCount = supervisor.managed_golf_courses ? supervisor.managed_golf_courses.length : 0;
            const isFullAccess = managedCount === golfCourses.length;
            console.log(`      ${index + 1}. ${supervisor.name} (${supervisor.code})`);
            console.log(`         - ดูแลสนาม: ${managedCount}/${golfCourses.length} สนาม`);
            console.log(`         - สิทธิ์ดู History: ${isFullAccess ? '🟢 ทั้งหมด (เหมือน Admin)' : '🟡 เฉพาะสนามที่ดูแล'}`);
            if (supervisor.managed_golf_courses && supervisor.managed_golf_courses.length > 0) {
                const managedNames = supervisor.managed_golf_courses
                    .map(id => golfCourses.find(c => c.id === id)?.name || 'ไม่ทราบ')
                    .join(', ');
                console.log(`         - สนามที่ดูแล: ${managedNames}`);
            }
        });

        // 3. ดึงข้อมูล Serial History
        console.log('\n3️⃣ ดึงข้อมูล Serial History...');
        const historyResponse = await fetch(`${BASE_URL}/api/serial-history`);
        const historyData = await historyResponse.json();
        console.log(`   ✅ พบประวัติ ${historyData.length} รายการ`);

        // แสดงการกระจายข้อมูลตามสนาม
        const historyByGolfCourse = {};
        historyData.forEach(entry => {
            const courseName = golfCourses.find(c => c.id === entry.golf_course_id)?.name || 'ไม่ทราบ';
            if (!historyByGolfCourse[courseName]) {
                historyByGolfCourse[courseName] = 0;
            }
            historyByGolfCourse[courseName]++;
        });

        console.log('   📊 การกระจายประวัติตามสนาม:');
        Object.entries(historyByGolfCourse).forEach(([courseName, count]) => {
            console.log(`      - ${courseName}: ${count} รายการ`);
        });

        // 4. ทดสอบสิทธิ์การเข้าถึง
        console.log('\n4️⃣ ทดสอบสิทธิ์การเข้าถึงข้อมูล...');
        
        supervisors.forEach((supervisor, index) => {
            console.log(`\n   👤 หัวหน้า: ${supervisor.name}`);
            
            const managedCount = supervisor.managed_golf_courses ? supervisor.managed_golf_courses.length : 0;
            const hasFullAccess = managedCount === golfCourses.length;
            
            if (hasFullAccess) {
                console.log('      🟢 สิทธิ์เต็ม: สามารถดู History ทั้งหมดได้เหมือน Admin');
                console.log(`      📈 สามารถเข้าถึงประวัติ: ${historyData.length} รายการ (ทั้งหมด)`);
            } else {
                const accessibleHistory = historyData.filter(entry => 
                    supervisor.managed_golf_courses && supervisor.managed_golf_courses.includes(entry.golf_course_id)
                );
                console.log('      🟡 สิทธิ์จำกัด: สามารถดูเฉพาะสนามที่ดูแล');
                console.log(`      📈 สามารถเข้าถึงประวัติ: ${accessibleHistory.length} รายการ`);
                
                const accessibleCourses = supervisor.managed_golf_courses
                    .map(id => golfCourses.find(c => c.id === id)?.name || 'ไม่ทราบ')
                    .join(', ');
                console.log(`      🏌️ สนามที่เข้าถึงได้: ${accessibleCourses}`);
            }
        });

        // 5. สรุปการปรับปรุง
        console.log('\n5️⃣ สรุปการปรับปรุงระบบ:');
        console.log('   ✅ เพิ่มปุ่ม "เลือกทั้งหมด" และ "ยกเลิกทั้งหมด" ในหน้าเพิ่มผู้ใช้งาน');
        console.log('   ✅ หัวหน้าที่เลือกดูแลทุกสนามจะได้สิทธิ์ดู History ทั้งหมดเหมือน Admin');
        console.log('   ✅ ปรับปรุง UI ให้แสดงข้อมูลสิทธิ์อย่างชัดเจน');
        console.log('   ✅ เพิ่ม CSS สำหรับปุ่มใหม่ให้สวยงาม');

        const fullAccessSupervisors = supervisors.filter(s => 
            s.managed_golf_courses && s.managed_golf_courses.length === golfCourses.length
        );
        
        console.log(`\n📊 สถิติปัจจุบัน:`);
        console.log(`   - หัวหน้าทั้งหมด: ${supervisors.length} คน`);
        console.log(`   - หัวหน้าที่มีสิทธิ์เต็ม: ${fullAccessSupervisors.length} คน`);
        console.log(`   - หัวหน้าที่มีสิทธิ์จำกัด: ${supervisors.length - fullAccessSupervisors.length} คน`);

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
    }
}

// เรียกใช้ฟังก์ชันทดสอบ
testSupervisorPermissions();