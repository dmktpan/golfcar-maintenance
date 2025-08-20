import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path.join('/');
    const externalApiBaseUrl = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080';
    const imageUrl = `${externalApiBaseUrl}/${path}`;
    
    console.log(`🖼️ Proxying image request: ${imageUrl}`);
    
    // Fetch the image from external server
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'GolfCart-Maintenance-App/1.0',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 seconds timeout
    });
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch image: ${imageUrl} - Status: ${response.status}`);
      return new NextResponse('Image not found', { status: 404 });
    }
    
    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    console.log(`✅ Successfully proxied image: ${imageUrl} - Type: ${contentType}`);
    
    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
    
  } catch (error) {
    console.error('❌ Image proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}