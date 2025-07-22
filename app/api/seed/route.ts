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
      // ลบ Parts Usage Logs
      const logs = await prisma.partsUsageLog.findMany({})
      for (const log of logs) {
        await prisma.partsUsageLog.delete({ where: { id: log.id } })
      }
    } catch (e) { console.log('No parts usage logs to delete') }

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

    // 3. สร้าง Vehicles (ใช้ Int สำหรับ golf_course_id)
    const vehicle1 = await prisma.vehicle.create({
      data: {
        serial_number: "GC001",
        vehicle_number: "001",
        golf_course_id: 1,
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
        golf_course_id: 1,
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
        golf_course_id: 2,
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

    const part3 = await prisma.part.create({
      data: {
        name: "น้ำมันเครื่อง",
        unit: "ลิตร",
        stock_qty: 15,
        min_qty: 3,
        max_qty: 30
      }
    })

    // 5. สร้าง Jobs (ใช้ Int สำหรับ IDs)
    const job1 = await prisma.job.create({
      data: {
        type: "PM",
        status: "pending",
        vehicle_id: 1,
        vehicle_number: vehicle1.vehicle_number,
        golf_course_id: 1,
        user_id: 1,
        userName: user1.name,
        system: "electrical",
        subTasks: ["เปลี่ยนแบตเตอรี่", "ตรวจสอบระบบไฟ"],
        parts: [],
        remarks: "แบตเตอรี่เก่าหมดอายุ ต้องเปลี่ยนใหม่",
        assigned_by: 2,
        assigned_by_name: user2.name,
        assigned_to: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    const job2 = await prisma.job.create({
      data: {
        type: "BM",
        status: "in_progress",
        vehicle_id: 2,
        vehicle_number: vehicle2.vehicle_number,
        golf_course_id: 1,
        user_id: 1,
        userName: user1.name,
        system: "mechanical",
        subTasks: ["เปลี่ยนยาง"],
        parts: [],
        remarks: "ยางหน้าซ้ายแตก",
        bmCause: "breakdown",
        assigned_by: 2,
        assigned_by_name: user2.name,
        assigned_to: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    const job3 = await prisma.job.create({
      data: {
        type: "Recondition",
        status: "completed",
        vehicle_id: 3,
        vehicle_number: vehicle3.vehicle_number,
        golf_course_id: 2,
        user_id: 1,
        userName: user1.name,
        system: "engine",
        subTasks: ["เปลี่ยนน้ำมันเครื่อง", "ตรวจสอบเครื่องยนต์"],
        parts: [
          {
            partId: part3.id,
            partName: part3.name,
            quantity: 2,
            unit: part3.unit
          }
        ],
        remarks: "Recondition เครื่องยนต์ประจำปี",
        assigned_by: 2,
        assigned_by_name: user2.name,
        assigned_to: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    // 6. สร้าง Serial History Entries
    const history1 = await prisma.serialHistoryEntry.create({
      data: {
        serial_number: vehicle1.serial_number,
        vehicle_id: 1,
        vehicle_number: vehicle1.vehicle_number,
        action_type: "registration",
        action_date: new Date().toISOString(),
        details: "ลงทะเบียนรถกอล์ฟใหม่",
        performed_by: user3.name,
        performed_by_id: 3,
        golf_course_id: 1,
        golf_course_name: golfCourse1.name,
        is_active: true,
        battery_serial: vehicle1.battery_serial,
        change_type: "create",
        affected_fields: ["serial_number", "vehicle_number", "golf_course_id"]
      }
    })

    const history2 = await prisma.serialHistoryEntry.create({
      data: {
        serial_number: vehicle2.serial_number,
        vehicle_id: 2,
        vehicle_number: vehicle2.vehicle_number,
        action_type: "maintenance",
        action_date: new Date().toISOString(),
        details: "เริ่มงาน BM - ยางหน้าซ้ายแตก",
        performed_by: user1.name,
        performed_by_id: 1,
        golf_course_id: 1,
        golf_course_name: golfCourse1.name,
        is_active: true,
        related_job_id: 2,
        job_type: "BM",
        system: "mechanical",
        status: "in_progress",
        battery_serial: vehicle2.battery_serial,
        change_type: "update",
        affected_fields: ["status"]
      }
    })

    const history3 = await prisma.serialHistoryEntry.create({
      data: {
        serial_number: vehicle3.serial_number,
        vehicle_id: 3,
        vehicle_number: vehicle3.vehicle_number,
        action_type: "maintenance",
        action_date: new Date().toISOString(),
        details: "เสร็จสิ้นงาน Recondition - เปลี่ยนน้ำมันเครื่อง",
        performed_by: user1.name,
        performed_by_id: 1,
        golf_course_id: 2,
        golf_course_name: golfCourse2.name,
        is_active: true,
        related_job_id: 3,
        job_type: "Recondition",
        system: "engine",
        parts_used: ["น้ำมันเครื่อง"],
        status: "completed",
        battery_serial: vehicle3.battery_serial,
        change_type: "update",
        affected_fields: ["status", "parts_used"]
      }
    })

    // 7. สร้าง Parts Usage Logs
    const usageLog1 = await prisma.partsUsageLog.create({
      data: {
        jobId: 3,
        partName: part3.name,
        partId: part3.id,
        quantity: 2,
        usedDate: new Date().toISOString(),
        userName: user1.name,
        vehicleNumber: vehicle3.vehicle_number,
        serialNumber: vehicle3.serial_number,
        golfCourseName: golfCourse2.name,
        jobType: "Recondition",
        system: "engine"
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully',
      created: {
        users: 3,
        golfCourses: 3,
        vehicles: 3,
        parts: 3,
        jobs: 3,
        serialHistory: 3,
        partsUsageLogs: 1
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