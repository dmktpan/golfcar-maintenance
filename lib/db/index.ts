// lib/db/index.ts
export { prisma } from './prisma'
export { dbManager } from './connection-manager'

// Re-export Prisma types สำหรับความสะดวก
export type {
  User,
  Vehicle,
  Job,
  Part,
  GolfCourse,
  JobPart,
  PartsUsageLog,
  SerialHistoryEntry,
  UserRole,
  JobType,
  JobStatus,
  VehicleStatus,
  BMCause,
  ActionType
} from '@prisma/client'

// Helper functions สำหรับ common operations
import { prisma } from './prisma'
import { dbManager } from './connection-manager'

export const db = {
  // User operations
  users: {
    findByCode: (code: string) => 
      dbManager.executeWithTiming(
        () => prisma.user.findUnique({ where: { code } }),
        `findUserByCode:${code}`
      ),
    
    findByGolfCourse: (golfCourseId: string) =>
      dbManager.executeWithTiming(
        () => prisma.user.findMany({ 
          where: { golf_course_id: golfCourseId },
          include: { golfCourse: true }
        }),
        `findUsersByGolfCourse:${golfCourseId}`
      ),
  },

  // Vehicle operations
  vehicles: {
    findBySerial: (serialNumber: string) =>
      dbManager.executeWithTiming(
        () => prisma.vehicle.findUnique({ 
          where: { serial_number: serialNumber },
          include: { golfCourse: true }
        }),
        `findVehicleBySerial:${serialNumber}`
      ),

    findByGolfCourse: (golfCourseId: string) =>
      dbManager.executeWithTiming(
        () => prisma.vehicle.findMany({ 
          where: { golf_course_id: golfCourseId },
          include: { golfCourse: true }
        }),
        `findVehiclesByGolfCourse:${golfCourseId}`
      ),
  },

  // Job operations
  jobs: {
    findPending: () =>
      dbManager.executeWithTiming(
        () => prisma.job.findMany({ 
          where: { status: 'pending' },
          include: { 
            vehicle: true, 
            author: true, 
            assignee: true,
            golfCourse: true 
          }
        }),
        'findPendingJobs'
      ),

    findByAssignee: (userId: string) =>
      dbManager.executeWithTiming(
        () => prisma.job.findMany({ 
          where: { assigned_to: userId },
          include: { 
            vehicle: true, 
            author: true,
            golfCourse: true 
          }
        }),
        `findJobsByAssignee:${userId}`
      ),
  },

  // Golf Course operations
  golfCourses: {
    findAll: () =>
      dbManager.executeWithTiming(
        () => prisma.golfCourse.findMany({
          include: {
            _count: {
              select: {
                users: true,
                vehicles: true,
                jobs: true
              }
            }
          }
        }),
        'findAllGolfCourses'
      ),
  },

  // Health check
  healthCheck: () => dbManager.healthCheck(),
  
  // Connection status
  getStatus: () => dbManager.getConnectionStatus(),
}