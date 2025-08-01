'use client';

import React, { useState, useMemo } from 'react';
import { User, Job, SerialHistoryEntry, MOCK_GOLF_COURSES, View, Vehicle, GolfCourse } from '@/lib/data';
import StatusBadge from './StatusBadge';
import JobDetailsModal from './JobDetailsModal';

interface SerialHistoryScreenProps {
  user: User;
  setView: (view: View) => void;
  jobs: Job[];
  vehicles: Vehicle[];
  serialHistory: SerialHistoryEntry[];
  golfCourses: GolfCourse[];
  users: User[];
  partsUsageLog?: any[]; // เพิ่ม props สำหรับ PartsUsageLog
}

const SerialHistoryScreen = ({ user, setView, jobs, vehicles, serialHistory, golfCourses, users, partsUsageLog = [] }: SerialHistoryScreenProps) => {
  // Search and filter states
  const [searchSerial, setSearchSerial] = useState('');
  const [searchVehicleNumber, setSearchVehicleNumber] = useState('');
  const [filterActionType, setFilterActionType] = useState('');
  const [filterGolfCourse, setFilterGolfCourse] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showInactive, setShowInactive] = useState(true);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); // เริ่มต้นที่ 50 รายการต่อหน้า
  
  // Sort states
  const [sortBy] = useState<'date' | 'serial' | 'action'>('date');
    const [sortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper functions
  const formatDate = (dateInput: string | Date | undefined | null) => {
    try {
      // ตรวจสอบว่ามีข้อมูลวันที่หรือไม่
      if (!dateInput) {
        return 'ไม่ระบุวันที่';
      }

      let date: Date;
      
      // ถ้าเป็น Date object อยู่แล้ว
      if (dateInput instanceof Date) {
        date = dateInput;
      }
      // ถ้าเป็น string
      else if (typeof dateInput === 'string') {
        // ตรวจสอบว่าเป็น string ว่างหรือไม่
        if (dateInput.trim() === '') {
          return 'ไม่ระบุวันที่';
        }
        
        // ถ้าเป็น timestamp (number string)
        if (/^\d+$/.test(dateInput)) {
          date = new Date(parseInt(dateInput));
        } else {
          date = new Date(dateInput);
        }
      } else {
        return 'รูปแบบวันที่ไม่รู้จัก';
      }

      // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateInput);
        return 'วันที่ไม่ถูกต้อง';
      }

      // ตรวจสอบว่าวันที่อยู่ในช่วงที่สมเหตุสมผลหรือไม่
      const now = new Date();
      const minDate = new Date('2020-01-01');
      const maxDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 ปีข้างหน้า

      if (date < minDate || date > maxDate) {
        console.warn('Date out of reasonable range:', dateInput, date);
        return 'วันที่ไม่อยู่ในช่วงที่เหมาะสม';
      }

      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok' // ระบุ timezone ไทยอย่างชัดเจน
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateInput);
      return 'ข้อผิดพลาดในการแสดงวันที่';
    }
  };

  const getSystemDisplayName = (system: string) => {
    const systemNames: Record<string, string> = {
      'brake': 'เบรก/เพื่อห้าม',
      'steering': 'พวงมาลัย', 
      'motor': 'มอเตอร์/เพื่อขับ',
      'electric': 'ไฟฟ้า',
      'general': 'ทั่วไป',
      'suspension': 'ช่วงล่างและพวงมาลัย'
    };
    return systemNames[system] || system;
  };

  const getActionTypeLabel = (actionType: string): string => {
    switch (actionType) {
      case 'registration': return 'ลงทะเบียน';
      case 'transfer': return 'โอนย้าย';
      case 'maintenance': return 'ซ่อมบำรุง';
      case 'decommission': return 'ปลดระวาง';
      case 'inspection': return 'ตรวจสอบ';
      case 'status_change': return 'เปลี่ยนสถานะ';
      case 'data_edit': return 'แก้ไขข้อมูล';
      case 'data_delete': return 'ลบข้อมูล';
      case 'bulk_transfer': return 'โอนย้ายหลายคัน';
      case 'bulk_upload': return 'อัปโหลดหลายคัน';
      default: return actionType;
    }
  };

  const getActionTypeColorClass = (actionType: string): string => {
    switch (actionType) {
      case 'registration': return 'action-registration';
      case 'transfer': return 'action-transfer';
      case 'maintenance': return 'action-maintenance';
      case 'decommission': return 'action-decommission';
      case 'inspection': return 'action-inspection';
      case 'status_change': return 'action-status-change';
      case 'data_edit': return 'action-data-edit';
      case 'data_delete': return 'action-data-delete';
      case 'bulk_transfer': return 'action-bulk-transfer';
      case 'bulk_upload': return 'action-bulk-upload';
      default: return 'action-default';
    }
  };

  // สร้าง Serial History Entries จากงานที่มีในระบบ
  const generateSerialHistoryFromJobs = useMemo(() => {
    const generatedEntries: SerialHistoryEntry[] = [];
    
    jobs.forEach(job => {
      const vehicle = vehicles.find(v => v.id === job.vehicle_id);
      if (!vehicle) return;

      const golfCourse = MOCK_GOLF_COURSES.find(gc => gc.id === vehicle.golf_course_id);
      if (!golfCourse) return;

      const entry: SerialHistoryEntry = {
        id: job.id + 1000,
        serial_number: vehicle.serial_number,
        vehicle_id: vehicle.id,
        vehicle_number: vehicle.vehicle_number,
        action_type: 'maintenance',
        action_date: job.updated_at || job.created_at,
        details: `งาน${job.type === 'PM' ? 'ซ่อมบำรุงตามแผน' : job.type === 'BM' ? 'ซ่อมแซม' : 'ปรับปรุงสภาพ'} (${job.type})${job.system ? ` - ระบบ${getSystemDisplayName(job.system)}` : ''}${job.subTasks && job.subTasks.length > 0 ? `: ${job.subTasks.join(', ')}` : ''}`,
        performed_by: job.userName,
        performed_by_id: job.user_id,
        golf_course_id: vehicle.golf_course_id,
        golf_course_name: golfCourse.name,
        is_active: true,
        related_job_id: job.id,
        job_type: job.type,
        system: job.system,
        parts_used: job.parts?.map(p => `${p.part_name || 'ไม่ระบุ'} (${p.quantity_used || 0} ชิ้น)`) || [],
        status: job.status === 'rejected' ? undefined : job.status as 'completed' | 'pending' | 'in_progress' | 'approved' | 'assigned'
      };

      generatedEntries.push(entry);
    });

    return generatedEntries;
  }, [jobs, vehicles]);

  // รวม Serial History จาก mock data และข้อมูลที่สร้างจากงาน
  const allSerialHistory = useMemo(() => {
    return [...serialHistory, ...generateSerialHistoryFromJobs];
  }, [serialHistory, generateSerialHistoryFromJobs]);

  // Get unique action types for filter
  const actionTypes = useMemo(() => {
    return Array.from(new Set(allSerialHistory.map(entry => entry.action_type)));
  }, [allSerialHistory]);

  // Get unique serial numbers from actual data
  const availableSerials = useMemo(() => {
    const serials = Array.from(new Set(allSerialHistory.map(entry => entry.serial_number)))
      .filter(serial => serial && serial.trim() !== '')
      .sort();
    return serials;
  }, [allSerialHistory]);

  // Get unique vehicle numbers from actual data
  const availableVehicleNumbers = useMemo(() => {
    const vehicleNumbers = Array.from(new Set(allSerialHistory.map(entry => entry.vehicle_number)))
      .filter(number => number && number.trim() !== '')
      .sort();
    return vehicleNumbers;
  }, [allSerialHistory]);

  // Get golf courses that actually have history data
  const availableGolfCoursesWithData = useMemo(() => {
    // Get unique golf courses from actual history data
    const coursesFromHistory = Array.from(
      new Map(
        allSerialHistory.map(entry => [
          entry.golf_course_id,
          { id: entry.golf_course_id, name: entry.golf_course_name }
        ])
      ).values()
    );
    
    // Merge with MOCK_GOLF_COURSES, prioritizing MOCK_GOLF_COURSES data
    const allCourses = new Map();
    
    // First add courses from history
    coursesFromHistory.forEach(course => {
      allCourses.set(course.id, course);
    });
    
    // Then override with MOCK_GOLF_COURSES data if exists
    MOCK_GOLF_COURSES.forEach(course => {
      if (allCourses.has(course.id)) {
        allCourses.set(course.id, course);
      }
    });
    
    const coursesToShow = Array.from(allCourses.values());
    
    // Apply user role restrictions
    if (user.role === 'admin') {
      return coursesToShow;
    } else if (user.role === 'supervisor' && user.managed_golf_courses) {
      // หัวหน้าที่เลือกทั้งหมด (จำนวนสนามที่ดูแลเท่ากับจำนวนสนามทั้งหมด) จะเห็นสนามทั้งหมดในตัวกรอง
      const totalGolfCourses = golfCourses.length;
      const managedCoursesCount = user.managed_golf_courses.length;
      
      if (managedCoursesCount === totalGolfCourses) {
        return coursesToShow; // แสดงสนามทั้งหมดเหมือน admin
      } else {
        return coursesToShow.filter(course => 
          user.managed_golf_courses!.includes(course.id)
        );
      }
    } else {
      return coursesToShow.filter(course => course.id === user.golf_course_id);
    }
  }, [allSerialHistory, user]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    const filtered = allSerialHistory.filter(entry => {
      let hasAccess = false;
      
      if (user.role === 'admin') {
        hasAccess = true;
      } else if (user.role === 'supervisor' && user.managed_golf_courses) {
        // หัวหน้าที่เลือกทั้งหมด (จำนวนสนามที่ดูแลเท่ากับจำนวนสนามทั้งหมด) จะดูได้ทั้งหมดเหมือน admin
        const totalGolfCourses = golfCourses.length;
        const managedCoursesCount = user.managed_golf_courses.length;
        
        if (managedCoursesCount === totalGolfCourses) {
          hasAccess = true; // ดูได้ทั้งหมดเหมือน admin
        } else {
          hasAccess = user.managed_golf_courses.includes(entry.golf_course_id);
        }
      } else {
        hasAccess = entry.golf_course_id === user.golf_course_id;
      }

      if (!hasAccess) return false;

      if (searchSerial && !entry.serial_number.toLowerCase().includes(searchSerial.toLowerCase())) {
        return false;
      }

      if (searchVehicleNumber && !entry.vehicle_number.toLowerCase().includes(searchVehicleNumber.toLowerCase())) {
        return false;
      }

      if (filterActionType && entry.action_type !== filterActionType) {
        return false;
      }

      if (filterGolfCourse && filterGolfCourse !== '' && entry.golf_course_id.toString() !== filterGolfCourse) {
        return false;
      }

      if (filterDateFrom) {
        const entryDate = new Date(entry.action_date);
        const fromDate = new Date(filterDateFrom);
        if (entryDate < fromDate) return false;
      }

      if (filterDateTo) {
        const entryDate = new Date(entry.action_date);
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (entryDate > toDate) return false;
      }

      if (!showInactive && !entry.is_active) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.action_date).getTime() - new Date(b.action_date).getTime();
          break;
        case 'serial':
          comparison = a.serial_number.localeCompare(b.serial_number);
          break;
        case 'action':
          comparison = a.action_type.localeCompare(b.action_type);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [allSerialHistory, user, searchSerial, searchVehicleNumber, filterActionType, filterGolfCourse, filterDateFrom, filterDateTo, showInactive, sortBy, sortOrder]);

  // Pagination logic
  const totalItems = filteredEntries.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchSerial, searchVehicleNumber, filterActionType, filterGolfCourse, filterDateFrom, filterDateTo, showInactive]);

  // Event handlers
  const handleViewJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setIsModalOpen(true);
    }
  };

  const handleViewDetails = (entry: SerialHistoryEntry) => {
    alert(`รายละเอียด: ${entry.details}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  const handleViewPartsHistory = () => {
    setView('parts_management');
  };

  const clearFilters = () => {
    setSearchSerial('');
    setSearchVehicleNumber('');
    setFilterActionType('');
    setFilterGolfCourse('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setShowInactive(true);
    setCurrentPage(1); // Reset pagination
  };

  // Calculate summary statistics
  const totalSerials = new Set(filteredEntries.map(e => e.serial_number)).size;
  const totalMaintenanceJobs = filteredEntries.filter(e => e.action_type === 'maintenance').length;
  const activeVehicles = filteredEntries.filter(e => e.is_active).length;

  return (
    <div className="serial-history-screen">
      {/* Header Section */}
      <div className="screen-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">📋</div>
            <div className="header-text">
              <h1>ประวัติ Serial รถกอล์ฟ</h1>
              <p>ติดตามประวัติการใช้งานและการซ่อมบำรุงของรถกอล์ฟแต่ละคัน</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              onClick={handleViewPartsHistory}
              className="btn-parts-history"
            >
              <span className="btn-icon">🔧</span>
              <span>ประวัติอะไหล่</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚗</div>
          <div className="stat-content">
            <div className="stat-value">{totalSerials}</div>
            <div className="stat-label">Serial ที่มีประวัติ</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <div className="stat-value">{totalMaintenanceJobs}</div>
            <div className="stat-label">งานซ่อมบำรุง</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{filteredEntries.length}</div>
            <div className="stat-label">รายการทั้งหมด</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">{activeVehicles}</div>
            <div className="stat-label">รถใช้งานอยู่</div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-header">
          <h3>🔍 ตัวกรองข้อมูล</h3>
          <button onClick={clearFilters} className="btn-clear">
            <span>🗑️</span> ล้างตัวกรอง
          </button>
        </div>
        
        <div className="filter-grid">
          <div className="filter-group">
            <label>🔍 ค้นหาซีเรียล:</label>
            <div className="search-input-container">
              <input
                type="text"
                value={searchSerial}
                onChange={(e) => setSearchSerial(e.target.value)}
                placeholder="ใส่หมายเลขซีเรียล..."
                className="filter-input"
                list="serial-list"
              />
              <datalist id="serial-list">
                {availableSerials.map(serial => (
                  <option key={serial} value={serial} />
                ))}
              </datalist>
            </div>
            <small className="filter-hint">มี {availableSerials.length} ซีเรียลในระบบ</small>
          </div>

          <div className="filter-group">
            <label>🚗 ค้นหาหมายเลขรถ:</label>
            <div className="search-input-container">
              <input
                type="text"
                value={searchVehicleNumber}
                onChange={(e) => setSearchVehicleNumber(e.target.value)}
                placeholder="ใส่หมายเลขรถ..."
                className="filter-input"
                list="vehicle-list"
              />
              <datalist id="vehicle-list">
                {availableVehicleNumbers.map(number => (
                  <option key={number} value={number} />
                ))}
              </datalist>
            </div>
            <small className="filter-hint">มี {availableVehicleNumbers.length} หมายเลขรถในระบบ</small>
          </div>

          <div className="filter-group">
            <label>⚙️ ประเภทการดำเนินการ:</label>
            <select
              value={filterActionType}
              onChange={(e) => setFilterActionType(e.target.value)}
              className="filter-select"
            >
              <option value="">ทั้งหมด ({actionTypes.length} ประเภท)</option>
              {actionTypes.map(type => (
                <option key={type} value={type}>
                  {getActionTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>🏌️ สนามกอล์ฟ:</label>
            <select
              value={filterGolfCourse}
              onChange={(e) => setFilterGolfCourse(e.target.value)}
              className="filter-select"
            >
              <option value="">ทั้งหมด ({availableGolfCoursesWithData.length} สนาม)</option>
              {availableGolfCoursesWithData.map(course => (
                <option key={course.id} value={course.id ? course.id.toString() : ''}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>📅 วันที่เริ่มต้น:</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>📅 วันที่สิ้นสุด:</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="filter-checkbox"
              />
              <span>🚫 แสดงรถปลดระวาง</span>
            </label>
          </div>
        </div>

        <div className="results-summary">
          <span className="results-count">
            📊 พบ <strong>{filteredEntries.length}</strong> รายการ จากทั้งหมด <strong>{allSerialHistory.length}</strong> รายการ
          </span>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-section">
        {filteredEntries.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📋</div>
            <h3>ไม่พบข้อมูล</h3>
            <p>ไม่พบประวัติที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>📅 วันที่/เวลา</th>
                  <th>🏷️ หมายเลขซีเรียล</th>
                  <th>🚗 หมายเลขรถ</th>
                  <th>🔋 ซีเรียลแบต</th>
                  <th>⚙️ ประเภท</th>
                  <th>📝 รายละเอียด</th>
                  <th>👤 ผู้รับผิดชอบ</th>
                  <th>🏌️ สนามกอล์ฟ</th>
                  <th>📊 สถานะ</th>
                  <th>🔧 การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntries.map((entry) => (
                  <tr key={entry.id} className={`table-row ${!entry.is_active ? 'inactive-row' : ''}`}>
                    <td className="date-col">
                      <div className="date-display">
                        <div className="system-date">
                          <span className="date-label">บันทึกในระบบ:</span>
                          <span className="date-value">{formatDate(entry.action_date)}</span>
                        </div>
                        {entry.actual_transfer_date && (
                          <div className="actual-date">
                            <span className="date-label">วันที่ย้ายจริง:</span>
                            <span className="date-value">{formatDate(entry.actual_transfer_date)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="serial-col">
                      <span className="serial-badge">{entry.serial_number}</span>
                    </td>
                    <td className="vehicle-col">
                      <span className="vehicle-badge">{entry.vehicle_number}</span>
                    </td>
                    <td className="battery-col">
                      <span className="battery-badge">
                        {entry.battery_serial || vehicles.find(v => v.id === entry.vehicle_id)?.battery_serial || '-'}
                      </span>
                    </td>
                    <td className="action-col">
                      <span className={`action-badge ${getActionTypeColorClass(entry.action_type)}`}>
                        {getActionTypeLabel(entry.action_type)}
                      </span>
                    </td>
                    <td className="details-col">
                      <div className="details-content">
                        <p className="details-text">{entry.details}</p>
                        {entry.parts_used && entry.parts_used.length > 0 && (
                          <div className="parts-info">
                            <span className="info-label">🔧 อะไหล่ที่ใช้:</span>
                            <div className="parts-list">
                              {entry.parts_used.map((part, index) => (
                                <span key={`part-${entry.id}-${index}-${part.replace(/[^a-zA-Z0-9]/g, '')}`} className="part-item">{part}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {entry.system && (
                          <div className="system-info">
                            <span className="info-label">⚙️ ระบบ:</span> 
                            <span className="system-name">{getSystemDisplayName(entry.system)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="performer-col">
                      <div className="performer-info">
                        <span className="performer-name">{entry.performed_by}</span>
                      </div>
                    </td>
                    <td className="course-col">
                      <span className="course-name">{entry.golf_course_name}</span>
                    </td>
                    <td className="status-col">
                      <div className="status-container">
                        <span className={`status-badge ${entry.is_active ? 'active' : 'inactive'}`}>
                          {entry.is_active ? '✅ ใช้งาน' : '❌ ปลดระวาง'}
                        </span>
                        {entry.status && (
                          <StatusBadge status={entry.status} />
                        )}
                      </div>
                    </td>
                    <td className="actions-col">
                      <div className="action-buttons">
                        {entry.related_job_id ? (
                          <button
                            onClick={() => handleViewJob(entry.related_job_id!)}
                            className="action-btn primary"
                          >
                            👁️ ดูงาน
                          </button>
                        ) : (
                          <button
                            onClick={() => handleViewDetails(entry)}
                            className="action-btn secondary"
                          >
                            📋 รายละเอียด
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {isModalOpen && selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          golfCourses={golfCourses}
          users={users}
          vehicles={vehicles}
          partsUsageLog={partsUsageLog}
          onClose={handleCloseModal}
        />
      )}

      <style jsx>{`
        .serial-history-screen {
          padding: 24px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .screen-header {
          background: white;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-icon {
          font-size: 3.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }

        .header-text h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #667eea 0%, #764BA2FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-text p {
          font-size: 1.1rem;
          color: #718096;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn-parts-history {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(72, 187, 120, 0.3);
        }

        .btn-parts-history:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(72, 187, 120, 0.4);
        }

        .btn-icon {
          font-size: 1.2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 28px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          font-size: 3rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1a202c;
          line-height: 1;
        }

        .stat-label {
          font-size: 1rem;
          color: #718096;
          margin-top: 4px;
          font-weight: 500;
        }

        .filter-section {
          background: white;
          border-radius: 20px;
          padding: 28px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }

        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f7fafc;
        }

        .filter-header h3 {
          font-size: 1.4rem;
          font-weight: 600;
          color: #1a202c;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-clear {
          background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(245, 101, 101, 0.3);
        }

        .btn-clear:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(245, 101, 101, 0.4);
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-group label {
          font-weight: 600;
          color: #4a5568;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .filter-input, .filter-select {
          padding: 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          background: white;
          font-family: inherit;
        }

        .filter-input:focus, .filter-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .checkbox-group {
          flex-direction: row;
          align-items: center;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-weight: 500;
        }

        .filter-checkbox {
          width: 20px;
          height: 20px;
          accent-color: #667eea;
        }

        .results-summary {
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .results-count {
          font-size: 1.1rem;
          color: #E7F0FFFF;
          font-weight: 600;
        }

        .table-section {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .table-container {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          background: linear-gradient(135deg, #667eea 0%, #667eea 100%);
          color: white;
          padding: 20px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 0.95rem;
          border-bottom: 2px solid #5a67d8;
          white-space: nowrap;
        }

        .table-row {
          transition: all 0.3s ease;
          border-bottom: 1px solid #e2e8f0;
        }

        .table-row:hover {
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          transform: scale(1.001);
        }

        .table-row.inactive-row {
          opacity: 0.6;
          background: linear-gradient(135deg, #fef5e7 0%, #fed7aa 100%);
        }

        .data-table td {
          padding: 20px 16px;
          vertical-align: top;
          border-bottom: 1px solid #e2e8f0;
        }

        .date-display {
          font-weight: 500;
          color: #4a5568;
        }

        .system-date, .actual-date {
          margin-bottom: 4px;
        }

        .date-label {
          font-size: 0.8rem;
          color: #718096;
          font-weight: 600;
          display: block;
        }

        .date-value {
          font-size: 0.9rem;
          color: #2d3748;
          font-weight: 500;
          display: block;
        }

        .actual-date {
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
          margin-top: 8px;
        }

        .actual-date .date-label {
          color: #e53e3e;
        }

        .actual-date .date-value {
          color: #c53030;
          font-weight: 600;
        }

        .serial-badge {
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
          box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
        }

        .vehicle-badge {
          background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
          box-shadow: 0 2px 8px rgba(237, 137, 54, 0.3);
        }

        .battery-badge {
          background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
          box-shadow: 0 2px 8px rgba(159, 122, 234, 0.3);
        }

        .action-badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.85rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .action-registration { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; }
        .action-transfer { background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white; }
        .action-maintenance { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; }
        .action-decommission { background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); color: white; }
        .action-inspection { background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%); color: white; }
        .action-status-change { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; }
        .action-data-edit { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .action-data-delete { background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); color: white; }
        .action-bulk-transfer { background: linear-gradient(135deg, #38b2ac 0%, #319795 100%); color: white; }
        .action-bulk-upload { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; }
        .action-default { background: linear-gradient(135deg, #a0aec0 0%, #718096 100%); color: white; }

        .details-content {
          max-width: 350px;
        }

        .details-text {
          margin: 0 0 8px 0;
          color: #2d3748;
          line-height: 1.5;
          font-weight: 500;
        }

        .parts-info, .system-info {
          margin: 6px 0;
          font-size: 0.9rem;
        }

        .info-label {
          font-weight: 600;
          color: #4a5568;
        }

        .parts-list, .system-name {
          color: #718096;
        }

        .parts-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }

        .part-item {
          background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
          color: #234e52;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid #81e6d9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .performer-name {
          font-weight: 600;
          color: #2d3748;
        }

        .course-name {
          color: #4a5568;
          font-weight: 500;
        }

        .status-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }

        .status-badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.85rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .status-badge.active {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
        }

        .status-badge.inactive {
          background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
          color: white;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 10px 16px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .action-btn.secondary {
          background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
          color: white;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .no-data {
          text-align: center;
          padding: 80px 20px;
          color: #718096;
        }

        .no-data-icon {
          font-size: 5rem;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .no-data h3 {
          font-size: 1.8rem;
          margin: 0 0 12px 0;
          color: #4a5568;
          font-weight: 600;
        }

        .no-data p {
          margin: 0;
          font-size: 1.1rem;
        }

        @media (max-width: 768px) {
          .serial-history-screen {
            padding: 16px;
          }

          .screen-header {
            padding: 24px;
          }

          .header-content {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }

          .header-left {
            flex-direction: column;
            text-align: center;
          }

          .header-text h1 {
            font-size: 2rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .filter-grid {
            grid-template-columns: 1fr;
          }

          .data-table {
            font-size: 0.85rem;
          }

          .data-table th,
          .data-table td {
            padding: 12px 8px;
          }

          .details-content {
            max-width: 250px;
          }
        }
      `}</style>
    </div>
  );
};

export default SerialHistoryScreen;