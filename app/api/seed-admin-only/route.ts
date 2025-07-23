import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// ข้อมูล Administrator เริ่มต้นเท่านั้น
const ADMIN_USER = {
  code: 'admin000',
  name: 'administrator',
  role: 'admin',
  golf_course_id: 1,
  managed_golf_courses: []
};

// สนามกอล์ฟเริ่มต้น 1 สนาม สำหรับ admin
const DEFAULT_GOLF_COURSE = {
  name: 'สนามกอล์ฟหลัก'
};

// POST - Seed เฉพาะ Administrator Account และสนามกอล์ฟเริ่มต้น
export async function POST() {
  try {
    // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
    let hasExistingData = false;
    let existingCounts = { golfCourses: 0, users: 0 };

    try {
      // ใช้ raw MongoDB commands เพื่อนับข้อมูล
      const countResults = await Promise.all([
        prisma.$runCommandRaw({ count: 'golf_courses' }),
        prisma.$runCommandRaw({ count: 'users' })
      ]);

      existingCounts = {
        golfCourses: (countResults[0] as any)?.n || 0,
        users: (countResults[1] as any)?.n || 0
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

    // Seed Default Golf Course
    const golfCourseResult = await createWithRawMongoDB('golf_courses', [DEFAULT_GOLF_COURSE]);
    results.golfCourses = golfCourseResult.successCount;
    results.errors.push(...golfCourseResult.errors);

    // Seed Administrator User
    const userResult = await createWithRawMongoDB('users', [ADMIN_USER]);
    results.users = userResult.successCount;
    results.errors.push(...userResult.errors);

    // ตรวจสอบผลลัพธ์
    const totalExpected = 2; // 1 golf course + 1 admin user
    const totalCreated = results.golfCourses + results.users;
    
    const responseData = {
      created: {
        golfCourses: results.golfCourses,
        users: results.users,
        total: totalCreated
      },
      expected: {
        golfCourses: 1,
        users: 1,
        total: totalExpected
      },
      adminAccount: {
        code: ADMIN_USER.code,
        name: ADMIN_USER.name,
        role: ADMIN_USER.role
      },
      ...(results.errors.length > 0 && { errors: results.errors })
    };

    const response = {
      success: totalCreated > 0,
      message: totalCreated === totalExpected 
        ? 'Administrator account and default golf course created successfully' 
        : `Partial setup completed. Created ${totalCreated}/${totalExpected} records`,
      data: responseData
    };

    // เพิ่มข้อมูล errors หากมี
    if (results.errors.length > 0) {
      response.message += `. Encountered ${results.errors.length} errors during setup`;
    }

    return NextResponse.json(response, { 
      status: totalCreated > 0 ? 201 : 500 
    });

  } catch (error: unknown) {
    console.error('Error setting up admin account:', error);
    let errorMessage = 'An unknown error occurred.';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }
    
    return NextResponse.json({
      success: false,
      message: 'Failed to setup administrator account',
      error: errorMessage,
      details: errorDetails,
      recommendation: 'Try clearing the database first with POST /api/clear-data, then retry this endpoint'
    }, { status: 500 });
  }
}