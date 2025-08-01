// app/api/proxy/maintenance/route.ts
import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = 'http://golfcar.go2kt.com:8080/api';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/proxy/maintenance - External API Only');
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    // เพิ่ม query parameter เพื่อขอข้อมูล parts ด้วย
    const url = new URL(`${EXTERNAL_API_BASE}/maintenance`);
    url.searchParams.append('include', 'parts');
    
    const response = await fetch(url.toString(), {
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
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error fetching maintenance records:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch maintenance records from external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 PUT /api/proxy/maintenance - External API Only');
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    // เตรียมข้อมูลสำหรับ External API โดยรวมข้อมูลอะไหล่ด้วย
    const maintenanceData = {
      ...body,
      // ตรวจสอบและเพิ่มข้อมูลอะไหล่ถ้ามี
      parts_used: body.parts_used || body.parts || [],
      system: body.system || 'maintenance'
    };
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    console.log('📝 Maintenance data with parts:', JSON.stringify(maintenanceData, null, 2));
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/maintenance`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(maintenanceData),
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
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error updating maintenance record:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update maintenance record with external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 POST /api/proxy/maintenance - External API Only');
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    // เตรียมข้อมูลสำหรับ External API โดยรวมข้อมูลอะไหล่ด้วย
    const maintenanceData = {
      ...body,
      // ตรวจสอบและเพิ่มข้อมูลอะไหล่ถ้ามี
      parts_used: body.parts_used || body.parts || [],
      system: body.system || 'maintenance'
    };
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    console.log('📝 Maintenance data with parts:', JSON.stringify(maintenanceData, null, 2));
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(maintenanceData),
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
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error creating maintenance record:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create maintenance record with external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}