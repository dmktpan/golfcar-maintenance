import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงข้อมูลผู้ใช้ทั้งหมด
export async function GET() {
  try {
    // ใช้ raw MongoDB operations เพื่อหลีกเลี่ยงปัญหา createdAt null
    let users: any[] = [];
    
    try {
      // ลองใช้ Prisma findMany ก่อน
      users = await prisma.user.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (prismaError) {
      console.warn('Prisma findMany failed, using raw MongoDB:', prismaError);
      
      // Fallback ใช้ raw MongoDB operations
      try {
        const result = await prisma.$runCommandRaw({
          find: 'users',
          sort: { createdAt: -1 }
        }) as { cursor?: { firstBatch?: any[] } };
        
        users = result?.cursor?.firstBatch || [];
        
        // แปลง _id เป็น id สำหรับ compatibility
        users = users.map(user => ({
          ...user,
          id: user._id,
          _id: undefined
        }));
      } catch (rawError) {
        console.error('Raw MongoDB query also failed:', rawError);
        throw rawError;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      count: users.length
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch users',
      error: errorMessage
    }, { status: 500 });
  }
}

// POST - สร้างผู้ใช้ใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, username, name, role, golf_course_id, golf_course_name, managed_golf_courses, password } = body;

    // Validation
    if (!code || !username || !name || !role || !golf_course_id || !golf_course_name) {
      return NextResponse.json({
        success: false,
        message: 'Code, username, name, role, golf_course_id, and golf_course_name are required'
      }, { status: 400 });
    }

    if (!['staff', 'supervisor', 'central', 'admin'].includes(role)) {
      return NextResponse.json({
        success: false,
        message: 'Role must be staff, supervisor, central, or admin'
      }, { status: 400 });
    }

    // ตรวจสอบ password สำหรับ admin, supervisor และ central
    if ((role === 'admin' || role === 'supervisor' || role === 'central') && !password) {
      return NextResponse.json({
        success: false,
        message: 'Password is required for admin, supervisor, and central roles'
      }, { status: 400 });
    }

    let user: any;
    const currentTime = new Date();

    try {
      // ลองใช้ Prisma create ก่อน
      const userData: any = {
        code: code.trim(),
        username: username.trim(),
        name: name.trim(),
        role,
        golf_course_id: golf_course_id,
        golf_course_name: golf_course_name.trim(),
        managed_golf_courses: managed_golf_courses || []
      };

      // เพิ่ม password หากมี
      if (password && password.trim() !== '') {
        userData.password = password.trim();
      }

      user = await prisma.user.create({
        data: userData
      });
    } catch (prismaError) {
      console.warn('Prisma create failed, using raw MongoDB:', prismaError);
      
      // Fallback ใช้ raw MongoDB operations
      const documentData: any = {
        code: code.trim(),
        username: username.trim(),
        name: name.trim(),
        role,
        golf_course_id: golf_course_id,
        golf_course_name: golf_course_name.trim(),
        managed_golf_courses: managed_golf_courses || [],
        createdAt: currentTime,
        updatedAt: currentTime
      };

      // เพิ่ม password หากมี
      if (password && password.trim() !== '') {
        documentData.password = password.trim();
      }

      const result = await prisma.$runCommandRaw({
        insert: 'users',
        documents: [documentData]
      }) as { n?: number };

      if (result.n && result.n > 0) {
        user = documentData;
      } else {
        throw new Error('Failed to create user');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: user
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating user:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to create user',
      error: errorMessage
    }, { status: 500 });
  }
}