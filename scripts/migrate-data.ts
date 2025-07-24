import * as dotenv from 'dotenv'
import { resolve } from 'path'

// โโหลด environment variables จาก .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') })

import mongoose from 'mongoose'
import { prisma } from '../lib/db/prisma'

// Mongoose Schemas (ตาม schema เดิม)
const userSchema = new mongoose.Schema({
  code: String,
  name: String,
  role: String,
  golf_course_id: Number,
  managed_golf_courses: [Number],
}, { timestamps: true })

const golfCourseSchema = new mongoose.Schema({
  name: String,
}, { timestamps: true })

const vehicleSchema = new mongoose.Schema({
  serial_number: String,
  vehicle_number: String,
  golf_course_id: Number,
  golf_course_name: String,
  model: String,
  battery_serial: String,
  status: String,
  transfer_date: String,
}, { timestamps: true })

const jobSchema = new mongoose.Schema({
  type: String,
  status: String,
  vehicle_id: Number,
  vehicle_number: String,
  golf_course_id: Number,
  user_id: Number,
  userName: String,
  system: String,
  subTasks: [String],
  parts: [Object],
  partsNotes: String,
  remarks: String,
  bmCause: String,
  battery_serial: String,
  assigned_by: Number,
  assigned_by_name: String,
  assigned_to: Number,
  created_at: String,
  updated_at: String,
}, { timestamps: true })

const partSchema = new mongoose.Schema({
  name: String,
  unit: String,
  stock_qty: Number,
  min_qty: Number,
  max_qty: Number,
}, { timestamps: true })

const serialHistorySchema = new mongoose.Schema({
  serial_number: String,
  vehicle_id: Number,
  vehicle_number: String,
  action_type: String,
  action_date: String,
  actual_transfer_date: String,
  details: String,
  performed_by: String,
  performed_by_id: Number,
  golf_course_id: Number,
  golf_course_name: String,
  is_active: Boolean,
  related_job_id: Number,
  job_type: String,
  system: String,
  parts_used: [String],
  status: String,
  battery_serial: String,
  previous_data: Object,
  new_data: Object,
  change_type: String,
  affected_fields: [String],
}, { timestamps: true })

const partsUsageLogSchema = new mongoose.Schema({
  jobId: Number,
  partName: String,
  partId: String,
  quantity: Number,
  usedDate: String,
  userName: String,
  vehicleNumber: String,
  serialNumber: String,
  golfCourseName: String,
  jobType: String,
  system: String,
}, { timestamps: true })

// Mongoose Models
const MongoUser = mongoose.models.User || mongoose.model('User', userSchema)
const MongoGolfCourse = mongoose.models.GolfCourse || mongoose.model('GolfCourse', golfCourseSchema)
const MongoVehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema)
const MongoJob = mongoose.models.Job || mongoose.model('Job', jobSchema)
const MongoPart = mongoose.models.Part || mongoose.model('Part', partSchema)
const MongoSerialHistory = mongoose.models.SerialHistory || mongoose.model('SerialHistory', serialHistorySchema)
const MongoPartsUsageLog = mongoose.models.PartsUsageLog || mongoose.model('PartsUsageLog', partsUsageLogSchema)

