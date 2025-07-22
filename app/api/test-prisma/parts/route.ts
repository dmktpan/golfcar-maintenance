import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    // ทดสอบการดึงข้อมูล Parts
    const parts = await prisma.part.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    
    const partCount = await prisma.part.count()
    
    // ทดสอบการกรองข้อมูลตาม stock
    const lowStockParts = await prisma.part.count({
      where: {
        stock_qty: {
          lte: 10
        }
      }
    })
    
    // ทดสอบการค้นหาด้วย text search
    const partsWithName = await prisma.part.findMany({
      where: {
        name: {
          contains: 'oil',
          mode: 'insensitive'
        }
      },
      take: 3
    })
    
    return NextResponse.json({
      success: true,
      message: `Parts model test successful - Found ${partCount} parts`,
      data: {
        totalParts: partCount,
        lowStockParts: lowStockParts,
        recentParts: parts,
        partsWithOil: partsWithName,
        operations: [
          'findMany() - ✅',
          'count() - ✅', 
          'count() with numeric filter - ✅',
          'findMany() with text search - ✅'
        ]
      }
    })
  } catch (error) {
    console.error('Parts model test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Parts model test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}