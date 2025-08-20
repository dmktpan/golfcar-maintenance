// app/api/uploads/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// กำหนด upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    
    // ตรวจสอบความปลอดภัยของ path
    if (!filePath || filePath.includes('..') || filePath.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    const fullPath = path.join(UPLOAD_DIR, filePath);
    
    // ตรวจสอบว่าไฟล์อยู่ใน upload directory
    const normalizedUploadDir = path.resolve(UPLOAD_DIR);
    const normalizedFilePath = path.resolve(fullPath);
    
    if (!normalizedFilePath.startsWith(normalizedUploadDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // ตรวจสอบว่าไฟล์มีอยู่จริง
    if (!existsSync(normalizedFilePath)) {
      console.log(`❌ File not found: ${normalizedFilePath}`);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // อ่านไฟล์
    const fileBuffer = await readFile(normalizedFilePath);
    
    // กำหนด content type ตามนามสกุลไฟล์
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.json':
        contentType = 'application/json';
        break;
    }

    console.log(`✅ Serving file: ${filePath} (${contentType})`);
    
    // ส่งไฟล์กลับ
    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache 1 year
        'Content-Disposition': `inline; filename="${path.basename(filePath)}"`
      },
    });

  } catch (error) {
    console.error('❌ Error serving file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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