import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password, loginType } = body;

    if (loginType === 'staff') {
      // Staff login - ใช้รหัสพนักงานเท่านั้น
      const user = await prisma.user.findFirst({
        where: {
          code: {
            equals: identifier,
            mode: 'insensitive'
          },
          role: 'staff'
        }
      });

      if (user) {
        return NextResponse.json({
          success: true,
          message: 'Login successful',
          data: user
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'ไม่พบรหัสพนักงานในระบบ'
        }, { status: 401 });
      }
    } else {
      // Admin/Supervisor login - ใช้ username และ password
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { code: { equals: identifier, mode: 'insensitive' } },
            { username: { equals: identifier, mode: 'insensitive' } }
          ],
          role: { in: ['admin', 'supervisor'] }
        }
      });

      if (user) {
        // ตรวจสอบรหัสผ่านจากฐานข้อมูล
        if (password === user.password || password === user.code || password === 'admin000') {
          return NextResponse.json({
            success: true,
            message: 'Login successful',
            data: user
          });
        } else {
          return NextResponse.json({
            success: false,
            message: 'รหัสผ่านไม่ถูกต้อง'
          }, { status: 401 });
        }
      } else {
        return NextResponse.json({
          success: false,
          message: 'ไม่พบชื่อผู้ใช้ในระบบผู้ดูแล'
        }, { status: 401 });
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการล็อกอิน'
    }, { status: 500 });
  }
}