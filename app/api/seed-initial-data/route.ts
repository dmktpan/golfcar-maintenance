import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Mock Data สำหรับ Seed
const MOCK_GOLF_COURSES = [
  { name: 'วอเตอร์แลนด์' },
  { name: 'กรีนวัลเลย์' }
];

const MOCK_USERS = [
  { code: 'staff123', name: 'tape1408', role: 'staff', golf_course_id: 1, managed_golf_courses: [] },
  { code: 'super567', name: 'สมศรี หัวหน้า', role: 'supervisor', golf_course_id: 1, managed_golf_courses: [1] },
  { code: 'admin000', name: 'administrator', role: 'admin', golf_course_id: 1, managed_golf_courses: [1, 2] },
  { code: 'staff456', name: 'สมชาย พนักงาน', role: 'staff', golf_course_id: 2, managed_golf_courses: [] },
  { code: 'staff789', name: 'สมหญิง ช่างซ่อม', role: 'staff', golf_course_id: 1, managed_golf_courses: [] },
  { code: 'staff101', name: 'วิชัย เทคนิค', role: 'staff', golf_course_id: 2, managed_golf_courses: [] },
  { code: 'super890', name: 'ประยุทธ หัวหน้าช่าง', role: 'supervisor', golf_course_id: 2, managed_golf_courses: [2] },
  { code: 'super999', name: 'วิชัย หัวหน้าใหญ่', role: 'supervisor', golf_course_id: 1, managed_golf_courses: [1, 2] }
];

const MOCK_VEHICLES = [
  { serial_number: 'KT-20220601', vehicle_number: 'A01', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'Club Car Precedent', battery_serial: 'BAT-2024-001', status: 'active', transfer_date: '2024-01-15' },
  { serial_number: 'GC-SN-002', vehicle_number: 'A02', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'E-Z-GO RXV', battery_serial: 'BAT-2024-002', status: 'active' },
  { serial_number: 'GC-SN-003', vehicle_number: 'B05', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'Yamaha Drive2', battery_serial: 'BAT-2023-015', status: 'inactive', transfer_date: '2023-12-20' },
  { serial_number: 'WL-2023-001', vehicle_number: 'A03', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'Club Car Precedent', battery_serial: 'BAT-2024-003', status: 'active' },
  { serial_number: 'WL-2023-002', vehicle_number: 'A04', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'E-Z-GO TXT', battery_serial: 'BAT-2024-004', status: 'parked', transfer_date: '2024-02-10' },
  { serial_number: 'WL-2023-003', vehicle_number: 'B01', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'Yamaha G29', battery_serial: 'BAT-2024-005', status: 'active' },
  { serial_number: 'WL-2023-004', vehicle_number: 'B02', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'Club Car DS', battery_serial: 'BAT-2023-020', status: 'spare' },
  { serial_number: 'WL-2023-005', vehicle_number: 'B03', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'E-Z-GO Freedom', battery_serial: 'BAT-2024-006', status: 'active', transfer_date: '2024-03-05' },
  { serial_number: 'GV-20230101', vehicle_number: 'C01', golf_course_id: 2, golf_course_name: 'กรีนวัลเลย์', model: 'Club Car Precedent', battery_serial: 'BAT-2024-007', status: 'active' },
  { serial_number: 'GV-20230102', vehicle_number: 'C02', golf_course_id: 2, golf_course_name: 'กรีนวัลเลย์', model: 'Yamaha Drive2', battery_serial: 'BAT-2023-025', status: 'inactive', transfer_date: '2024-01-25' },
  { serial_number: 'GV-2023-003', vehicle_number: 'C03', golf_course_id: 2, golf_course_name: 'กรีนวัลเลย์', model: 'E-Z-GO RXV', battery_serial: 'BAT-2024-008', status: 'active' },
  { serial_number: 'GV-2023-004', vehicle_number: 'C04', golf_course_id: 2, golf_course_name: 'กรีนวัลเลย์', model: 'Club Car DS', battery_serial: 'BAT-2023-030', status: 'spare', transfer_date: '2023-11-30' }
];

const MOCK_PARTS = [
  { name: 'แบตเตอรี่ 12V', unit: 'ลูก', stock_qty: 15, min_qty: 5, max_qty: 30 },
  { name: 'ยางล้อ', unit: 'เส้น', stock_qty: 40, min_qty: 10, max_qty: 60 },
  { name: 'ชุดควบคุมมอเตอร์', unit: 'ชุด', stock_qty: 5, min_qty: 2, max_qty: 10 },
  { name: 'ผ้าเบรค', unit: 'ชุด', stock_qty: 22, min_qty: 8, max_qty: 40 },
  { name: 'น้ำมันเฟืองท้าย', unit: 'ลิตร', stock_qty: 30, min_qty: 10, max_qty: 50 },
  { name: 'จารบี', unit: 'หลอด', stock_qty: 50, min_qty: 15, max_qty: 80 },
  { name: 'แปรงถ่าน', unit: 'ชุด', stock_qty: 18, min_qty: 6, max_qty: 30 },
  { name: 'ลูกหมาก', unit: 'ชิ้น', stock_qty: 25, min_qty: 8, max_qty: 40 },
  { name: 'ยางกันฝุ่น', unit: 'ชิ้น', stock_qty: 60, min_qty: 20, max_qty: 100 },
  { name: 'สายเบรค', unit: 'เส้น', stock_qty: 35, min_qty: 12, max_qty: 60 }
];

