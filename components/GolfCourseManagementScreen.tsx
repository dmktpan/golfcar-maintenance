import React, { useState } from 'react';

// Import interfaces from lib/data.ts
import { GolfCourse, Vehicle } from '@/lib/data';

interface GolfCourseManagementScreenProps {
  onBack?: () => void;
  golfCourses: GolfCourse[];
  setGolfCourses: (courses: GolfCourse[]) => void;
  vehicles: Vehicle[];
  setVehicles: (vehicles: Vehicle[]) => void;
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
  setVehicles 
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

  // Helper function to count vehicles by course
  const getVehicleCountByCourse = (courseId: number): number => {
    return vehicles.filter(vehicle => vehicle.golf_course_id === courseId).length;
  };

  // ใช้ข้อมูลจาก props ที่ส่งมาจาก lib/data.ts แทน mock data

  // Golf Course Management Functions
  const handleAddCourse = () => {
    if (newCourse.name && newCourse.location) {
      const newId = Math.max(...golfCourses.map(c => c.id), 0) + 1;
      setGolfCourses([...golfCourses, { id: newId, ...newCourse }]);
      setNewCourse({ name: '', location: '' });
      setShowAddCourseForm(false);
    }
  };

  const handleUpdateCourse = () => {
    if (editingCourse) {
      setGolfCourses(golfCourses.map(course => 
        course.id === editingCourse.id ? editingCourse : course
      ));
      setEditingCourse(null);
    }
  };

  const handleDeleteCourse = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบสนามนี้?')) {
      setGolfCourses(golfCourses.filter(course => course.id !== id));
      setVehicles(vehicles.filter(vehicle => vehicle.golf_course_id !== id));
    }
  };

  // Vehicle Management Functions
  const handleAddVehicle = () => {
    if (newVehicle.serial_number && newVehicle.vehicle_number && newVehicle.golf_course_id) {
      const newId = Math.max(...vehicles.map(v => v.id), 0) + 1;
      setVehicles([...vehicles, { 
        id: newId, 
        serial_number: newVehicle.serial_number,
        vehicle_number: newVehicle.vehicle_number,
        golf_course_id: newVehicle.golf_course_id,
        status: 'active' as const
      }]);
      setNewVehicle({ serial_number: '', vehicle_number: '', golf_course_id: 0 });
      setShowAddVehicleForm(false);
    }
  };

  const handleUpdateVehicle = () => {
    if (editingVehicle) {
      setVehicles(vehicles.map(vehicle => 
        vehicle.id === editingVehicle.id ? editingVehicle : vehicle
      ));
      setEditingVehicle(null);
    }
  };

  const handleDeleteVehicle = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบรถคันนี้?')) {
      setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
    }
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

        if (vehicles.find(v => v.serial_number === serial_number)) {
          errors.push(`บรรทัด ${index + 1}: หมายเลขซีเรียล ${serial_number} มีอยู่แล้ว`);
          return;
        }

        // ลบส่วนนี้ออก - ไม่ต้องเช็คเบอร์รถซ้ำ
        // if (vehicles.find(v => v.vehicle_number === vehicle_number)) {
        //   errors.push(`บรรทัด ${index + 1}: หมายเลขรถ ${vehicle_number} มีอยู่แล้ว`);
        //   return;
        // }

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
      return {
        id: newId,
        serial_number: data.serial_number,
        vehicle_number: data.vehicle_number,
        golf_course_id: data.golf_course_id,
        status: 'active' as const
      };
    });

    setVehicles([...vehicles, ...newVehicles]);
    setBulkUploadData([]);
    setBulkUploadErrors([]);
    setShowBulkUploadModal(false);
    
    // แจ้งเตือนความสำเร็จ
    alert(`อัปโหลดสำเร็จ! เพิ่มรถ ${newVehicles.length} คัน`);
  };

  const handleSelectVehicle = (vehicleId: number) => {
    setSelectedVehicles(prev => 
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleBulkTransfer = () => {
    if (selectedVehicles.length === 0 || !transferToCourse) return;

    setVehicles(vehicles.map(vehicle => 
      selectedVehicles.includes(vehicle.id)
        ? { ...vehicle, golf_course_id: transferToCourse as number }
        : vehicle
    ));

    setSelectedVehicles([]);
    setTransferToCourse('');
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
              <button onClick={() => setShowAddVehicleForm(true)} className="add-button">
                + เพิ่มรถ
              </button>
            </div>
          </div>

          {/* Add Vehicle Form */}
          {showAddVehicleForm && (
            <div className="form-section">
              <h3>เพิ่มรถใหม่</h3>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="หมายเลขซีเรียล"
                  value={newVehicle.serial_number}
                  onChange={(e) => setNewVehicle({...newVehicle, serial_number: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="หมายเลขรถ"
                  value={newVehicle.vehicle_number}
                  onChange={(e) => setNewVehicle({...newVehicle, vehicle_number: e.target.value})}
                />
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
                <button onClick={() => setShowAddVehicleForm(false)} className="cancel-button">ยกเลิก</button>
              </div>
            </div>
          )}

          {/* Filter and Bulk Actions */}
          <div className="filter-section">
            <div className="filter-controls">
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
                            onChange={(e) => setEditingVehicle({...editingVehicle, golf_course_id: parseInt(e.target.value)})}
                          >
                            {golfCourses.map(course => (
                              <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                          </select>
                        ) : (
                          course?.name || 'ไม่ระบุ'
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${vehicle.status}`}>
                          {vehicle.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                        </span>
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
              <h3>ย้ายรถไปสนามอื่น</h3>
              <button onClick={() => setShowBulkTransferModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <p>เลือกสนามที่ต้องการย้าย {selectedVehicles.length} คัน:</p>
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
            <div className="modal-footer">
              <button 
                onClick={handleBulkTransfer} 
                className="save-button"
                disabled={!transferToCourse}
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