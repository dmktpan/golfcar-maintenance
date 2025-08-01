// app/api/proxy/serial-history/route.ts
import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = 'http://golfcar.go2kt.com:8080/api';

// Retry function with exponential backoff
async function retryFetch(url: string, options: RequestInit, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // ถ้าสำเร็จหรือเป็น client error (4xx) ไม่ต้อง retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      // ถ้าเป็น server error (5xx) และยังมี attempt เหลือ ให้ retry
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // exponential backoff
        console.log(`⏳ Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ Retry attempt ${attempt}/${maxRetries} after ${delay}ms due to error:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/proxy/serial-history - External API with retry');
    
    // ใช้ External API เท่านั้น พร้อม retry mechanism
    console.log('🌐 Calling external API with retry...');
    
    const response = await retryFetch(`${EXTERNAL_API_BASE}/serial-history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
    console.error('❌ Error fetching serial history:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch serial history from external API', 
        data: [],
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 PUT /api/proxy/serial-history - External API Only');
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    // เตรียมข้อมูลสำหรับ External API โดยรวมข้อมูลอะไหล่ด้วย
    const serialHistoryData = {
      ...body,
      // ตรวจสอบและเพิ่มข้อมูลอะไหล่ถ้ามี
      parts_used: body.parts_used || [],
      system: body.system || 'serial_history'
    };
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    console.log('📝 Serial history data with parts:', JSON.stringify(serialHistoryData, null, 2));
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/serial-history`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serialHistoryData),
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
    console.error('❌ Error updating serial history:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update serial history with external API',
        data: null,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 POST /api/proxy/serial-history - External API Only');
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    // เตรียมข้อมูลสำหรับ External API โดยรวมข้อมูลอะไหล่ด้วย
    const serialHistoryData = {
      ...body,
      // ตรวจสอบและเพิ่มข้อมูลอะไหล่ถ้ามี
      parts_used: body.parts_used || [],
      system: body.system || 'serial_history'
    };
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    console.log('📝 Serial history data with parts:', JSON.stringify(serialHistoryData, null, 2));
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/serial-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serialHistoryData),
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
    console.error('❌ Error creating serial history:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create serial history with external API', 
        data: null,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}