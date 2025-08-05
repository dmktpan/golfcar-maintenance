// app/api/proxy/vehicles/route.ts
import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api';

// แมปสถานะจาก External API กลับมายัง frontend
// ตอนนี้ External API ใช้สถานะเดียวกันกับ frontend แล้ว
function mapStatusFromExternalAPI(externalStatus: string): string {
  // สำหรับ backward compatibility กับข้อมูลเก่า
  const legacyStatusMap: { [key: string]: string } = {
    'inactive': 'maintenance', // inactive เก่า -> รอซ่อม
    'spare': 'retired',        // spare เก่า -> เสื่อมแล้ว
    'parked': 'ready'          // parked เก่า -> พร้อมใช้
  };
  
  // ถ้าเป็นสถานะเก่า ให้แมป ถ้าไม่ใช่ ให้ใช้สถานะเดิม
  return legacyStatusMap[externalStatus] || externalStatus;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/proxy/vehicles - External API with improved error handling');
    
    // ใช้ External API พร้อม error handling ที่ดีขึ้น
    console.log('🌐 Calling external API...');
    
    // เพิ่ม timeout และ retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/vehicles`, {
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
      console.log('📝 Total vehicles found:', data.length || data.data?.length || 0);
      
      // แมปสถานะจาก External API กลับมายัง frontend สำหรับทุกรถ
      if (Array.isArray(data)) {
        data.forEach(vehicle => {
          if (vehicle.status) {
            vehicle.status = mapStatusFromExternalAPI(vehicle.status);
          }
        });
      } else if (data.data && Array.isArray(data.data)) {
        data.data.forEach((vehicle: any) => {
          if (vehicle.status) {
            vehicle.status = mapStatusFromExternalAPI(vehicle.status);
          }
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
    console.error('❌ Error fetching vehicles from external API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch vehicles from external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 PUT /api/proxy/vehicles - External API with improved error handling');
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    // ใช้ External API พร้อม error handling ที่ดีขึ้น
    console.log('🌐 Calling external API...');
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/vehicles`, {
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
    console.error('❌ Error updating vehicle via external API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update vehicle via external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 POST /api/proxy/vehicles - External API with improved error handling');
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    // ใช้ External API พร้อม error handling ที่ดีขึ้น
    console.log('🌐 Calling external API...');
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/vehicles`, {
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
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error creating vehicle via external API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create vehicle via external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}