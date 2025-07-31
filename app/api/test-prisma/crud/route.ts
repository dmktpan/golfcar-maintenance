import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const operations = []
    const testData = {
      testUser: null as any,
      testGolfCourse: null as any,
      testVehicle: null as any,
      testJob: null as any,
      testPart: null as any
    }

    // Test 1: Create operations
    try {
      // สร้าง Test Golf Course
      testData.testGolfCourse = await prisma.golfCourse.create({
        data: {
          name: `Test Golf Course ${Date.now()}`
        }
      })
      operations.push('Create Golf Course - ✅')

      // สร้าง Test User
      testData.testUser = await prisma.user.create({
        data: {
          code: `TEST${Date.now()}`,
          username: `testuser${Date.now()}`,
          name: 'Test User',
          role: 'staff',
          golf_course_id: testData.testGolfCourse.id,
          golf_course_name: testData.testGolfCourse.name,
          managed_golf_courses: []
        }
      })
      operations.push('Create User - ✅')

      // สร้าง Test Vehicle
      testData.testVehicle = await prisma.vehicle.create({
        data: {
          serial_number: `TEST${Date.now()}`,
          vehicle_number: `V${Date.now()}`,
          golf_course_id: testData.testGolfCourse.id,
          golf_course_name: testData.testGolfCourse.name,
          model: 'Test Model',
          status: 'active'
        }
      })
      operations.push('Create Vehicle - ✅')

      // สร้าง Test Part
      testData.testPart = await prisma.part.create({
        data: {
          name: `Test Part ${Date.now()}`,
          unit: 'piece',
          stock_qty: 100,
          min_qty: 10,
          max_qty: 200
        }
      })
      operations.push('Create Part - ✅')

      // สร้าง Test Job
      testData.testJob = await prisma.job.create({
        data: {
          type: 'PM',
          status: 'pending',
          vehicle_id: testData.testVehicle.id,
          vehicle_number: testData.testVehicle.vehicle_number,
          golf_course_id: testData.testGolfCourse.id,
          user_id: testData.testUser.id,
          userName: testData.testUser.name,
          system: 'Engine',
          subTasks: ['Check oil', 'Check battery']
        }
      })
      operations.push('Create Job - ✅')

    } catch (error) {
      operations.push(`Create operations failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test 2: Read operations
    try {
      await prisma.user.findUnique({
        where: { id: testData.testUser.id }
      })
      operations.push('Read User by ID - ✅')

      await prisma.vehicle.findUnique({
        where: { id: testData.testVehicle.id }
      })
      operations.push('Read Vehicle by ID - ✅')

    } catch (error) {
      operations.push(`Read operations failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test 3: Update operations
    try {
      await prisma.user.update({
        where: { id: testData.testUser.id },
        data: { name: 'Updated Test User' }
      })
      operations.push('Update User - ✅')

      await prisma.job.update({
        where: { id: testData.testJob.id },
        data: { status: 'in_progress' }
      })
      operations.push('Update Job - ✅')

    } catch (error) {
      operations.push(`Update operations failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test 4: Complex queries
    try {
      // ทดสอบ aggregation
      await prisma.job.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      })
      operations.push('Group By query - ✅')

      // ทดสอบ transaction
      await prisma.$transaction(async (tx: any) => {
        await tx.part.update({
          where: { id: testData.testPart.id },
          data: { stock_qty: { decrement: 1 } }
        })
        
        await tx.partsUsageLog.create({
          data: {
            jobId: testData.testJob.id.toString(),
            partId: testData.testPart.id.toString(),
            partName: testData.testPart.name,
            quantityUsed: 1,
            vehicleNumber: testData.testVehicle.vehicle_number,
            vehicleSerial: testData.testVehicle.serial_number,
            golfCourseName: testData.testGolfCourse.name,
            usedBy: testData.testUser.name,
            usedDate: new Date().toISOString(),
            notes: 'Test usage log',
            jobType: testData.testJob.type,
            system: testData.testJob.system || 'Test System'
          }
        })
      })
      operations.push('Transaction - ✅')

    } catch (error) {
      operations.push(`Complex queries failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test 5: Delete operations (cleanup)
    try {
      // แก้ไขจาก deleteMany เป็น individual delete เพื่อรองรับ MongoDB standalone
      const partsUsageLogs = await prisma.partsUsageLog.findMany({
        where: {
          jobId: testData.testJob.id.toString()
        }
      })
      
      for (const log of partsUsageLogs) {
        await prisma.partsUsageLog.delete({
          where: { id: log.id }
        })
      }
      operations.push('Delete PartsUsageLog - ✅')

      await prisma.job.delete({
        where: { id: testData.testJob.id }
      })
      operations.push('Delete Job - ✅')

      await prisma.part.delete({
        where: { id: testData.testPart.id }
      })
      operations.push('Delete Part - ✅')

      await prisma.vehicle.delete({
        where: { id: testData.testVehicle.id }
      })
      operations.push('Delete Vehicle - ✅')

      await prisma.user.delete({
        where: { id: testData.testUser.id }
      })
      operations.push('Delete User - ✅')

      await prisma.golfCourse.delete({
        where: { id: testData.testGolfCourse.id }
      })
      operations.push('Delete Golf Course - ✅')

    } catch (error) {
      operations.push(`Delete operations failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return NextResponse.json({
      success: true,
      message: 'CRUD operations test completed successfully',
      data: {
        operations,
        testResults: {
          totalOperations: operations.length,
          successfulOperations: operations.filter(op => op.includes('✅')).length,
          failedOperations: operations.filter(op => !op.includes('✅')).length
        }
      }
    })

  } catch (error) {
    console.error('CRUD test error:', error)
    return NextResponse.json({
      success: false,
      message: 'CRUD operations test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}