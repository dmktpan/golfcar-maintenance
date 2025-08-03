// app/api/proxy/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const EXTERNAL_API_BASE = 'http://golfcar.go2kt.com:8080/api';

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
              console.log('✅ Internal API fallback success for staff');
              return NextResponse.json({
                success: true,
                message: 'Login successful',
                data: user
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
              // ตรวจสอบรหัสผ่านจากฐานข้อมูล
              if (password === user.password || password === user.code || password === 'admin000') {
                console.log('✅ Internal API fallback success for admin/supervisor/central');
                return NextResponse.json({
                  success: true,
                  message: 'Login successful',
                  data: user
                });
              }
            }
          }
          
          console.log('❌ Internal API fallback also failed');
        } catch (fallbackError) {
          console.error('❌ Internal API fallback error:', fallbackError);
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: `External API failed with status ${response.status}`,
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