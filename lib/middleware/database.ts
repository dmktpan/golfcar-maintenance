// lib/middleware/database.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbManager } from '@/lib/db/connection-manager'

export async function withDatabase(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  req: NextRequest,
  ...args: any[]
): Promise<NextResponse> {
  try {
    // ตรวจสอบ connection ก่อนทำงาน
    await dbManager.connect()
    
    // เรียก handler
    const result = await handler(req, ...args)
    
    return result
  } catch (error) {
    console.error('Database middleware error:', error)
    
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// HOC สำหรับ API routes
export function withDatabaseConnection(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    return withDatabase(handler, req, ...args)
  }
}

// Error handler สำหรับ Prisma errors
export function handlePrismaError(error: any): NextResponse {
  console.error('Prisma error:', error)
  
  if (error.code === 'P2002') {
    return NextResponse.json(
      { error: 'Duplicate entry', message: 'Record already exists' },
      { status: 409 }
    )
  }
  
  if (error.code === 'P2025') {
    return NextResponse.json(
      { error: 'Not found', message: 'Record not found' },
      { status: 404 }
    )
  }
  
  if (error.code === 'P2003') {
    return NextResponse.json(
      { error: 'Foreign key constraint', message: 'Related record not found' },
      { status: 400 }
    )
  }
  
  return NextResponse.json(
    { 
      error: 'Database error', 
      message: error.message || 'Unknown database error',
      code: error.code 
    },
    { status: 500 }
  )
}