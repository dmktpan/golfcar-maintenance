// app/api/upload/maintenance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (เพิ่มขึ้นเพื่อรองรับไฟล์ก่อนบีบอัด)
const MAX_COMPRESSED_SIZE = 150 * 1024; // 150KB (ขนาดหลังบีบอัด)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/maintenance');

// ฟังก์ชันบีบอัดรูปภาพให้ไม่เกิน 100KB
async function compressImage(buffer: Buffer, filename: string): Promise<Buffer> {
  try {
    // ตรวจสอบขนาดไฟล์ก่อน ถ้าเล็กแล้วแต่ยังต้องปรับคุณภาพ
    if (buffer.length <= MAX_COMPRESSED_SIZE) {
      return await sharp(buffer)
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
    }

    // เริ่มต้นด้วยการลดขนาดและคุณภาพอย่างรุนแรงเพื่อให้ได้ไฟล์ขนาด 100KB
    let targetWidth = 800;
    let quality = 60;
    
    // ถ้าไฟล์ใหญ่มาก ลดขนาดและคุณภาพมากขึ้น
    if (buffer.length > 5 * 1024 * 1024) {
      targetWidth = 600;
      quality = 45;
    } else if (buffer.length > 2 * 1024 * 1024) {
      targetWidth = 700;
      quality = 50;
    }

    let compressedBuffer = await sharp(buffer)
      .resize(targetWidth, targetWidth, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();

    // ถ้ายังใหญ่เกิน 100KB ให้ลดขนาดและคุณภาพเพิ่มเติม
    let attempts = 0;
    while (compressedBuffer.length > MAX_COMPRESSED_SIZE && attempts < 3) {
      attempts++;
      
      // ลดขนาดและคุณภาพในแต่ละรอบ
      targetWidth = Math.max(400, targetWidth - 150);
      quality = Math.max(25, quality - 15);
      
      compressedBuffer = await sharp(buffer)
        .resize(targetWidth, targetWidth, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();
        
      console.log(`Compression attempt ${attempts}: ${targetWidth}px, quality ${quality}%, size: ${(compressedBuffer.length / 1024).toFixed(2)}KB`);
    }

    // ถ้ายังใหญ่เกินไป ให้บีบอัดสุดท้ายด้วยขนาดและคุณภาพต่ำสุด
    if (compressedBuffer.length > MAX_COMPRESSED_SIZE) {
      compressedBuffer = await sharp(buffer)
        .resize(400, 400, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 20,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();
    }

    return compressedBuffer;
  } catch (error) {
    console.error(`Error compressing ${filename}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // เพิ่ม timeout สำหรับ request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000); // 25 วินาที
    });

    const processPromise = async () => {
      // Ensure upload directory exists
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }

      const data = await request.formData();
      const files = data.getAll('files') as File[];
      
      if (!files || files.length === 0) {
        return NextResponse.json({ 
          success: false,
          error: 'ไม่พบไฟล์ที่อัปโหลด' 
        }, { status: 400 });
      }

      const uploadedFiles: string[] = [];
      const errors: string[] = [];

      // ประมวลผลไฟล์ทีละไฟล์เพื่อลด memory usage
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push(`${file.name}: ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ JPEG, PNG และ WebP`);
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: ไฟล์ใหญ่เกินไป ขนาดสูงสุด 10MB`);
          continue;
        }

        try {
          console.log(`Processing file ${i + 1}/${files.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
          
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          // Generate unique filename
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const filename = `${timestamp}-${randomString}.jpg`; // บันทึกเป็น JPEG เสมอ
          
          // บีบอัดรูปภาพ
          const compressedBuffer = await compressImage(buffer, filename);
          
          const filepath = path.join(UPLOAD_DIR, filename);
          await writeFile(filepath, compressedBuffer);
          
          uploadedFiles.push(`/uploads/maintenance/${filename}`);
          console.log(`Successfully processed: ${filename} (${(compressedBuffer.length / 1024).toFixed(2)}KB)`);
          
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          errors.push(`${file.name}: การอัปโหลดล้มเหลว - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return NextResponse.json({
        success: uploadedFiles.length > 0,
        message: `อัปโหลดสำเร็จ ${uploadedFiles.length} ไฟล์`,
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined
      });
    };

    // รัน process พร้อม timeout
    return await Promise.race([processPromise(), timeoutPromise]) as NextResponse;

  } catch (error) {
    console.error('Upload error:', error);
    
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json({ 
        success: false,
        error: 'การอัปโหลดใช้เวลานานเกินไป กรุณาลองใหม่หรือใช้ไฟล์ขนาดเล็กกว่า' 
      }, { status: 408 });
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'เกิดข้อผิดพลาดในการอัปโหลด' 
    }, { status: 500 });
  }
}