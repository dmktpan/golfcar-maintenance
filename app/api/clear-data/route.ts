import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST() {
  try {
    console.log('🗑️ Starting data cleanup...')
    
    // ลบข้อมูลทั้งหมดแบบทีละ collection (เพื่อหลีกเลี่ยง deleteMany ที่ต้องการ replica set)
    const deletedCounts = {
      jobs: 0,
      partsUsageLogs: 0,
      parts: 0,
      serialHistories: 0,
      vehicles: 0,
      golfCourses: 0,
      users: 0
    }

    try {
      // ลบ Jobs ก่อน (เพราะมี foreign key)
      const jobs = await prisma.job.findMany({})
      for (const job of jobs) {
        await prisma.job.delete({ where: { id: job.id } })
        deletedCounts.jobs++
      }
      console.log(`✅ Deleted ${deletedCounts.jobs} jobs`)
    } catch {
      console.log('ℹ️ No jobs to delete') 
    }

    try {
      // ลบ Parts Usage Logs
      const logs = await prisma.partsUsageLog.findMany({})
      for (const log of logs) {
        await prisma.partsUsageLog.delete({ where: { id: log.id } })
        deletedCounts.partsUsageLogs++
      }
      console.log(`✅ Deleted ${deletedCounts.partsUsageLogs} parts usage logs`)
    } catch {
      console.log('ℹ️ No parts usage logs to delete') 
    }

    try {
      // ลบ Parts
      const parts = await prisma.part.findMany({})
      for (const part of parts) {
        await prisma.part.delete({ where: { id: part.id } })
        deletedCounts.parts++
      }
      console.log(`✅ Deleted ${deletedCounts.parts} parts`)
    } catch {
      console.log('ℹ️ No parts to delete') 
    }

    try {
      // ลบ SerialHistoryEntry
      const histories = await prisma.serialHistoryEntry.findMany({})
      for (const history of histories) {
        await prisma.serialHistoryEntry.delete({ where: { id: history.id } })
        deletedCounts.serialHistories++
      }
      console.log(`✅ Deleted ${deletedCounts.serialHistories} serial histories`)
    } catch {
      console.log('ℹ️ No histories to delete') 
    }

    try {
      // ลบ Vehicles
      const vehicles = await prisma.vehicle.findMany({})
      for (const vehicle of vehicles) {
        await prisma.vehicle.delete({ where: { id: vehicle.id } })
        deletedCounts.vehicles++
      }
      console.log(`✅ Deleted ${deletedCounts.vehicles} vehicles`)
    } catch {
      console.log('ℹ️ No vehicles to delete') 
    }

    try {
      // ลบ GolfCourses
      const golfCourses = await prisma.golfCourse.findMany({})
      for (const course of golfCourses) {
        await prisma.golfCourse.delete({ where: { id: course.id } })
        deletedCounts.golfCourses++
      }
      console.log(`✅ Deleted ${deletedCounts.golfCourses} golf courses`)
    } catch {
      console.log('ℹ️ No golf courses to delete') 
    }

    try {
      // ลบ Users
      const users = await prisma.user.findMany({})
      for (const user of users) {
        await prisma.user.delete({ where: { id: user.id } })
        deletedCounts.users++
      }
      console.log(`✅ Deleted ${deletedCounts.users} users`)
    } catch {
      console.log('ℹ️ No users to delete') 
    }

    console.log('🎉 Data cleanup completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully - Ready for production use',
      deleted: deletedCounts,
      totalDeleted: Object.values(deletedCounts).reduce((sum, count) => sum + count, 0)
    })

  } catch (error) {
    console.error('❌ Data cleanup failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Data cleanup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}