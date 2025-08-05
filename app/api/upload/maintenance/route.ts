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
const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api';

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

// ฟังก์ชันตรวจสอบสถานะ External API
async function checkExternalAPIHealth(): Promise<boolean> {
  try {
    console.log('🔍 Checking External API health...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 วินาที timeout
    
    const response = await fetch(`${EXTERNAL_API_BASE}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GolfCart-Maintenance-App/1.0',
      },
    });

    clearTimeout(timeoutId);
    
    console.log(`📊 External API health status: ${response.status}`);
    
    // ถ้า server ตอบสนอง (ไม่ว่าจะเป็น status ไหน) แสดงว่า API server ทำงานอยู่
    // ให้ลองทดสอบ upload endpoint โดยตรง
    if (response.status === 503 || response.status === 405) {
      console.log('⚠️ Health endpoint returns non-200 status, testing upload endpoint...');
      return await testExternalAPIUpload();
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ External API health check failed:', error);
    // ถ้า health endpoint ไม่ทำงาน ให้ลองทดสอบ upload endpoint โดยตรง
    console.log('🔄 Fallback: Testing upload endpoint directly...');
    return await testExternalAPIUpload();
  }
}

// ฟังก์ชันทดสอบ External API upload endpoint
async function testExternalAPIUpload(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // ใช้ OPTIONS method เพื่อทดสอบว่า endpoint มีอยู่จริงหรือไม่
    const response = await fetch(`${EXTERNAL_API_BASE}/upload/maintenance`, {
      method: 'OPTIONS',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GolfCart-Maintenance-App/1.0',
      },
    });

    clearTimeout(timeoutId);
    
    // ถ้า response มาถึง (ไม่ว่าจะ success หรือ error) แสดงว่า API ทำงานอยู่
    console.log(`📊 External API upload test status: ${response.status}`);
    
    // ยอมรับ status codes ที่แสดงว่า server ทำงานอยู่
    const workingStatuses = [200, 204, 405, 404]; // 405 = Method Not Allowed, 404 = Not Found แต่ server ยังทำงาน
    return workingStatuses.includes(response.status);
  } catch (error) {
    console.error('❌ External API upload test failed:', error);
    return false;
  }
}

// ฟังก์ชันส่งไฟล์ไปยัง External API พร้อม fallback
async function uploadToExternalAPI(buffer: Buffer, filename: string): Promise<string> {
  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
    formData.append('files', blob, filename); // ใช้ 'files' ตามที่ External API ต้องการ

    console.log(`🌐 Uploading ${filename} to external API...`);
    console.log(`📍 API URL: ${EXTERNAL_API_BASE}/upload/maintenance`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // เพิ่ม timeout เป็น 20 วินาที
    
    const response = await fetch(`${EXTERNAL_API_BASE}/upload/maintenance`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: {
        // ไม่ต้องใส่ Content-Type เพราะ FormData จะจัดการเอง
        'Accept': 'application/json',
        'User-Agent': 'GolfCart-Maintenance-App/1.0',
      },
    });

    clearTimeout(timeoutId);
    
    console.log(`📊 External API response status: ${response.status}`);
    
    if (response.ok) {
      let result;
      try {
        result = await response.json();
        console.log(`✅ External API upload success for ${filename}:`, result);
      } catch (jsonError) {
        // ถ้า response ไม่ใช่ JSON ให้ลองอ่านเป็น text
        const textResult = await response.text();
        console.log(`📝 External API text response:`, textResult);
        result = { message: textResult };
      }
      
      let fileUrl = '';
      
      // ส่งกลับ URL จาก External API
      if (result.files && result.files.length > 0) {
        fileUrl = result.files[0];
      } else if (result.file) {
        fileUrl = result.file;
      } else if (result.url) {
        fileUrl = result.url;
      } else if (result.path) {
        fileUrl = result.path;
      } else {
        // ถ้า External API ไม่ส่ง URL กลับมา ให้สร้าง URL เอง
        fileUrl = `/uploads/maintenance/${filename}`;
      }
      
      // ตรวจสอบว่า URL เป็น relative path หรือไม่ ถ้าใช่ให้เพิ่ม domain
      if (fileUrl.startsWith('/')) {
        const baseUrl = EXTERNAL_API_BASE.replace('/api', '');
        fileUrl = `${baseUrl}${fileUrl}`;
      }
      
      console.log(`🔗 Final URL: ${fileUrl}`);
      return fileUrl;
    } else {
      // อ่าน error response
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorResult = await response.json();
        errorMessage = errorResult.message || errorResult.error || errorMessage;
      } catch {
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // ใช้ default error message
        }
      }
      
      console.error(`❌ External API upload failed for ${filename}:`, response.status, errorMessage);
      throw new Error(`External API upload failed: ${errorMessage}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`⏰ External API timeout for ${filename}`);
      throw new Error('External API timeout');
    }
    console.error(`❌ Error uploading ${filename} to external API:`, error);
    throw error;
  }
}

