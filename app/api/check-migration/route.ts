import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const counts = {
      users: await prisma.user.count(),
      golfCourses: await prisma.golfCourse.count(),
      vehicles: await prisma.vehicle.count(),
      jobs: await prisma.job.count(),
      parts: await prisma.part.count(),
      serialHistory: await prisma.serialHistoryEntry.count(),
      partsUsageLogs: await prisma.partsUsageLog.count(),
    }

    // ตัวอย่างข้อมูล
    const sampleData = {
      users: await prisma.user.findMany({ take: 3 }),
      vehicles: await prisma.vehicle.findMany({ take: 3 }),
      jobs: await prisma.job.findMany({ take: 3 }),
    }

    return NextResponse.json({
      success: true,
      message: 'Migration check completed',
      counts,
      sampleData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Migration check error:', error)
    return NextResponse.json({
      success: false,
      message: 'Migration check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}