import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST() {
  try {
    // ลบข้อมูลเดิมแบบทีละ collection (หลีกเลี่ยง transactions)
    try {
      // ลบ Jobs ก่อน (เพราะมี foreign key)
      const jobs = await prisma.job.findMany({})
      for (const job of jobs) {
        await prisma.job.delete({ where: { id: job.id } })
      }
    } catch (e) { console.log('No jobs to delete') }

    try {
      // ลบ Parts
      const parts = await prisma.part.findMany({})
      for (const part of parts) {
        await prisma.part.delete({ where: { id: part.id } })
      }
    } catch (e) { console.log('No parts to delete') }

    try {
      // ลบ SerialHistoryEntry
      const histories = await prisma.serialHistoryEntry.findMany({})
      for (const history of histories) {
        await prisma.serialHistoryEntry.delete({ where: { id: history.id } })
      }
    } catch (e) { console.log('No histories to delete') }

    try {
      // ลบ Vehicles
      const vehicles = await prisma.vehicle.findMany({})
      for (const vehicle of vehicles) {
        await prisma.vehicle.delete({ where: { id: vehicle.id } })
      }
    } catch (e) { console.log('No vehicles to delete') }

    try {
      // ลบ GolfCourses
      const golfCourses = await prisma.golfCourse.findMany({})
      for (const course of golfCourses) {
        await prisma.golfCourse.delete({ where: { id: course.id } })
      }
    } catch (e) { console.log('No golf courses to delete') }

    try {
      // ลบ Users
      const users = await prisma.user.findMany({})
      for (const user of users) {
        await prisma.user.delete({ where: { id: user.id } })
      }
    } catch (e) { console.log('No users to delete') }

    // สร้างข้อมูลใหม่
    
    // 1. สร้าง Golf Courses ก่อน
    const golfCourse1 = await prisma.golfCourse.create({
      data: { name: "สนามกอล์ฟ A" }
    })

    const golfCourse2 = await prisma.golfCourse.create({
      data: { name: "สนามกอล์ฟ B" }
    })

    const golfCourse3 = await prisma.golfCourse.create({
      data: { name: "สนามกอล์ฟ C" }
    })

    // 2. สร้าง Users (ใช้ Int สำหรับ golf_course_id)
    const user1 = await prisma.user.create({
      data: {
        code: "EMP001",
        name: "สมชาย ใจดี",
        role: "staff",
        golf_course_id: 1, // ใช้ Int แทน golfCourse1.id
        managed_golf_courses: []
      }
    })

    const user2 = await prisma.user.create({
      data: {
        code: "SUP001", 
        name: "สมหญิง รับผิดชอบ",
        role: "supervisor",
        golf_course_id: 1, // ใช้ Int แทน golfCourse1.id
        managed_golf_courses: [1, 2] // ใช้ Int array
      }
    })

    const user3 = await prisma.user.create({
      data: {
        code: "ADM001",
        name: "ผู้จัดการ ระบบ",
        role: "admin", 
        golf_course_id: 1, // ใช้ Int แทน golfCourse1.id
        managed_golf_courses: [1, 2, 3] // ใช้ Int array
      }
    })

    // 3. สร้าง Vehicles (ใช้ Int สำหรับ golf_course_id)
    const vehicle1 = await prisma.vehicle.create({
      data: {
        serial_number: "GC001",
        vehicle_number: "001",
        golf_course_id: 1, // ใช้ Int แทน golfCourse1.id
        golf_course_name: golfCourse1.name,
        model: "Club Car",
        battery_serial: "BAT001",
        status: "active"
      }
    })

    const vehicle2 = await prisma.vehicle.create({
      data: {
        serial_number: "GC002", 
        vehicle_number: "002",
        golf_course_id: 1, // ใช้ Int แทน golfCourse1.id
        golf_course_name: golfCourse1.name,
        model: "EZGO",
        battery_serial: "BAT002",
        status: "active"
      }
    })

    const vehicle3 = await prisma.vehicle.create({
      data: {
        serial_number: "GC003", 
        vehicle_number: "003",
        golf_course_id: 2, // ใช้ Int แทน golfCourse2.id
        golf_course_name: golfCourse2.name,
        model: "Yamaha",
        battery_serial: "BAT003",
        status: "active"
      }
    })

    // 4. สร้าง Parts
    const part1 = await prisma.part.create({
      data: {
        name: "แบตเตอรี่ 12V",
        unit: "ชิ้น",
        stock_qty: 10,
        min_qty: 2,
        max_qty: 50
      }
    })

    const part2 = await prisma.part.create({
      data: {
        name: "ยางรถกอล์ฟ",
        unit: "เส้น",
        stock_qty: 20,
        min_qty: 4,
        max_qty: 100
      }
    })

    // 5. สร้าง Jobs (ใช้ Int สำหรับ IDs)
    const job1 = await prisma.job.create({
      data: {
        type: "PM",
        status: "pending",
        vehicle_id: 1, // ใช้ Int
        vehicle_number: vehicle1.vehicle_number,
        golf_course_id: 1, // ใช้ Int
        user_id: 1, // ใช้ Int
        userName: user1.name,
        system: "electrical",
        subTasks: ["เปลี่ยนแบตเตอรี่", "ตรวจสอบระบบไฟ"],
        parts: [],
        remarks: "แบตเตอรี่เก่าหมดอายุ ต้องเปลี่ยนใหม่",
        assigned_by: 2, // ใช้ Int
        assigned_by_name: user2.name,
        assigned_to: 1, // ใช้ Int
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    const job2 = await prisma.job.create({
      data: {
        type: "BM",
        status: "in_progress",
        vehicle_id: 2, // ใช้ Int
        vehicle_number: vehicle2.vehicle_number,
        golf_course_id: 1, // ใช้ Int
        user_id: 1, // ใช้ Int
        userName: user1.name,
        system: "mechanical",
        subTasks: ["เปลี่ยนยาง"],
        parts: [],
        remarks: "ยางหน้าซ้ายแตก",
        bmCause: "breakdown",
        assigned_by: 2, // ใช้ Int
        assigned_by_name: user2.name,
        assigned_to: 1, // ใช้ Int
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully',
      created: {
        users: 3,
        golfCourses: 3,
        vehicles: 3,
        parts: 2,
        jobs: 2
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