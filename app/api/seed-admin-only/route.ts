import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// ข้อมูล Administrator เริ่มต้นเท่านั้น
const ADMIN_USER = {
  code: 'admin000',
  username: 'admin000',
  name: 'administrator',
  role: 'admin' as const,
  password: 'admin000', // รหัสผ่านเริ่มต้น
  managed_golf_courses: [] as string[] // แก้ไขให้เป็น string array ตาม Prisma schema
};

// สนามกอล์ฟเริ่มต้น 1 สนาม สำหรับ admin
const DEFAULT_GOLF_COURSE = {
  name: 'สำนักงานใหญ่'
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

    // Seed Default Golf Course first
    let golfCourseId: string | null = null;
    try {
      const golfCourse = await prisma.golfCourse.create({
        data: {
          name: DEFAULT_GOLF_COURSE.name,
          location: 'สำนักงานใหญ่'
        }
      });
      golfCourseId = golfCourse.id;
      results.golfCourses = 1;
      console.log(`Successfully created golf course with ID: ${golfCourseId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating golf course:', error);
      results.errors.push(`Failed to create golf course: ${errorMessage}`);
    }

    // Seed Administrator User with golf course reference
    if (golfCourseId) {
      try {
        const adminUser = await prisma.user.create({
          data: {
            code: ADMIN_USER.code,
            username: ADMIN_USER.username,
            name: ADMIN_USER.name,
            role: ADMIN_USER.role,
            password: ADMIN_USER.password,
            managed_golf_courses: [], // ส่งเป็น empty array ของ strings
            golf_course_id: golfCourseId,
            golf_course_name: DEFAULT_GOLF_COURSE.name
          }
        });
        results.users = 1;
        console.log(`Successfully created admin user: ${adminUser.code}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error creating admin user:', error);
        results.errors.push(`Failed to create admin user: ${errorMessage}`);
      }
    } else {
      results.errors.push('Cannot create admin user: Golf course creation failed');
    }

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
        username: ADMIN_USER.username,
        name: ADMIN_USER.name,
        role: ADMIN_USER.role,
        password: ADMIN_USER.password,
        loginInstructions: 'ใช้ username: admin000 และ password: admin000 สำหรับล็อกอิน'
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