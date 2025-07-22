import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST() {
  try {
    // ลบข้อมูลเดิมก่อน (ถ้ามี)
    await prisma.job.deleteMany({})
    await prisma.vehicle.deleteMany({})
    await prisma.golfCourse.deleteMany({})
    await prisma.user.deleteMany({})
    
    // สร้างข้อมูลตัวอย่าง แบบทีละรายการ
    
    // 1. สร้าง Users
    const user1 = await prisma.user.create({
      data: {
        code: "EMP001",
        name: "สมชาย ใจดี",
        role: "staff",
        golf_course_id: 1,
        managed_golf_courses: []
      }
    })

    const user2 = await prisma.user.create({
      data: {
        code: "SUP001", 
        name: "สมหญิง รับผิดชอบ",
        role: "supervisor",
        golf_course_id: 1,
        managed_golf_courses: [1, 2]
      }
    })

    const user3 = await prisma.user.create({
      data: {
        code: "ADM001",
        name: "ผู้จัดการ ระบบ",
        role: "admin", 
        golf_course_id: 1,
        managed_golf_courses: [1, 2, 3]
      }
    })

    // 2. สร้าง Golf Courses
    const golfCourse1 = await prisma.golfCourse.create({
      data: { name: "สนามกอล์ฟ A" }
    })

    const golfCourse2 = await prisma.golfCourse.create({
      data: { name: "สนามกอล์ฟ B" }
    })

    // 3. สร้าง Vehicles
    const vehicle1 = await prisma.vehicle.create({
      data: {
        serial_number: "GC001",
        vehicle_number: "001",
        golf_course_id: 1,
        golf_course_name: "สนามกอล์ฟ A",
        model: "Club Car",
        battery_serial: "BAT001",
        status: "active"
      }
    })

    const vehicle2 = await prisma.vehicle.create({
      data: {
        serial_number: "GC002", 
        vehicle_number: "002",
        golf_course_id: 1,
        golf_course_name: "สนามกอล์ฟ A",
        model: "EZGO",
        battery_serial: "BAT002",
        status: "active"
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully',
      created: {
        users: 3,
        golfCourses: 2,
        vehicles: 2
      }
    })

  } catch (error) {
    console.error('Seed failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Seed failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}