#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// สร้างรูปภาพทดสอบ (JPEG ขั้นต่ำ)
function createTestImage() {
  // JPEG header และ footer ขั้นต่ำ
  const jpegHeader = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
    0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
    0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
    0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xB2, 0xC0,
    0x07, 0xFF, 0xD9
  ]);
  
  return jpegHeader;
}

async function testUpload() {
  try {
    console.log('🧪 สร้างไฟล์ทดสอบ...');
    const testImageBuffer = createTestImage();
    
    // สร้าง FormData
    const FormData = require('form-data');
    const formData = new FormData();
    
    // เพิ่มไฟล์ลงใน FormData
    formData.append('files', testImageBuffer, {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });

    console.log('📤 กำลังอัปโหลดไฟล์...');
    
    // ใช้ fetch แทน node-fetch
    const response = await fetch('http://localhost:3000/api/upload/maintenance', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    const result = await response.json();
    
    console.log('📊 ผลการอัปโหลด:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success && result.files && result.files.length > 0) {
      console.log('\n🔗 URL ของรูปภาพที่อัปโหลด:');
      result.files.forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
      });
      
      // ทดสอบเข้าถึงรูปภาพ
      console.log('\n🧪 ทดสอบเข้าถึงรูปภาพ...');
      for (const imageUrl of result.files) {
        try {
          const imageResponse = await fetch(imageUrl);
          console.log(`✅ ${imageUrl} - Status: ${imageResponse.status} (${imageResponse.statusText})`);
          
          if (imageResponse.ok) {
            const contentType = imageResponse.headers.get('content-type');
            const contentLength = imageResponse.headers.get('content-length');
            console.log(`   Content-Type: ${contentType}`);
            console.log(`   Content-Length: ${contentLength} bytes`);
          }
        } catch (error) {
          console.log(`❌ ${imageUrl} - Error: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

// เรียกใช้ฟังก์ชันทดสอบ
testUpload();