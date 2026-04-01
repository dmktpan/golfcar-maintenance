'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { User, Job, SerialHistoryEntry, View, Vehicle, GolfCourse } from '@/lib/data';
import { serialHistoryApi, SerialHistoryFilters } from '@/lib/api';
import StatusBadge from './StatusBadge';
import JobDetailsModal from './JobDetailsModal';
import { TableVirtuoso } from 'react-virtuoso';

interface SerialHistoryScreenProps {
  user: User;
  setView: (view: View) => void;
  jobs: Job[];
  vehicles: Vehicle[];
  serialHistory: SerialHistoryEntry[];
  golfCourses: GolfCourse[];
  users: User[];
  partsUsageLog?: any[];
}

interface PaginationState {
  data: SerialHistoryEntry[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number | null;
  isLoading: boolean;
  isLoadingMore: boolean;
}

const SerialHistoryScreen = ({ user, setView, jobs, vehicles, serialHistory: _serialHistory, golfCourses, users, partsUsageLog = [] }: SerialHistoryScreenProps) => {
  // === Filter States ===
  const [searchSerial, setSearchSerial] = useState('');
  const [searchVehicleNumber, setSearchVehicleNumber] = useState('');
  const [filterActionType, setFilterActionType] = useState('');
  const [filterGolfCourse, setFilterGolfCourse] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showInactive, setShowInactive] = useState(true);

  // === Pagination State ===
  const [pagination, setPagination] = useState<PaginationState>({
    data: [], nextCursor: null, hasMore: true, totalCount: null, isLoading: true, isLoadingMore: false,
  });

