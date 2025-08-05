import { NextRequest, NextResponse } from 'next/server'
import { withDatabaseConnection, handlePrismaError } from '@/lib/middleware/database'
import { prisma } from '@/lib/db/prisma'

// Health check endpoint
async function healthCheck(request: NextRequest) {
  const startTime = Date.now()
  const checks: any = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    environment: process.env.NODE_ENV,
    checks: {}
  }

  try {
    // 1. Database connectivity check
    try {
      // ใช้ simple count query แทน raw SQL
      await prisma.user.count()
      checks.checks.database = {
        status: 'healthy',
        message: 'Database connection successful'
      }
    } catch (error) {
      checks.checks.database = {
        status: 'unhealthy',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      checks.status = 'unhealthy'
    }

    // 2. External API connectivity check
    try {
      const externalApiBase = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api'
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(`${externalApiBase}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Health-Check'
        }
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        checks.checks.external_api = {
          status: 'healthy',
          message: 'External API connection successful',
          url: externalApiBase
        }
      } else {
        checks.checks.external_api = {
          status: 'degraded',
          message: `External API returned status ${response.status}`,
          url: externalApiBase
        }
      }
    } catch (error) {
      checks.checks.external_api = {
        status: 'unhealthy',
        message: 'External API connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        url: process.env.EXTERNAL_API_BASE_URL
      }
      // Don't mark overall status as unhealthy for external API issues
      if (checks.status === 'healthy') {
        checks.status = 'degraded'
      }
    }

    // 3. Environment variables check
    const requiredEnvVars = [
      'DATABASE_URL',
      'EXTERNAL_API_BASE_URL'
    ]

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    if (missingEnvVars.length > 0) {
      checks.checks.environment = {
        status: 'unhealthy',
        message: 'Missing required environment variables',
        missing: missingEnvVars
      }
      checks.status = 'unhealthy'
    } else {
      checks.checks.environment = {
        status: 'healthy',
        message: 'All required environment variables are set'
      }
    }

    // 4. Memory usage check (Node.js specific)
    const memUsage = process.memoryUsage()
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    }

    checks.checks.memory = {
      status: memUsageMB.heapUsed > 500 ? 'warning' : 'healthy',
      usage_mb: memUsageMB,
      message: memUsageMB.heapUsed > 500 ? 'High memory usage detected' : 'Memory usage normal'
    }

    // 5. Response time check
    const responseTime = Date.now() - startTime
    checks.checks.response_time = {
      status: responseTime > 1000 ? 'warning' : 'healthy',
      duration_ms: responseTime,
      message: responseTime > 1000 ? 'Slow response time' : 'Response time normal'
    }

    // 6. Uptime check
    const uptimeSeconds = process.uptime()
    checks.checks.uptime = {
      status: 'healthy',
      uptime_seconds: Math.round(uptimeSeconds),
      uptime_human: formatUptime(uptimeSeconds)
    }

    // Overall status determination
    const hasUnhealthy = Object.values(checks.checks).some((check: any) => check.status === 'unhealthy')
    const hasWarning = Object.values(checks.checks).some((check: any) => check.status === 'warning')
    
    if (hasUnhealthy) {
      checks.status = 'unhealthy'
    } else if (hasWarning) {
      checks.status = 'warning'
    }

    // Return appropriate HTTP status
    const httpStatus = checks.status === 'healthy' ? 200 : 
                      checks.status === 'warning' ? 200 : 503

    return NextResponse.json(checks, { status: httpStatus })

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      environment: process.env.NODE_ENV,
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: checks.checks || {}
    }, { status: 503 })
  }
}

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

// Lightweight health check for load balancers
async function simpleHealthCheck(request: NextRequest) {
  try {
    // Quick database ping
    await prisma.user.count()
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}

// Route handlers
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const simple = searchParams.get('simple') === 'true'
  
  if (simple) {
    return withDatabaseConnection(simpleHealthCheck)(request)
  } else {
    return withDatabaseConnection(healthCheck)(request)
  }
}

// Also handle HEAD requests for load balancers
export async function HEAD(request: NextRequest) {
  try {
    await prisma.user.count()
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}