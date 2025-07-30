# Database Optimization & Performance Monitoring

## สรุปการปรับปรุงระบบ

ระบบได้รับการปรับปรุงเพื่อแก้ไขปัญหา PrismaClient singleton และเพิ่มประสิทธิภาพการทำงาน:

### 1. PrismaClient Singleton (lib/db/prisma.ts)
- ✅ ปลอดภัยกับ Next.js development mode
- ✅ ป้องกันการสร้าง instance ซ้ำ
- ✅ Graceful shutdown สำหรับ production
- ✅ Logging configuration ตาม environment

### 2. Database Connection Manager (lib/db/connection-manager.ts)
- ✅ Connection pool management
- ✅ Health check monitoring
- ✅ Performance timing measurement
- ✅ Auto-connect ใน development

### 3. Database Utilities (lib/db/index.ts)
- ✅ Helper functions สำหรับ common operations
- ✅ Performance monitoring integration
- ✅ Type-safe database operations

### 4. API Middleware (lib/middleware/database.ts)
- ✅ Database connection validation
- ✅ Prisma error handling
- ✅ Consistent error responses

### 5. Performance Monitor (lib/utils/performance.ts)
- ✅ Operation timing tracking
- ✅ Success/failure statistics
- ✅ Slow operation detection
- ✅ Memory-efficient metrics storage

## API Endpoints ใหม่

### Health Check
```
GET /api/health
```
ตรวจสอบสถานะ database connection และ performance

### Performance Metrics
```
GET /api/metrics
GET /api/metrics?type=stats
GET /api/metrics?type=slow
GET /api/metrics?type=failed
GET /api/metrics?type=recent
```
ดูสถิติการทำงานและ performance metrics

```
POST /api/metrics
```
ล้าง metrics (development mode เท่านั้น)

## การใช้งาน

### 1. Database Operations
```typescript
import { prisma, dbManager, findUserById } from '@/lib/db'

// ใช้ helper functions
const user = await findUserById('user-id')

// ใช้ prisma โดยตรง
const users = await prisma.user.findMany()

// ใช้ performance monitoring
const result = await dbManager.executeWithTiming(
  'complex-query',
  () => prisma.user.findMany({ include: { vehicles: true } })
)
```

### 2. API Routes
```typescript
import { withDatabaseConnection, handlePrismaError } from '@/lib/middleware/database'

export const GET = withDatabaseConnection(async (request) => {
  try {
    const data = await prisma.user.findMany()
    return NextResponse.json(data)
  } catch (error) {
    return handlePrismaError(error)
  }
})
```

## ประโยชน์ที่ได้รับ

1. **ประสิทธิภาพดีขึ้น**: ไม่มีการสร้าง PrismaClient ซ้ำ
2. **Monitoring**: ติดตามการทำงานแบบ real-time
3. **Error Handling**: จัดการ error อย่างสม่ำเสมอ
4. **Development Experience**: Hot reload ไม่มีปัญหา connection leak
5. **Production Ready**: Graceful shutdown และ connection pooling

## การตรวจสอบ

1. เข้าไปที่ `http://localhost:3000/api/health` เพื่อดู database status
2. เข้าไปที่ `http://localhost:3000/api/metrics` เพื่อดู performance metrics
3. ตรวจสอบ console logs สำหรับ slow operations (>1000ms)

## Environment Variables

ตรวจสอบให้แน่ใจว่ามี:
```
DATABASE_URL="your-mongodb-connection-string"
NODE_ENV="development" # หรือ "production"
```