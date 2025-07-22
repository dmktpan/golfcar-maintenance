import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    // ทดสอบการดึงข้อมูล Users
    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    
    const userCount = await prisma.user.count()
    
    // ทดสอบการค้นหา User
    const firstUser = await prisma.user.findFirst()
    
    return NextResponse.json({
      success: true,
      message: `User model test successful - Found ${userCount} users`,
      data: {
        totalUsers: userCount,
        recentUsers: users,
        firstUser: firstUser,
        operations: [
          'findMany() - ✅',
          'count() - ✅', 
          'findFirst() - ✅'
        ]
      }
    })
  } catch (error) {
    console.error('User model test error:', error)
    return NextResponse.json({
      success: false,
      message: 'User model test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}