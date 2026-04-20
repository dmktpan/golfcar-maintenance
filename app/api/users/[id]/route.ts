import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isValidObjectId } from '@/lib/utils/validation';

// GET - ดึงข้อมูลผู้ใช้ตาม ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // ตรวจสอบ ObjectID
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid user ID format'
      }, { status: 400 });
    }

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

// --- กำหนดค่า Permission เริ่มต้น ---
const VIEW_PERMISSIONS = [
    { id: 'pending_jobs:view', roles: ['admin', 'supervisor', 'manager', 'central'] },
    { id: 'history:view', roles: ['admin', 'supervisor', 'manager', 'clerk', 'central'] },
    { id: 'golf_course:view', roles: ['admin', 'supervisor', 'manager', 'stock', 'clerk', 'central'] },
    { id: 'users:view', roles: ['admin', 'supervisor', 'manager'] },
    { id: 'serial_history:view', roles: ['admin', 'supervisor', 'manager', 'stock', 'central'] },
    { id: 'stock:view', roles: ['admin', 'supervisor', 'manager', 'stock', 'clerk', 'staff', 'central'] },
];

const ACTION_PERMISSIONS = [
    { id: 'pending_jobs:approve', roles: ['admin', 'supervisor', 'manager'] },
    { id: 'central_job:create', roles: ['admin', 'supervisor', 'manager', 'central'] },
    { id: 'multi_assign:manage', roles: ['admin', 'supervisor', 'manager'] },
    { id: 'history:edit', roles: ['admin', 'supervisor'] },
    { id: 'golf_course:edit', roles: ['admin', 'supervisor', 'manager', 'stock'] },
    { id: 'users:edit', roles: ['admin', 'supervisor', 'manager'] },
    { id: 'system:manage', roles: ['admin'] },
    { id: 'part_request:approve', roles: ['admin', 'supervisor', 'stock'] },
    { id: 'stock:edit', roles: ['admin', 'stock'] },
];

const ALL_PERMISSIONS = [...VIEW_PERMISSIONS, ...ACTION_PERMISSIONS];

function getDefaultPermissions(role: string): string[] {
    return ALL_PERMISSIONS.filter(p => p.roles.includes(role)).map(p => p.id);
}

// PUT - อัปเดตข้อมูลผู้ใช้
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // ตรวจสอบ ObjectID
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid user ID format'
      }, { status: 400 });
    }

    const body = await request.json();
    const { code, username, name, role, golf_course_id, golf_course_name, managed_golf_courses, password } = body;

    // Validation
    if (!code || !username || !name || !role || !golf_course_id || !golf_course_name) {
      return NextResponse.json({
        success: false,
        message: 'Code, username, name, role, golf_course_id, and golf_course_name are required'
      }, { status: 400 });
    }

    if (!['staff', 'supervisor', 'central', 'admin', 'manager', 'stock', 'clerk'].includes(role)) {
      return NextResponse.json({
        success: false,
        message: 'Role must be staff, supervisor, central, admin, manager, stock, or clerk'
      }, { status: 400 });
    }

    const updateData: any = {
      code: code.trim(),
      username: username.trim(),
      name: name.trim(),
      role,
      golf_course_id: golf_course_id,
      golf_course_name: golf_course_name.trim(),
      managed_golf_courses: managed_golf_courses || []
    };

    // ตรวจสอบว่ามีการเปลี่ยน Role หรือไม่
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (existingUser && existingUser.role !== role) {
      updateData.permissions = getDefaultPermissions(role);
    }

    // เพิ่ม password หากมีการส่งมา (สำหรับการเปลี่ยนรหัสผ่าน)
    if (password && password.trim() !== '') {
      updateData.password = password.trim();
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
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

// PATCH - ระงับ/เปิดการใช้งานผู้ใช้
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // ตรวจสอบ ObjectID
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid user ID format'
      }, { status: 400 });
    }

    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json({
        success: false,
        message: 'is_active must be a boolean'
      }, { status: 400 });
    }

    const updateData: any = {
      is_active,
      // ถ้าเป็นการ disable ให้บันทึกวันที่
      ...(is_active === false && { disabled_at: new Date() }),
      // ถ้าเป็นการ enable ให้ล้างวันที่
      ...(is_active === true && { disabled_at: null })
    };

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    const actionText = is_active ? 'เปิดใช้งาน' : 'ระงับการใช้งาน';

    return NextResponse.json({
      success: true,
      message: `${actionText}ผู้ใช้สำเร็จ`,
      data: user
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error updating user status:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to update user status',
      error: errorMessage
    }, { status: 500 });
  }
}

// DELETE - ลบผู้ใช้
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // ตรวจสอบ ObjectID
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid user ID format'
      }, { status: 400 });
    }

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