// app/api/proxy/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = 'http://golfcar.go2kt.com:8080/api';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/proxy/jobs - External API Only');
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/jobs`, {
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
      return NextResponse.json(data);
    } else {
      console.log('❌ External API failed with status:', response.status);
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      
      return NextResponse.json(
        { 
          success: false, 
          message: `External API failed with status ${response.status}`,
          details: errorText,
          data: [] 
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error fetching jobs:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch jobs from external API',
        details: error instanceof Error ? error.message : 'Unknown error',
        data: [] 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 POST /api/proxy/jobs - External API Only');
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/jobs`, {
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
      
      return NextResponse.json(
        { 
          success: false, 
          message: `External API failed with status ${response.status}`,
          details: errorText,
          data: null 
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error creating job:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create job with external API',
        details: error instanceof Error ? error.message : 'Unknown error',
        data: null 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 PUT /api/proxy/jobs - External API Only');
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/jobs`, {
      method: 'PUT',
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
      
      // ตรวจสอบว่า response มี success field หรือไม่
      if (data && typeof data === 'object') {
        // ถ้า External API ไม่ส่ง success field ให้เพิ่มเข้าไป
        if (!('success' in data)) {
          data.success = true;
        }
        return NextResponse.json(data);
      } else {
        // ถ้า response ไม่ใช่ object ให้ wrap ใน standard format
        return NextResponse.json({
          success: true,
          message: 'Job updated successfully',
          data: data
        });
      }
    } else {
      console.log('❌ External API failed with status:', response.status);
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      
      // พยายาม parse error response เป็น JSON
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || `External API failed with status ${response.status}`,
          details: errorText,
          data: null 
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error updating job:', error);
    
    // จัดการ error ต่างๆ
    let errorMessage = 'Failed to update job with external API';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - External API took too long to respond';
        statusCode = 408;
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error - Unable to connect to external API';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        data: null 
      },
      { status: statusCode }
    );
  }
}