async function migrateData() {
  try {
    // เชื่อมต่อ MongoDB ผ่าน Mongoose
    await mongoose.connect(process.env.MONGODB_URI as string)
    console.log('Connected to MongoDB via Mongoose')

    // 1. Migrate Users
    console.log('Migrating Users...')
    const mongoUsers = await MongoUser.find({})
    for (const user of mongoUsers) {
      await prisma.user.upsert({
        where: { code: user.code },
        update: {
          username: user.username || user.code,
          name: user.name,
          role: user.role,
          golf_course_id: user.golf_course_id,
          golf_course_name: user.golf_course_name || 'Unknown',
          managed_golf_courses: user.managed_golf_courses || [],
          updatedAt: user.updatedAt || new Date(),
        },
        create: {
          code: user.code,
          username: user.username || user.code, // ใช้ code เป็น username หากไม่มี
          name: user.name,
          role: user.role,
          golf_course_id: user.golf_course_id,
          golf_course_name: user.golf_course_name || 'Unknown', // ใส่ค่า default
          managed_golf_courses: user.managed_golf_courses || [],
          createdAt: user.createdAt || new Date(),
          updatedAt: user.updatedAt || new Date(),
        }
      })
    }
    console.log(`Migrated ${mongoUsers.length} users`)

    // 2. Migrate Golf Courses
    console.log('Migrating Golf Courses...')
    const mongoGolfCourses = await MongoGolfCourse.find({})
    for (const course of mongoGolfCourses) {
      await prisma.golfCourse.create({
        data: {
          name: course.name,
          createdAt: course.createdAt || new Date(),
          updatedAt: course.updatedAt || new Date(),
        }
      })
    }
    console.log(`Migrated ${mongoGolfCourses.length} golf courses`)

    // 3. Migrate Vehicles
    console.log('Migrating Vehicles...')
    const mongoVehicles = await MongoVehicle.find({})
    for (const vehicle of mongoVehicles) {
      await prisma.vehicle.upsert({
        where: { serial_number: vehicle.serial_number },
        update: {
          vehicle_number: vehicle.vehicle_number,
          golf_course_id: vehicle.golf_course_id,
          golf_course_name: vehicle.golf_course_name,
          model: vehicle.model,
          battery_serial: vehicle.battery_serial,
          status: vehicle.status,
          transfer_date: vehicle.transfer_date,
          updatedAt: vehicle.updatedAt || new Date(),
        },
        create: {
          serial_number: vehicle.serial_number,
          vehicle_number: vehicle.vehicle_number,
          golf_course_id: vehicle.golf_course_id,
          golf_course_name: vehicle.golf_course_name,
          model: vehicle.model,
          battery_serial: vehicle.battery_serial,
          status: vehicle.status,
          transfer_date: vehicle.transfer_date,
          createdAt: vehicle.createdAt || new Date(),
          updatedAt: vehicle.updatedAt || new Date(),
        }
      })
    }
    console.log(`Migrated ${mongoVehicles.length} vehicles`)

    // 4. Migrate Jobs
    console.log('Migrating Jobs...')
    const mongoJobs = await MongoJob.find({})
    for (const job of mongoJobs) {
      await prisma.job.create({
        data: {
          type: job.type,
          status: job.status,
          vehicle_id: job.vehicle_id,
          vehicle_number: job.vehicle_number,
          golf_course_id: job.golf_course_id,
          user_id: job.user_id,
          userName: job.userName,
          system: job.system,
          subTasks: job.subTasks || [],
          remarks: job.remarks,
          bmCause: job.bmCause,
          battery_serial: job.battery_serial,
          assigned_to: job.assigned_to,
          createdAt: job.createdAt || new Date(),
          updatedAt: job.updatedAt || new Date(),
        }
      })
    }
    console.log(`Migrated ${mongoJobs.length} jobs`)

    // 5. Migrate Parts
    console.log('Migrating Parts...')
    const mongoParts = await MongoPart.find({})
    for (const part of mongoParts) {
      await prisma.part.create({
        data: {
          name: part.name,
          unit: part.unit,
          stock_qty: part.stock_qty,
          min_qty: part.min_qty,
          max_qty: part.max_qty,
          createdAt: part.createdAt || new Date(),
          updatedAt: part.updatedAt || new Date(),
        }
      })
    }
    console.log(`Migrated ${mongoParts.length} parts`)

    // 6. Migrate Serial History
    console.log('Migrating Serial History...')
    const mongoSerialHistory = await MongoSerialHistory.find({})
    for (const entry of mongoSerialHistory) {
      await prisma.serialHistoryEntry.create({
        data: {
          action_type: entry.action_type,
          action_date: entry.action_date || new Date(),
          actual_transfer_date: entry.actual_transfer_date,
          details: entry.details,
          is_active: entry.is_active,
          vehicle_id: entry.vehicle_id,
          performed_by_id: entry.performed_by_id,
          related_job_id: entry.related_job_id,
        }
      })
    }
    console.log(`Migrated ${mongoSerialHistory.length} serial history entries`)

    // 7. Migrate Parts Usage Logs
    console.log('Migrating Parts Usage Logs...')
    const mongoPartsUsageLogs = await MongoPartsUsageLog.find({})
    for (const log of mongoPartsUsageLogs) {
      await prisma.partsUsageLog.create({
        data: {
          jobId: log.jobId,
          partId: log.partId,
          quantity: log.quantity,
          createdAt: log.createdAt || new Date(),
        }
      })
    }
    console.log(`Migrated ${mongoPartsUsageLogs.length} parts usage logs`)

    console.log('Migration completed successfully!')

  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await mongoose.disconnect()
    await prisma.$disconnect()
  }
}

// รัน migration
migrateData()