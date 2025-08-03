// app/api/proxy/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = 'http://golfcar.go2kt.com:8080/api';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    console.log(`🔄 GET /api/proxy/users/${id} - External API Only`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/users/${id}`, {
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
      
      // แปลง role กลับจาก "admin" เป็น "central" สำหรับผู้ใช้ที่มี managed_golf_courses มากกว่า 1 สนาม
      if (data.success && data.data && data.data.role === 'admin' && 
          data.data.managed_golf_courses && data.data.managed_golf_courses.length > 1) {
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
          data: null,
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error in users GET proxy:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user from external API' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    console.log(`🔄 PUT /api/proxy/users/${id} - External API Only`);
    
    // แปลง role "central" เป็น "admin" สำหรับ External API
    const modifiedBody = { ...body };
    if (modifiedBody.role === 'central') {
      console.log('🔄 Converting "central" role to "admin" for External API');
      modifiedBody.role = 'admin';
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/users/${id}`, {
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
          data: null,
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error in users PUT proxy:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user with external API' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    console.log(`🗑️ DELETE /api/proxy/users/${id} - External API Only`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/users/${id}`, {
      method: 'DELETE',
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
      return NextResponse.json(data);
    } else {
      console.log('❌ External API failed with status:', response.status);
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      
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
    console.error('❌ Error in users DELETE proxy:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete user with external API' },
      { status: 500 }
    );
  }
}