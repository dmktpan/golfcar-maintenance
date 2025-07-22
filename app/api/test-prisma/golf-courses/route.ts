import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    // ทดสอบการดึงข้อมูล Golf Courses
    const golfCourses = await prisma.golfCourse.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    
    const golfCourseCount = await prisma.golfCourse.count()
    
    // ทดสอบการค้นหา Golf Course
    const firstGolfCourse = await prisma.golfCourse.findFirst()
    
    return NextResponse.json({
      success: true,
      message: `Golf Course model test successful - Found ${golfCourseCount} golf courses`,
      data: {
        totalGolfCourses: golfCourseCount,
        recentGolfCourses: golfCourses,
        firstGolfCourse: firstGolfCourse,
        operations: [
          'findMany() - ✅',
          'count() - ✅', 
          'findFirst() - ✅'
        ]
      }
    })
  } catch (error) {
    console.error('Golf Course model test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Golf Course model test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}