// app/api/proxy/vehicles/transfer/route.ts
import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 POST /api/proxy/vehicles/transfer - Using Internal API');
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    // เรียก Internal API แทน External API เพื่อแก้ปัญหา performed_by null
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const internalApiUrl = `${baseUrl}/api/vehicles/transfer`;
    
    console.log('🏠 Calling internal API:', internalApiUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(internalApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('🏠 Internal API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Internal API success');
      return NextResponse.json(data);
    } else {
      console.log('❌ Internal API failed with status:', response.status);
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Internal API failed with status ${response.status}`,
          data: null,
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error in vehicles transfer POST proxy:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to transfer vehicles with internal API' },
      { status: 500 }
    );
  }
}