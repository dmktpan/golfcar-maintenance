// app/api/proxy/parts-usage-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = 'http://golfcar.go2kt.com:8080/api';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/proxy/parts-usage-logs - External API Only');
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/parts-usage-logs`, {
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
          data: [],
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error fetching parts usage logs:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch parts usage logs from external API', 
        data: [],
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 POST /api/proxy/parts-usage-logs - External API Only');
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/parts-usage-logs`, {
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
          data: null,
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error creating parts usage log:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create parts usage log with external API', 
        data: null,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}