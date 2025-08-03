// app/api/proxy/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = 'http://golfcar.go2kt.com:8080/api';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/proxy/users - External API Only');
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('🌐 External API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ External API success');
      
      // แปลง role กลับจาก "admin" เป็น "central" สำหรับผู้ใช้ที่มี managed_golf_courses ครบทุกสนาม
      if (data.success && data.data && Array.isArray(data.data)) {
        // สำหรับ array ของ users
        data.data = data.data.map((user: any) => {
          if (user.role === 'admin' && user.managed_golf_courses && user.managed_golf_courses.length > 0) {
            // ตรวจสอบว่าเป็น central user หรือไม่ (อาจจะดูจาก managed_golf_courses หรือ field อื่น)
            // สำหรับตอนนี้ ให้ใช้ logic ง่ายๆ ว่าถ้า admin ที่มี managed_golf_courses มากกว่า 1 สนาม = central
            if (user.managed_golf_courses.length > 1) {
              return { ...user, role: 'central' };
            }
          }
          return user;
        });
      }
      
      return NextResponse.json(data);
    } else {
      console.log('❌ External API failed with status:', response.status);
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      
      return NextResponse.json(
        { 
          success: false, 
          message: `External API failed with status ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch users from external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 PUT /api/proxy/users - External API Only');
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    // แปลง role "central" เป็น "admin" สำหรับ External API
    const modifiedBody = { ...body };
    if (modifiedBody.role === 'central') {
      console.log('🔄 Converting "central" role to "admin" for External API');
      modifiedBody.role = 'admin';
    }
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/users`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modifiedBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('🌐 External API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ External API success');
      
      // แปลง role กลับเป็น "central" ถ้าเป็นการอัปเดต central user
      if (data.success && data.data && body.role === 'central') {
        data.data.role = 'central';
      }
      
      return NextResponse.json(data);
    } else {
      console.log('❌ External API failed with status:', response.status);
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      
      return NextResponse.json(
        { 
          success: false, 
          message: `External API failed with status ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error updating user:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update user with external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 POST /api/proxy/users - External API Only');
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    // แปลง role "central" เป็น "admin" สำหรับ External API
    const modifiedBody = { ...body };
    if (modifiedBody.role === 'central') {
      console.log('🔄 Converting "central" role to "admin" for External API');
      modifiedBody.role = 'admin';
    }
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modifiedBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('🌐 External API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ External API success');
      
      // แปลง role กลับเป็น "central" ถ้าเป็นการสร้าง central user
      if (data.success && data.data && body.role === 'central') {
        data.data.role = 'central';
      }
      
      return NextResponse.json(data);
    } else {
      console.log('❌ External API failed with status:', response.status);
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      
      return NextResponse.json(
        { 
          success: false, 
          message: `External API failed with status ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error creating user:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create user with external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}