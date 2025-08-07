# การแก้ไขตัวกรองสนามกอล์ฟในหน้า Serial History

## ปัญหาที่พบ

### 1. ปัญหาการเปรียบเทียบ golf_course_id
- ในการกรองข้อมูล `filteredEntries` มีการเปรียบเทียบ `entry.golf_course_id` กับ `filterGolfCourse`
- `entry.golf_course_id` เป็น string แต่ `filterGolfCourse` เป็น number ทำให้การเปรียบเทียบไม่ตรงกัน
- ผลลัพธ์: ไม่สามารถเลือกสนามกอล์ฟจาก dropdown ได้

### 2. ปัญหาการแสดงสนามกอล์ฟที่มีข้อมูล
- `availableGolfCoursesWithData` ใช้ `MOCK_GOLF_COURSES` ซึ่งเป็น array ว่าง
- ไม่ได้ใช้ข้อมูล `golfCourses` ที่ดึงมาจาก API
- ผลลัพธ์: ตัวกรองไม่แสดงสนามกอล์ฟที่มีข้อมูล Serial History

### 3. ปัญหาการสร้างข้อมูล Serial History จาก Jobs
- `generateSerialHistoryFromJobs` ใช้ `MOCK_GOLF_COURSES` แทนที่จะใช้ `golfCourses` จาก API
- ทำให้ข้อมูลที่สร้างจาก Jobs ไม่มีข้อมูลสนามกอล์ฟที่ถูกต้อง

### 4. ปัญหาการตั้งค่า value ใน dropdown
- dropdown ใช้ `String(course.id)` แต่ในการกรองใช้ `course.id` ตรงๆ
- ทำให้เกิดความไม่สอดคล้องในการเปรียบเทียบ

## การแก้ไข

### 1. แก้ไขการเปรียบเทียบใน filteredEntries
```typescript
if (filterGolfCourse && filterGolfCourse !== '') {
  // แปลงทั้งสองค่าเป็น string เพื่อเปรียบเทียบ
  const entryGolfCourseId = String(entry.golf_course_id);
  const selectedGolfCourseId = String(filterGolfCourse);
  
  if (entryGolfCourseId !== selectedGolfCourseId) {
    return false;
  }
}
```

### 2. แก้ไข availableGolfCoursesWithData ให้ใช้ข้อมูลจาก API
```typescript
const availableGolfCoursesWithData = useMemo(() => {
  // Get unique golf course IDs from actual history data
  const uniqueCourseIds = Array.from(new Set(allSerialHistory.map(entry => entry.golf_course_id)));
  
  // Map to golf course objects with names
  const coursesWithData = uniqueCourseIds.map(courseId => {
    // Try to find in golfCourses first (from API)
    const apiCourse = golfCourses.find(course => course.id === courseId);
    if (apiCourse) {
      return apiCourse;
    }
    
    // Fallback to name from history data
    const historyEntry = allSerialHistory.find(entry => entry.golf_course_id === courseId);
    return {
      id: courseId,
      name: historyEntry?.golf_course_name || `สนาม ${courseId}`
    };
  });
  
  // Sort by name
  return coursesWithData.sort((a, b) => a.name.localeCompare(b.name));
}, [allSerialHistory, golfCourses]);
```

### 3. แก้ไข generateSerialHistoryFromJobs ให้ใช้ golfCourses จาก API
```typescript
const generateSerialHistoryFromJobs = useMemo(() => {
  const generatedEntries: SerialHistoryEntry[] = [];
  
  jobs.forEach(job => {
    const vehicle = vehicles.find(v => v.id === job.vehicle_id);
    if (!vehicle) return;

    // ใช้ golfCourses จาก API แทน MOCK_GOLF_COURSES
    const golfCourse = golfCourses.find(gc => gc.id === vehicle.golf_course_id);
    if (!golfCourse) return;
    
    // ... rest of the code
  });

  return generatedEntries;
}, [jobs, vehicles, golfCourses]); // เพิ่ม golfCourses ใน dependency array
```

### 4. แก้ไข dropdown value ให้สอดคล้องกัน
```typescript
// เปลี่ยนจาก
<option key={course.id} value={String(course.id)}>

// เป็น
<option key={course.id} value={course.id}>
```

## ผลลัพธ์
- ตัวกรองสนามกอล์ฟทำงานได้ถูกต้อง
- สามารถเลือกสนามกอล์ฟจาก dropdown ได้
- แสดงเฉพาะสนามกอล์ฟที่มีข้อมูล Serial History
- การกรองทำงานเหมือนกับตัวกรอง "Action Type" อื่นๆ
- ข้อมูลที่สร้างจาก Jobs มีข้อมูลสนามกอล์ฟที่ถูกต้องจาก API