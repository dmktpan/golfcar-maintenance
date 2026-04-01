import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isValidObjectId } from '@/lib/utils/validation';

// GET - ดึงข้อมูลสนามกอล์ฟตาม ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    // ตรวจสอบ ObjectID
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid golf course ID format'
      }, { status: 400 });
    }
    
    const golfCourse = await prisma.golfCourse.findUnique({
      where: { id },
      include: {
        agreements: true
      }
    });

    if (!golfCourse) {
      return NextResponse.json({
        success: false,
        message: 'Golf course not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Golf course retrieved successfully',
      data: golfCourse
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching golf course:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch golf course',
      error: errorMessage
    }, { status: 500 });
  }
}

// PUT - อัปเดตข้อมูลสนามกอล์ฟ
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    // ตรวจสอบ ObjectID
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid golf course ID format'
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { name, location, code, isActive } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Golf course name is required'
      }, { status: 400 });
    }

    if (code) {
      const existingCode = await prisma.golfCourse.findFirst({
        where: { code: code.trim() }
      });
      if (existingCode && existingCode.id !== id) {
        return NextResponse.json({
          success: false,
          message: 'รหัสสนามนี้มีอยู่แล้วในระบบ'
        }, { status: 400 });
      }
    }

    const golfCourse = await prisma.golfCourse.update({
      where: { id },
      data: {
        name: name.trim(),
        location: location ? location.trim() : null,
        code: code !== undefined ? (code ? code.trim() : null) : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Golf course updated successfully',
      data: golfCourse
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error updating golf course:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to update golf course',
      error: errorMessage
    }, { status: 500 });
  }
}

// DELETE - ลบสนามกอล์ฟ
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // ตรวจสอบ ObjectID
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid golf course ID format'
      }, { status: 400 });
    }

    await prisma.golfCourse.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Golf course deleted successfully'
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error deleting golf course:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to delete golf course',
      error: errorMessage
    }, { status: 500 });
  }
}