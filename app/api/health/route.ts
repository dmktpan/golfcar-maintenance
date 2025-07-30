// app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withDatabaseConnection, handlePrismaError } from '@/lib/middleware/database'
import { db } from '@/lib/db'

async function healthHandler(req: NextRequest): Promise<NextResponse> {
  try {
    // ทดสอบ database connection
    const isHealthy = await db.healthCheck()
    const status = db.getStatus()
    
    if (!isHealthy) {
      return NextResponse.json({
        success: false,
        message: 'Database health check failed',
        status: 'unhealthy',
        connection: status
      }, { status: 503 })
    }

    // ทดสอบ query ง่ายๆ
    const userCount = await db.users.findByGolfCourse('').then(() => 0).catch(() => 0)
    
    return NextResponse.json({
      success: true,
      message: 'System is healthy',
      status: 'healthy',
      connection: status,
      timestamp: new Date().toISOString(),
      database: {
        connected: isHealthy,
        connectionCount: status.connectionCount
      }
    })
    
  } catch (error) {
    return handlePrismaError(error)
  }
}

// ใช้ middleware wrapper
export const GET = withDatabaseConnection(healthHandler)