  // === Modal States ===
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBatterySerial, setSelectedBatterySerial] = useState<string | null>(null);
  const [isBatteryModalOpen, setIsBatteryModalOpen] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // === Helpers ===
  const formatDate = (dateInput: string | Date | undefined | null) => {
    try {
      if (!dateInput) return 'ไม่ระบุวันที่';
      let date: Date;
      if (dateInput instanceof Date) date = dateInput;
      else if (typeof dateInput === 'string') {
        if (dateInput.trim() === '') return 'ไม่ระบุวันที่';
        date = /^\d+$/.test(dateInput) ? new Date(parseInt(dateInput)) : new Date(dateInput);
      } else return 'รูปแบบวันที่ไม่รู้จัก';
      if (isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';
      return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
    } catch { return 'ข้อผิดพลาดในการแสดงวันที่'; }
  };

  const getSystemDisplayName = (system: string) => {
    const names: Record<string, string> = { 'brake': 'เบรก', 'steering': 'พวงมาลัย', 'motor': 'มอเตอร์', 'electric': 'ไฟฟ้า', 'general': 'ทั่วไป', 'suspension': 'ช่วงล่าง' };
    return names[system] || system;
  };

  const getStatusLabel = (status: string): string => {
    const m: Record<string, string> = { 'active': 'ใช้งาน', 'ready': 'พร้อมใช้', 'maintenance': 'รอซ่อม', 'retired': 'เสื่อมแล้ว', 'parked': 'จอดไว้', 'spare': 'อะไหล่', 'inactive': 'ไม่ใช้งาน' };
    return m[status] || status;
  };

  const translateDetailsToThai = (details: string): string => {
    let t = details;
    t = t.replace(/สถานะ:\s*(\w+)\s*→\s*(\w+)/g, (_m, o, n) => `สถานะ: ${getStatusLabel(o)} → ${getStatusLabel(n)}`);
    ['active', 'ready', 'maintenance', 'retired', 'parked', 'spare', 'inactive'].forEach(s => { t = t.replace(new RegExp(`\\b${s}\\b`, 'gi'), getStatusLabel(s)); });
    return t;
  };

  const getActionTypeLabel = (actionType: string): string => {
    const m: Record<string, string> = { 'registration': 'ลงทะเบียน', 'transfer': 'โอนย้าย', 'maintenance': 'ซ่อมบำรุง', 'decommission': 'ปลดระวาง', 'inspection': 'ตรวจสอบ', 'status_change': 'เปลี่ยนสถานะ', 'data_edit': 'แก้ไขข้อมูล', 'data_delete': 'ลบข้อมูล', 'bulk_transfer': 'โอนย้ายหลายคัน', 'bulk_upload': 'อัปโหลดหลายคัน' };
    return m[actionType] || actionType;
  };

  const getActionTypeStyle = (actionType: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      'registration': { bg: '#dcfce7', color: '#166534' }, 'transfer': { bg: '#dbeafe', color: '#1e40af' },
      'maintenance': { bg: '#fef3c7', color: '#92400e' }, 'decommission': { bg: '#fee2e2', color: '#991b1b' },
      'inspection': { bg: '#ede9fe', color: '#5b21b6' }, 'status_change': { bg: '#ffedd5', color: '#9a3412' },
      'data_edit': { bg: '#e0e7ff', color: '#3730a3' }, 'data_delete': { bg: '#fce7f3', color: '#9d174d' },
      'bulk_transfer': { bg: '#ccfbf1', color: '#134e4a' }, 'bulk_upload': { bg: '#d1fae5', color: '#065f46' },
    };
    return styles[actionType] || { bg: '#f1f5f9', color: '#475569' };
  };

  const safeGetPerformedBy = (userName: any): string => {
    if (userName === null || userName === undefined) return 'ไม่ระบุ';
    if (typeof userName === 'string') return userName.trim() || 'ไม่ระบุ';
    if (typeof userName === 'object') {
      for (const name of [userName.name, userName.username, userName.displayName, userName.fullName, userName.user_name]) {
        if (typeof name === 'string' && name.trim()) return name.trim();
      }
    }
    return String(userName);
  };

  // === Data Fetching (API only — no local job merge) ===
  const buildFilters = useCallback((): SerialHistoryFilters => {
    const f: SerialHistoryFilters = { limit: 100 };
    if (searchSerial) f.search = searchSerial;
    if (searchVehicleNumber) f.vehicleNumber = searchVehicleNumber;
    if (filterActionType) f.actionType = filterActionType;
    if (filterGolfCourse) f.golfCourseId = filterGolfCourse;
    if (filterDateFrom) f.dateFrom = filterDateFrom;
    if (filterDateTo) f.dateTo = filterDateTo;
    if (!showInactive) f.showInactive = false;
    return f;
  }, [searchSerial, searchVehicleNumber, filterActionType, filterGolfCourse, filterDateFrom, filterDateTo, showInactive]);

  const fetchData = useCallback(async (isLoadMore = false, cursorOverride?: string | null) => {
    try {
      setPagination(prev => isLoadMore ? { ...prev, isLoadingMore: true } : { ...prev, isLoading: true });
      const filters = buildFilters();
      if (isLoadMore && cursorOverride) filters.cursor = cursorOverride;
      const result = await serialHistoryApi.getPage(filters);
      if (result.success) {
        const newData = (result.data || []) as SerialHistoryEntry[];
        const pi = (result as any).pagination || {};
        setPagination(prev => ({
          data: isLoadMore ? [...prev.data, ...newData] : newData,
          nextCursor: pi.nextCursor || null, hasMore: pi.hasMore ?? false,
          totalCount: pi.totalCount ?? prev.totalCount, isLoading: false, isLoadingMore: false,
        }));
      } else {
        setPagination(prev => ({ ...prev, isLoading: false, isLoadingMore: false }));
      }
    } catch (error) {
      console.error('Error fetching serial history:', error);
      setPagination(prev => ({ ...prev, isLoading: false, isLoadingMore: false }));
    }
  }, [buildFilters]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(false); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetchData(false); }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchSerial, searchVehicleNumber, filterActionType, filterGolfCourse, filterDateFrom, filterDateTo, showInactive]);

  // === ใช้ข้อมูลจาก API เท่านั้น (ไม่ merge job ในเครื่อง) ===
  const allEntries = pagination.data;

  const handleEndReached = useCallback(() => {
    if (pagination.hasMore && !pagination.isLoadingMore && pagination.nextCursor) {
      fetchData(true, pagination.nextCursor);
    }
  }, [pagination.hasMore, pagination.isLoadingMore, pagination.nextCursor, fetchData]);

  const availableGolfCourses = useMemo(() => {
    if (user.role === 'admin') return golfCourses;
    if (user.role === 'supervisor' && user.managed_golf_courses) {
      if (user.managed_golf_courses.length === golfCourses.length) return golfCourses;
      return golfCourses.filter(gc => user.managed_golf_courses!.includes(gc.id));
    }
    return golfCourses.filter(gc => gc.id === user.golf_course_id);
  }, [golfCourses, user]);

  const actionTypes = ['registration', 'transfer', 'maintenance', 'decommission', 'inspection', 'status_change', 'data_edit', 'data_delete', 'bulk_transfer', 'bulk_upload'];

  const totalSerials = useMemo(() => new Set(allEntries.map(e => e.serial_number)).size, [allEntries]);
  const totalMaintenanceJobs = useMemo(() => allEntries.filter(e => e.action_type === 'maintenance').length, [allEntries]);

  // === Event Handlers ===
  const handleViewJob = (jobId: string) => { const job = jobs.find(j => j.id === jobId); if (job) { setSelectedJob(job); setIsModalOpen(true); } };
  const handleViewDetails = (entry: SerialHistoryEntry) => { alert(`รายละเอียด: ${translateDetailsToThai(entry.details)}`); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedJob(null); };
  const handleViewPartsHistory = () => { setView('parts_management'); };
  const clearFilters = () => { setSearchSerial(''); setSearchVehicleNumber(''); setFilterActionType(''); setFilterGolfCourse(''); setFilterDateFrom(''); setFilterDateTo(''); setShowInactive(true); };
  const handleViewBatterySerial = (serial: string) => { setSelectedBatterySerial(serial); setIsBatteryModalOpen(true); };
  const handleCloseBatteryModal = () => { setIsBatteryModalOpen(false); setSelectedBatterySerial(null); };

  return (
    <div className="serial-history-screen">
      {/* Header */}
      <div className="page-header-card">
        <div className="header-row">
          <div className="header-title-area">
            <div className="header-icon-box">📋</div>
            <div>
              <h1 className="page-title">ประวัติ Serial รถกอล์ฟ</h1>
              <p className="page-subtitle">ติดตามประวัติการใช้งานและการซ่อมบำรุงของรถกอล์ฟแต่ละคัน</p>
            </div>
          </div>
          <div className="header-buttons">
            <button onClick={() => fetchData(false)} className="btn-action btn-refresh">🔄 รีเฟรช</button>
            <button onClick={handleViewPartsHistory} className="btn-action btn-green">🔧 ประวัติอะไหล่</button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        {[
          { icon: '🚗', value: totalSerials, label: 'Serial ที่มีประวัติ', accent: '#4299e1' },
          { icon: '🔧', value: totalMaintenanceJobs, label: 'งานซ่อมบำรุง', accent: '#ed8936' },
          { icon: '📊', value: allEntries.length, label: 'รายการที่แสดง', accent: '#9f7aea' },
          { icon: '#', value: pagination.totalCount?.toLocaleString() ?? '...', label: 'รายการในฐานข้อมูล', accent: '#48bb78' },
        ].map((s, i) => (
          <div key={i} className="stat-box" style={{ borderTop: `3px solid ${s.accent}` }}>
            <span className="stat-icon-txt">{s.icon}</span>
            <div>
              <div className="stat-number">{s.value}</div>
              <div className="stat-desc">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-card">
        <div className="filter-top-row">
          <span className="filter-title">🔍 ตัวกรองข้อมูล</span>
          <button onClick={clearFilters} className="btn-clear-filter">✕ ล้างตัวกรอง</button>
        </div>
        <div className="filter-grid">
          <div className="fg">
            <label>ค้นหาซีเรียล</label>
            <input type="text" value={searchSerial} onChange={(e) => setSearchSerial(e.target.value)} placeholder="ใส่ซีเรียล..." />
          </div>
          <div className="fg">
            <label>ค้นหาเลขรถ</label>
            <input type="text" value={searchVehicleNumber} onChange={(e) => setSearchVehicleNumber(e.target.value)} placeholder="ใส่เลขรถ..." />
          </div>
          <div className="fg">
            <label>ประเภทการดำเนินการ</label>
            <select value={filterActionType} onChange={(e) => setFilterActionType(e.target.value)}>
              <option value="">ทั้งหมด</option>
              {actionTypes.map(t => (<option key={t} value={t}>{getActionTypeLabel(t)}</option>))}
            </select>
          </div>
          <div className="fg">
            <label>สนามกอล์ฟ</label>
            <select value={filterGolfCourse} onChange={(e) => setFilterGolfCourse(e.target.value)}>
              <option value="">ทั้งหมด ({availableGolfCourses.length} สนาม)</option>
              {availableGolfCourses.map(c => (<option key={c.id} value={String(c.id)}>{c.name}</option>))}
            </select>
          </div>
          <div className="fg">
            <label>ตั้งแต่วันที่</label>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
          </div>
          <div className="fg">
            <label>ถึงวันที่</label>
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
          </div>
          <div className="fg checkbox-fg">
            <label className="cb-label">
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
              <span>แสดงรถปลดระวาง</span>
            </label>
          </div>
        </div>
        <div className="result-bar">
          พบ <strong>{allEntries.length}</strong> รายการ
          {pagination.totalCount !== null && <> จากทั้งหมด <strong>{pagination.totalCount.toLocaleString()}</strong> รายการ</>}
          {pagination.hasMore && <span className="more-hint"> (เลื่อนลงเพื่อโหลดเพิ่ม)</span>}
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        {pagination.isLoading ? (
          <div className="empty-state"><div className="spinner"></div><p>กำลังโหลดข้อมูล...</p></div>
        ) : allEntries.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><h3>ไม่พบข้อมูล</h3><p>ไม่พบประวัติที่ตรงกับเงื่อนไขการค้นหา</p></div>
        ) : (
          <TableVirtuoso
            style={{ height: 'calc(100vh - 300px)', minHeight: '700px' }}
            data={allEntries}
            endReached={handleEndReached}
            overscan={200}
            fixedHeaderContent={() => (
              <tr className="table-header-row">
                <th className="th-date">วันที่/เวลา</th>
                <th className="th-serial">ซีเรียล</th>
                <th className="th-vehicle">เลขรถ</th>
                <th className="th-battery">แบต</th>
                <th className="th-type">ประเภท</th>
                <th className="th-details">รายละเอียด</th>
                <th className="th-performer">ผู้ดำเนินการ</th>
                <th className="th-course">สนาม</th>
                <th className="th-status">สถานะ</th>
                <th className="th-action">จัดการ</th>
              </tr>
            )}
            itemContent={(_index, entry) => {
              const batterySerial = String(entry.battery_serial || vehicles.find(v => v.id === entry.vehicle_id)?.battery_serial || '');
              const actionStyle = getActionTypeStyle(entry.action_type);
              return (
                <>
                  <td data-label="วันที่" className="td-date">
                    <span className="cell-date">{formatDate(entry.action_date)}</span>
                    {entry.actual_transfer_date && (
                      <div className="sub-date">ย้ายจริง: {formatDate(entry.actual_transfer_date)}</div>
                    )}
                  </td>
                  <td data-label="ซีเรียล" className="td-serial">
                    <span className="badge-serial">{String(entry.serial_number || '-')}</span>
                  </td>
                  <td data-label="เลขรถ" className="td-vehicle">
                    <span className="badge-vehicle">{String(entry.vehicle_number || '-')}</span>
                  </td>
                  <td data-label="แบต" className="td-battery">
                    {batterySerial && batterySerial !== '-' && batterySerial !== '' ? (
                      <button onClick={() => handleViewBatterySerial(batterySerial)} className="btn-battery" title={batterySerial}>🔋 ดู</button>
                    ) : (<span className="text-muted">-</span>)}
                  </td>
                  <td data-label="ประเภท" className="td-type">
                    <span className="badge-action" style={{ background: actionStyle.bg, color: actionStyle.color }}>{getActionTypeLabel(entry.action_type)}</span>
                  </td>
                  <td data-label="รายละเอียด" className="td-details">
                    <div className="cell-details">
                      <p className="detail-text">{translateDetailsToThai(String(entry.details || ''))}</p>
                      {entry.parts_used && entry.parts_used.length > 0 && (
                        <div className="detail-parts">
                          {entry.parts_used.slice(0, 2).map((p, i) => (
                            <span key={`p-${entry.id}-${i}`} className="part-tag">{String(p)}</span>
                          ))}
                          {entry.parts_used.length > 2 && <span className="part-more">+{entry.parts_used.length - 2}</span>}
                        </div>
                      )}
                      {entry.system && <span className="detail-system">⚙️ {getSystemDisplayName(String(entry.system))}</span>}
                    </div>
                  </td>
                  <td data-label="ผู้ดำเนินการ" className="td-performer">
                    <span className="cell-text">{safeGetPerformedBy(entry.performed_by)}</span>
                  </td>
                  <td data-label="สนาม" className="td-course">
                    <span className="cell-text-muted">{String(entry.golf_course_name || 'ไม่ระบุ')}</span>
                  </td>
                  <td data-label="สถานะ" className="td-status">
                    <div className="status-stack">
                      <span className={`is-active-tag ${entry.is_active ? 'active' : 'inactive'}`}>
                        {entry.is_active ? 'ใช้งาน' : 'ปลดระวาง'}
                      </span>
                      {entry.status && <StatusBadge status={entry.status} />}
                    </div>
                  </td>
                  <td data-label="จัดการ" className="td-action">
                    {entry.related_job_id ? (
                      <button onClick={() => handleViewJob(entry.related_job_id!)} className="btn-view-job">ดูงาน</button>
                    ) : (
                      <button onClick={() => handleViewDetails(entry)} className="btn-view-detail">ดู</button>
                    )}
                  </td>
                </>
              );
            }}
          />
        )}
        {pagination.isLoadingMore && (
          <div className="loading-bar"><div className="spinner-sm"></div> กำลังโหลดเพิ่ม...</div>
        )}
        {!pagination.hasMore && allEntries.length > 0 && !pagination.isLoadingMore && (
          <div className="end-bar">— แสดงข้อมูลทั้งหมด {allEntries.length.toLocaleString()} รายการ —</div>
        )}
      </div>

      {/* Modals */}
      {isModalOpen && selectedJob && (
        <JobDetailsModal job={selectedJob} golfCourses={golfCourses} users={users} vehicles={vehicles} partsUsageLog={partsUsageLog} onClose={handleCloseModal} />
      )}

      {isBatteryModalOpen && selectedBatterySerial && (
        <div className="modal-overlay" onClick={handleCloseBatteryModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>🔋 ซีเรียลแบตเตอรี่</h3>
              <button className="modal-close" onClick={handleCloseBatteryModal}>&times;</button>
            </div>
            <div className="battery-display">{selectedBatterySerial}</div>
          </div>
        </div>
      )}

      <style jsx>{`
        .serial-history-screen {
          padding: 24px;
          background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
          min-height: 100vh;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        /* === Header === */
        .page-header-card {
          background: white;
          border-radius: 16px;
          padding: 28px 32px;
          margin-bottom: 20px;
          box-shadow: 0 1px 8px rgba(0,0,0,0.06);
          border: 1px solid #e2e8f0;
        }
        .header-row { display: flex; justify-content: space-between; align-items: center; }
        .header-title-area { display: flex; align-items: center; gap: 16px; }
        .header-icon-box {
          font-size: 2.5rem;
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
        }
        .page-title {
          font-size: 1.8rem; font-weight: 700; margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .page-subtitle { margin: 4px 0 0; font-size: 0.95rem; color: #718096; }
        .header-buttons { display: flex; gap: 10px; }
        .btn-action {
          border: none; padding: 12px 20px; border-radius: 10px; font-weight: 600;
          font-size: 0.95rem; cursor: pointer; transition: all 0.2s;
        }
        .btn-action:hover { transform: translateY(-1px); }
        .btn-refresh { background: #667eea; color: white; }
        .btn-green { background: #48bb78; color: white; }

        /* === Stats === */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        .stat-box {
          background: white; border-radius: 12px; padding: 20px 24px;
          display: flex; align-items: center; gap: 16px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;
        }
        .stat-icon-txt { font-size: 2rem; }
        .stat-number { font-size: 2rem; font-weight: 700; color: #1a202c; line-height: 1; }
        .stat-desc { font-size: 0.85rem; color: #718096; margin-top: 2px; }

        /* === Filters === */
        .filter-card {
          background: white; border-radius: 16px; padding: 24px 28px; margin-bottom: 20px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;
        }
        .filter-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid #f1f5f9; }
        .filter-title { font-size: 1.1rem; font-weight: 600; color: #1a202c; }
        .btn-clear-filter {
          background: none; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px;
          font-size: 0.85rem; cursor: pointer; color: #64748b; font-weight: 600; transition: all 0.2s;
        }
        .btn-clear-filter:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
        .filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px; }
        .fg { display: flex; flex-direction: column; gap: 6px; }
        .fg label { font-weight: 600; color: #4a5568; font-size: 0.85rem; }
        .fg input, .fg select {
          padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;
          transition: all 0.2s; background: white; font-family: inherit;
        }
        .fg input:focus, .fg select:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }
        .checkbox-fg { flex-direction: row; align-items: flex-end; }
        .cb-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500; color: #4a5568; }
        .result-bar {
          text-align: center; padding: 14px; background: #f7fafc; border-radius: 8px;
          font-size: 0.95rem; color: #4a5568; border: 1px solid #e2e8f0;
        }
        .more-hint { color: #667eea; font-weight: 500; }

        /* === Table Card === */
        .table-card {
          background: white; border-radius: 16px; overflow: hidden;
          box-shadow: 0 1px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;
        }

        /* Table Base */
        .table-card :global(table) { width: 100%; border-collapse: collapse; }

        /* Column Widths — proportional distribution */
        .table-card :global(.th-date),
        .table-card :global(.td-date) { width: 11%; min-width: 120px; }
        .table-card :global(.th-serial),
        .table-card :global(.td-serial) { width: 10%; min-width: 110px; }
        .table-card :global(.th-vehicle),
        .table-card :global(.td-vehicle) { width: 6%; min-width: 60px; text-align: center; }
        .table-card :global(.th-battery),
        .table-card :global(.td-battery) { width: 5%; min-width: 55px; text-align: center; }
        .table-card :global(.th-type),
        .table-card :global(.td-type) { width: 8%; min-width: 90px; }
        .table-card :global(.th-details),
        .table-card :global(.td-details) { width: 26%; }
        .table-card :global(.th-performer),
        .table-card :global(.td-performer) { width: 10%; min-width: 90px; }
        .table-card :global(.th-course),
        .table-card :global(.td-course) { width: 9%; min-width: 80px; }
        .table-card :global(.th-status),
        .table-card :global(.td-status) { width: 9%; min-width: 80px; }
        .table-card :global(.th-action),
        .table-card :global(.td-action) { width: 6%; min-width: 60px; text-align: center; }

        /* Table Header */
        .table-card :global(thead tr),
        .table-card :global(.table-header-row) {
          background: linear-gradient(135deg, #667eea 0%, #5a67d8 100%);
        }
        .table-card :global(th) {
          color: white; padding: 14px 10px; text-align: left; font-weight: 600;
          font-size: 0.8rem; white-space: nowrap; border-bottom: 2px solid #4c51bf;
          letter-spacing: 0.02em;
        }

        /* Table Rows */
        .table-card :global(td) {
          padding: 10px 10px; vertical-align: middle; border-bottom: 1px solid #edf2f7;
          font-size: 0.84rem; color: #2d3748;
        }
        .table-card :global(tr:nth-child(even) td) { background: #fafbfc; }
        .table-card :global(tr:hover td) { background: #edf2f7; }

        /* Cell Styles */
        .cell-date { font-size: 0.8rem; color: #4a5568; font-weight: 500; display: block; line-height: 1.35; }
        .sub-date { font-size: 0.72rem; color: #e53e3e; margin-top: 3px; font-weight: 500; }

        .badge-serial {
          display: inline-block;
          background: #ebf4ff; color: #2b6cb0; padding: 3px 8px; border-radius: 5px;
          font-weight: 600; font-size: 0.78rem; border: 1px solid #bee3f8;
          word-break: break-all; line-height: 1.3;
        }
        .badge-vehicle {
          display: inline-flex; align-items: center; justify-content: center;
          background: #feebc8; color: #c05621; padding: 3px 8px; border-radius: 5px;
          font-weight: 700; font-size: 0.8rem; border: 1px solid #fbd38d; min-width: 32px;
        }

        .btn-battery {
          background: #faf5ff; border: 1px solid #d6bcfa; color: #6b46c1;
          padding: 3px 8px; border-radius: 5px; font-weight: 600; font-size: 0.75rem;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .btn-battery:hover { background: #e9d8fd; }

        .badge-action {
          display: inline-block; padding: 3px 10px; border-radius: 5px;
          font-weight: 600; font-size: 0.76rem; white-space: nowrap;
        }

        .cell-details { }
        .detail-text { margin: 0; line-height: 1.4; color: #2d3748; font-size: 0.82rem; word-break: break-word; }
        .detail-parts { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 3px; align-items: center; }
        .part-tag {
          display: inline-block; background: #e6fffa; color: #234e52;
          padding: 1px 6px; border-radius: 3px; font-size: 0.72rem; font-weight: 500; border: 1px solid #b2f5ea;
        }
        .part-more { font-size: 0.72rem; color: #a0aec0; margin-left: 2px; }
        .detail-system { display: block; font-size: 0.74rem; color: #718096; margin-top: 3px; }

        .cell-text { font-weight: 500; color: #2d3748; font-size: 0.82rem; }
        .cell-text-muted { color: #718096; font-size: 0.82rem; }
        .text-muted { color: #cbd5e0; }

        .status-stack { display: flex; flex-direction: column; gap: 3px; align-items: flex-start; }
        .is-active-tag {
          display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.72rem; font-weight: 600;
        }
        .is-active-tag.active { background: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }
        .is-active-tag.inactive { background: #fff5f5; color: #9b2c2c; border: 1px solid #fed7d7; }

        .btn-view-job {
          background: #667eea; color: white; border: none; padding: 5px 10px; border-radius: 6px;
          font-weight: 600; font-size: 0.76rem; cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .btn-view-job:hover { background: #5a67d8; }
        .btn-view-detail {
          background: #edf2f7; color: #4a5568; border: 1px solid #e2e8f0; padding: 5px 10px;
          border-radius: 6px; font-weight: 600; font-size: 0.76rem; cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .btn-view-detail:hover { background: #e2e8f0; }

        /* Loading / Empty */
        .empty-state { text-align: center; padding: 60px 20px; color: #718096; }
        .empty-icon { font-size: 3.5rem; margin-bottom: 16px; opacity: 0.4; }
        .empty-state h3 { font-size: 1.4rem; margin: 0 0 8px; color: #4a5568; }
        .empty-state p { margin: 0; }
        .spinner {
          width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #667eea;
          border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px;
        }
        .spinner-sm {
          display: inline-block; width: 16px; height: 16px; border: 2px solid #e2e8f0; border-top-color: #667eea;
          border-radius: 50%; animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 8px;
        }
        .loading-bar { text-align: center; padding: 16px; color: #667eea; font-weight: 600; font-size: 0.9rem; }
        .end-bar { text-align: center; padding: 14px; color: #a0aec0; font-size: 0.85rem; }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Modal */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center;
          z-index: 1000; backdrop-filter: blur(4px);
        }
        .modal-box {
          background: white; padding: 28px; border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15); width: 90%; max-width: 380px;
        }
        .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
        .modal-head h3 { margin: 0; font-size: 1.15rem; color: #2d3748; }
        .modal-close { background: none; border: none; font-size: 1.5rem; color: #a0aec0; cursor: pointer; padding: 0; }
        .modal-close:hover { color: #4a5568; }
        .battery-display {
          background: #f7fafc; padding: 20px; border-radius: 10px; border: 2px dashed #cbd5e0;
          text-align: center; font-size: 1.15rem; font-weight: 600; color: #4a5568; font-family: monospace; word-break: break-all;
        }

        /* === Responsive: Tablet === */
        @media (max-width: 1200px) {
          .table-card :global(.th-battery),
          .table-card :global(.td-battery) { display: none; }
          .table-card :global(.th-course),
          .table-card :global(.td-course) { display: none; }
        }

        @media (max-width: 1024px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
          .header-row { flex-direction: column; gap: 16px; text-align: center; }
          .header-title-area { flex-direction: column; text-align: center; }
          .page-title { font-size: 1.5rem; }
          .table-card :global(.th-performer),
          .table-card :global(.td-performer) { display: none; }
        }

        /* === Responsive: Mobile === */
        @media (max-width: 768px) {
          .serial-history-screen { padding: 12px; }
          .page-header-card { padding: 20px; }
          .filter-card { padding: 16px 18px; }
          .stats-row { grid-template-columns: 1fr 1fr; gap: 10px; }
          .stat-box { padding: 14px 16px; gap: 10px; }
          .stat-icon-txt { font-size: 1.5rem; }
          .stat-number { font-size: 1.5rem; }
          .stat-desc { font-size: 0.78rem; }
          .filter-grid { grid-template-columns: 1fr; }

          /* Table: keep as table but smaller */
          .table-card :global(th) { padding: 10px 6px; font-size: 0.72rem; }
          .table-card :global(td) { padding: 8px 6px; font-size: 0.78rem; }

          .table-card :global(.th-battery),
          .table-card :global(.td-battery),
          .table-card :global(.th-course),
          .table-card :global(.td-course),
          .table-card :global(.th-performer),
          .table-card :global(.td-performer),
          .table-card :global(.th-status),
          .table-card :global(.td-status) { display: none; }

          .badge-serial, .badge-vehicle { font-size: 0.72rem; padding: 2px 6px; }
          .badge-action { font-size: 0.7rem; padding: 2px 6px; }
          .detail-text { font-size: 0.76rem; }
          .btn-view-job, .btn-view-detail { font-size: 0.7rem; padding: 4px 8px; }
        }

        @media (max-width: 480px) {
          .stats-row { grid-template-columns: 1fr 1fr; gap: 8px; }
          .stat-box { padding: 10px 12px; }
          .stat-number { font-size: 1.2rem; }
          .header-icon-box { width: 48px; height: 48px; font-size: 1.8rem; }
          .page-title { font-size: 1.2rem; }

          .table-card :global(.th-details),
          .table-card :global(.td-details) { display: none; }
        }
      `}</style>
    </div>
  );
};

export default SerialHistoryScreen;