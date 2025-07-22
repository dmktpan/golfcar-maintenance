import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    // ทดสอบการดึงข้อมูล Vehicles
    const vehicles = await prisma.vehicle.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    
    const vehicleCount = await prisma.vehicle.count()
    
    // ทดสอบการค้นหา Vehicle ด้วย unique field
    const vehicleBySerial = await prisma.vehicle.findFirst({
      where: {
        serial_number: {
          not: undefined
        }
      }
    })
    
    // ทดสอบการกรองข้อมูล
    const activeVehicles = await prisma.vehicle.count({
      where: {
        status: 'active'
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `Vehicle model test successful - Found ${vehicleCount} vehicles`,
      data: {
        totalVehicles: vehicleCount,
        activeVehicles: activeVehicles,
        recentVehicles: vehicles,
        vehicleBySerial: vehicleBySerial,
        operations: [
          'findMany() - ✅',
          'count() - ✅', 
          'findFirst() with where - ✅',
          'count() with filter - ✅'
        ]
      }
    })
  } catch (error) {
    console.error('Vehicle model test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Vehicle model test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}