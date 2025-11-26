import React, { useState, useEffect } from 'react';

// Import interfaces and functions from lib/data.ts
import {
  GolfCourse,
  Vehicle,
  SerialHistoryEntry,
  User
} from '@/lib/data';

interface GolfCourseManagementScreenProps {
  onBack?: () => void;
  golfCourses: GolfCourse[];
  setGolfCourses: (courses: GolfCourse[]) => void;
  vehicles: Vehicle[];
  setVehicles: (vehicles: Vehicle[]) => void;
  serialHistory: SerialHistoryEntry[];
  forceRefreshAllData?: () => Promise<void>;
  user: User;
}

interface BulkUploadData {
  serial_number: string;
  vehicle_number: string;
  battery_serial?: string; // เพิ่มฟิลด์สำหรับซีเรียลแบต
  golf_course_id: string;
}

const GolfCourseManagementScreen: React.FC<GolfCourseManagementScreenProps> = ({
  onBack,
  golfCourses,
  setGolfCourses,
  vehicles,
  setVehicles,
  forceRefreshAllData,
  user
}) => {
  // Remove conflicting useState declarations and use props instead
  const [activeTab, setActiveTab] = useState<'courses' | 'vehicles'>('courses');
  const [newCourse, setNewCourse] = useState({ name: '', location: '' });
  const [editingCourse, setEditingCourse] = useState<GolfCourse | null>(null);
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ serial_number: '', vehicle_number: '', golf_course_id: '' });
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [filterCourse, setFilterCourse] = useState<string | ''>('');
  const [filterSerial, setFilterSerial] = useState<string>(''); // เพิ่ม state สำหรับกรอง Serial
  const [filterBatterySerial, setFilterBatterySerial] = useState<string>(''); // เพิ่ม state สำหรับกรอง Battery Serial
  const [filterVehicleNumber, setFilterVehicleNumber] = useState<string>(''); // เพิ่ม state สำหรับกรองหมายเลขรถ
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showBulkTransferModal, setShowBulkTransferModal] = useState(false);
  const [bulkUploadData, setBulkUploadData] = useState<BulkUploadData[]>([]);
  const [bulkUploadErrors, setBulkUploadErrors] = useState<string[]>([]);
  const [transferToCourse, setTransferToCourse] = useState<string | ''>('');
  const [transferDate, setTransferDate] = useState<string>(''); // เพิ่ม state สำหรับวันที่ย้าย
  const [serialError, setSerialError] = useState<string>(''); // เพิ่ม state สำหรับแสดงข้อผิดพลาด Serial ซ้ำ
  const [vehicleNumberError, setVehicleNumberError] = useState<string>(''); // เพิ่ม state สำหรับแสดงข้อผิดพลาดหมายเลขรถซ้ำ

  // Debug logging for newVehicle state changes
  useEffect(() => {
    console.log('newVehicle state changed:', newVehicle);
  }, [newVehicle]);

  // Debug logging for golfCourses changes
  useEffect(() => {
    console.log('golfCourses changed:', golfCourses);
  }, [golfCourses]);

  // Helper function to get status label
  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'active': 'ใช้งาน',
      'ready': 'พร้อมใช้',
      'maintenance': 'รอซ่อม',
      'retired': 'เสื่อมแล้ว',
      'parked': 'จอดไว้',
      'spare': 'อะไหล่',
      'inactive': 'ไม่ใช้งาน'
    };
    return statusLabels[status] || 'ใช้งาน';
  };

  // Helper function to check duplicate serial number
  const checkDuplicateSerial = (serialNumber: string, excludeId?: string): boolean => {
    return vehicles.some(vehicle =>
      vehicle.serial_number === serialNumber && vehicle.id !== excludeId
    );
  };



  // Helper function to validate vehicle data
  const validateVehicleData = (serialNumber: string, vehicleNumber: string, excludeId?: string): { isValid: boolean; errors: { serial?: string; vehicleNumber?: string } } => {
    const errors: { serial?: string; vehicleNumber?: string } = {};

    if (checkDuplicateSerial(serialNumber, excludeId)) {
      errors.serial = `หมายเลขซีเรียล "${serialNumber}" มีอยู่ในระบบแล้ว`;
    }

    // ลบการตรวจสอบ vehicle_number ที่ซ้ำ - อนุญาตให้ซ้ำได้
    // if (checkDuplicateVehicleNumber(vehicleNumber, excludeId)) {
    //   errors.vehicleNumber = `หมายเลขรถ "${vehicleNumber}" มีอยู่ในระบบแล้ว`;
    // }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Helper function to count vehicles by course
  const getVehicleCountByCourse = (courseId: string): number => {
    return vehicles.filter(vehicle => vehicle.golf_course_id === courseId).length;
  };

  // ใช้ข้อมูลจาก props ที่ส่งมาจาก lib/data.ts แทน mock data

  // Golf Course Management Functions
  const handleAddCourse = async () => {
    if (newCourse.name && newCourse.location) {
      try {
        const response = await fetch('/api/proxy/golf-courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newCourse)
        });

        if (response.ok) {
          const result = await response.json();
          setGolfCourses([...golfCourses, result.data]);
          setNewCourse({ name: '', location: '' });
          setShowAddCourseForm(false);
          alert('เพิ่มสนามกอล์ฟสำเร็จ');
        } else {
          const error = await response.json();
          alert(`เกิดข้อผิดพลาด: ${error.message}`);
        }
      } catch (error) {
        console.error('Error adding golf course:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    }
  };

  const handleUpdateCourse = async () => {
    if (editingCourse) {
      try {
        const response = await fetch(`/api/proxy/golf-courses/${editingCourse.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editingCourse.name,
            location: editingCourse.location
          })
        });

        if (response.ok) {
          const result = await response.json();
          setGolfCourses(golfCourses.map(course =>
            course.id === editingCourse.id ? result.data : course
          ));
          setEditingCourse(null);
          alert('อัปเดตสนามกอล์ฟสำเร็จ');
        } else {
          const error = await response.json();
          alert(`เกิดข้อผิดพลาด: ${error.message}`);
        }
      } catch (error) {
        console.error('Error updating golf course:', error);
        alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      }
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบสนามนี้?')) {
      try {
        const response = await fetch(`/api/proxy/golf-courses/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setGolfCourses(golfCourses.filter(course => course.id !== id));
          setVehicles(vehicles.filter(vehicle => vehicle.golf_course_id !== id));
          alert('ลบสนามกอล์ฟสำเร็จ');
        } else {
          const error = await response.json();
          alert(`เกิดข้อผิดพลาด: ${error.message}`);
        }
      } catch (error) {
        console.error('Error deleting golf course:', error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    }
  };

  // Vehicle Management Functions
  const handleAddVehicle = async () => {
    // ล้างข้อความแจ้งเตือนเก่า
    setSerialError('');
    setVehicleNumberError('');

    if (newVehicle.serial_number && newVehicle.vehicle_number && newVehicle.golf_course_id) {
      // ตรวจสอบข้อมูลซ้ำ
      const validation = validateVehicleData(newVehicle.serial_number, newVehicle.vehicle_number);

      if (!validation.isValid) {
        if (validation.errors.serial) {
          setSerialError(validation.errors.serial);
        }
        if (validation.errors.vehicleNumber) {
          setVehicleNumberError(validation.errors.vehicleNumber);
        }
        return; // หยุดการทำงานถ้าพบข้อมูลซ้ำ
      }

      const golfCourse = golfCourses.find(c => c.id === newVehicle.golf_course_id);

      const vehicleData = {
        serial_number: newVehicle.serial_number,
        vehicle_number: newVehicle.vehicle_number,
        golf_course_id: newVehicle.golf_course_id,
        golf_course_name: golfCourse?.name || 'ไม่ระบุ',
        brand: 'ไม่ระบุ',
        model: 'ไม่ระบุ',
        year: new Date().getFullYear(),
        status: 'active' as const
      };

      try {
        const response = await fetch('/api/proxy/vehicles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vehicleData)
        });

        if (response.ok) {
          const result = await response.json();
          setVehicles([...vehicles, result.data]);

          // บันทึกประวัตการเพิ่มรถใหม่
          try {
            await fetch('/api/proxy/serial-history', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                serial_number: result.data.serial_number,
                vehicle_id: result.data.id,
                vehicle_number: result.data.vehicle_number,
                action_type: 'registration',
                action_date: new Date().toISOString(),
                details: `เพิ่มรถใหม่ - หมายเลขรถ: ${result.data.vehicle_number}, สนาม: ${golfCourse?.name || 'ไม่ระบุ'}`,
                performed_by_id: "000000000000000000000001",
                golf_course_id: result.data.golf_course_id,
                golf_course_name: golfCourse?.name || 'ไม่ระบุ',
                is_active: true
              })
            });

            // รีเฟรชข้อมูลทั้งหมดหลังจากบันทึก Serial History
            if (forceRefreshAllData) {
              await forceRefreshAllData();
            }
          } catch (error) {
            console.error('Error logging serial history:', error);
          }

          setNewVehicle({ serial_number: '', vehicle_number: '', golf_course_id: '' });
          setShowAddVehicleForm(false);
          alert('เพิ่มรถกอล์ฟสำเร็จ');
        } else {
          const error = await response.json();
          alert(`เกิดข้อผิดพลาด: ${error.message}`);
        }
      } catch (error) {
        console.error('Error adding vehicle:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    }
  };

  const handleUpdateVehicle = async () => {
    if (!editingVehicle) return;

    // ตรวจสอบข้อมูลซ้ำ (ยกเว้นรถที่กำลังแก้ไข)
    const validation = validateVehicleData(
      editingVehicle.serial_number,
      editingVehicle.vehicle_number,
      editingVehicle.id
    );

    if (!validation.isValid) {
      let errorMessage = 'ไม่สามารถบันทึกได้:\n';
      if (validation.errors.serial) {
        errorMessage += `• ${validation.errors.serial}\n`;
      }
      if (validation.errors.vehicleNumber) {
        errorMessage += `• ${validation.errors.vehicleNumber}\n`;
      }
      alert(errorMessage);
      return;
    }

    try {
      // เตรียมข้อมูลสำหรับส่งไป API
      const updateData = {
        id: editingVehicle.id,
        serial_number: editingVehicle.serial_number.trim(),
        vehicle_number: editingVehicle.vehicle_number.trim(),
        golf_course_id: editingVehicle.golf_course_id,
        golf_course_name: golfCourses.find(c => c.id === editingVehicle.golf_course_id)?.name || 'ไม่ระบุ',
        status: editingVehicle.status || 'active',
        brand: editingVehicle.brand || 'ไม่ระบุ',
        model: editingVehicle.model || 'ไม่ระบุ',
        year: editingVehicle.year || new Date().getFullYear(),
        battery_serial: editingVehicle.battery_serial?.trim() || '',
        user_id: user.id.toString()
      };

      console.log('🔄 Updating vehicle with data:', updateData);

      // อัปเดตข้อมูลผ่าน proxy API
      const response = await fetch(`/api/proxy/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Update failed:', error);
        alert(`เกิดข้อผิดพลาดในการอัปเดต: ${error.message || 'ไม่ทราบสาเหตุ'}`);
        return;
      }

      const result = await response.json();
      console.log('✅ Update successful:', result);

      // อัปเดต state ด้วยข้อมูลที่ส่งไป (ไม่ต้องพึ่งพา API response)
      // const updatedVehicle = result.data || result;

      // หารถที่กำลังแก้ไข
      const currentVehicle = vehicles.find(v => v.id === editingVehicle.id);

      // เตรียมข้อมูลที่อัปเดตแล้วสำหรับ state โดยใช้ข้อมูลที่เราส่งไป
      const vehicleForState: Vehicle = {
        ...currentVehicle!,
        ...updateData // ใช้ข้อมูลที่เราส่งไปโดยตรง (รวมถึงสถานะที่ถูกต้อง)
      };

      console.log('🔄 Updating vehicle state with:', vehicleForState);

      // อัปเดต vehicles state
      setVehicles(vehicles.map(vehicle =>
        vehicle.id === editingVehicle.id ? vehicleForState : vehicle
      ));

      // ปิด editing mode
      setEditingVehicle(null);

      // ไม่ต้อง refresh ข้อมูลทั้งหมด เพื่อไม่ให้เขียนทับสถานะรถที่เพิ่งอัปเดต
      // Serial History จะถูกสร้างโดย API อัตโนมัติแล้ว
      console.log('✅ Vehicle updated successfully, Serial History created automatically');

      alert('อัปเดตข้อมูลรถสำเร็จ');

    } catch (error) {
      console.error('❌ Error updating vehicle:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบรถคันนี้?')) {
      const vehicleToDelete = vehicles.find(v => v.id === id);

      if (vehicleToDelete) {
        // Serial history จะถูกสร้างโดย Backend API อัตโนมัติเมื่อลบรถ
        // ไม่ต้องสร้างซ้ำที่ Frontend

        // เรียก API เพื่อลบรถ (ใช้ External API เท่านั้น)
        try {
          const response = await fetch(`/api/proxy/vehicles/${vehicleToDelete.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id.toString()
            })
          });

          if (response.ok) {
            // รีเฟรชข้อมูลทั้งหมดหลังจากลบสำเร็จ
            if (forceRefreshAllData) {
              await forceRefreshAllData();
            }
          } else {
            const error = await response.json();
            alert(`เกิดข้อผิดพลาดในการลบรถ: ${error.message}`);
            return;
          }
        } catch (error) {
          console.error('Error deleting vehicle:', error);
          alert('เกิดข้อผิดพลาดในการลบรถ');
          return;
        }
      }

      setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
    }
  };

  const handleSelectVehicle = (id: string) => {
    setSelectedVehicles(prev =>
      prev.includes(id)
        ? prev.filter(vehicleId => vehicleId !== id)
        : [...prev, id]
    );
  };

  // Bulk Operations
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      const data: BulkUploadData[] = [];
      const errors: string[] = [];
      const seenSerials = new Set<string>(); // ตรวจสอบ Serial ซ้ำในไฟล์เอง
      // ลบการตรวจสอบ vehicle_number ซ้ำ - อนุญาตให้ซ้ำได้
      // const seenVehicleNumbers = new Set<string>(); 

      lines.forEach((line, index) => {
        if (index === 0) return; // Skip header
        const [serial_number, vehicle_number, battery_serial, golf_course_id] = line.split(',').map(s => s.trim());

        // ตรวจสอบว่ามีข้อมูลครบถ้วน (battery_serial เป็น optional ใน CSV แต่ถ้าจะให้ดีควรมีช่องว่างถ้าไม่มีข้อมูล)
        // กรณี CSV มี 3 คอลัมน์ (แบบเก่า) จะถือว่าไม่มี battery_serial
        // กรณี CSV มี 4 คอลัมน์ จะอ่าน battery_serial

        // ปรับปรุงการตรวจสอบข้อมูล
        let courseId = golf_course_id;
        let batterySerial = battery_serial;

        // ถ้าข้อมูลมีแค่ 3 ส่วน อาจจะเป็น format เก่า: serial, vehicle, course
        if (!golf_course_id && battery_serial && !isNaN(Number(battery_serial))) {
          // เดาว่าเป็น format เก่าที่ไม่มี battery_serial
          courseId = battery_serial;
          batterySerial = '';
        }

        if (!serial_number || !vehicle_number || !courseId) {
          errors.push(`บรรทัด ${index + 1}: ข้อมูลไม่ครบถ้วน (ต้องมี: หมายเลขซีเรียล, หมายเลขรถ, [ซีเรียลแบต], รหัสสนาม)`);
          return;
        }


        if (!golfCourses.find(c => c.id === courseId)) {
          const availableCourses = golfCourses.map(c => `${c.id}=${c.name}`).join(', ');
          errors.push(`บรรทัด ${index + 1}: รหัสสนามไม่ถูกต้อง (ใช้ได้: ${availableCourses})`);
          return;
        }

        // ตรวจสอบ Serial ซ้ำในระบบ
        if (vehicles.find(v => v.serial_number === serial_number)) {
          errors.push(`บรรทัด ${index + 1}: หมายเลขซีเรียล "${serial_number}" มีอยู่ในระบบแล้ว`);
          return;
        }

        // ตรวจสอบ Serial ซ้ำในไฟล์เอง
        if (seenSerials.has(serial_number)) {
          errors.push(`บรรทัด ${index + 1}: หมายเลขซีเรียล "${serial_number}" ซ้ำกันในไฟล์`);
          return;
        }

        // ลบการตรวจสอบ vehicle_number ซ้ำ - อนุญาตให้ซ้ำได้
        // if (vehicles.find(v => v.vehicle_number === vehicle_number)) {
        //   errors.push(`บรรทัด ${index + 1}: หมายเลขรถ "${vehicle_number}" มีอยู่ในระบบแล้ว`);
        //   return;
        // }

        // if (seenVehicleNumbers.has(vehicle_number)) {
        //   errors.push(`บรรทัด ${index + 1}: หมายเลขรถ "${vehicle_number}" ซ้ำกันในไฟล์`);
        //   return;
        // }

        // เพิ่มลงใน Set เพื่อตรวจสอบการซ้ำ (เฉพาะ serial_number)
        seenSerials.add(serial_number);
        // seenVehicleNumbers.add(vehicle_number);

        data.push({
          serial_number,
          vehicle_number,
          battery_serial: batterySerial,
          golf_course_id: courseId
        });
      });

      setBulkUploadData(data);
      setBulkUploadErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = async () => {
    if (bulkUploadData.length === 0) return;

    const successfulVehicles = [];
    const failedVehicles = [];

    // บันทึกรถแต่ละคันลงฐานข้อมูลผ่าน API
    for (const data of bulkUploadData) {
      try {
        const golfCourse = golfCourses.find(c => c.id === String(data.golf_course_id));

        const vehicleData = {
          serial_number: data.serial_number,
          vehicle_number: data.vehicle_number,
          battery_serial: data.battery_serial || '', // เพิ่ม battery_serial
          golf_course_id: String(data.golf_course_id),
          golf_course_name: golfCourse?.name || 'ไม่ระบุ',
          brand: 'ไม่ระบุ',
          model: 'ไม่ระบุ',
          year: new Date().getFullYear(),
          status: 'active' as const
        };

        // เรียก API เพื่อบันทึกรถลงฐานข้อมูล
        const vehicleResponse = await fetch('/api/proxy/vehicles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vehicleData)
        });

        if (vehicleResponse.ok) {
          const vehicleResult = await vehicleResponse.json();
          const savedVehicle = vehicleResult.data;
          successfulVehicles.push(savedVehicle);

          console.log(`✅ บันทึกรถสำเร็จ: ${savedVehicle.vehicle_number}`);
        } else {
          const error = await vehicleResponse.json();
          console.error(`❌ ไม่สามารถบันทึกรถ ${data.vehicle_number}: ${error.message}`);
          failedVehicles.push({ ...data, error: error instanceof Error ? error.message : String(error) });
        }
      } catch (error) {
        console.error(`❌ Error saving vehicle ${data.vehicle_number}:`, error);
        failedVehicles.push({ ...data, error: error instanceof Error ? error.message : String(error) });
      }
    }

    // อัปเดต state ด้วยรถที่บันทึกสำเร็จ
    if (successfulVehicles.length > 0) {
      setVehicles([...vehicles, ...successfulVehicles]);

      // รีเฟรชข้อมูลทั้งหมดหลังจากอัปโหลดสำเร็จ
      if (forceRefreshAllData) {
        await forceRefreshAllData();
      }
    }

    // แสดงผลลัพธ์
    if (successfulVehicles.length > 0 && failedVehicles.length === 0) {
      alert(`อัปโหลดรถสำเร็จทั้งหมด ${successfulVehicles.length} คัน`);
    } else if (successfulVehicles.length > 0 && failedVehicles.length > 0) {
      alert(`อัปโหลดสำเร็จ ${successfulVehicles.length} คัน, ล้มเหลว ${failedVehicles.length} คัน`);
    } else {
      alert(`อัปโหลดล้มเหลวทั้งหมด ${failedVehicles.length} คัน`);
    }

    setBulkUploadData([]);
    setBulkUploadErrors([]);
    setShowBulkUploadModal(false);
  };

  const handleBulkTransfer = async () => {
    if (selectedVehicles.length === 0 || !transferToCourse || !transferDate) return;

    try {
      const targetCourseId = transferToCourse;
      const targetCourse = golfCourses.find(c => c.id === targetCourseId);

      if (!targetCourse) {
        alert('ไม่พบสนามปลายทาง');
        return;
      }

      // หาสนามต้นทางจากรถคันแรก
      const firstVehicle = vehicles.find(v => v.id === selectedVehicles[0]);
      const fromGolfCourseId = firstVehicle?.golf_course_id;
      // const fromGolfCourseName = firstVehicle?.golf_course_name;

      if (!fromGolfCourseId) {
        alert('ไม่พบข้อมูลสนามต้นทาง');
        return;
      }

      // เรียก API เพื่อย้ายรถ (ใช้ internal API แทน proxy)
      const response = await fetch('/api/vehicles/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicle_ids: selectedVehicles,
          from_golf_course_id: fromGolfCourseId,
          to_golf_course_id: targetCourseId,
          to_golf_course_name: targetCourse.name,
          transfer_date: transferDate,
          user_id: user?.id?.toString() || 'unknown'
        }),
      });

      const result = await response.json();

      if (result.success) {
        // อัปเดต state ใน frontend
        setVehicles(vehicles.map(vehicle =>
          selectedVehicles.includes(vehicle.id)
            ? {
              ...vehicle,
              golf_course_id: targetCourseId,
              golf_course_name: targetCourse.name
            }
            : vehicle
        ));

        // รีเฟรชข้อมูลทั้งหมดหลังจากย้ายรถสำเร็จ
        if (forceRefreshAllData) {
          await forceRefreshAllData();
        }

        alert(`ย้ายรถสำเร็จ ${result.data.length} คัน`);

        setSelectedVehicles([]);
        setTransferToCourse('');
        setTransferDate('');
        setShowBulkTransferModal(false);
      } else {
        // จัดการ error case พิเศษ
        if (response.status === 409 && result.data?.vehicles_with_pending_jobs) {
          const vehiclesWithJobs = result.data.vehicles_with_pending_jobs;
          const vehicleNumbers = vehiclesWithJobs.map((v: any) => v.vehicle_number).join(', ');
          alert(`ไม่สามารถย้ายรถได้เนื่องจากมี job ที่ยังไม่เสร็จ:\n\nรถหมายเลข: ${vehicleNumbers}\n\nกรุณาทำ job ให้เสร็จก่อนหรือยกเลิก job แล้วค่อยย้ายรถ`);
        } else {
          alert(`เกิดข้อผิดพลาด: ${result.message}`);
        }
      }
    } catch (error) {
      console.error('Error transferring vehicles:', error);
      alert('เกิดข้อผิดพลาดในการย้ายรถ');
    }
  };

  const downloadTemplate = () => {
    // สร้าง header พร้อมคำอธิบาย
    const header = 'serial_number,vehicle_number,battery_serial,golf_course_id';
    const description = '# แม่แบบการอัปโหลดรถกอล์ฟ\n# คอลัมน์: หมายเลขซีเรียล, หมายเลขรถ, ซีเรียลแบต(เว้นว่างได้), รหัสสนาม\n# รหัสสนาม: ' +
      golfCourses.map(course => `${course.id}=${course.name}`).join(', ') + '\n';

    // ตัวอย่างข้อมูล
    const examples = [
      'GC001,V001,BAT001,1',
      'GC002,V002,,1',
      'GC003,V003,BAT003,2'
    ];

    const csvContent = description + header + '\n' + examples.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'แม่แบบอัปโหลดรถกอล์ฟ.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesCourse = filterCourse ? String(vehicle.golf_course_id) === filterCourse : true;
    const matchesSerial = filterSerial
      ? vehicle.serial_number.toLowerCase().includes(filterSerial.toLowerCase())
      : true;
    const matchesBatterySerial = filterBatterySerial
      ? (vehicle.battery_serial || '').toLowerCase().includes(filterBatterySerial.toLowerCase())
      : true;
    const matchesVehicleNumber = filterVehicleNumber
      ? vehicle.vehicle_number.toLowerCase().includes(filterVehicleNumber.toLowerCase())
      : true;

    return matchesCourse && matchesSerial && matchesBatterySerial && matchesVehicleNumber;
  });

  return (
    <div className="golf-course-management">
      <div className="page-header">
        <button onClick={onBack} className="back-button">← กลับ</button>
        <h1>จัดการสนามกอล์ฟและรถ</h1>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          จัดการสนาม
        </button>
        <button
          className={`tab-button ${activeTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => setActiveTab('vehicles')}
        >
          จัดการรถ
        </button>
      </div>

      {/* Manage Courses Tab */}
      {activeTab === 'courses' && (
        <div className="courses-section">
          <div className="section-header">
            <h2>สนามกอล์ฟ</h2>
            <button
              onClick={() => setShowAddCourseForm(true)}
              className="add-button"
            >
              + เพิ่มสนาม
            </button>
          </div>

          {/* Add Course Form */}
          {showAddCourseForm && (
            <div className="form-section">
              <h3>เพิ่มสนามใหม่</h3>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="ชื่อสนาม"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="ที่อยู่"
                  value={newCourse.location}
                  onChange={(e) => setNewCourse({ ...newCourse, location: e.target.value })}
                />
                <button onClick={handleAddCourse} className="save-button">บันทึก</button>
                <button onClick={() => setShowAddCourseForm(false)} className="cancel-button">ยกเลิก</button>
              </div>
            </div>
          )}

          {/* Courses Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ชื่อสนาม</th>
                  <th>ที่อยู่</th>
                  <th>จำนวนรถ</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {golfCourses.map(course => (
                  <tr key={course.id}>
                    <td>
                      {editingCourse?.id === course.id ? (
                        <input
                          type="text"
                          value={editingCourse.name}
                          onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                        />
                      ) : (
                        course.name
                      )}
                    </td>
                    <td>
                      {editingCourse?.id === course.id ? (
                        <input
                          type="text"
                          value={editingCourse.location}
                          onChange={(e) => setEditingCourse({ ...editingCourse, location: e.target.value })}
                        />
                      ) : (
                        course.location
                      )}
                    </td>
                    <td>
                      <span className="vehicle-count">
                        {getVehicleCountByCourse(course.id)} คัน
                      </span>
                    </td>
                    <td>
                      {editingCourse?.id === course.id ? (
                        <>
                          <button onClick={handleUpdateCourse} className="save-button">บันทึก</button>
                          <button onClick={() => setEditingCourse(null)} className="cancel-button">ยกเลิก</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditingCourse(course)} className="edit-button">แก้ไข</button>
                          <button onClick={() => handleDeleteCourse(course.id)} className="delete-button">ลบ</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manage Vehicles Tab */}
      {activeTab === 'vehicles' && (
        <div className="vehicles-section">
          <div className="section-header">
            <h2>รถกอล์ฟ</h2>
            <div className="header-actions">
              <button onClick={() => setShowBulkUploadModal(true)} className="bulk-button">
                📁 อัปโหลดจำนวนมาก
              </button>
              <button onClick={() => {
                setShowAddVehicleForm(true);
                setSerialError('');
                setVehicleNumberError('');
              }} className="add-button">
                + เพิ่มรถ
              </button>
            </div>
          </div>

          {/* Add Vehicle Form */}
          {showAddVehicleForm && (
            <div className="form-section">
              <h3>เพิ่มรถใหม่</h3>
              <div className="form-row">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="หมายเลขซีเรียล"
                    value={newVehicle.serial_number}
                    onChange={(e) => {
                      setNewVehicle({ ...newVehicle, serial_number: e.target.value });
                      setSerialError(''); // ล้างข้อความแจ้งเตือนเมื่อผู้ใช้พิมพ์
                    }}
                    className={serialError ? 'error' : ''}
                  />
                  {serialError && <div className="error-message">{serialError}</div>}
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="หมายเลขรถ"
                    value={newVehicle.vehicle_number}
                    onChange={(e) => {
                      setNewVehicle({ ...newVehicle, vehicle_number: e.target.value });
                      setVehicleNumberError(''); // ล้างข้อความแจ้งเตือนเมื่อผู้ใช้พิมพ์
                    }}
                    className={vehicleNumberError ? 'error' : ''}
                  />
                  {vehicleNumberError && <div className="error-message">{vehicleNumberError}</div>}
                </div>
                <select
                  key="add-vehicle-course-select"
                  value={newVehicle.golf_course_id}
                  onChange={(e) => {
                    console.log('Dropdown changed to:', e.target.value);
                    setNewVehicle({ ...newVehicle, golf_course_id: e.target.value });
                  }}
                  className="course-select"
                >
                  <option value="">เลือกสนาม</option>
                  {golfCourses.map(course => (
                    <option key={course.id} value={String(course.id)}>{course.name}</option>
                  ))}
                </select>
                <button onClick={handleAddVehicle} className="save-button">บันทึก</button>
                <button
                  onClick={() => {
                    setShowAddVehicleForm(false);
                    setSerialError('');
                    setVehicleNumberError('');
                  }}
                  className="cancel-button"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}

          {/* Filter and Bulk Actions */}
          <div className="filter-section">
            <div className="filter-controls">
              <div className="filter-item">
                <label>กรองตามสนาม:</label>
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value || '')}
                >
                  <option value="">ทุกสนาม</option>
                  {golfCourses.map(course => (
                    <option key={course.id} value={String(course.id)}>{course.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label>หมายเลขซีเรียล:</label>
                <input
                  type="text"
                  placeholder="ค้นหา Serial..."
                  value={filterSerial}
                  onChange={(e) => setFilterSerial(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-item">
                <label>หมายเลขรถ:</label>
                <input
                  type="text"
                  placeholder="ค้นหาหมายเลขรถ..."
                  value={filterVehicleNumber}
                  onChange={(e) => setFilterVehicleNumber(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-item">
                <label>ซีเรียลแบต:</label>
                <input
                  type="text"
                  placeholder="ค้นหา Battery Serial..."
                  value={filterBatterySerial}
                  onChange={(e) => setFilterBatterySerial(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
            {selectedVehicles.length > 0 && (
              <div className="bulk-actions">
                <span>{selectedVehicles.length} รายการที่เลือก</span>
                <button
                  onClick={() => setShowBulkTransferModal(true)}
                  className="transfer-button"
                >
                  ย้ายสนาม
                </button>
              </div>
            )}
          </div>

          {/* Vehicles Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedVehicles(filteredVehicles.map(v => v.id));
                        } else {
                          setSelectedVehicles([]);
                        }
                      }}
                      checked={selectedVehicles.length === filteredVehicles.length && filteredVehicles.length > 0}
                    />
                  </th>
                  <th>หมายเลขซีเรียล</th>
                  <th>หมายเลขรถ</th>
                  <th>ซีเรียลแบต</th>
                  <th>สนาม</th>
                  <th>สถานะ</th>
                  <th>การจัดการ</th>
                  <th>วันที่ย้าย</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle, index) => {
                  const course = golfCourses.find(c => c.id === vehicle.golf_course_id);
                  return (
                    <tr key={`vehicle-${vehicle.id}-${index}`}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedVehicles.includes(vehicle.id)}
                          onChange={() => handleSelectVehicle(vehicle.id)}
                        />
                      </td>
                      <td>
                        {editingVehicle?.id === vehicle.id ? (
                          <input
                            type="text"
                            value={editingVehicle.serial_number}
                            onChange={(e) => setEditingVehicle({ ...editingVehicle, serial_number: e.target.value })}
                          />
                        ) : (
                          vehicle.serial_number
                        )}
                      </td>
                      <td>
                        {editingVehicle?.id === vehicle.id ? (
                          <input
                            type="text"
                            value={editingVehicle.vehicle_number}
                            onChange={(e) => setEditingVehicle({ ...editingVehicle, vehicle_number: e.target.value })}
                          />
                        ) : (
                          vehicle.vehicle_number
                        )}
                      </td>
                      <td>
                        {editingVehicle?.id === vehicle.id ? (
                          <input
                            type="text"
                            value={editingVehicle.battery_serial || ''}
                            onChange={(e) => setEditingVehicle({ ...editingVehicle, battery_serial: e.target.value })}
                            placeholder="ระบุซีเรียลแบต"
                          />
                        ) : (
                          vehicle.battery_serial || '-'
                        )}
                      </td>
                      <td>
                        {editingVehicle?.id === vehicle.id ? (
                          <select
                            value={String(editingVehicle.golf_course_id)}
                            onChange={(e) => {
                              const courseId = e.target.value;
                              const selectedCourse = golfCourses.find(c => c.id === courseId);
                              setEditingVehicle({
                                ...editingVehicle,
                                golf_course_id: courseId,
                                golf_course_name: selectedCourse?.name || 'ไม่ระบุ'
                              });
                            }}
                            className="course-select"
                          >
                            {golfCourses.map(course => (
                              <option key={course.id} value={String(course.id)}>{course.name}</option>
                            ))}
                          </select>
                        ) : (
                          course?.name || 'ไม่พบสนาม'
                        )}
                      </td>
                      <td>
                        {editingVehicle?.id === vehicle.id ? (
                          <select
                            value={editingVehicle.status || vehicle.status || 'active'}
                            onChange={(e) => setEditingVehicle({
                              ...editingVehicle,
                              status: e.target.value as Vehicle['status']
                            })}
                            className="status-select"
                          >
                            <option value="active">ใช้งาน</option>
                            <option value="ready">พร้อมใช้</option>
                            <option value="maintenance">รอซ่อม</option>
                            <option value="retired">เสื่อมแล้ว</option>

                          </select>
                        ) : (
                          <span className={`status-badge ${vehicle.status || 'active'}`}>
                            {getStatusLabel(vehicle.status || 'active')}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingVehicle?.id === vehicle.id ? (
                          <>
                            <button onClick={handleUpdateVehicle} className="save-button">บันทึก</button>
                            <button onClick={() => setEditingVehicle(null)} className="cancel-button">ยกเลิก</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => {
                              // ตรวจสอบให้แน่ใจว่า status มีค่าเสมอ
                              const vehicleWithStatus = {
                                ...vehicle,
                                status: vehicle.status || 'active'
                              };
                              setEditingVehicle(vehicleWithStatus);
                            }} className="edit-button">แก้ไข</button>
                            <button onClick={() => handleDeleteVehicle(vehicle.id)} className="delete-button">ลบ</button>
                          </>
                        )}
                      </td>
                      <td>
                        {vehicle.transfer_date ? (
                          <span className="transfer-date">
                            {new Date(vehicle.transfer_date).toLocaleDateString('th-TH')}
                          </span>
                        ) : (
                          <span className="no-transfer-date">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>อัปโหลดรถจำนวนมาก</h3>
              <button onClick={() => setShowBulkUploadModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <div className="upload-section">
                <div className="info-section">
                  <h4>📋 ข้อมูลสนามที่มีอยู่:</h4>
                  <div className="course-list">
                    {golfCourses.map(course => (
                      <span key={course.id} className="course-tag">
                        รหัส {course.id}: {course.name}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={downloadTemplate} className="template-button">
                  📥 ดาวน์โหลดแม่แบบ CSV
                </button>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileUpload}
                  className="file-input"
                />
              </div>

              {bulkUploadErrors.length > 0 && (
                <div className="error-section">
                  <h4>ข้อผิดพลาด:</h4>
                  <ul>
                    {bulkUploadErrors.map((error, index) => (
                      <li key={`error-${index}-${error.slice(0, 10)}`} className="error-item">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {bulkUploadData.length > 0 && (
                <div className="preview-section">
                  <h4>ตัวอย่างข้อมูล ({bulkUploadData.length} รายการ):</h4>
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>หมายเลขซีเรียล</th>
                        <th>หมายเลขรถ</th>
                        <th>ซีเรียลแบต</th>
                        <th>สนาม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkUploadData.slice(0, 5).map((item, index) => {
                        const course = golfCourses.find(c => c.id === item.golf_course_id);
                        return (
                          <tr key={`upload-${index}-${item.serial_number}`}>
                            <td>{item.serial_number}</td>
                            <td>{item.vehicle_number}</td>
                            <td>{item.battery_serial || '-'}</td>
                            <td>{course?.name || 'ไม่พบสนาม'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {bulkUploadData.length > 5 && (
                    <p>และอีก {bulkUploadData.length - 5} รายการ...</p>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                onClick={handleBulkUpload}
                className="save-button"
                disabled={bulkUploadData.length === 0 || bulkUploadErrors.length > 0}
              >
                อัปโหลด ({bulkUploadData.length} รายการ)
              </button>
              <button onClick={() => setShowBulkUploadModal(false)} className="cancel-button">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Transfer Modal */}
      {showBulkTransferModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>ย้ายรถไปสนามอื่น ({selectedVehicles.length} คัน)</h3>
              <button onClick={() => setShowBulkTransferModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <div className="transfer-info">
                <p><strong>จำนวนรถที่เลือก: {selectedVehicles.length} คัน</strong></p>
                <p>เลือกสนามปลายทางและวันที่ที่ต้องการย้าย:</p>
              </div>

              <div className="transfer-form">
                <div className="form-group">
                  <label>สนามปลายทาง:</label>
                  <select
                    value={transferToCourse}
                    onChange={(e) => setTransferToCourse(e.target.value || '')}
                    className="transfer-select"
                  >
                    <option value="">เลือกสนาม</option>
                    {golfCourses.map(course => (
                      <option key={course.id} value={String(course.id)}>{course.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>วันที่ย้าย:</label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="transfer-date"
                    required
                  />
                </div>
              </div>

              {selectedVehicles.length > 0 && (
                <div className="selected-vehicles">
                  <h4>รถที่เลือกไว้:</h4>
                  <ul>
                    {vehicles
                      .filter(v => selectedVehicles.includes(v.id))
                      .map(vehicle => (
                        <li key={vehicle.id}>
                          {vehicle.serial_number} - {vehicle.vehicle_number}
                        </li>
                      ))
                    }
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                onClick={handleBulkTransfer}
                className="save-button"
                disabled={!transferToCourse || !transferDate}
              >
                ย้าย
              </button>
              <button onClick={() => setShowBulkTransferModal(false)} className="cancel-button">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GolfCourseManagementScreen;