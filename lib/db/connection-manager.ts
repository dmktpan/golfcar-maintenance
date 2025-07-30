// lib/db/connection-manager.ts
import { prisma } from './prisma'

class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager
  private connectionCount = 0
  private isConnected = false

  private constructor() {}

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager()
    }
    return DatabaseConnectionManager.instance
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return
    }

    try {
      // ทดสอบ connection
      await prisma.$connect()
      this.isConnected = true
      this.connectionCount++
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔗 Database connected (Connection #${this.connectionCount})`)
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return
    }

    try {
      await prisma.$disconnect()
      this.isConnected = false
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔌 Database disconnected')
      }
    } catch (error) {
      console.error('❌ Database disconnection failed:', error)
      throw error
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // ใช้การ query collection ง่ายๆ สำหรับ health check
      await prisma.user.findFirst({ take: 1 })
      return true
    } catch (error) {
      console.error('❌ Database health check failed:', error)
      return false
    }
  }

  getConnectionStatus(): { isConnected: boolean; connectionCount: number } {
    return {
      isConnected: this.isConnected,
      connectionCount: this.connectionCount
    }
  }

  // Performance monitoring
  async executeWithTiming<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    // Import performance monitor แบบ dynamic เพื่อหลีกเลี่ยง circular dependency
    const { measurePerformance } = await import('@/lib/utils/performance')
    return measurePerformance(operation, operationName)
  }
}

export const dbManager = DatabaseConnectionManager.getInstance()

// Auto-connect ใน development
if (process.env.NODE_ENV === 'development') {
  dbManager.connect().catch(console.error)
}