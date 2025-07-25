import React, { useState } from 'react';

// Import interfaces and functions from lib/data.ts
import { 
  GolfCourse, 
  Vehicle, 
  SerialHistoryEntry
} from '@/lib/data';

interface GolfCourseManagementScreenProps {
  onBack?: () => void;
  golfCourses: GolfCourse[];
  setGolfCourses: (courses: GolfCourse[]) => void;
  vehicles: Vehicle[];
  setVehicles: (vehicles: Vehicle[]) => void;
  serialHistory: SerialHistoryEntry[];
  addSerialHistoryEntry: (entry: Omit<SerialHistoryEntry, 'id'>) => void;
}

interface BulkUploadData {
  serial_number: string;
  vehicle_number: string;
  golf_course_id: number;
}

const GolfCourseManagementScreen: React.FC<GolfCourseManagementScreenProps> = ({ 
  onBack, 
  golfCourses, 
  setGolfCourses, 
  vehicles, 
  setVehicles,
  serialHistory,
  addSerialHistoryEntry
}) => {
  // Remove conflicting useState declarations and use props instead
  const [activeTab, setActiveTab] = useState<'courses' | 'vehicles'>('courses');
  const [newCourse, setNewCourse] = useState({ name: '', location: '' });
  const [editingCourse, setEditingCourse] = useState<GolfCourse | null>(null);
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ serial_number: '', vehicle_number: '', golf_course_id: 0 });
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [filterCourse, setFilterCourse] = useState<number | ''>('');
  const [selectedVehicles, setSelectedVehicles] = useState<number[]>([]);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showBulkTransferModal, setShowBulkTransferModal] = useState(false);
  const [bulkUploadData, setBulkUploadData] = useState<BulkUploadData[]>([]);
  const [bulkUploadErrors, setBulkUploadErrors] = useState<string[]>([]);
  const [transferToCourse, setTransferToCourse] = useState<number | ''>('');
  const [transferDate, setTransferDate] = useState<string>(''); // เพิ่ม state สำหรับวันที่ย้าย
  const [serialError, setSerialError] = useState<string>(''); // เพิ่ม state สำหรับแสดงข้อผิดพลาด Serial ซ้ำ
  const [vehicleNumberError, setVehicleNumberError] = useState<string>(''); // เพิ่ม state สำหรับแสดงข้อผิดพลาดหมายเลขรถซ้ำ

  // Helper function to get status label
  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'active': 'ใช้งาน',
      'inactive': 'ไม่ใช้งาน',
      'parked': 'ฝากจอด',
      'spare': 'สแปร์'
    };
    return statusLabels[status] || 'ใช้งาน';
  };

  // Helper function to check duplicate serial number
  const checkDuplicateSerial = (serialNumber: string, excludeId?: number): boolean => {
    return vehicles.some(vehicle => 
      vehicle.serial_number === serialNumber && vehicle.id !== excludeId
    );
  };

  // Helper function to check duplicate vehicle number
  const checkDuplicateVehicleNumber = (vehicleNumber: string, excludeId?: number): boolean => {
    return vehicles.some(vehicle => 
      vehicle.vehicle_number === vehicleNumber && vehicle.id !== excludeId
    );
  };

  // Helper function to validate vehicle data
  const validateVehicleData = (serialNumber: string, vehicleNumber: string, excludeId?: number): { isValid: boolean; errors: { serial?: string; vehicleNumber?: string } } => {
    const errors: { serial?: string; vehicleNumber?: string } = {};
    
    if (checkDuplicateSerial(serialNumber, excludeId)) {
      errors.serial = `หมายเลขซีเรียล "${serialNumber}" มีอยู่ในระบบแล้ว`;
    }
    
    if (checkDuplicateVehicleNumber(vehicleNumber, excludeId)) {
      errors.vehicleNumber = `หมายเลขรถ "${vehicleNumber}" มีอยู่ในระบบแล้ว`;
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Helper function to count vehicles by course
  const getVehicleCountByCourse = (courseId: number): number => {
    return vehicles.filter(vehicle => vehicle.golf_course_id === courseId).length;
  };

  // ใช้ข้อมูลจาก props ที่ส่งมาจาก lib/data.ts แทน mock data

  // Golf Course Management Functions
  const handleAddCourse = async () => {
    if (newCourse.name && newCourse.location) {
      try {
        const response = await fetch('/api/golf-courses', {
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
        const response = await fetch(`/api/golf-courses/${editingCourse.id}`, {
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

  const handleDeleteCourse = async (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบสนามนี้?')) {
      try {
        const response = await fetch(`/api/golf-courses/${id}`, {
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
        golf_course_name: golfCourse?.name ?? '',
        brand: 'ไม่ระบุ',
        model: 'ไม่ระบุ',
        year: new Date().getFullYear(),
        status: 'active' as const
      };

      try {
        const response = await fetch('/api/vehicles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vehicleData)
        });

        if (response.ok) {
          const result = await response.json();
          setVehicles([...vehicles, result.data]);
          
          // บันทึกประวัติการเพิ่มรถใหม่
          addSerialHistoryEntry({
            serial_number: result.data.serial_number,
            vehicle_id: result.data.id,
            vehicle_number: result.data.vehicle_number,
            action_type: 'registration',
            action_date: new Date().toISOString(),
            details: `เพิ่มรถใหม่ - หมายเลขรถ: ${result.data.vehicle_number}, สนาม: ${golfCourse?.name ?? 'ไม่ระบุ'}`,
            performed_by: 'administrator',
            performed_by_id: 1,
            golf_course_id: result.data.golf_course_id,
            golf_course_name: golfCourse?.name ?? 'ไม่ระบุ',
            is_active: true
          });
          
          setNewVehicle({ serial_number: '', vehicle_number: '', golf_course_id: 0 });
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

  const handleUpdateVehicle = () => {
    if (editingVehicle) {
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
        return; // หยุดการทำงานถ้าพบข้อมูลซ้ำ
      }
      
      const oldVehicle = vehicles.find(v => v.id === editingVehicle.id);
      
      setVehicles(vehicles.map(vehicle => 
        vehicle.id === editingVehicle.id ? editingVehicle : vehicle
      ));
      
      // บันทึกประวัติการเปลี่ยนแปลง
      if (oldVehicle) {
        const changes: string[] = [];
        
        if (oldVehicle.serial_number !== editingVehicle.serial_number) {
          changes.push(`หมายเลขซีเรียล: ${oldVehicle.serial_number} → ${editingVehicle.serial_number}`);
        }
        if (oldVehicle.vehicle_number !== editingVehicle.vehicle_number) {
          changes.push(`หมายเลขรถ: ${oldVehicle.vehicle_number} → ${editingVehicle.vehicle_number}`);
        }
        if (oldVehicle.golf_course_id !== editingVehicle.golf_course_id) {
          const oldCourse = golfCourses.find(c => c.id === oldVehicle.golf_course_id)?.name ?? 'ไม่ระบุ';
          const newCourse = golfCourses.find(c => c.id === editingVehicle.golf_course_id)?.name ?? 'ไม่ระบุ';
          changes.push(`สนาม: ${oldCourse} → ${newCourse}`);
        }
        if (oldVehicle.status !== editingVehicle.status) {
          changes.push(`สถานะ: ${getStatusLabel(oldVehicle.status || 'active')} → ${getStatusLabel(editingVehicle.status || 'active')}`);
        }
        
        if (changes.length > 0) {
          addSerialHistoryEntry({
            serial_number: editingVehicle.serial_number,
            vehicle_id: editingVehicle.id,
            vehicle_number: editingVehicle.vehicle_number,
            action_type: 'data_edit',
            action_date: new Date().toISOString(),
            details: `แก้ไขข้อมูลรถ - ${changes.join(', ')}`,
            performed_by: 'administrator',
            performed_by_id: 1,
            golf_course_id: editingVehicle.golf_course_id,
            golf_course_name: golfCourses.find(c => c.id === editingVehicle.golf_course_id)?.name ?? 'ไม่ระบุ',
            is_active: true
          });
        }
      }
      
      setEditingVehicle(null);
    }
  };

  const handleDeleteVehicle = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบรถคันนี้?')) {
      const vehicleToDelete = vehicles.find(v => v.id === id);
      
      if (vehicleToDelete) {
        // บันทึกประวัติการลบ
        addSerialHistoryEntry({
          serial_number: vehicleToDelete.serial_number,
          vehicle_id: vehicleToDelete.id,
          vehicle_number: vehicleToDelete.vehicle_number,
          action_type: 'data_delete',
          action_date: new Date().toISOString(),
          details: `ลบรถออกจากระบบ - หมายเลขรถ: ${vehicleToDelete.vehicle_number}, สนาม: ${vehicleToDelete.golf_course_name}`,
          performed_by: 'administrator',
          performed_by_id: 1,
          golf_course_id: vehicleToDelete.golf_course_id,
          golf_course_name: vehicleToDelete.golf_course_name,
          is_active: false
        });
      }
      
      setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
    }
  };

  const handleSelectVehicle = (id: number) => {
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
      const seenVehicleNumbers = new Set<string>(); // ตรวจสอบหมายเลขรถซ้ำในไฟล์เอง

      lines.forEach((line, index) => {
        if (index === 0) return; // Skip header
        const [serial_number, vehicle_number, golf_course_id] = line.split(',').map(s => s.trim());
        
        if (!serial_number || !vehicle_number || !golf_course_id) {
          errors.push(`บรรทัด ${index + 1}: ข้อมูลไม่ครบถ้วน (ต้องมี: หมายเลขซีเรียล, หมายเลขรถ, รหัสสนาม)`);
          return;
        }

        const courseId = parseInt(golf_course_id);
        if (isNaN(courseId) || !golfCourses.find(c => c.id === courseId)) {
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

        // ตรวจสอบหมายเลขรถซ้ำในระบบ
        if (vehicles.find(v => v.vehicle_number === vehicle_number)) {
          errors.push(`บรรทัด ${index + 1}: หมายเลขรถ "${vehicle_number}" มีอยู่ในระบบแล้ว`);
          return;
        }

        // ตรวจสอบหมายเลขรถซ้ำในไฟล์เอง
        if (seenVehicleNumbers.has(vehicle_number)) {
          errors.push(`บรรทัด ${index + 1}: หมายเลขรถ "${vehicle_number}" ซ้ำกันในไฟล์`);
          return;
        }

        // เพิ่มลงใน Set เพื่อตรวจสอบการซ้ำ
        seenSerials.add(serial_number);
        seenVehicleNumbers.add(vehicle_number);

        data.push({ serial_number, vehicle_number, golf_course_id: courseId });
      });

      setBulkUploadData(data);
      setBulkUploadErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = () => {
    if (bulkUploadData.length === 0) return;

    const newVehicles = bulkUploadData.map((data, index) => {
      const newId = Math.max(...vehicles.map(v => v.id), 0) + index + 1;
      const golfCourse = golfCourses.find(c => c.id === data.golf_course_id);
      
      return {
        id: newId,
        serial_number: data.serial_number,
        vehicle_number: data.vehicle_number,
        golf_course_id: data.golf_course_id,
        golf_course_name: golfCourse?.name ?? '',
        brand: 'ไม่ระบุ',
        model: 'ไม่ระบุ',
        year: new Date().getFullYear(),
        status: 'active' as const,
        created_at: new Date().toISOString()
      };
    });

    setVehicles([...vehicles, ...newVehicles]);
    
    // บันทึกประวัติการอัปโหลดหลายคัน
    newVehicles.forEach(vehicle => {
      addSerialHistoryEntry({
        serial_number: vehicle.serial_number,
        vehicle_id: vehicle.id,
        vehicle_number: vehicle.vehicle_number,
        action_type: 'bulk_upload',
        action_date: new Date().toISOString(),
        details: `อัปโหลดรถจากไฟล์ - หมายเลขรถ: ${vehicle.vehicle_number}, สนาม: ${vehicle.golf_course_name}`,
        performed_by: 'administrator',
        performed_by_id: 1,
        golf_course_id: vehicle.golf_course_id,
        golf_course_name: vehicle.golf_course_name,
        is_active: true
      });
    });

    setBulkUploadData([]);
    setBulkUploadErrors([]);
    setShowBulkUploadModal(false);
  };

  const handleBulkTransfer = () => {
    if (selectedVehicles.length === 0 || !transferToCourse || !transferDate) return;

    const vehiclesToTransfer = vehicles.filter(v => selectedVehicles.includes(v.id));
    const targetCourse = golfCourses.find(c => c.id === transferToCourse);
    
    if (!targetCourse) return;

    // อัปเดตข้อมูลรถ
    setVehicles(vehicles.map(vehicle => 
      selectedVehicles.includes(vehicle.id)
        ? { 
            ...vehicle, 
            golf_course_id: transferToCourse as number, 
            golf_course_name: targetCourse.name
          }
        : vehicle
    ));

    // บันทึกประวัติการโอนย้ายหลายคันพร้อมวันที่
    vehiclesToTransfer.forEach(vehicle => {
      const oldCourse = golfCourses.find(c => c.id === vehicle.golf_course_id)?.name ?? 'ไม่ระบุ';
      addSerialHistoryEntry({
        serial_number: vehicle.serial_number,
        vehicle_id: vehicle.id,
        vehicle_number: vehicle.vehicle_number,
        action_type: 'bulk_transfer',
        action_date: new Date().toISOString(), // วันที่/เวลาที่บันทึกในระบบ (ปัจจุบัน)
        actual_transfer_date: transferDate, // วันที่ย้ายจริงที่ผู้ใช้เลือก
        details: `โยกย้ายรถ - จาก: ${oldCourse} ไป: ${targetCourse.name} (วันที่โยกย้ายจริง: ${new Date(transferDate).toLocaleDateString('th-TH')})`,
        performed_by: 'administrator',
        performed_by_id: 1,
        golf_course_id: transferToCourse as number,
        golf_course_name: targetCourse.name,
        is_active: true
      });
    });

    setSelectedVehicles([]);
    setTransferToCourse('');
    setTransferDate('');
    setShowBulkTransferModal(false);
  };

  const downloadTemplate = () => {
    // สร้าง header พร้อมคำอธิบาย
    const header = 'serial_number,vehicle_number,golf_course_id';
    const description = '# แม่แบบการอัปโหลดรถกอล์ฟ\n# คอลัมน์: หมายเลขซีเรียล, หมายเลขรถ, รหัสสนาม\n# รหัสสนาม: ' + 
      golfCourses.map(course => `${course.id}=${course.name}`).join(', ') + '\n';
    
    // ตัวอย่างข้อมูล
    const examples = [
      'GC001,V001,1',
      'GC002,V002,1', 
      'GC003,V003,2'
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

  const filteredVehicles = filterCourse 
    ? vehicles.filter(vehicle => vehicle.golf_course_id === filterCourse)
    : vehicles;

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
                  onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="ที่อยู่"
                  value={newCourse.location}
                  onChange={(e) => setNewCourse({...newCourse, location: e.target.value})}
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
                          onChange={(e) => setEditingCourse({...editingCourse, name: e.target.value})}
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
                          onChange={(e) => setEditingCourse({...editingCourse, location: e.target.value})}
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
                      setNewVehicle({...newVehicle, serial_number: e.target.value});
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
                      setNewVehicle({...newVehicle, vehicle_number: e.target.value});
                      setVehicleNumberError(''); // ล้างข้อความแจ้งเตือนเมื่อผู้ใช้พิมพ์
                    }}
                    className={vehicleNumberError ? 'error' : ''}
                  />
                  {vehicleNumberError && <div className="error-message">{vehicleNumberError}</div>}
                </div>
                <select
                  value={newVehicle.golf_course_id}
                  onChange={(e) => setNewVehicle({...newVehicle, golf_course_id: parseInt(e.target.value)})}
                >
                  <option value={0}>เลือกสนาม</option>
                  {golfCourses.map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
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
              <label>กรองตามสนาม:</label>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value ? parseInt(e.target.value) : '')}
              >
                <option value="">ทุกสนาม</option>
                {golfCourses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
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
                  <th>สนาม</th>
                  <th>สถานะ</th>
                  <th>การจัดการ</th>
                  <th>วันที่ย้าย</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map(vehicle => {
                  const course = golfCourses.find(c => c.id === vehicle.golf_course_id);
                  return (
                    <tr key={vehicle.id}>
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
                            onChange={(e) => setEditingVehicle({...editingVehicle, serial_number: e.target.value})}
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
                            onChange={(e) => setEditingVehicle({...editingVehicle, vehicle_number: e.target.value})}
                          />
                        ) : (
                          vehicle.vehicle_number
                        )}
                      </td>
                      <td>
                        {editingVehicle?.id === vehicle.id ? (
                          <select
                            value={editingVehicle.golf_course_id}
                            onChange={(e) => {
                              const courseId = parseInt(e.target.value);
                              const selectedCourse = golfCourses.find(c => c.id === courseId);
                              setEditingVehicle({
                                ...editingVehicle, 
                                golf_course_id: courseId,
                                golf_course_name: selectedCourse?.name ?? ''
                              });
                            }}
                            className="course-select"
                          >
                            {golfCourses.map(course => (
                              <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                          </select>
                        ) : (
                          course?.name ?? 'ไม่พบสนาม'
                        )}
                      </td>
                      <td>
                        {editingVehicle?.id === vehicle.id ? (
                          <select
                            value={editingVehicle.status || 'active'}
                            onChange={(e) => setEditingVehicle({
                              ...editingVehicle, 
                              status: e.target.value as 'active' | 'maintenance' | 'retired' | 'parked'
                            })}
                            className="status-select"
                          >
                            <option value="active">ใช้งาน</option>
                            <option value="maintenance">ซ่อมบำรุง</option>
                            <option value="retired">เกษียณ</option>
                            <option value="parked">ฝากจอด</option>
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
                            <button onClick={() => setEditingVehicle(vehicle)} className="edit-button">แก้ไข</button>
                            <button onClick={() => handleDeleteVehicle(vehicle.id)} className="delete-button">ลบ</button>
                          </>
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
                      <li key={index} className="error-item">{error}</li>
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
                        <th>สนาม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkUploadData.slice(0, 5).map((item, index) => {
                        const course = golfCourses.find(c => c.id === item.golf_course_id);
                        return (
                          <tr key={index}>
                            <td>{item.serial_number}</td>
                            <td>{item.vehicle_number}</td>
                            <td>{course?.name ?? 'ไม่พบสนาม'}</td>
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
              <h3>ย้ายรถไปสนามอื่น</h3>
              <button onClick={() => setShowBulkTransferModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <p>เลือกสนามและวันที่ที่ต้องการย้าย {selectedVehicles.length} คัน:</p>
              
              <div className="transfer-form">
                <div className="form-group">
                  <label>สนามปลายทาง:</label>
                  <select
                    value={transferToCourse}
                    onChange={(e) => setTransferToCourse(e.target.value ? parseInt(e.target.value) : '')}
                    className="transfer-select"
                  >
                    <option value="">เลือกสนาม</option>
                    {golfCourses.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
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

  // Helper function to get status color class
  const getStatusColorClass = (status: string) => {
    const statusColors: Record<string, string> = {
      'active': 'status-active',
      'inactive': 'status-inactive',
      'parked': 'status-parked',
      'spare': 'status-spare'
    };
    return statusColors[status] || 'status-active';
  };