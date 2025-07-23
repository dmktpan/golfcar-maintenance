import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงข้อมูลผู้ใช้ตาม ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching user:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch user',
      error: errorMessage
    }, { status: 500 });
  }
}

// PUT - อัปเดตข้อมูลผู้ใช้
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    const { code, name, role, golf_course_id, managed_golf_courses } = body;

    // Validation
    if (!code || !name || !role || !golf_course_id) {
      return NextResponse.json({
        success: false,
        message: 'Code, name, role, and golf_course_id are required'
      }, { status: 400 });
    }

    if (!['staff', 'supervisor', 'admin'].includes(role)) {
      return NextResponse.json({
        success: false,
        message: 'Role must be staff, supervisor, or admin'
      }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        code: code.trim(),
        name: name.trim(),
        role,
        golf_course_id: parseInt(golf_course_id),
        managed_golf_courses: managed_golf_courses || []
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: user
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error updating user:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to update user',
      error: errorMessage
    }, { status: 500 });
  }
}

// DELETE - ลบผู้ใช้
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error deleting user:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to delete user',
      error: errorMessage
    }, { status: 500 });
  }
}