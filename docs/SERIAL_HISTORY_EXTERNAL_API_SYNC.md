# Serial History External API Synchronization

## การปรับปรุงระบบ Serial History สำหรับ Job Activities

### ปัญหาที่แก้ไข
ก่อนหน้านี้ข้อมูล Serial History ของ Job Activities จะถูกบันทึกเฉพาะในฐานข้อมูลท้องถิ่น (Prisma) เท่านั้น และไม่ได้ถูกส่งไปยัง External API ซึ่งทำให้ข้อมูลไม่ซิงค์กัน

### การแก้ไขที่ทำ

#### 1. เพิ่มฟังก์ชัน `sendSerialHistoryToExternalAPI`
- เพิ่มใน `/app/api/jobs/route.ts`
- เพิ่มใน `/app/api/jobs/[id]/route.ts`
- ฟังก์ชันนี้จะส่งข้อมูล Serial History ไปยัง External API
- มี timeout 10 วินาที และ error handling ที่ไม่กระทบต่อการทำงานหลัก

#### 2. การเรียกใช้ฟังก์ชันใน Job Creation (POST)
**ไฟล์:** `/app/api/jobs/route.ts`
- หลังจากสร้าง Serial History ในฐานข้อมูลท้องถิ่น
- ใช้ `setImmediate()` เพื่อส่งข้อมูลไปยัง External API แบบ asynchronous
- ไม่รอผลลัพธ์เพื่อไม่ให้กระทบต่อ response time

#### 3. การเรียกใช้ฟังก์ชันใน Job Update (PUT)
**ไฟล์:** `/app/api/jobs/route.ts` และ `/app/api/jobs/[id]/route.ts`
- หลังจากสร้าง Serial History เมื่อเปลี่ยนสถานะเป็น 'assigned' หรือ 'approved'
- ใช้ `setImmediate()` เพื่อส่งข้อมูลไปยัง External API แบบ asynchronous

### จุดสำคัญของการแก้ไข

#### ✅ ข้อดี
1. **ไม่กระทบต่อ Performance:** ใช้ `setImmediate()` ทำให้การส่งข้อมูลไม่บล็อก response
2. **Error Handling:** หาก External API ล้มเหลว จะไม่กระทบต่อการทำงานหลัก
3. **Consistency:** ข้อมูลจะถูกบันทึกในฐานข้อมูลท้องถิ่นก่อน แล้วจึงส่งไปยัง External API
4. **Timeout Protection:** มี timeout 10 วินาที เพื่อป้องกันการค้าง

#### ⚠️ ข้อควรระวัง
1. **Network Issues:** หาก External API ไม่สามารถเข้าถึงได้ ข้อมูลจะไม่ซิงค์
2. **Data Consistency:** ข้อมูลในฐานข้อมูลท้องถิ่นและ External API อาจไม่ตรงกันชั่วคราว

### การทดสอบ

#### สถานการณ์ที่ควรทดสอบ:
1. **สร้าง Job ใหม่** - ตรวจสอบว่า Serial History ถูกส่งไปยัง External API
2. **เปลี่ยนสถานะเป็น 'assigned'** - ตรวจสอบการส่งข้อมูล
3. **เปลี่ยนสถานะเป็น 'approved'** - ตรวจสอบการส่งข้อมูล
4. **External API ล้มเหลว** - ตรวจสอบว่าระบบยังทำงานได้ปกติ

#### Log Messages ที่ควรดู:
```
🔄 Sending Serial History to External API...
📝 Serial History data: {...}
✅ Serial History sent to External API successfully
❌ External API failed with status: XXX
❌ Error sending Serial History to External API: {...}
```

### สรุป
การปรับปรุงนี้ทำให้ข้อมูล Serial History ของ Job Activities ถูกซิงค์กับ External API เช่นเดียวกับ Vehicle Activities แล้ว ระบบจะมีความสมบูรณ์และข้อมูลจะสอดคล้องกันมากขึ้น

### Environment Variables ที่ต้องการ
```
EXTERNAL_API_BASE_URL=http://golfcar.go2kt.com:8080/api
```