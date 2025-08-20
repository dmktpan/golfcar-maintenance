// app/api/uploads/external/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080';
const EXTERNAL_API_TIMEOUT = parseInt(process.env.EXTERNAL_API_TIMEOUT || '10000');

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    const externalUrl = `${EXTERNAL_API_BASE}/uploads/${filePath}`;
    
    console.log(`🌐 Proxying external upload: ${externalUrl}`);
    
    // Fetch the file from external API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_API_TIMEOUT);
    
    const response = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'GolfCart-Maintenance-App/1.0',
        'Accept': '*/*',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`❌ External API file not found: ${externalUrl} - Status: ${response.status}`);
      
      // Try alternative paths
      const alternativeUrls = [
        `${EXTERNAL_API_BASE}/uploads/${filePath}`,
        `${EXTERNAL_API_BASE}/${filePath}`,
      ];
      
      for (const altUrl of alternativeUrls) {
        try {
          console.log(`🔄 Trying alternative URL: ${altUrl}`);
          const altController = new AbortController();
          const altTimeoutId = setTimeout(() => altController.abort(), EXTERNAL_API_TIMEOUT);
          
          const altResponse = await fetch(altUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'GolfCart-Maintenance-App/1.0',
              'Accept': '*/*',
            },
            signal: altController.signal,
          });
          
          clearTimeout(altTimeoutId);
          
          if (altResponse.ok) {
            console.log(`✅ Found file at alternative URL: ${altUrl}`);
            const fileBuffer = await altResponse.arrayBuffer();
            const contentType = altResponse.headers.get('content-type') || getContentTypeFromPath(filePath);
            
            return new NextResponse(fileBuffer, {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
              },
            });
          }
        } catch (altError) {
          console.log(`❌ Alternative URL failed: ${altUrl}`);
          continue;
        }
      }
      
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Get the file data
    const fileBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || getContentTypeFromPath(filePath);
    
    console.log(`✅ Successfully proxied external file: ${externalUrl} - Type: ${contentType}`);
    
    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
    
  } catch (error) {
    console.error('❌ External file proxy error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new NextResponse('Request timeout', { status: 408 });
      }
      if (error.message.includes('fetch')) {
        return new NextResponse('External API unavailable', { status: 503 });
      }
    }
    
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Helper function to determine content type from file path
function getContentTypeFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
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