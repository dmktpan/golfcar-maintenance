# Frontend API Integration Guide

## การแทนที่ Mock Data ด้วย API Calls

### 1. สร้าง API Service Functions

สร้างไฟล์ `lib/api.ts` สำหรับจัดการ API calls:

```typescript
// lib/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://192.168.1.54:8080/api' 
  : 'http://localhost:3000/api'

// Golf Courses API
export const golfCoursesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/golf-courses`)
    return response.json()
  },
  create: async (data: { name: string }) => {
    const response = await fetch(`${API_BASE_URL}/golf-courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  },
  update: async (id: number, data: { name: string }) => {
    const response = await fetch(`${API_BASE_URL}/golf-courses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  },
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/golf-courses/${id}`, {
      method: 'DELETE'
    })
    return response.json()
  }
}

// Users API
export const usersApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/users`)
    return response.json()
  },
  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}

// Vehicles API
export const vehiclesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/vehicles`)
    return response.json()
  },
  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}

// Parts API
export const partsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/parts`)
    return response.json()
  },
  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}

// Jobs API
export const jobsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/jobs`)
    return response.json()
  },
  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  },
  update: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}
```

### 2. อัปเดต Components ที่ใช้ Mock Data

#### GolfCourseManagementScreen.tsx
```typescript
// แทนที่
import { MOCK_GOLF_COURSES } from '@/lib/data'

// ด้วย
import { golfCoursesApi } from '@/lib/api'
import { useEffect, useState } from 'react'

// ใน component
const [golfCourses, setGolfCourses] = useState([])

useEffect(() => {
  const fetchGolfCourses = async () => {
    try {
      const result = await golfCoursesApi.getAll()
      if (result.success) {
        setGolfCourses(result.data)
      }
    } catch (error) {
      console.error('Error fetching golf courses:', error)
    }
  }
  fetchGolfCourses()
}, [])

// สำหรับการเพิ่มสนามใหม่
const handleAddCourse = async (name: string) => {
  try {
    const result = await golfCoursesApi.create({ name })
    if (result.success) {
      setGolfCourses([...golfCourses, result.data])
    }
  } catch (error) {
    console.error('Error creating golf course:', error)
  }
}
```

#### CreateJobScreen.tsx
```typescript
// แทนที่
import { MOCK_VEHICLES, MOCK_USERS } from '@/lib/data'

// ด้วย
import { vehiclesApi, usersApi, jobsApi } from '@/lib/api'

// ใน component
const [vehicles, setVehicles] = useState([])
const [users, setUsers] = useState([])

useEffect(() => {
  const fetchData = async () => {
    try {
      const [vehiclesResult, usersResult] = await Promise.all([
        vehiclesApi.getAll(),
        usersApi.getAll()
      ])
      
      if (vehiclesResult.success) setVehicles(vehiclesResult.data)
      if (usersResult.success) setUsers(usersResult.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }
  fetchData()
}, [])

// สำหรับการสร้างงานใหม่
const handleCreateJob = async (jobData: any) => {
  try {
    const result = await jobsApi.create(jobData)
    if (result.success) {
      // Handle success
      router.push('/jobs')
    }
  } catch (error) {
    console.error('Error creating job:', error)
  }
}
```

#### PartsManagementScreen.tsx
```typescript
// แทนที่
import { MOCK_PARTS } from '@/lib/data'

// ด้วย
import { partsApi } from '@/lib/api'

// ใน component
const [parts, setParts] = useState([])

useEffect(() => {
  const fetchParts = async () => {
    try {
      const result = await partsApi.getAll()
      if (result.success) {
        setParts(result.data)
      }
    } catch (error) {
      console.error('Error fetching parts:', error)
    }
  }
  fetchParts()
}, [])
```

### 3. อัปเดต Components อื่นๆ

#### JobCard.tsx, SupervisorPendingJobsScreen.tsx, ViewAssignedJobsScreen.tsx
```typescript
// แทนที่
import { MOCK_JOBS } from '@/lib/data'

// ด้วย
import { jobsApi } from '@/lib/api'

// ใช้ useEffect เพื่อ fetch ข้อมูลจาก API
```

#### MultiAssignScreen.tsx, AssignedJobFormScreen.tsx
```typescript
// แทนที่ Mock data ด้วย API calls สำหรับ:
// - MOCK_VEHICLES → vehiclesApi.getAll()
// - MOCK_USERS → usersApi.getAll()
// - MOCK_JOBS → jobsApi.getAll()
```

### 4. การจัดการ Loading และ Error States

```typescript
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

const fetchData = async () => {
  try {
    setLoading(true)
    setError(null)
    const result = await api.getAll()
    if (result.success) {
      setData(result.data)
    } else {
      setError(result.message)
    }
  } catch (err) {
    setError('เกิดข้อผิดพลาดในการโหลดข้อมูล')
  } finally {
    setLoading(false)
  }
}

// ใน JSX
if (loading) return <div>กำลังโหลด...</div>
if (error) return <div>ข้อผิดพลาด: {error}</div>
```

### 5. การใช้ React Query (แนะนำ)

ติดตั้ง React Query สำหรับการจัดการ API calls ที่ดีขึ้น:

```bash
npm install @tanstack/react-query
```

```typescript
// lib/hooks/useGolfCourses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { golfCoursesApi } from '@/lib/api'

export const useGolfCourses = () => {
  return useQuery({
    queryKey: ['golf-courses'],
    queryFn: golfCoursesApi.getAll
  })
}

export const useCreateGolfCourse = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: golfCoursesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['golf-courses'] })
    }
  })
}
```

### 6. Environment Variables

สร้างไฟล์ `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

สำหรับ production:
```
NEXT_PUBLIC_API_URL=http://192.168.1.54:8080/api
```

### 7. การทดสอบ

1. เริ่มต้นด้วยการ seed ข้อมูล:
```bash
curl -X POST http://localhost:3000/api/seed-initial-data
```

2. ทดสอบ Frontend ที่อัปเดตแล้ว
3. ตรวจสอบว่าข้อมูลถูกบันทึกใน MongoDB

### 8. การ Deploy

1. อัปเดตโค้ด Frontend
2. Build และ deploy
3. อัปเดต environment variables บน production server
4. ทดสอบการทำงานบน production

## สรุป

การเปลี่ยนจาก Mock Data เป็น API calls จะทำให้:
- ข้อมูลถูกบันทึกจริงใน MongoDB
- แอปพลิเคชันพร้อมใช้งานจริง
- สามารถ sync ข้อมูลระหว่าง users ได้
- มีการจัดการ state ที่ดีขึ้น