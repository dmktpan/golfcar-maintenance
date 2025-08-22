// test-upload-functionality.js
// สคริปต์ทดสอบการทำงานของระบบอัพโหลดไฟล์

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api';
const TEST_IMAGES_DIR = path.join(__dirname, 'test-images');

// สร้างโฟลเดอร์ test-images ถ้ายังไม่มี
if (!fs.existsSync(TEST_IMAGES_DIR)) {
  fs.mkdirSync(TEST_IMAGES_DIR, { recursive: true });
}

// ฟังก์ชันสร้างไฟล์ทดสอบ
function createTestImage(filename, sizeKB) {
  const filePath = path.join(TEST_IMAGES_DIR, filename);
  const buffer = Buffer.alloc(sizeKB * 1024, 0xFF); // สร้างไฟล์ขนาดที่กำหนด
  
  // สร้าง header ของไฟล์ JPEG แบบง่าย
  const jpegHeader = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43
  ]);
  
  // สร้าง footer ของไฟล์ JPEG
  const jpegFooter = Buffer.from([0xFF, 0xD9]);
  
  // รวม header + data + footer
  const finalBuffer = Buffer.concat([
    jpegHeader,
    buffer.slice(jpegHeader.length, buffer.length - jpegFooter.length),
    jpegFooter
  ]);
  
  fs.writeFileSync(filePath, finalBuffer);
  console.log(`✅ Created test image: ${filename} (${sizeKB}KB)`);
  return filePath;
}

