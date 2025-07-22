import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    // ทดสอบการดึงข้อมูล Jobs
    const jobs = await prisma.job.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    
    const jobCount = await prisma.job.count()
    
    // ทดสอบการกรองข้อมูลตาม status
    const pendingJobs = await prisma.job.count({
      where: {
        status: 'pending'
      }
    })
    
    const completedJobs = await prisma.job.count({
      where: {
        status: 'completed'
      }
    })
    
    // ทดสอบการกรองข้อมูลตาม type
    const pmJobs = await prisma.job.count({
      where: {
        type: 'PM'
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `Job model test successful - Found ${jobCount} jobs`,
      data: {
        totalJobs: jobCount,
        pendingJobs: pendingJobs,
        completedJobs: completedJobs,
        pmJobs: pmJobs,
        recentJobs: jobs,
        operations: [
          'findMany() - ✅',
          'count() - ✅', 
          'count() with status filter - ✅',
          'count() with type filter - ✅'
        ]
      }
    })
  } catch (error) {
    console.error('Job model test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Job model test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}