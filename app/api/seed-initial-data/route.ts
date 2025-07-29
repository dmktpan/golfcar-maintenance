import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Mock Data สำหรับ Seed
const MOCK_GOLF_COURSES = [
  { name: 'วอเตอร์แลนด์', location: 'กรุงเทพมหานคร' },
  { name: 'กรีนวัลเลย์', location: 'นนทบุรี' }
];

const MOCK_USERS = [
  // Admin 2 คน
  { 
    code: 'admin001', 
    name: 'ผู้ดูแลระบบ', 
    role: 'admin', 
    golf_course_id: '1', // จะต้องแปลงเป็น ObjectId ตอน insert
    golf_course_name: 'วอเตอร์แลนด์',
    managed_golf_courses: ['1', '2'], // จะต้องแปลงเป็น ObjectId ตอน insert
    password: '$2b$10$defaultpassword' // default hashed password
  },
  { 
    code: 'admin002', 
    name: 'ผู้จัดการทั่วไป', 
    role: 'admin', 
    golf_course_id: '2',
    golf_course_name: 'กรีนวัลเลย์',
    managed_golf_courses: ['1', '2'],
    password: '$2b$10$defaultpassword'
  },
  
  // Supervisor 2 คน
  { 
    code: 'super001', 
    name: 'หัวหน้าช่างวอเตอร์แลนด์', 
    role: 'supervisor', 
    golf_course_id: '1',
    golf_course_name: 'วอเตอร์แลนด์',
    managed_golf_courses: ['1'],
    password: '$2b$10$defaultpassword'
  },
  { 
    code: 'super002', 
    name: 'หัวหน้าช่างกรีนวัลเลย์', 
    role: 'supervisor', 
    golf_course_id: '2',
    golf_course_name: 'กรีนวัลเลย์',
    managed_golf_courses: ['2'],
    password: '$2b$10$defaultpassword'
  },
  
  // Staff 2 คน
  { 
    code: 'staff001', 
    name: 'ช่างซ่อมวอเตอร์แลนด์', 
    role: 'staff', 
    golf_course_id: '1',
    golf_course_name: 'วอเตอร์แลนด์',
    managed_golf_courses: [],
    password: '$2b$10$defaultpassword'
  },
  { 
    code: 'staff002', 
    name: 'ช่างซ่อมกรีนวัลเลย์', 
    role: 'staff', 
    golf_course_id: '2',
    golf_course_name: 'กรีนวัลเลย์',
    managed_golf_courses: [],
    password: '$2b$10$defaultpassword'
  }
];

const MOCK_VEHICLES = [
  // Vehicles สำหรับวอเตอร์แลนด์ (4 คัน)
  { 
    serial_number: 'WL-2024-001', 
    vehicle_number: 'A01', 
    golf_course_id: '1', // จะต้องแปลงเป็น ObjectId ตอน insert
    golf_course_name: 'วอเตอร์แลนด์', 
    brand: 'Club Car',
    model: 'Precedent', 
    year: 2024,
    battery_serial: 'BAT-2024-001', 
    status: 'active', 
    transfer_date: '2024-01-15T00:00:00.000Z'
  },
  { 
    serial_number: 'WL-2024-002', 
    vehicle_number: 'A02', 
    golf_course_id: '1',
    golf_course_name: 'วอเตอร์แลนด์', 
    brand: 'E-Z-GO',
    model: 'RXV', 
    year: 2024,
    battery_serial: 'BAT-2024-002', 
    status: 'active'
  },
  { 
    serial_number: 'WL-2024-003', 
    vehicle_number: 'A03', 
    golf_course_id: '1',
    golf_course_name: 'วอเตอร์แลนด์', 
    brand: 'Yamaha',
    model: 'Drive2', 
    year: 2024,
    battery_serial: 'BAT-2024-003', 
    status: 'parked'
  },
  { 
    serial_number: 'WL-2024-004', 
    vehicle_number: 'A04', 
    golf_course_id: '1',
    golf_course_name: 'วอเตอร์แลนด์', 
    brand: 'Club Car',
    model: 'DS', 
    year: 2023,
    battery_serial: 'BAT-2024-004', 
    status: 'spare'
  },
  
  // Vehicles สำหรับกรีนวัลเลย์ (4 คัน)
  { 
    serial_number: 'GV-2024-001', 
    vehicle_number: 'B01', 
    golf_course_id: '2',
    golf_course_name: 'กรีนวัลเลย์', 
    brand: 'Club Car',
    model: 'Precedent', 
    year: 2024,
    battery_serial: 'BAT-2024-005', 
    status: 'active'
  },
  { 
    serial_number: 'GV-2024-002', 
    vehicle_number: 'B02', 
    golf_course_id: '2',
    golf_course_name: 'กรีนวัลเลย์', 
    brand: 'E-Z-GO',
    model: 'TXT', 
    year: 2024,
    battery_serial: 'BAT-2024-006', 
    status: 'active'
  },
  { 
    serial_number: 'GV-2024-003', 
    vehicle_number: 'B03', 
    golf_course_id: '2',
    golf_course_name: 'กรีนวัลเลย์', 
    brand: 'Yamaha',
    model: 'G29', 
    year: 2023,
    battery_serial: 'BAT-2024-007', 
    status: 'inactive', 
    transfer_date: '2024-02-10T00:00:00.000Z'
  },
  { 
    serial_number: 'GV-2024-004', 
    vehicle_number: 'B04', 
    golf_course_id: '2',
    golf_course_name: 'กรีนวัลเลย์', 
    brand: 'E-Z-GO',
    model: 'Freedom', 
    year: 2024,
    battery_serial: 'BAT-2024-008', 
    status: 'spare'
  }
];

