// app/api/proxy/vehicles/transfer/route.ts
import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api';

export async function POST(request: NextRequest) {
  try {    const originalBody = await request.json();
    console.log('🔄 POST /api/proxy/vehicles/transfer - Using External API');
    console.log('📝 Original request body:', JSON.stringify(originalBody, null, 2));
    
    // กรอง performed_by field ออกจาก request body เพื่อป้องกัน Prisma error
    const { performed_by, ...cleanBody } = originalBody;
    console.log('📝 Cleaned request body (removed performed_by):', JSON.stringify(cleanBody, null, 2));
    
    // เรียก External API สำหรับ production
    const externalApiUrl = `${EXTERNAL_API_BASE}/vehicles/transfer`;
    
    console.log('� Calling external API:', externalApiUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(externalApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('� External API response status:', response.status);

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
    console.error('❌ Error in vehicles transfer POST proxy:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to transfer vehicles with external API' },
      { status: 500 }
    );
  }
}