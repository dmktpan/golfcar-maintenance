// app/api/upload/maintenance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (เพิ่มขึ้นเพื่อรองรับไฟล์ก่อนบีบอัด)
const MAX_COMPRESSED_SIZE = 150 * 1024; // 150KB (ขนาดหลังบีบอัด)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/maintenance');
const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api';
const EXTERNAL_API_TIMEOUT = parseInt(process.env.EXTERNAL_API_TIMEOUT || '30000'); // เพิ่มเป็น 30 วินาที
const MAX_RETRY_ATTEMPTS = 3; // เพิ่มจำนวน retry

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
    const timeoutId = setTimeout(() => controller.abort(), 10000); // เพิ่มเป็น 10 วินาที timeout
    
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
      console.log('⚠️ Health endpoint returns non-200 status, using local fallback');
      return false; // ไม่ต้องทดสอบ upload endpoint
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ External API health check failed:', error);
    // ถ้า health endpoint ไม่ทำงาน ให้ใช้ local fallback ทันที
    console.log('🔄 Health check failed, using local fallback');
    return false; // ไม่ต้องทดสอบ upload endpoint
  }
}

// ฟังก์ชันทดสอบ External API upload endpoint
async function testExternalAPIUpload(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // เพิ่มเป็น 10 วินาที
    
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

// ฟังก์ชันส่งไฟล์ไปยัง External API พร้อม retry logic
async function uploadToExternalAPI(buffer: Buffer, filename: string, fileHash?: string): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`🌐 Uploading ${filename} to external API (attempt ${attempt}/${MAX_RETRY_ATTEMPTS})...`);
      
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
      formData.append('files', blob, filename);
      
      // เพิ่ม file hash ถ้ามี
      if (fileHash) {
        formData.append('fileHash', fileHash);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_API_TIMEOUT);
      
      const response = await fetch(`${EXTERNAL_API_BASE}/upload/maintenance`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'User-Agent': 'GolfCart-Maintenance-App/1.0',
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`External API responded with status ${response.status}: ${response.statusText}`);
      }
      
      let result;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const textResult = await response.text();
        console.log('📄 External API returned non-JSON response:', textResult);
        
        try {
          result = JSON.parse(textResult);
        } catch {
          result = { success: true, files: [textResult] };
        }
      }
      
      console.log('📊 External API response:', result);
      
      // ตรวจสอบ response format และดึง URL
      let imageUrl: string;
      
      if (result.files && Array.isArray(result.files) && result.files.length > 0) {
        imageUrl = result.files[0];
      } else if (result.file) {
        imageUrl = result.file;
      } else if (result.url) {
        imageUrl = result.url;
      } else if (result.path) {
        imageUrl = result.path;
      } else {
        throw new Error('Invalid response format from external API');
      }
      
      // ถ้าได้ relative path ให้สร้าง full URL
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${EXTERNAL_API_BASE.replace('/api', '')}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }
      
      console.log(`✅ External API upload successful: ${imageUrl}`);
      return imageUrl;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ External API upload attempt ${attempt} failed:`, lastError.message);
      
      // ถ้าเป็นความผิดพลาดที่ไม่ควร retry (เช่น 400, 401, 403) ให้หยุดทันที
      if (lastError.message.includes('400') || lastError.message.includes('401') || lastError.message.includes('403')) {
        break;
      }
      
      // รอสักครู่ก่อน retry (exponential backoff)
      if (attempt < MAX_RETRY_ATTEMPTS) {
        const delay = Math.pow(2, attempt - 1) * 2000; // 2s, 4s, 8s... (เพิ่มเวลารอ)
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // ถ้า retry หมดแล้วยังไม่สำเร็จ
  if (lastError) {
    if (lastError.name === 'AbortError' || lastError.message.includes('aborted')) {
      console.warn('⚠️ External API upload timed out, will use local fallback');
      throw new Error('External API upload timed out after multiple attempts');
    } else if (lastError.message.includes('fetch') || lastError.message.includes('network')) {
      console.warn('⚠️ Network error connecting to external API, will use local fallback');
      throw new Error('Network error when connecting to external API after multiple attempts');
    }
    console.warn('⚠️ External API upload failed, will use local fallback');
    throw new Error(`External API upload failed after ${MAX_RETRY_ATTEMPTS} attempts: ${lastError.message}`);
  }
  
  throw new Error('External API upload failed for unknown reason');
}

// ฟังก์ชัน fallback สำหรับกรณีที่ External API ไม่ทำงาน
function createLocalFileUrl(filename: string): string {
  // สร้าง URL สำหรับไฟล์ local ผ่าน API route
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  // Ensure baseUrl doesn't end with slash to avoid double slashes
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Use the new uploads API route that works with standalone server
  const apiUrl = `${cleanBaseUrl}/api/uploads/maintenance/${filename}`;
  
  console.log(`📁 Created local file URL: ${apiUrl}`);
  
  return apiUrl;
}

export async function POST(request: NextRequest) {
  try {
    // เพิ่ม timeout สำหรับ request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000); // ลดเป็น 25 วินาที
    });

    const processPromise = async () => {
      // Ensure upload directory exists
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }

      const data = await request.formData();
      const files = data.getAll('files') as File[];
      const fileHashesString = data.get('fileHashes') as string;
      
      let fileHashes: string[] = [];
      if (fileHashesString) {
        try {
          fileHashes = JSON.parse(fileHashesString);
        } catch (error) {
          console.warn('Failed to parse file hashes:', error);
        }
      }
      
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
        const fileHash = fileHashes[i];
        
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

          // Generate unique filename with UUID to prevent duplicates
          const timestamp = Date.now();
          const uuid = randomUUID().replace(/-/g, ''); // Remove hyphens for shorter filename
          const hashPrefix = fileHash ? fileHash.slice(0, 8) : Buffer.from(file.name + timestamp).toString('base64').slice(0, 8).replace(/[+/=]/g, '');
          let filename = `${timestamp}-${uuid.slice(0, 12)}-${hashPrefix}.jpg`; // บันทึกเป็น JPEG เสมอ
          
          // Check if file already exists and generate new name if needed
          let filepath = path.join(UPLOAD_DIR, filename);
          let attempts = 0;
          while (existsSync(filepath) && attempts < 5) {
            attempts++;
            console.warn(`⚠️ File ${filename} already exists, generating new name (attempt ${attempts})...`);
            const newUuid = randomUUID().replace(/-/g, '');
            filename = `${Date.now()}-${newUuid.slice(0, 12)}-${fileHash}-${attempts}.jpg`;
            filepath = path.join(UPLOAD_DIR, filename);
          }
          
          if (attempts >= 5) {
            errors.push(`${file.name}: ไม่สามารถสร้างชื่อไฟล์ที่ไม่ซ้ำได้`);
            continue;
          }
          
          // บีบอัดรูปภาพ
          const compressedBuffer = await compressImage(buffer, filename);
          
          // บันทึกไฟล์ local เป็น backup (optional)
          try {
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
              fileUrl = await uploadToExternalAPI(compressedBuffer, filename, fileHash);
              console.log(`✅ External API upload success: ${filename} -> ${fileUrl}`);
            } catch (externalError) {
              const errorMessage = externalError instanceof Error ? externalError.message : String(externalError);
              
              if (errorMessage.includes('timed out') || errorMessage.includes('aborted')) {
                console.warn(`⏰ External API timeout for ${filename}, using local fallback`);
              } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                console.warn(`🌐 Network error for ${filename}, using local fallback`);
              } else {
                console.warn(`⚠️ External API failed for ${filename}, using local fallback:`, errorMessage);
              }
              
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
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Error processing ${file.name}:`, errorMessage);
          
          // ให้ข้อความ error ที่เข้าใจง่ายขึ้น
          if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
            errors.push(`${file.name}: การอัปโหลดใช้เวลานานเกินไป กรุณาลองใหม่`);
          } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            errors.push(`${file.name}: เกิดปัญหาการเชื่อมต่อเครือข่าย กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต`);
          } else if (errorMessage.includes('size') || errorMessage.includes('large')) {
            errors.push(`${file.name}: ไฟล์มีขนาดใหญ่เกินไป กรุณาใช้ไฟล์ขนาดเล็กกว่า`);
          } else {
            errors.push(`${file.name}: การอัปโหลดล้มเหลว - ${errorMessage}`);
          }
        }
      }

      // ตรวจสอบว่ามีไฟล์ที่อัปโหลดผ่าน External API หรือไม่
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const localDomain = baseUrl.includes('localhost') ? 'localhost' : new URL(baseUrl).hostname;
      const externalUploads = uploadedFiles.filter(url => !url.includes(localDomain));
      const localFallbacks = uploadedFiles.filter(url => url.includes(localDomain));
      
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Upload error:', errorMessage);
    
    if (errorMessage === 'Request timeout') {
      return NextResponse.json({ 
        success: false,
        error: 'การอัปโหลดใช้เวลานานเกินไป กรุณาลองใหม่หรือใช้ไฟล์ขนาดเล็กกว่า' 
      }, { status: 408 });
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
      return NextResponse.json({ 
        success: false,
        error: 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง' 
      }, { status: 408 });
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return NextResponse.json({ 
        success: false,
        error: 'เกิดปัญหาการเชื่อมต่อเครือข่าย กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต' 
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่อีกครั้ง' 
    }, { status: 500 });
  }
}