// POST - Seed ข้อมูลเริ่มต้น
export async function POST() {
  try {
    // ใช้ raw MongoDB command เพื่อตรวจสอบข้อมูลที่มีอยู่ โดยหลีกเลี่ยงปัญหา createdAt null
    let hasExistingData = false;
    let existingCounts = { golfCourses: 0, users: 0, vehicles: 0, parts: 0 };

    try {
      // ใช้ raw MongoDB commands เพื่อนับข้อมูล
      const countResults = await Promise.all([
        prisma.$runCommandRaw({ count: 'golf_courses' }),
        prisma.$runCommandRaw({ count: 'users' }),
        prisma.$runCommandRaw({ count: 'vehicles' }),
        prisma.$runCommandRaw({ count: 'parts' })
      ]);

      existingCounts = {
        golfCourses: (countResults[0] as any)?.n || 0,
        users: (countResults[1] as any)?.n || 0,
        vehicles: (countResults[2] as any)?.n || 0,
        parts: (countResults[3] as any)?.n || 0
      };

      hasExistingData = Object.values(existingCounts).some(count => count > 0);
    } catch (countError) {
      console.warn('Error counting with raw commands, assuming empty database:', countError);
      hasExistingData = false;
    }

    if (hasExistingData) {
      return NextResponse.json({
        success: false,
        message: 'Database already contains data. Use clear-data endpoint first if you want to reseed.',
        existingData: existingCounts,
        recommendation: 'Call POST /api/clear-data first, then retry this endpoint'
      }, { status: 400 });
    }

    const results = {
      golfCourses: 0,
      users: 0,
      vehicles: 0,
      parts: 0,
      errors: [] as string[]
    };

    const currentTime = new Date();

    // Helper function สำหรับการสร้างข้อมูลด้วย raw MongoDB operations
    const createWithRawMongoDB = async (collectionName: string, data: any[]): Promise<{ successCount: number; errors: string[] }> => {
      const errors: string[] = [];
      let successCount = 0;

      try {
        const documentsWithTimestamps = data.map(item => ({
          ...item,
          createdAt: currentTime,
          updatedAt: currentTime
        }));

        const result = await prisma.$runCommandRaw({
          insert: collectionName,
          documents: documentsWithTimestamps
        }) as { n?: number };
        
        successCount = typeof result.n === 'number' ? result.n : 0;
        console.log(`Successfully inserted ${successCount} ${collectionName} records`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error inserting ${collectionName}:`, error);
        errors.push(`Failed to insert ${collectionName}: ${errorMessage}`);
      }

      return { successCount, errors };
    };

    // Seed Golf Courses
    const golfCourseResult = await createWithRawMongoDB('golf_courses', MOCK_GOLF_COURSES);
    results.golfCourses = golfCourseResult.successCount;
    results.errors.push(...golfCourseResult.errors);

    // Seed Users
    const userResult = await createWithRawMongoDB('users', MOCK_USERS);
    results.users = userResult.successCount;
    results.errors.push(...userResult.errors);

    // Seed Vehicles
    const vehicleResult = await createWithRawMongoDB('vehicles', MOCK_VEHICLES);
    results.vehicles = vehicleResult.successCount;
    results.errors.push(...vehicleResult.errors);

    // Seed Parts
    const partResult = await createWithRawMongoDB('parts', MOCK_PARTS);
    results.parts = partResult.successCount;
    results.errors.push(...partResult.errors);

    // ตรวจสอบผลลัพธ์
    const totalExpected = MOCK_GOLF_COURSES.length + MOCK_USERS.length + MOCK_VEHICLES.length + MOCK_PARTS.length;
    const totalCreated = results.golfCourses + results.users + results.vehicles + results.parts;
    
    const responseData = {
      created: {
        golfCourses: results.golfCourses,
        users: results.users,
        vehicles: results.vehicles,
        parts: results.parts,
        total: totalCreated
      },
      expected: {
        golfCourses: MOCK_GOLF_COURSES.length,
        users: MOCK_USERS.length,
        vehicles: MOCK_VEHICLES.length,
        parts: MOCK_PARTS.length,
        total: totalExpected
      },
      ...(results.errors.length > 0 && { errors: results.errors })
    };

    const response = {
      success: totalCreated > 0,
      message: totalCreated === totalExpected 
        ? 'Database seeded successfully' 
        : `Database partially seeded. Created ${totalCreated}/${totalExpected} records`,
      data: responseData
    };

    // เพิ่มข้อมูล errors หากมี
    if (results.errors.length > 0) {
      response.message += `. Encountered ${results.errors.length} errors during seeding`;
    }

    return NextResponse.json(response, { 
      status: totalCreated > 0 ? 201 : 500 
    });

  } catch (error: unknown) {
    console.error('Error seeding database:', error);
    let errorMessage = 'An unknown error occurred.';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }
    
    return NextResponse.json({
      success: false,
      message: 'Failed to seed database',
      error: errorMessage,
      details: errorDetails,
      recommendation: 'Try clearing the database first with POST /api/clear-data, then retry seeding'
    }, { status: 500 });
  }
}
