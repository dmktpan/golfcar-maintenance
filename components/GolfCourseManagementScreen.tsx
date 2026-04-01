import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Trash2, Edit, FileText, CalendarRange, ArrowUp, ArrowDown, ArrowUpDown, Car, Building2 } from 'lucide-react';
import AgreementManagementScreen from './AgreementManagementScreen';

// Import interfaces and functions from lib/data.ts
import {
  GolfCourse,
  Vehicle,
  SerialHistoryEntry,
  User,
  Agreement
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
  const [activeTab, setActiveTab] = useState<'courses' | 'vehicles' | 'agreements'>('courses');
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseFormData, setCourseFormData] = useState({ name: '', location: '', code: '', isActive: true });
  const [showAgreementsModal, setShowAgreementsModal] = useState(false);
  const [selectedCourseForAgreements, setSelectedCourseForAgreements] = useState<GolfCourse | null>(null);
  const [courseAgreements, setCourseAgreements] = useState<any[]>([]);
  const [isLoadingAgreements, setIsLoadingAgreements] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ serial_number: '', vehicle_number: '', golf_course_id: '' });
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [allAgreements, setAllAgreements] = useState<Agreement[]>([]);
  const [filterCourse, setFilterCourse] = useState<string | ''>('');
  const [filterAgreement, setFilterAgreement] = useState<string>('');
  const [filterSerial, setFilterSerial] = useState<string>(''); // เพิ่ม state สำหรับกรอง Serial
  const [filterBatterySerial, setFilterBatterySerial] = useState<string>(''); // เพิ่ม state สำหรับกรอง Battery Serial
  const [filterVehicleNumber, setFilterVehicleNumber] = useState<string>(''); // เพิ่ม state สำหรับกรองหมายเลขรถ
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showBulkTransferModal, setShowBulkTransferModal] = useState(false);
  const [showBulkAgreementModal, setShowBulkAgreementModal] = useState(false);
  const [bulkAgreementCourseId, setBulkAgreementCourseId] = useState<string | ''>('');
  const [bulkAgreementId, setBulkAgreementId] = useState<string | ''>('');
  const [bulkUploadData, setBulkUploadData] = useState<BulkUploadData[]>([]);
  const [bulkUploadErrors, setBulkUploadErrors] = useState<string[]>([]);
  const [transferToCourse, setTransferToCourse] = useState<string | ''>('');
  const [transferDate, setTransferDate] = useState<string>(''); // เพิ่ม state สำหรับวันที่ย้าย
  const [serialError, setSerialError] = useState<string>(''); // เพิ่ม state สำหรับแสดงข้อผิดพลาด Serial ซ้ำ
  const [vehicleNumberError, setVehicleNumberError] = useState<string>(''); // เพิ่ม state สำหรับแสดงข้อผิดพลาดหมายเลขรถซ้ำ

  // Fetch all agreements
  useEffect(() => {
    const fetchAgreements = async () => {
      try {
        const response = await fetch('/api/agreements');
        if (response.ok) {
          const result = await response.json();
          setAllAgreements(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching agreements:', error);
      }
    };
    fetchAgreements();
  }, []);

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
  const openCourseModal = (course?: GolfCourse) => {
    if (course) {
      setEditingCourseId(course.id);
      setCourseFormData({
        name: course.name,
        location: course.location || '',
        code: course.code || '',
        isActive: course.isActive !== false
      });
    } else {
      setEditingCourseId(null);
      setCourseFormData({ name: '', location: '', code: '', isActive: true });
    }
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!courseFormData.name) {
      alert('กรุณาระบุชื่อสนาม');
      return;
    }

    try {
      const url = editingCourseId ? `/api/proxy/golf-courses/${editingCourseId}` : '/api/proxy/golf-courses';
      const method = editingCourseId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseFormData)
      });

      if (response.ok) {
        const result = await response.json();
        if (editingCourseId) {
          setGolfCourses(golfCourses.map(course =>
            course.id === editingCourseId ? result.data : course
          ));
        } else {
          setGolfCourses([result.data, ...golfCourses]);
        }
        setShowCourseModal(false);
        setCourseFormData({ name: '', location: '', code: '', isActive: true });
        setEditingCourseId(null);
        alert(editingCourseId ? 'อัปเดตสนามกอล์ฟสำเร็จ' : 'เพิ่มสนามกอล์ฟสำเร็จ');
      } else {
        const error = await response.json();
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving golf course:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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

  const handleViewAgreements = async (course: GolfCourse) => {
    setSelectedCourseForAgreements(course);
    setShowAgreementsModal(true);
    setIsLoadingAgreements(true);
    try {
      const res = await fetch(`/api/golf-courses/${course.id}`);
      if (res.ok) {
        const result = await res.json();
        setCourseAgreements(result.data?.agreements || []);
      }
    } catch (err) {
      console.error('Failed to fetch course agreements', err);
    } finally {
      setIsLoadingAgreements(false);
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
        agreement_id: editingVehicle.agreement_id || null,
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

  const handleBulkAgreementChange = async () => {
    if (selectedVehicles.length === 0) return;

    try {
      const response = await fetch('/api/vehicles/bulk-agreement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicle_ids: selectedVehicles,
          agreement_id: bulkAgreementId || null,
          user_id: user?.id?.toString() || 'unknown'
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (forceRefreshAllData) {
          await forceRefreshAllData();
        }

        alert(`เปลี่ยนสัญญาสำเร็จ ${result.data.length} คัน`);

        setSelectedVehicles([]);
        setBulkAgreementCourseId('');
        setBulkAgreementId('');
        setShowBulkAgreementModal(false);
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.message}`);
      }
    } catch (error) {
      console.error('Error changing bulk agreement:', error);
      alert('เกิดข้อผิดพลาดในการเปลี่ยนสัญญา');
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

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof Vehicle, direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: keyof Vehicle) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesCourse = filterCourse ? String(vehicle.golf_course_id) === filterCourse : true;
    const matchesAgreement = filterAgreement ? vehicle.agreement_id === filterAgreement : true;
    const matchesSerial = filterSerial
      ? vehicle.serial_number.toLowerCase().includes(filterSerial.toLowerCase())
      : true;
    const matchesBatterySerial = filterBatterySerial
      ? (vehicle.battery_serial || '').toLowerCase().includes(filterBatterySerial.toLowerCase())
      : true;
    const matchesVehicleNumber = filterVehicleNumber
      ? vehicle.vehicle_number.toLowerCase().includes(filterVehicleNumber.toLowerCase())
      : true;

    return matchesCourse && matchesAgreement && matchesSerial && matchesBatterySerial && matchesVehicleNumber;
  }).sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;

    // Handle specific fields that might need custom sorting
    let aValue: any = a[key];
    let bValue: any = b[key];

    // Handle null/undefined
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    // Handle course name sorting (special case since it's derived usually, but here we have golf_course_name)
    if (key === 'golf_course_id') {
      // if sorting by course ID, maybe we want to sort by name instead?
      // let's stick to the key for now, but user might expect name sort if clicking course column
      // For now, let's allow sorting by the actual key or data available
    }

    // Numeric sorting for vehicle number if possible
    if (key === 'vehicle_number') {
      const aNum = parseInt(aValue);
      const bNum = parseInt(bValue);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        if (aNum < bNum) return direction === 'asc' ? -1 : 1;
        if (aNum > bNum) return direction === 'asc' ? 1 : -1;
        // if equal or mixed with strings, fall back to string comparison
      }
      // Natural sort for strings with numbers (e.g. V1, V2, V10)
      return direction === 'asc'
        ? String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' })
        : String(bValue).localeCompare(String(aValue), undefined, { numeric: true, sensitivity: 'base' });
    }

    if (key === 'agreement_id') {
      const aAgr = allAgreements.find(a => a.id === aValue)?.agreement_number || '';
      const bAgr = allAgreements.find(a => a.id === bValue)?.agreement_number || '';
      if (aAgr < bAgr) return direction === 'asc' ? -1 : 1;
      if (aAgr > bAgr) return direction === 'asc' ? 1 : -1;
      return 0;
    }

    if (aValue < bValue) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const getSortIcon = (key: keyof Vehicle) => {
    if (!sortConfig || sortConfig.key !== key) return <span className="ml-1 inline-flex text-zinc-300 dark:text-zinc-600"><ArrowUpDown size={14} /></span>;
    return sortConfig.direction === 'asc'
      ? <span className="ml-1 inline-flex text-indigo-600 dark:text-indigo-400"><ArrowUp size={14} /></span>
      : <span className="ml-1 inline-flex text-indigo-600 dark:text-indigo-400"><ArrowDown size={14} /></span>;
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Reset to first page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCourse, filterAgreement, filterSerial, filterBatterySerial, filterVehicleNumber]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVehicles = filteredVehicles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const activeCourses = golfCourses.filter(c => c.isActive !== false);
  const inactiveCourses = golfCourses.filter(c => c.isActive === false);

  return (
    <div className="p-4 sm:p-6 lg:p-12 min-h-screen bg-slate-50/50 dark:bg-zinc-950 font-sans">
      <div className="flex items-center gap-4 mb-6 sm:mb-8">
        <button onClick={onBack} className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm transition-all duration-200 active:scale-95 flex items-center gap-2">
          ← กลับ
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-6 sm:mb-8 hide-scrollbar">
        <button
          className={`whitespace-nowrap flex-none px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'courses' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
          onClick={() => setActiveTab('courses')}
        >
          จัดการสนาม
        </button>
        <button
          className={`whitespace-nowrap flex-none px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'vehicles' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
          onClick={() => setActiveTab('vehicles')}
        >
          จัดการรถ
        </button>
        <button
          className={`whitespace-nowrap flex-none px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'agreements' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
          onClick={() => setActiveTab('agreements')}
        >
          สัญญาเช่า
        </button>
      </div>

      {/* Manage Courses Tab */}
      {activeTab === 'courses' && (
        <div className="courses-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
                จัดการสนามกอล์ฟ
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm sm:text-base">
                เพิ่ม ลบ หรือแก้ไขข้อมูลและรหัสของสนามกอล์ฟในระบบ <span className="inline-block ml-1 font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded text-xs">(ทั้งหมด {golfCourses.length} สนาม)</span>
              </p>
            </div>
            <button
              onClick={() => openCourseModal()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus size={16} strokeWidth={2} />
              เพิ่มสนามใหม่
            </button>
          </div>

          {/* Course Add/Edit Modal */}
          {showCourseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm transition-opacity">
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-lg overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 transform transition-all">
                <div className="flex items-center justify-between p-6 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <h2 className="text-xl font-semibold tracking-tighter text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    {editingCourseId ? 'แก้ไขข้อมูลสนามกอล์ฟ' : 'เพิ่มสนามกอล์ฟใหม่'}
                  </h2>
                  <button onClick={() => setShowCourseModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">รหัสสนาม</label>
                      <input
                        type="text"
                        placeholder="เช่น G01"
                        value={courseFormData.code}
                        onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value })}
                        className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">ชื่อสนาม <span className="text-red-500">*</span></label>
                      <input
                        required
                        type="text"
                        placeholder="ระบุชื่อสนามกอล์ฟ"
                        value={courseFormData.name}
                        onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })}
                        className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">ที่อยู่</label>
                    <input
                      type="text"
                      placeholder="ระบุที่ตั้ง/ที่อยู่ของสนาม"
                      value={courseFormData.location}
                      onChange={(e) => setCourseFormData({ ...courseFormData, location: e.target.value })}
                      className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    />
                  </div>
                  {editingCourseId && (
                    <div className="space-y-1.5 border-t border-zinc-100 dark:border-zinc-800/50 pt-4 mt-2">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">สถานะสัญญา <span className="text-xs font-normal text-zinc-500">(เปิดใช้งาน/ระงับใช้งาน)</span></label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="isActive"
                            checked={courseFormData.isActive}
                            onChange={() => setCourseFormData({ ...courseFormData, isActive: true })}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">✅ เปิดใช้งาน (Active)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="isActive"
                            checked={!courseFormData.isActive}
                            onChange={() => setCourseFormData({ ...courseFormData, isActive: false })}
                            className="w-4 h-4 text-zinc-500 focus:ring-zinc-500"
                          />
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">❌ หมดสัญญา/ระงับ (Archived)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 pt-5 flex justify-end gap-3 -mx-6 -mb-6 px-6 py-4 rounded-b-xl border-t border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <button
                      type="button"
                      onClick={() => setShowCourseModal(false)}
                      className="bg-transparent border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm"
                    >
                      {editingCourseId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Courses Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-200/50 dark:border-zinc-800/50">
                  <tr>
                    <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 text-center w-32">รหัสสนาม</th>
                    <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 text-left min-w-[200px]">ชื่อสนาม</th>
                    <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 text-left max-w-[300px]">ที่อยู่</th>
                    <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 text-center w-32">จำนวนรถ</th>
                    <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 text-center w-48">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/30">
                  {activeCourses.map(course => (
                    <tr key={course.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1.5 rounded-md text-xs font-semibold border border-indigo-100 dark:border-indigo-500/20 shadow-sm">{course.code || '-'}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 text-left">
                        {course.name}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 truncate max-w-[200px] lg:max-w-xs text-left cursor-default" title={course.location || ''}>
                        {course.location || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-200/50 dark:border-emerald-500/20 shadow-sm min-w-[80px]">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          {getVehicleCountByCourse(course.id)} คัน
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleViewAgreements(course)} className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border border-indigo-100 dark:border-indigo-800/30 shadow-sm shadow-indigo-100/20 dark:shadow-none" title="ดูสัญญาเช่า">
                            <CalendarRange size={14} />
                            สัญญาเช่า
                          </button>
                          <button onClick={() => openCourseModal(course)} className="text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white p-1.5 rounded-md transition-all duration-200 active:scale-95 shadow-sm" title="แก้ไข">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteCourse(course.id)} className="text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white p-1.5 rounded-md transition-all duration-200 active:scale-95 shadow-sm" title="ลบ">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activeCourses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                        <div className="flex flex-col items-center gap-2">
                          <FileText size={32} className="text-zinc-300 dark:text-zinc-600 mb-2" />
                          <p>ยังไม่มีข้อมูลสนามกอล์ฟที่ใช้งานอยู่</p>
                          <button onClick={() => openCourseModal()} className="text-indigo-600 dark:text-indigo-400 hover:underline mt-1 text-sm font-medium">
                            เพิ่มสนามกอล์ฟใหม่
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inactive Courses Table (Archived) */}
          {inactiveCourses.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-zinc-400" />
                สนามที่หมดสัญญา / ถูกระงับชั่วคราว <span className="text-sm font-normal text-zinc-500 bg-zinc-200/50 px-2 py-0.5 rounded ml-2">{inactiveCourses.length} แห่ง</span>
              </h3>
              <div className="bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl shadow-sm overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-200/50 dark:border-zinc-800/50">
                      <tr>
                        <th className="px-6 py-3.5 font-medium text-zinc-500 dark:text-zinc-400 text-center w-32">รหัสสนาม</th>
                        <th className="px-6 py-3.5 font-medium text-zinc-500 dark:text-zinc-400 text-left min-w-[200px]">ชื่อสนาม</th>
                        <th className="px-6 py-3.5 font-medium text-zinc-500 dark:text-zinc-400 text-left max-w-[300px]">ที่อยู่</th>
                        <th className="px-6 py-3.5 font-medium text-zinc-500 dark:text-zinc-400 text-center w-32">จำนวนรถ</th>
                        <th className="px-6 py-3.5 font-medium text-zinc-500 dark:text-zinc-400 text-center w-48">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/30">
                      {inactiveCourses.map(course => (
                        <tr key={course.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/20 transition-colors group">
                          <td className="px-6 py-3.5 text-center">
                            <span className="font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-xs font-medium border border-zinc-200 dark:border-zinc-700">{course.code || '-'}</span>
                          </td>
                          <td className="px-6 py-3.5 font-medium text-zinc-600 dark:text-zinc-300 line-through decoration-zinc-300 dark:decoration-zinc-600 opacity-70 text-left">
                            {course.name}
                          </td>
                          <td className="px-6 py-3.5 text-zinc-500 dark:text-zinc-500 truncate max-w-[200px] lg:max-w-xs text-left" title={course.location || ''}>
                            {course.location || '-'}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2.5 py-0.5 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-700 min-w-[80px]">
                              {getVehicleCountByCourse(course.id)} คัน
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openCourseModal(course)} className="bg-white dark:bg-zinc-800 text-zinc-600 hover:text-white hover:bg-emerald-500 dark:hover:bg-emerald-500 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1.5 text-xs font-medium transition-all duration-200 shadow-sm" title="กู้คืน / เปิดใช้งาน">
                                แก้ไขสถานะ
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manage Vehicles Tab */}
      {activeTab === 'vehicles' && (
        <div className="vehicles-section">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                <Car className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
                จัดการรถกอล์ฟ
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm sm:text-base">
                จัดการบัญชีรายชื่อรถ สถานะ และการผูกกับสัญญาเช่าหรือสนาม <span className="inline-block ml-1 font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-500/20 text-xs">(ทั้งหมด {vehicles.length} คัน)</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button onClick={() => setShowBulkUploadModal(true)} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto">
                <FileText size={16} strokeWidth={2} className="text-zinc-500" />
                อัปโหลดจำนวนมาก
              </button>
              <button
                onClick={() => {
                  setShowAddVehicleForm(true);
                  setSerialError('');
                  setVehicleNumberError('');
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Plus size={16} strokeWidth={2} />
                เพิ่มรถใหม่
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl shadow-sm overflow-hidden mb-6 flex flex-col transition-all duration-300">
            <div className="p-4 sm:p-5 bg-zinc-50/50 dark:bg-zinc-800/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">กรองตามสนาม</label>
                  <select
                    value={filterCourse}
                    onChange={(e) => {
                      setFilterCourse(e.target.value || '');
                      setFilterAgreement('');
                    }}
                    className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-700 dark:text-zinc-300 transition-all duration-200"
                  >
                    <option value="">ทุกสนาม</option>
                    {golfCourses.map(course => (
                      <option key={course.id} value={String(course.id)}>{course.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">กรองตามสัญญา</label>
                  <select
                    value={filterAgreement}
                    onChange={(e) => setFilterAgreement(e.target.value || '')}
                    disabled={!filterCourse}
                    className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <option value="">ทุกสัญญา</option>
                    {allAgreements
                      .filter(a => String(a.golf_course_id) === filterCourse)
                      .map(agreement => (
                        <option key={agreement.id} value={agreement.id}>{agreement.agreement_number}</option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">หมายเลขซีเรียล</label>
                  <input
                    type="text"
                    placeholder="ค้นหา Serial..."
                    value={filterSerial}
                    onChange={(e) => setFilterSerial(e.target.value)}
                    className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 transition-all duration-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">หมายเลขรถ</label>
                  <input
                    type="text"
                    placeholder="ค้นหาหมายเลขรถ..."
                    value={filterVehicleNumber}
                    onChange={(e) => setFilterVehicleNumber(e.target.value)}
                    className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 transition-all duration-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">ซีเรียลแบต</label>
                  <input
                    type="text"
                    placeholder="ค้นหา Battery Serial..."
                    value={filterBatterySerial}
                    onChange={(e) => setFilterBatterySerial(e.target.value)}
                    className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {selectedVehicles.length > 0 && (
              <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-indigo-50/50 dark:bg-indigo-900/10 transition-all">
                <span className="text-indigo-700 dark:text-indigo-400 font-medium text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  เลือกไว้ {selectedVehicles.length} คัน
                </span>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setShowBulkTransferModal(true)}
                    className="flex-1 sm:flex-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 shadow-sm active:scale-95"
                  >
                    ย้ายสนาม
                  </button>
                  <button
                    onClick={() => setShowBulkAgreementModal(true)}
                    className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-400 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 shadow-sm active:scale-95"
                  >
                    เปลี่ยนสัญญา
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Vehicles Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-200/50 dark:border-zinc-800/50">
                  <tr>
                    <th className="px-5 py-4 w-12 text-center">
                      <input
                        type="checkbox"
                        className="rounded text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
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
                    <th onClick={() => handleSort('serial_number')} className="px-5 py-4 font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors whitespace-nowrap group min-w-[170px]">
                      <div className="flex items-center">
                        หมายเลขซีเรียล {getSortIcon('serial_number')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('vehicle_number')} className="px-5 py-4 font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors whitespace-nowrap group w-[110px]">
                      <div className="flex items-center">
                        หมายเลขรถ {getSortIcon('vehicle_number')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('battery_serial')} className="px-5 py-4 font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors whitespace-nowrap group min-w-[150px]">
                      <div className="flex items-center">
                        ซีเรียลแบต {getSortIcon('battery_serial')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('golf_course_name')} className="px-5 py-4 font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors whitespace-nowrap group min-w-[150px]">
                      <div className="flex items-center">
                        สนาม {getSortIcon('golf_course_name')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('agreement_id')} className="px-5 py-4 font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors whitespace-nowrap group min-w-[130px]">
                      <div className="flex items-center">
                        เลขที่สัญญา {getSortIcon('agreement_id')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('status')} className="px-5 py-4 font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors whitespace-nowrap group w-[110px]">
                      <div className="flex items-center">
                        สถานะ {getSortIcon('status')}
                      </div>
                    </th>
                    <th className="px-5 py-4 font-medium text-zinc-500 dark:text-zinc-400 w-[120px] text-right">
                      การจัดการ
                    </th>
                    <th onClick={() => handleSort('transfer_date')} className="px-5 py-4 font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors whitespace-nowrap group w-[130px] text-right">
                      <div className="flex items-center justify-end">
                        วันที่ย้าย {getSortIcon('transfer_date')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/30">
                  {currentVehicles.map((vehicle, index) => {
                    const course = golfCourses.find(c => c.id === vehicle.golf_course_id);
                    return (
                      <tr key={`vehicle-${vehicle.id}-${index}`} className={`transition-colors group ${selectedVehicles.includes(vehicle.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'}`}>
                        <td className="px-5 py-4 text-center">
                          <input
                            type="checkbox"
                            className="rounded text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                            checked={selectedVehicles.includes(vehicle.id)}
                            onChange={() => handleSelectVehicle(vehicle.id)}
                          />
                        </td>
                        <td className="px-5 py-4">
                          {editingVehicle?.id === vehicle.id ? (
                            <input
                              type="text"
                              value={editingVehicle.serial_number}
                              onChange={(e) => setEditingVehicle({ ...editingVehicle, serial_number: e.target.value })}
                              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{vehicle.serial_number}</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-zinc-900 dark:text-zinc-100">
                          {editingVehicle?.id === vehicle.id ? (
                            <input
                              type="text"
                              value={editingVehicle.vehicle_number}
                              onChange={(e) => setEditingVehicle({ ...editingVehicle, vehicle_number: e.target.value })}
                              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          ) : (
                            vehicle.vehicle_number || '-'
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {editingVehicle?.id === vehicle.id ? (
                            <input
                              type="text"
                              value={editingVehicle.battery_serial || ''}
                              onChange={(e) => setEditingVehicle({ ...editingVehicle, battery_serial: e.target.value })}
                              placeholder="ระบุซีเรียลแบต"
                              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="text-zinc-600 dark:text-zinc-400">{vehicle.battery_serial || '-'}</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-zinc-700 dark:text-zinc-300">
                          {editingVehicle?.id === vehicle.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <select
                                value={String(editingVehicle.golf_course_id)}
                                onChange={(e) => {
                                  const courseId = e.target.value;
                                  const selectedCourse = golfCourses.find(c => c.id === courseId);
                                  setEditingVehicle({
                                    ...editingVehicle,
                                    golf_course_id: courseId,
                                    golf_course_name: selectedCourse?.name || 'ไม่ระบุ',
                                    agreement_id: null
                                  });
                                }}
                                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                {golfCourses.map(course => (
                                  <option key={course.id} value={String(course.id)}>{course.name}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <span className="truncate block max-w-[150px]" title={course?.name}>{course?.name || 'ไม่พบสนาม'}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {editingVehicle?.id === vehicle.id ? (
                            <select
                              value={editingVehicle.agreement_id || ''}
                              onChange={(e) => {
                                setEditingVehicle({
                                  ...editingVehicle,
                                  agreement_id: e.target.value || null
                                });
                              }}
                              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">ไม่มีสัญญา</option>
                              {allAgreements
                                .filter(a => a.golf_course_id === editingVehicle.golf_course_id)
                                .map(a => (
                                  <option key={a.id} value={a.id}>{a.agreement_number}</option>
                                ))
                              }
                            </select>
                          ) : (
                            <span className="font-mono text-zinc-600 dark:text-zinc-400 text-xs bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded truncate max-w-[120px] inline-block" title={allAgreements.find(a => a.id === vehicle.agreement_id)?.agreement_number || ''}>
                              {allAgreements.find(a => a.id === vehicle.agreement_id)?.agreement_number || '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {editingVehicle?.id === vehicle.id ? (
                            <select
                              value={editingVehicle.status || vehicle.status || 'active'}
                              onChange={(e) => setEditingVehicle({
                                ...editingVehicle,
                                status: e.target.value as Vehicle['status']
                              })}
                              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="active">ใช้งาน</option>
                              <option value="ready">พร้อมใช้</option>
                              <option value="maintenance">รอซ่อม</option>
                              <option value="retired">เสื่อมแล้ว</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                              ${(vehicle.status === 'active' || vehicle.status === 'ready' || !vehicle.status) ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : ''}
                              ${vehicle.status === 'maintenance' ? 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : ''}
                              ${vehicle.status === 'retired' ? 'bg-red-50 text-red-700 border-red-200/50 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : ''}
                            `}>
                              {getStatusLabel(vehicle.status || 'active')}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {editingVehicle?.id === vehicle.id ? (
                              <>
                                <button onClick={handleUpdateVehicle} className="text-white bg-indigo-600 hover:bg-indigo-500 rounded-md p-1.5 transition-colors" title="บันทึก">
                                  <Check size={16} />
                                </button>
                                <button onClick={() => setEditingVehicle(null)} className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md p-1.5 transition-colors" title="ยกเลิก">
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => {
                                  const vehicleWithStatus = {
                                    ...vehicle,
                                    status: vehicle.status || 'active'
                                  };
                                  setEditingVehicle(vehicleWithStatus);
                                }} className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="แก้ไข">
                                  <Edit size={16} />
                                </button>
                                <button onClick={() => handleDeleteVehicle(vehicle.id)} className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="ลบ">
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {vehicle.transfer_date ? (
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium text-xs bg-indigo-50 dark:bg-indigo-900/10 px-2 py-1 rounded">
                              {new Date(vehicle.transfer_date).toLocaleDateString('th-TH')}
                            </span>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {currentVehicles.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                        <div className="flex flex-col items-center gap-2">
                          <Car size={32} className="text-zinc-300 dark:text-zinc-600 mb-2" />
                          <p>ไม่พบข้อมูลรถกอล์ฟ</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="pagination-container">
            <div className="pagination-info">
              แสดง {indexOfFirstItem + 1} ถึง {Math.min(indexOfLastItem, filteredVehicles.length)} จากทั้งหมด {filteredVehicles.length} รายการ
            </div>

            <div className="pagination-controls">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="items-per-page-select"
              >
                <option value={10}>10 / หน้า</option>
                <option value={20}>20 / หน้า</option>
                <option value={50}>50 / หน้า</option>
                <option value={100}>100 / หน้า</option>
              </select>

              <div className="page-buttons">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  &lt;
                </button>

                {/* Logic to show limited page numbers (e.g. 1 2 ... 5 6 7 ... 10) can be complex.
                    For simplicity, let's show basic range or simple previous/next with current page input if needed.
                    Let's implement a simple sliding window if there are many pages. */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Logic to center the current page
                  let startPage = Math.max(1, currentPage - 2);
                  if (startPage + 4 > totalPages) startPage = Math.max(1, totalPages - 4);
                  const page = startPage + i;

                  if (page > totalPages) return null;

                  return (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
                      className={`page-btn ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  &gt;
                </button>
              </div>
            </div>
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

      {/* Bulk Agreement Change Modal */}
      {showBulkAgreementModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>เปลี่ยนสัญญาแบบกลุ่ม ({selectedVehicles.length} คัน)</h3>
              <button onClick={() => setShowBulkAgreementModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ marginBottom: '15px', color: '#6b7280', fontSize: '14px' }}>
                กรุณาเลือกสนามและสัญญาที่ต้องการเปลี่ยนให้กลุ่มรถที่เลือก
                (หากเปลี่ยนสัญญาที่มีสนามต่างกัน ระบบจะย้ายสนามของรถให้โดยอัตโนมัติ)
              </p>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>1. เลือกสนามกอล์ฟ:</label>
                <select
                  value={bulkAgreementCourseId}
                  onChange={(e) => {
                    setBulkAgreementCourseId(e.target.value);
                    setBulkAgreementId(''); // รีเซ็ตสัญญาเมื่อเปลี่ยนสนาม
                  }}
                  className="form-input"
                >
                  <option value="">-- เลือกเพื่อกรองสัญญา --</option>
                  {golfCourses.map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>2. เลือกสัญญาเช่า:</label>
                <select
                  value={bulkAgreementId}
                  onChange={(e) => setBulkAgreementId(e.target.value)}
                  className="form-input"
                  style={{ borderColor: bulkAgreementCourseId ? '#cbd5e1' : '#e2e8f0', backgroundColor: bulkAgreementCourseId ? '#fff' : '#f8fafc' }}
                  disabled={!bulkAgreementCourseId}
                >
                  <option value="">-- ถอดสัญญา (ไม่มีสัญญา) --</option>
                  {allAgreements
                    .filter(a => a.golf_course_id === bulkAgreementCourseId)
                    .map(a => (
                      <option key={a.id} value={a.id}>{a.agreement_number}</option>
                    ))}
                </select>
              </div>

              {selectedVehicles.length > 0 && (
                <div className="selected-vehicles" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px' }}>
                  <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>รถที่เลือกไว้ (จะไม่ระบุสัญญาเดิมที่นี่):</h4>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontSize: '13px', color: '#475569' }}>
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
                onClick={handleBulkAgreementChange}
                className="save-button"
                style={{ backgroundColor: '#f59e0b' }}
              >
                ยืนยันการเปลี่ยนสัญญา
              </button>
              <button onClick={() => setShowBulkAgreementModal(false)} className="cancel-button">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agreements Tab */}
      {activeTab === 'agreements' && (
        <AgreementManagementScreen golfCourses={golfCourses} />
      )}

      {/* View Agreements Modal */}
      {showAgreementsModal && selectedCourseForAgreements && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>สัญญาเช่าทั้งหมด - {selectedCourseForAgreements.name}</h3>
              <button onClick={() => setShowAgreementsModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              {isLoadingAgreements ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>กำลังโหลดข้อมูลสัญญา...</div>
              ) : courseAgreements.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>ไม่พบข้อมูลสัญญาเช่าสำหรับสนามนี้</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead style={{ backgroundColor: '#f9fafb' }}>
                      <tr>
                        <th style={{ padding: '12px' }}>เลขที่สัญญา</th>
                        <th style={{ padding: '12px' }}>วันที่เริ่มต้น</th>
                        <th style={{ padding: '12px' }}>วันที่สิ้นสุด</th>
                        <th style={{ padding: '12px' }}>จำนวนรถในสัญญา</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseAgreements.map(agreement => (
                        <tr key={agreement.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px' }}>{agreement.agreement_number}</td>
                          <td style={{ padding: '12px' }}>{new Date(agreement.startDate).toLocaleDateString('th-TH')}</td>
                          <td style={{ padding: '12px' }}>{new Date(agreement.endDate).toLocaleDateString('th-TH')}</td>
                          <td style={{ padding: '12px' }}>{agreement._count?.vehicles || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GolfCourseManagementScreen;