const MOCK_PARTS = [
  // อะไหล่พื้นฐาน (6 รายการ)
  { 
    name: 'แบตเตอรี่ 12V', 
    part_number: 'BAT-12V-001',
    category: 'ไฟฟ้า',
    unit: 'ลูก', 
    stock_qty: 15, 
    min_qty: 5, 
    max_qty: 30,
    golf_course_id: null // Global part
  },
  { 
    name: 'ยางล้อ', 
    part_number: 'TIRE-001',
    category: 'ยาง',
    unit: 'เส้น', 
    stock_qty: 40, 
    min_qty: 10, 
    max_qty: 60,
    golf_course_id: null
  },
  { 
    name: 'ชุดควบคุมมอเตอร์', 
    part_number: 'CTRL-001',
    category: 'ไฟฟ้า',
    unit: 'ชุด', 
    stock_qty: 5, 
    min_qty: 2, 
    max_qty: 10,
    golf_course_id: null
  },
  { 
    name: 'ผ้าเบรค', 
    part_number: 'BRAKE-001',
    category: 'เบรค',
    unit: 'ชุด', 
    stock_qty: 22, 
    min_qty: 8, 
    max_qty: 40,
    golf_course_id: null
  },
  { 
    name: 'น้ำมันเฟืองท้าย', 
    part_number: 'OIL-001',
    category: 'น้ำมัน',
    unit: 'ลิตร', 
    stock_qty: 30, 
    min_qty: 10, 
    max_qty: 50,
    golf_course_id: null
  },
  { 
    name: 'จารบี', 
    part_number: 'GREASE-001',
    category: 'น้ำมัน',
    unit: 'หลอด', 
    stock_qty: 50, 
    min_qty: 15, 
    max_qty: 80,
    golf_course_id: null
  }
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

    // ตรวจสอบว่ามีข้อมูลครบทุกประเภทหรือไม่
    const hasCompleteData = existingCounts.golfCourses >= MOCK_GOLF_COURSES.length && 
                           existingCounts.users >= MOCK_USERS.length && 
                           existingCounts.vehicles >= MOCK_VEHICLES.length && 
                           existingCounts.parts >= MOCK_PARTS.length;

    if (hasCompleteData) {
      return NextResponse.json({
        success: false,
        message: 'Database already contains complete data. Use clear-data endpoint first if you want to reseed.',
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
    const createWithRawMongoDB = async (collectionName: string, data: any[]): Promise<{ successCount: number; errors: string[]; insertedIds?: string[] }> => {
      const errors: string[] = [];
      let successCount = 0;
      let insertedIds: string[] = [];

      try {
        const documentsWithTimestamps = data.map(item => ({
          ...item,
          createdAt: currentTime,
          updatedAt: currentTime
        }));

        const result = await prisma.$runCommandRaw({
          insert: collectionName,
          documents: documentsWithTimestamps
        }) as { n?: number; insertedIds?: any[] };
        
        successCount = typeof result.n === 'number' ? result.n : 0;
        insertedIds = result.insertedIds ? result.insertedIds.map((id: any) => id.toString()) : [];
        console.log(`Successfully inserted ${successCount} ${collectionName} records`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error inserting ${collectionName}:`, error);
        errors.push(`Failed to insert ${collectionName}: ${errorMessage}`);
      }

      return { successCount, errors, insertedIds };
    };

    // Seed Golf Courses ก่อน
    const golfCourseResult = await createWithRawMongoDB('golf_courses', MOCK_GOLF_COURSES);
    results.golfCourses = golfCourseResult.successCount;
    results.errors.push(...golfCourseResult.errors);

    // ถ้า Golf Courses สร้างสำเร็จ ให้ดึง ObjectId จากฐานข้อมูล
    if (golfCourseResult.successCount >= 2) {
      try {
        // ดึง golf courses ที่เพิ่งสร้างจากฐานข้อมูล
        const createdGolfCourses = await prisma.golfCourse.findMany({
          orderBy: { createdAt: 'asc' },
          take: 2
        });

        if (createdGolfCourses.length >= 2) {
          const golfCourse1Id = createdGolfCourses[0].id;
          const golfCourse2Id = createdGolfCourses[1].id;

          // อัปเดต Users ด้วย ObjectId ที่ถูกต้อง
          const updatedUsers = MOCK_USERS.map(user => ({
            ...user,
            golf_course_id: user.golf_course_id === '1' ? golfCourse1Id : golfCourse2Id,
            managed_golf_courses: user.managed_golf_courses.map(id => 
              id === '1' ? golfCourse1Id : golfCourse2Id
            )
          }));

          // อัปเดต Vehicles ด้วย ObjectId ที่ถูกต้อง
          const updatedVehicles = MOCK_VEHICLES.map(vehicle => ({
            ...vehicle,
            golf_course_id: vehicle.golf_course_id === '1' ? golfCourse1Id : golfCourse2Id,
            transfer_date: vehicle.transfer_date ? new Date(vehicle.transfer_date) : undefined
          }));

          // Seed Users
          const userResult = await createWithRawMongoDB('users', updatedUsers);
          results.users = userResult.successCount;
          results.errors.push(...userResult.errors);

          // Seed Vehicles
          const vehicleResult = await createWithRawMongoDB('vehicles', updatedVehicles);
          results.vehicles = vehicleResult.successCount;
          results.errors.push(...vehicleResult.errors);
        } else {
          results.errors.push('Could not find created golf courses in database');
        }
      } catch (error) {
        console.error('Error fetching created golf courses:', error);
        results.errors.push('Failed to fetch created golf courses for users and vehicles');
      }
    } else {
      results.errors.push('Failed to create golf courses, skipping users and vehicles');
    }

    // Seed Parts (ไม่ต้องใช้ ObjectId)
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
