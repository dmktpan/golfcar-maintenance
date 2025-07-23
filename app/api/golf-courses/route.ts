import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงข้อมูลสนามกอล์ฟทั้งหมด
export async function GET() {
  try {
    // ใช้ raw MongoDB operations เพื่อหลีกเลี่ยงปัญหา createdAt null
    let golfCourses: any[] = [];
    
    try {
      // ลองใช้ Prisma findMany ก่อน
      golfCourses = await prisma.golfCourse.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (prismaError) {
      console.warn('Prisma findMany failed, using raw MongoDB:', prismaError);
      
      // Fallback ใช้ raw MongoDB operations
      try {
        const result = await prisma.$runCommandRaw({
          find: 'golf_courses',
          sort: { createdAt: -1 }
        }) as { cursor?: { firstBatch?: any[] } };
        
        golfCourses = result?.cursor?.firstBatch || [];
        
        // แปลง _id เป็น id สำหรับ compatibility
        golfCourses = golfCourses.map(course => ({
          ...course,
          id: course._id,
          _id: undefined
        }));
      } catch (rawError) {
        console.error('Raw MongoDB query also failed:', rawError);
        throw rawError;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Golf courses retrieved successfully',
      data: golfCourses,
      count: golfCourses.length
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching golf courses:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch golf courses',
      error: errorMessage
    }, { status: 500 });
  }
}

// POST - สร้างสนามกอล์ฟใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Golf course name is required'
      }, { status: 400 });
    }

    let golfCourse: any;
    const currentTime = new Date();

    try {
      // ลองใช้ Prisma create ก่อน
      golfCourse = await prisma.golfCourse.create({
        data: {
          name: name.trim()
        }
      });
    } catch (prismaError) {
      console.warn('Prisma create failed, using raw MongoDB:', prismaError);
      
      // Fallback ใช้ raw MongoDB operations
      const result = await prisma.$runCommandRaw({
        insert: 'golf_courses',
        documents: [{
          name: name.trim(),
          createdAt: currentTime,
          updatedAt: currentTime
        }]
      }) as { n?: number };

      if (result.n && result.n > 0) {
        golfCourse = {
          name: name.trim(),
          createdAt: currentTime,
          updatedAt: currentTime
        };
      } else {
        throw new Error('Failed to create golf course');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Golf course created successfully',
      data: golfCourse
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating golf course:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to create golf course',
      error: errorMessage
    }, { status: 500 });
  }
}