// ฟังก์ชันทดสอบ External API Health
async function testExternalAPIHealth() {
  console.log('\n🔍 Testing External API Health...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${EXTERNAL_API_BASE}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GolfCart-Maintenance-Test/1.0',
      },
    });
    
    clearTimeout(timeoutId);
    
    console.log(`📊 External API Health Status: ${response.status}`);
    console.log(`📊 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.text();
      console.log(`✅ External API is healthy`);
      console.log(`📄 Response:`, data.substring(0, 200));
      return true;
    } else {
      console.log(`⚠️ External API returned non-200 status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ External API Health Check Failed:`, error.message);
    return false;
  }
}

// ฟังก์ชันทดสอบ External API Upload Endpoint
async function testExternalAPIUpload() {
  console.log('\n🔍 Testing External API Upload Endpoint...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${EXTERNAL_API_BASE}/upload/maintenance`, {
      method: 'OPTIONS',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GolfCart-Maintenance-Test/1.0',
      },
    });
    
    clearTimeout(timeoutId);
    
    console.log(`📊 External API Upload Test Status: ${response.status}`);
    console.log(`📊 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    const workingStatuses = [200, 204, 405, 404];
    const isWorking = workingStatuses.includes(response.status);
    
    if (isWorking) {
      console.log(`✅ External API Upload Endpoint is accessible`);
    } else {
      console.log(`⚠️ External API Upload Endpoint may not be working`);
    }
    
    return isWorking;
  } catch (error) {
    console.error(`❌ External API Upload Test Failed:`, error.message);
    return false;
  }
}

// ฟังก์ชันทดสอบการอัพโหลดไฟล์
async function testFileUpload(filePath, testName) {
  console.log(`\n📤 Testing File Upload: ${testName}`);
  
  try {
    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);
    
    formData.append('files', fileStream, {
      filename: fileName,
      contentType: 'image/jpeg'
    });
    
    // เพิ่ม file hash สำหรับการทดสอบ
    const fileHashes = [Buffer.from(fileName + Date.now()).toString('base64').slice(0, 16)];
    formData.append('fileHashes', JSON.stringify(fileHashes));
    
    console.log(`📤 Uploading ${fileName}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 วินาที timeout
    
    const response = await fetch(`${BASE_URL}/api/upload/maintenance`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log(`📊 Upload Response Status: ${response.status}`);
    
    const result = await response.json();
    console.log(`📊 Upload Result:`, JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`✅ ${testName} - Upload Successful`);
      console.log(`📁 Uploaded Files:`, result.files);
      console.log(`🌐 External API Status:`, result.external_api_status);
      
      if (result.errors && result.errors.length > 0) {
        console.log(`⚠️ Warnings:`, result.errors);
      }
    } else {
      console.log(`❌ ${testName} - Upload Failed`);
      console.log(`❌ Error:`, result.error);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ ${testName} - Upload Error:`, error.message);
    return { success: false, error: error.message };
  }
}

// ฟังก์ชันทดสอบการบีบอัดไฟล์
async function testImageCompression() {
  console.log('\n🗜️ Testing Image Compression...');
  
  // สร้างไฟล์ทดสอบขนาดต่างๆ
  const testFiles = [
    { name: 'small-image.jpg', size: 50 },      // 50KB - ไม่ควรมีปัญหา
    { name: 'medium-image.jpg', size: 500 },    // 500KB - ต้องบีบอัด
    { name: 'large-image.jpg', size: 2000 },    // 2MB - ต้องบีบอัดมาก
    { name: 'xlarge-image.jpg', size: 8000 },   // 8MB - ใกล้ขีดจำกัด
  ];
  
  for (const testFile of testFiles) {
    const filePath = createTestImage(testFile.name, testFile.size);
    await testFileUpload(filePath, `Compression Test - ${testFile.name}`);
    
    // รอสักครู่ระหว่างการทดสอบ
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// ฟังก์ชันทดสอบกรณีข้อผิดพลาด
async function testErrorCases() {
  console.log('\n❌ Testing Error Cases...');
  
  // ทดสอบไฟล์ที่ใหญ่เกินไป
  console.log('\n📤 Testing oversized file...');
  const oversizedFile = createTestImage('oversized-image.jpg', 15000); // 15MB
  await testFileUpload(oversizedFile, 'Oversized File Test');
  
  // ทดสอบไฟล์ประเภทที่ไม่รองรับ
  console.log('\n📤 Testing unsupported file type...');
  const textFilePath = path.join(TEST_IMAGES_DIR, 'test.txt');
  fs.writeFileSync(textFilePath, 'This is a text file, not an image');
  
  try {
    const formData = new FormData();
    const fileStream = fs.createReadStream(textFilePath);
    formData.append('files', fileStream, {
      filename: 'test.txt',
      contentType: 'text/plain'
    });
    
    const response = await fetch(`${BASE_URL}/api/upload/maintenance`, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    console.log(`📊 Unsupported File Type Result:`, JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`❌ Unsupported File Type Test Error:`, error.message);
  }
}

// ฟังก์ชันหลักสำหรับรันการทดสอบทั้งหมด
async function runAllTests() {
  console.log('🚀 Starting Upload Functionality Tests...');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`🌐 External API: ${EXTERNAL_API_BASE}`);
  
  try {
    // ทดสอบ External API
    const isHealthy = await testExternalAPIHealth();
    const isUploadReady = await testExternalAPIUpload();
    
    console.log(`\n📊 External API Summary:`);
    console.log(`   Health Check: ${isHealthy ? '✅ Pass' : '❌ Fail'}`);
    console.log(`   Upload Ready: ${isUploadReady ? '✅ Pass' : '❌ Fail'}`);
    
    // ทดสอบการบีบอัดและอัพโหลด
    await testImageCompression();
    
    // ทดสอบกรณีข้อผิดพลาด
    await testErrorCases();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    // ลบไฟล์ทดสอบ
    console.log('\n🧹 Cleaning up test files...');
    try {
      if (fs.existsSync(TEST_IMAGES_DIR)) {
        fs.rmSync(TEST_IMAGES_DIR, { recursive: true, force: true });
        console.log('✅ Test files cleaned up');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Failed to clean up test files:', cleanupError.message);
    }
  }
}

// รันการทดสอบถ้าไฟล์นี้ถูกเรียกโดยตรง
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testExternalAPIHealth,
  testExternalAPIUpload,
  testFileUpload,
  testImageCompression,
  testErrorCases,
  runAllTests
};