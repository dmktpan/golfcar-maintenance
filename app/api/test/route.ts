// ไฟล์ทดสอบ API ใน Next.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 กำลังทดสอบ API endpoints...');
    
    // ตรวจสอบว่าอยู่ใน build time หรือไม่
    const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL;
    
    if (isBuildTime) {
      console.log('⚠️ ข้าม API test ระหว่าง build time');
      return NextResponse.json({
        success: true,
        message: 'API test skipped during build time',
        buildTime: true
      });
    }
    
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api' 
      : `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api`;
    
    // ทดสอบ API users
    const usersResponse = await fetch(`${baseUrl}/users`, {
      headers: { 'User-Agent': 'Internal-Test' }
    });
    const usersData = await usersResponse.json();
    console.log('Users API Response:', usersData);
    
    // ทดสอบ API golf-courses
    const golfCoursesResponse = await fetch(`${baseUrl}/golf-courses`, {
      headers: { 'User-Agent': 'Internal-Test' }
    });
    const golfCoursesData = await golfCoursesResponse.json();
    console.log('Golf Courses API Response:', golfCoursesData);
    
    // ทดสอบ API vehicles
    const vehiclesResponse = await fetch(`${baseUrl}/vehicles`, {
      headers: { 'User-Agent': 'Internal-Test' }
    });
    const vehiclesData = await vehiclesResponse.json();
    console.log('Vehicles API Response:', vehiclesData);
    
    // ทดสอบ API jobs
    const jobsResponse = await fetch(`${baseUrl}/jobs`, {
      headers: { 'User-Agent': 'Internal-Test' }
    });
    const jobsData = await jobsResponse.json();
    console.log('Jobs API Response:', jobsData);
    
    return NextResponse.json({
      success: true,
      message: 'API test completed',
      results: {
        users: {
          success: usersData.success,
          count: usersData.count,
          dataLength: usersData.data?.length
        },
        golfCourses: {
          success: golfCoursesData.success,
          count: golfCoursesData.count,
          dataLength: golfCoursesData.data?.length
        },
        vehicles: {
          success: vehiclesData.success,
          count: vehiclesData.count,
          dataLength: vehiclesData.data?.length
        },
        jobs: {
          success: jobsData.success,
          count: jobsData.count,
          dataLength: jobsData.data?.length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ API:', error);
    return NextResponse.json({
      success: false,
      message: 'API test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}