// ฟังก์ชัน fallback สำหรับกรณีที่ External API ไม่ทำงาน
function createLocalFileUrl(filename: string): string {
  // สร้าง URL สำหรับไฟล์ local ผ่าน API route
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/api/uploads/maintenance/${filename}`;
}

export async function POST(request: NextRequest) {
  try {
    // เพิ่ม timeout สำหรับ request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 45000); // เพิ่มเป็น 45 วินาที
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

      // ตรวจสอบสถานะ External API ก่อนการอัปโหลด
      const isExternalAPIAvailable = await checkExternalAPIHealth();
      console.log(`🔍 External API availability: ${isExternalAPIAvailable ? 'Available' : 'Unavailable'}`);

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
          
          // บันทึกไฟล์ local เป็น backup (optional)
          try {
            const filepath = path.join(UPLOAD_DIR, filename);
            await writeFile(filepath, compressedBuffer);
            console.log(`📁 Local backup saved: ${filename}`);
          } catch (localError) {
            console.warn(`⚠️ Failed to save local backup for ${filename}:`, localError);
            // ไม่ให้ error ของ local backup ทำให้การอัพโหลดล้มเหลว
          }
          
          // ตรวจสอบว่า External API พร้อมใช้งานหรือไม่
          let fileUrl: string;
          if (isExternalAPIAvailable) {
            try {
              fileUrl = await uploadToExternalAPI(compressedBuffer, filename);
              console.log(`✅ External API upload success: ${filename} -> ${fileUrl}`);
            } catch (externalError) {
              console.warn(`⚠️ External API failed for ${filename}, using local fallback:`, externalError);
              // ใช้ local file URL เป็น fallback
              fileUrl = createLocalFileUrl(filename);
              console.log(`📁 Using local fallback: ${filename} -> ${fileUrl}`);
            }
          } else {
            // External API ไม่พร้อมใช้งาน ใช้ local fallback ทันที
            fileUrl = createLocalFileUrl(filename);
            console.log(`📁 Using local fallback (External API unavailable): ${filename} -> ${fileUrl}`);
          }
          
          uploadedFiles.push(fileUrl);
          console.log(`✅ Successfully processed: ${filename} (${(compressedBuffer.length / 1024).toFixed(2)}KB)`);
          
        } catch (error) {
          console.error(`❌ Error processing ${file.name}:`, error);
          errors.push(`${file.name}: การอัปโหลดล้มเหลว - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // ตรวจสอบว่ามีไฟล์ที่อัปโหลดผ่าน External API หรือไม่
      const externalUploads = uploadedFiles.filter(url => !url.includes('localhost'));
      const localFallbacks = uploadedFiles.filter(url => url.includes('localhost'));
      
      let message = '';
      if (externalUploads.length > 0 && localFallbacks.length === 0) {
        message = `อัปโหลดสำเร็จ ${uploadedFiles.length} ไฟล์ผ่าน External API`;
      } else if (localFallbacks.length > 0 && externalUploads.length === 0) {
        message = `อัปโหลดสำเร็จ ${uploadedFiles.length} ไฟล์ (External API ไม่พร้อมใช้งาน ใช้ Local Storage)`;
      } else if (externalUploads.length > 0 && localFallbacks.length > 0) {
        message = `อัปโหลดสำเร็จ ${uploadedFiles.length} ไฟล์ (${externalUploads.length} ผ่าน External API, ${localFallbacks.length} ผ่าน Local Storage)`;
      } else {
        message = `อัปโหลดสำเร็จ ${uploadedFiles.length} ไฟล์`;
      }

      return NextResponse.json({
        success: uploadedFiles.length > 0,
        message,
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
        external_api_status: externalUploads.length > 0 ? 'working' : 'unavailable'
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