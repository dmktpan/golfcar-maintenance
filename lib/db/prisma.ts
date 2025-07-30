import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// สร้าง PrismaClient พร้อม configuration ที่เหมาะสม
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// ใช้ singleton pattern เพื่อป้องกันการสร้าง connection ใหม่ซ้ำๆ
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// ใน development mode เก็บ instance ไว้ใน global เพื่อป้องกัน hot reload สร้างใหม่
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}