'use client';

import React, { useState, useMemo } from 'react';
import { PartsUsageLog } from '@/lib/data';

interface PartsHistoryModalProps {
  serialNumber: string;
  partsUsageLog: PartsUsageLog[];
  onClose: () => void;
}

const PartsHistoryModal = ({ serialNumber, partsUsageLog, onClose }: PartsHistoryModalProps) => {
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterPartName, setFilterPartName] = useState('');
  const [filterJobType, setFilterJobType] = useState('');
  const [sortBy] = useState<'date' | 'part' | 'quantity'>('date');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter parts usage logs for this serial number
  const serialPartsLogs = useMemo(() => {
    return partsUsageLog.filter(log => log.vehicleSerial === serialNumber);
  }, [serialNumber, partsUsageLog]);

  // Apply filters and sorting
  const filteredLogs = useMemo(() => {
    const filtered = serialPartsLogs.filter(log => {
      // Filter by date range
      if (filterDateFrom) {
        const logDate = new Date(log.usedDate);
        const fromDate = new Date(filterDateFrom);
        if (logDate < fromDate) return false;
      }

      if (filterDateTo) {
        const logDate = new Date(log.usedDate);
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (logDate > toDate) return false;
      }

      // Filter by part name
      if (filterPartName && !log.partName.toLowerCase().includes(filterPartName.toLowerCase())) {
        return false;
      }

      // Filter by job type
      if (filterJobType && log.jobType !== filterJobType) {
        return false;
      }

      return true;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.usedDate).getTime() - new Date(b.usedDate).getTime();
          break;
        case 'part':
          comparison = a.partName.localeCompare(b.partName);
          break;
        case 'quantity':
          comparison = a.quantityUsed - b.quantityUsed;
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [serialPartsLogs, filterDateFrom, filterDateTo, filterPartName, filterJobType, sortBy, sortOrder]);

  // Group logs by date for better visualization
  const groupedLogs = useMemo(() => {
    const groups: { [date: string]: PartsUsageLog[] } = {};
    
    filteredLogs.forEach(log => {
      const dateKey = new Date(log.usedDate).toLocaleDateString('th-TH');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });

    return groups;
  }, [filteredLogs]);

  const uniqueJobTypes = useMemo(() => {
    return Array.from(new Set(serialPartsLogs.map(log => log.jobType))).sort();
  }, [serialPartsLogs]);

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

  const getJobTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'PM': 'ซ่อมบำรุงตามแผน',
      'BM': 'ซ่อมแซม',
      'Recondition': 'ปรับปรุงสภาพ'
    };
    return typeLabels[type] || type;
  };

  const getJobTypeIcon = (type: string) => {
    const typeIcons: Record<string, string> = {
      'PM': '🔄',
      'BM': '🚨',
      'Recondition': '🔨'
    };
    return typeIcons[type] || '🔧';
  };

  const getSystemIcon = (system: string) => {
    const systemIcons: Record<string, string> = {
      'brake': '🛑',
      'steering': '🎯',
      'motor': '⚙️',
      'electric': '⚡',
      'general': '🔧',
      'suspension': '🏗️'
    };
    return systemIcons[system] || '🔧';
  };

  const clearFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterPartName('');
    setFilterJobType('');
  };

  // Calculate summary statistics
  const totalParts = filteredLogs.reduce((sum, log) => sum + log.quantityUsed, 0);
  const uniqueParts = new Set(filteredLogs.map(log => log.partName)).size;
  const totalJobs = new Set(filteredLogs.map(log => log.jobId)).size;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-left">
            <div className="modal-icon">🔧</div>
            <div>
              <h2>ประวัติการใช้อะไหล่</h2>
              <p className="serial-info">🏷️ Serial: {serialNumber}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Summary Stats */}
          <div className="stats-section">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <div className="stat-value">{totalParts}</div>
                <div className="stat-label">อะไหล่ทั้งหมด</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔧</div>
              <div className="stat-content">
                <div className="stat-value">{uniqueParts}</div>
                <div className="stat-label">ชนิดอะไหล่</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <div className="stat-value">{totalJobs}</div>
                <div className="stat-label">งานซ่อม</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{filteredLogs.length}</div>
                <div className="stat-label">รายการ</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="filter-section">
            <div className="filter-header">
              <h3>🔍 ตัวกรองข้อมูล</h3>
              <button onClick={clearFilters} className="btn-clear">
                🗑️ ล้างตัวกรอง
              </button>
            </div>
            
            <div className="filter-grid">
              <div className="filter-group">
                <label>🔍 ชื่ออะไหล่:</label>
                <input
                  type="text"
                  value={filterPartName}
                  onChange={(e) => setFilterPartName(e.target.value)}
                  placeholder="ค้นหาชื่ออะไหล่..."
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>⚙️ ประเภทงาน:</label>
                <select
                  value={filterJobType}
                  onChange={(e) => setFilterJobType(e.target.value)}
                  className="filter-select"
                >
                  <option value="">ทั้งหมด</option>
                  {uniqueJobTypes.map(type => (
                    <option key={type} value={type}>
                      {getJobTypeLabel(type)}
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
            </div>
          </div>

          {/* Parts History Content */}
          <div className="parts-history-content">
            {filteredLogs.length === 0 ? (
              <div className="no-data">
                <div className="no-data-icon">📦</div>
                <h3>ไม่พบประวัติการใช้อะไหล่</h3>
                <p>ไม่มีข้อมูลการใช้อะไหล่สำหรับ Serial นี้ หรือไม่ตรงกับเงื่อนไขการค้นหา</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="parts-history-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Serial Number</th>
                      <th>หมายเลขรถ</th>
                      <th>สนามกอล์ฟ</th>
                      <th>รายการอะไหล่</th>
                      <th>จำนวน</th>
                      <th>หน่วย</th>
                      <th>รายการงาน</th>
                      <th>วันที่บันทึก</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, index) => (
                      <tr key={log.id}>
                        <td>{index + 1}</td>
                        <td>{log.vehicleSerial}</td>
                        <td>{log.vehicleNumber}</td>
                        <td>{log.golfCourseName}</td>
                        <td>
                          <div className="part-name-cell">
                            {getSystemIcon(log.system)} {log.partName}
                          </div>
                        </td>
                        <td>
                          <span className="quantity-cell">{log.quantityUsed}</span>
                        </td>
                        <td>ชิ้น</td>
                        <td>
                          <span className={`job-type-badge ${log.jobType.toLowerCase()}`}>
                            {getJobTypeIcon(log.jobType)} {getJobTypeLabel(log.jobType)}
                          </span>
                        </td>
                        <td>
                          <div className="date-cell">
                            <div className="date-main">{formatDate(log.usedDate)}</div>
                            <div className="date-sub">โดย: {log.usedBy}</div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 1000px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 24px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .modal-icon {
          font-size: 2.5rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .serial-info {
          margin: 4px 0 0 0;
          opacity: 0.9;
          font-size: 1rem;
        }

        .modal-close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .modal-body {
          padding: 24px 32px;
          overflow-y: auto;
          flex: 1;
        }

        .stats-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #e2e8f0;
        }

        .stat-icon {
          font-size: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #2d3748;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #718096;
          margin-top: 2px;
        }

        .filter-section {
          background: #f7fafc;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
        }

        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .filter-header h3 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
          color: #2d3748;
        }

        .btn-clear {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.85rem;
        }

        .btn-clear:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-group label {
          font-weight: 600;
          color: #4a5568;
          font-size: 0.9rem;
        }

        .filter-input, .filter-select {
          padding: 10px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .filter-input:focus, .filter-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .parts-history-content {
          max-height: 400px;
          overflow-y: auto;
        }

        .table-container {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .parts-history-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          font-size: 0.9rem;
        }

        .parts-history-table th {
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #2b6cb0;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .parts-history-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
        }

        .parts-history-table tbody tr:hover {
          background: #f7fafc;
        }

        .parts-history-table tbody tr:nth-child(even) {
          background: #f8f9fa;
        }

        .parts-history-table tbody tr:nth-child(even):hover {
          background: #e2e8f0;
        }

        .part-name-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }

        .quantity-cell {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.8rem;
          display: inline-block;
          min-width: 30px;
          text-align: center;
        }

        .date-cell {
          text-align: center;
        }

        .date-main {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 2px;
        }

        .date-sub {
          font-size: 0.75rem;
          color: #718096;
        }

        .grouped-logs {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .date-group {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }

        .date-header {
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          color: white;
          padding: 12px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .date-badge {
          font-weight: 600;
          font-size: 1rem;
        }

        .date-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
        }

        .logs-list {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .log-item {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.2s ease;
        }

        .log-item:hover {
          background: #edf2f7;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .part-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .part-name {
          font-weight: 600;
          color: #2d3748;
          font-size: 1rem;
        }

        .quantity-badge {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .job-type-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .job-type-badge.pm {
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          color: white;
        }

        .job-type-badge.bm {
          background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
          color: white;
        }

        .job-type-badge.recondition {
          background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
          color: white;
        }

        .log-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .detail-label {
          font-weight: 600;
          color: #4a5568;
          font-size: 0.85rem;
          min-width: 80px;
        }

        .detail-value {
          color: #2d3748;
          font-size: 0.85rem;
        }

        .no-data {
          text-align: center;
          padding: 60px 20px;
          color: #718096;
        }

        .no-data-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        .no-data h3 {
          font-size: 1.5rem;
          margin: 0 0 8px 0;
          color: #4a5568;
        }

        .no-data p {
          margin: 0;
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .modal-content {
            margin: 10px;
            max-height: 95vh;
          }

          .modal-header {
            padding: 20px;
          }

          .modal-body {
            padding: 20px;
          }

          .stats-section {
            grid-template-columns: repeat(2, 1fr);
          }

          .filter-grid {
            grid-template-columns: 1fr;
          }

          .log-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .log-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PartsHistoryModal;