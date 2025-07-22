import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { prisma } from '@/lib/db/prisma'

// Mongoose Schemas
const userSchema = new mongoose.Schema({
  code: String,
  name: String,
  role: String,
  golf_course_id: Number,
  managed_golf_courses: [Number],
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

// Mongoose Models
const MongoUser = mongoose.models.User || mongoose.model('User', userSchema)
const MongoVehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema)
const MongoJob = mongoose.models.Job || mongoose.model('Job', jobSchema)

// เพิ่ม GET method เพื่อให้เรียกได้ง่าย
export async function GET() {
  return POST() // เรียกใช้ POST function เดียวกัน
}

export async function POST() {
  try {
    // เชื่อมต่อ MongoDB ผ่าน Mongoose
    await mongoose.connect(process.env.MONGODB_URI as string)
    console.log('Connected to MongoDB via Mongoose')

    let migratedCounts = {
      users: 0,
      vehicles: 0,
      jobs: 0
    }

    // 1. Migrate Users
    console.log('Migrating Users...')
    const mongoUsers = await MongoUser.find({})
    for (const user of mongoUsers) {
      try {
        await prisma.user.upsert({
          where: { code: user.code },
          update: {
            name: user.name,
            role: user.role,
            golf_course_id: user.golf_course_id,
            managed_golf_courses: user.managed_golf_courses || [],
            updatedAt: user.updatedAt || new Date(),
          },
          create: {
            code: user.code,
            name: user.name,
            role: user.role,
            golf_course_id: user.golf_course_id,
            managed_golf_courses: user.managed_golf_courses || [],
            createdAt: user.createdAt || new Date(),
            updatedAt: user.updatedAt || new Date(),
          }
        })
        migratedCounts.users++
      } catch (error) {
        console.error('Error migrating user:', user.code, error)
      }
    }

    // 2. Migrate Vehicles
    console.log('Migrating Vehicles...')
    const mongoVehicles = await MongoVehicle.find({})
    for (const vehicle of mongoVehicles) {
      try {
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
        migratedCounts.vehicles++
      } catch (error) {
        console.error('Error migrating vehicle:', vehicle.serial_number, error)
      }
    }

    // 3. Migrate Jobs
    console.log('Migrating Jobs...')
    const mongoJobs = await MongoJob.find({})
    for (const job of mongoJobs) {
      try {
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
            parts: job.parts || [],
            partsNotes: job.partsNotes,
            remarks: job.remarks,
            bmCause: job.bmCause,
            battery_serial: job.battery_serial,
            assigned_by: job.assigned_by,
            assigned_by_name: job.assigned_by_name,
            assigned_to: job.assigned_to,
            created_at: job.created_at,
            updated_at: job.updated_at,
            createdAt: job.createdAt || new Date(),
            updatedAt: job.updatedAt || new Date(),
          }
        })
        migratedCounts.jobs++
      } catch (error) {
        console.error('Error migrating job:', job._id, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      originalCounts: {
        users: mongoUsers.length,
        vehicles: mongoVehicles.length,
        jobs: mongoJobs.length
      },
      migratedCounts,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Migration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await mongoose.disconnect()
    await prisma.$disconnect()
  }
}