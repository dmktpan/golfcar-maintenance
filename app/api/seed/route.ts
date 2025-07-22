import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST() {
  try {
    // สร้างข้อมูลตัวอย่าง
    
    // 1. สร้าง Users
    const users = await prisma.user.createMany({
      data: [
        {
          code: "EMP001",
          name: "สมชาย ใจดี",
          role: "staff",
          golf_course_id: 1,
          managed_golf_courses: []
        },
        {
          code: "SUP001", 
          name: "สมหญิง รับผิดชอบ",
          role: "supervisor",
          golf_course_id: 1,
          managed_golf_courses: [1, 2]
        },
        {
          code: "ADM001",
          name: "ผู้จัดการ ระบบ",
          role: "admin", 
          golf_course_id: 1,
          managed_golf_courses: [1, 2, 3]
        }
      ]
    })

    // 2. สร้าง Golf Courses
    const golfCourses = await prisma.golfCourse.createMany({
      data: [
        { name: "สนามกอล์ฟ A" },
        { name: "สนามกอล์ฟ B" },
        { name: "สนามกอล์ฟ C" }
      ]
    })

    // 3. สร้าง Vehicles
    const vehicles = await prisma.vehicle.createMany({
      data: [
        {
          serial_number: "GC001",
          vehicle_number: "001",
          golf_course_id: 1,
          golf_course_name: "สนามกอล์ฟ A",
          model: "Club Car",
          battery_serial: "BAT001",
          status: "active"
        },
        {
          serial_number: "GC002", 
          vehicle_number: "002",
          golf_course_id: 1,
          golf_course_name: "สนามกอล์ฟ A",
          model: "EZGO",
          battery_serial: "BAT002",
          status: "active"
        }
      ]
    })

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully',
      created: {
        users: users.count,
        golfCourses: golfCourses.count,
        vehicles: vehicles.count
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