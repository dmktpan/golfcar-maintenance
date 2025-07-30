// ไฟล์ทดสอบ API ใน Next.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 กำลังทดสอบ API endpoints...');
    
    const baseUrl = 'http://localhost:3000/api';
    
    // ทดสอบ API users
    const usersResponse = await fetch(`${baseUrl}/users`);
    const usersData = await usersResponse.json();
    console.log('Users API Response:', usersData);
    
    // ทดสอบ API golf-courses
    const golfCoursesResponse = await fetch(`${baseUrl}/golf-courses`);
    const golfCoursesData = await golfCoursesResponse.json();
    console.log('Golf Courses API Response:', golfCoursesData);
    
    // ทดสอบ API vehicles
    const vehiclesResponse = await fetch(`${baseUrl}/vehicles`);
    const vehiclesData = await vehiclesResponse.json();
    console.log('Vehicles API Response:', vehiclesData);
    
    // ทดสอบ API jobs
    const jobsResponse = await fetch(`${baseUrl}/jobs`);
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