// app/api/proxy/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 POST /api/proxy/auth/login - External API Only');
    console.log('📝 Request body:', JSON.stringify({ ...body, password: '[HIDDEN]' }, null, 2));

    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');

    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(`${EXTERNAL_API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('🌐 External API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ External API success');

      // ตรวจสอบว่า User ถูกระงับในฐานข้อมูลท้องถิ่นหรือไม่
      if (data.data && data.data.code) {
        try {
          const localUser = await prisma.user.findUnique({
            where: { code: data.data.code },
            select: { is_active: true, code: true }
          });

          if (localUser && localUser.is_active === false) {
            console.log('❌ Blocking login: User is locally suspended:', localUser.code);
            return NextResponse.json(
              {
                success: false,
                message: 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
                data: null
              },
              { status: 403 }
            );
          }
        } catch (dbError) {
          console.error('⚠️ Could not verify local status:', dbError);
        }
      }

      // Update isOnline and lastActive in local Prisma DB if user exists
      if (data.data && (data.data.id || data.data.code)) {
        try {
          await (prisma.user.update as any)({
            where: { code: data.data.code },
            data: {
              isOnline: true,
              lastActive: new Date()
            }
          });
          console.log('✅ Updated isOnline: true for user in Prisma (External Login)');
        } catch {
          console.log('⚠️ Could not update user in Prisma (might not exist locally)');
        }
      }

      return NextResponse.json(data);
    } else {
      console.log('❌ External API failed with status:', response.status);
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);

      // Fallback to Internal API เฉพาะกรณีที่ไม่พบผู้ใช้ (401)
      if (response.status === 401) {
        console.log('🔄 User not found in External API, trying Internal API as fallback...');
        try {
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
              // ตรวจสอบว่า user ถูกระงับการใช้งานหรือไม่
              if ((user as any).is_active === false) {
                console.log('❌ User is disabled:', user.code);
                return NextResponse.json(
                  {
                    success: false,
                    message: 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
                    data: null
                  },
                  { status: 403 }
                );
              }

              console.log('✅ Internal API fallback success for staff');

              // Update isOnline and lastActive
              await (prisma.user.update as any)({
                where: { id: user.id },
                data: {
                  isOnline: true,
                  lastActive: new Date()
                }
              });

              return NextResponse.json({
                success: true,
                message: 'Login successful',
                data: { ...user, isOnline: true, lastActive: new Date() }
              });
            }
          } else {
            // Admin/Supervisor/Central login - ใช้ username และ password
            const user = await prisma.user.findFirst({
              where: {
                OR: [
                  { code: { equals: identifier, mode: 'insensitive' } },
                  { username: { equals: identifier, mode: 'insensitive' } }
                ],
                role: { in: ['admin', 'supervisor', 'central'] as any }
              }
            });

            if (user) {
              // ตรวจสอบว่า user ถูกระงับการใช้งานหรือไม่
              if ((user as any).is_active === false) {
                console.log('❌ User is disabled:', user.code);
                return NextResponse.json(
                  {
                    success: false,
                    message: 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
                    data: null
                  },
                  { status: 403 }
                );
              }

              // ตรวจสอบรหัสผ่านจากฐานข้อมูล (เฉพาะ password ใหม่เท่านั้น)
              if (password === user.password) {
                console.log('✅ Internal API fallback success for admin/supervisor/central');

                // Update isOnline and lastActive
                await (prisma.user.update as any)({
                  where: { id: user.id },
                  data: {
                    isOnline: true,
                    lastActive: new Date()
                  }
                });

                return NextResponse.json({
                  success: true,
                  message: 'Login successful',
                  data: { ...user, isOnline: true, lastActive: new Date() }
                });
              } else {
                // รหัสผ่านไม่ถูกต้อง
                console.log('❌ Internal API fallback failed - wrong password');
                return NextResponse.json(
                  {
                    success: false,
                    message: 'รหัสผ่านไม่ถูกต้อง',
                    data: null
                  },
                  { status: 401 }
                );
              }
            }
          }

          console.log('❌ Internal API fallback also failed - user not found');

          // กำหนดข้อความ error ที่เหมาะสมตาม loginType
          const errorMessage = loginType === 'staff'
            ? 'ไม่พบรหัสพนักงานในระบบ'
            : 'ไม่พบชื่อผู้ใช้ในระบบผู้ดูแล';

          return NextResponse.json(
            {
              success: false,
              message: errorMessage,
              data: null
            },
            { status: 401 }
          );
        } catch (fallbackError) {
          console.error('❌ Internal API fallback error:', fallbackError);
          return NextResponse.json(
            {
              success: false,
              message: 'เกิดข้อผิดพลาดในการล็อกอิน',
              data: null
            },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        {
          success: false,
          message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
          data: null,
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error authenticating user:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to authenticate with external API',
        data: null,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}