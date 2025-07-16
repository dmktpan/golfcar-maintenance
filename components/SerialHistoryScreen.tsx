'use client';

import React, { useState, useMemo } from 'react';
import { User, Job, SerialHistoryEntry, MOCK_SERIAL_HISTORY, MOCK_GOLF_COURSES, MOCK_JOBS, View } from '@/lib/data';
import StatusBadge from './StatusBadge';
import JobDetailsModal from './JobDetailsModal';

interface SerialHistoryScreenProps {
  user: User;
  setView: (view: View) => void;
}

const SerialHistoryScreen = ({ user, setView }: SerialHistoryScreenProps) => {
  // Search and filter states
  const [searchSerial, setSearchSerial] = useState('');
  const [filterActionType, setFilterActionType] = useState('');
  const [filterGolfCourse, setFilterGolfCourse] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showInactive, setShowInactive] = useState(true);
  
  // Sort states
  const [sortBy, setSortBy] = useState<'date' | 'serial' | 'action'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get unique action types for filter
  const actionTypes = useMemo(() => {
    return Array.from(new Set(MOCK_SERIAL_HISTORY.map(entry => entry.action_type)));
  }, []);

  // Get available golf courses based on user role and managed courses
  const availableGolfCourses = useMemo(() => {
    if (user.role === 'admin') {
      return MOCK_GOLF_COURSES; // Admin เห็นทุกสนาม
    } else if (user.role === 'supervisor' && user.managed_golf_courses) {
      return MOCK_GOLF_COURSES.filter(course => 
        user.managed_golf_courses!.includes(course.id)
      );
    } else {
      // Staff เห็นเฉพาะสนามของตน
      return MOCK_GOLF_COURSES.filter(course => course.id === user.golf_course_id);
    }
  }, [user]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let filtered = MOCK_SERIAL_HISTORY.filter(entry => {
      // ระบบ filter ใหม่ตาม managed_golf_courses
      let hasAccess = false;
      
      if (user.role === 'admin') {
        hasAccess = true; // Admin เห็นทุกอย่าง
      } else if (user.role === 'supervisor' && user.managed_golf_courses) {
        hasAccess = user.managed_golf_courses.includes(entry.golf_course_id);
      } else {
        hasAccess = entry.golf_course_id === user.golf_course_id; // Staff เห็นเฉพาะสนามของตน
      }

      if (!hasAccess) {
        return false;
      }

      // Search by serial number
      if (searchSerial && !entry.serial_number.toLowerCase().includes(searchSerial.toLowerCase())) {
        return false;
      }

      // Filter by action type
      if (filterActionType && entry.action_type !== filterActionType) {
        return false;
      }

      // Filter by golf course
      if (filterGolfCourse && entry.golf_course_id.toString() !== filterGolfCourse) {
        return false;
      }

      // Filter by date range
      if (filterDateFrom) {
        const entryDate = new Date(entry.action_date);
        const fromDate = new Date(filterDateFrom);
        if (entryDate < fromDate) {
          return false;
        }
      }

      if (filterDateTo) {
        const entryDate = new Date(entry.action_date);
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (entryDate > toDate) {
          return false;
        }
      }

      // Filter by active status
      if (!showInactive && !entry.is_active) {
        return false;
      }

      return true;
    });

    // Sort entries
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

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [searchSerial, filterActionType, filterGolfCourse, filterDateFrom, filterDateTo, showInactive, sortBy, sortOrder, user]);

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      case 'registration': return 'bg-green-100 text-green-800';
      case 'transfer': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'decommission': return 'bg-red-100 text-red-800';
      case 'inspection': return 'bg-purple-100 text-purple-800';
      case 'status_change': return 'bg-orange-100 text-orange-800';
      case 'data_edit': return 'bg-indigo-100 text-indigo-800';
      case 'data_delete': return 'bg-red-100 text-red-800';
      case 'bulk_transfer': return 'bg-cyan-100 text-cyan-800';
      case 'bulk_upload': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewJob = (jobId: number) => {
    const job = MOCK_JOBS.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setIsModalOpen(true);
    }
  };

  const handleViewDetails = (entry: SerialHistoryEntry) => {
    let detailsText = `รายละเอียด: ${entry.details}\n\n`;
    detailsText += `ประเภท: ${getActionTypeLabel(entry.action_type)}\n`;
    detailsText += `ผู้ดำเนินการ: ${entry.performed_by}\n`;
    detailsText += `วันที่: ${formatDate(entry.action_date)}\n`;
    
    if (entry.affected_fields && entry.affected_fields.length > 0) {
      detailsText += `ฟิลด์ที่เปลี่ยนแปลง: ${entry.affected_fields.join(', ')}\n`;
    }
    
    if (entry.previous_data && entry.new_data) {
      detailsText += `\nข้อมูลก่อนเปลี่ยนแปลง:\n`;
      detailsText += JSON.stringify(entry.previous_data, null, 2);
      detailsText += `\n\nข้อมูลหลังเปลี่ยนแปลง:\n`;
      detailsText += JSON.stringify(entry.new_data, null, 2);
    }
    
    if (entry.parts_used && entry.parts_used.length > 0) {
      detailsText += `\nอะไหล่ที่ใช้: ${entry.parts_used.join(', ')}`;
    }
    
    alert(detailsText);
  };

  const handleCloseModal = () => {
    setSelectedJob(null);
    setIsModalOpen(false);
  };

  const clearFilters = () => {
    setSearchSerial('');
    setFilterActionType('');
    setFilterGolfCourse('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setShowInactive(true);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="serial-history-container">
      {/* Header */}
      <div className="serial-header">
        <h1 className="serial-title">ประวัติซีเรียล (Serial History Log)</h1>
        <div className="header-actions">
          <button onClick={handlePrintReport} className="btn-print">
            พิมพ์รายงาน
          </button>
          <button onClick={() => setView('dashboard')} className="btn-back">
            กลับ
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{Array.from(new Set(MOCK_SERIAL_HISTORY.map(e => e.serial_number))).length}</div>
          <div className="stat-label">รถทั้งหมด</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{MOCK_SERIAL_HISTORY.filter(e => e.action_type === 'maintenance').length}</div>
          <div className="stat-label">งานซ่อมบำรุง</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{Array.from(new Set(MOCK_SERIAL_HISTORY.filter(e => e.is_active).map(e => e.serial_number))).length}</div>
          <div className="stat-label">รถใช้งาน</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{Array.from(new Set(MOCK_SERIAL_HISTORY.filter(e => !e.is_active).map(e => e.serial_number))).length}</div>
          <div className="stat-label">รถปลดระวาง</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>ค้นหาซีเรียล:</label>
            <input
              type="text"
              value={searchSerial}
              onChange={(e) => setSearchSerial(e.target.value)}
              placeholder="ใส่หมายเลขซีเรียล..."
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>ประเภทการดำเนินการ:</label>
            <select
              value={filterActionType}
              onChange={(e) => setFilterActionType(e.target.value)}
              className="filter-select"
            >
              <option value="">ทั้งหมด</option>
              {actionTypes.map(type => (
                <option key={type} value={type}>
                  {getActionTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>สนามกอล์ฟ:</label>
            <select
              value={filterGolfCourse}
              onChange={(e) => setFilterGolfCourse(e.target.value)}
              className="filter-select"
            >
              <option value="">ทั้งหมด</option>
              {availableGolfCourses.map(course => (
                <option key={course.id} value={course.id.toString()}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>วันที่เริ่มต้น:</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>วันที่สิ้นสุด:</label>
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
              แสดงรถปลดระวาง
            </label>
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={clearFilters} className="btn-clear">
            ล้างตัวกรอง
          </button>
          <span className="results-count">
            พบ {filteredEntries.length} รายการ จากทั้งหมด {MOCK_SERIAL_HISTORY.length} รายการ
          </span>
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        พบ <strong>{filteredEntries.length}</strong> รายการ จากทั้งหมด <strong>{MOCK_SERIAL_HISTORY.length}</strong> รายการ
      </div>

      {/* Table */}
      <div className="table-container">
        {filteredEntries.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📋</div>
            <h3>ไม่พบข้อมูล</h3>
            <p>ไม่พบประวัติที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>วันที่/เวลา</th>
                <th>หมายเลขซีเรียล</th>
                <th>หมายเลขรถ</th>
                <th>ประเภท</th>
                <th>รายละเอียด</th>
                <th>ผู้ดำเนินการ</th>
                <th>สนามกอล์ฟ</th>
                <th>สถานะ</th>
                <th>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className={!entry.is_active ? 'inactive-row' : ''}>
                  <td className="date-col">
                    {formatDate(entry.action_date)}
                  </td>
                  <td className="serial-col">
                    <span className="serial-badge">{entry.serial_number}</span>
                  </td>
                  <td className="vehicle-col">
                    <span className="vehicle-badge">{entry.vehicle_number}</span>
                  </td>
                  <td className="action-col">
                    <span 
                      className={`action-badge ${getActionTypeColorClass(entry.action_type)}`}
                    >
                      {getActionTypeLabel(entry.action_type)}
                    </span>
                  </td>
                  <td className="details-col">
                    <div className="details-content">
                      <p>{entry.details}</p>
                      {entry.parts_used && entry.parts_used.length > 0 && (
                        <div className="parts-info">
                          <strong>อะไหล่:</strong> {entry.parts_used.join(', ')}
                        </div>
                      )}
                      {entry.system && (
                        <div className="system-info">
                          <strong>ระบบ:</strong> {entry.system}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="performer-col">
                    {entry.performed_by}
                  </td>
                  <td className="course-col">
                    {entry.golf_course_name}
                  </td>
                  <td className="status-col">
                    <div className="status-container">
                      <span className={`status-badge ${entry.is_active ? 'active' : 'inactive'}`}>
                        {entry.is_active ? 'ใช้งาน' : 'ปลดระวาง'}
                      </span>
                      {entry.status && (
                        <StatusBadge status={entry.status} />
                      )}
                    </div>
                  </td>
                  <td className="actions-col">
                    {entry.related_job_id ? (
                      <button
                        onClick={() => handleViewJob(entry.related_job_id!)}
                        className="action-btn primary"
                      >
                        ดูงาน
                      </button>
                    ) : (
                      <button
                        onClick={() => handleViewDetails(entry)}
                        className="action-btn secondary"
                      >
                        รายละเอียด
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default SerialHistoryScreen;