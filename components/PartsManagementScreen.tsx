
'use client';

import React, { useState, useMemo } from 'react';
import { PartsUsageLog, Vehicle, GolfCourse, View } from '../lib/data';

interface PartsManagementScreenProps {
    parts: any[];
    setParts: (parts: any[]) => void;
    partsUsageLog: PartsUsageLog[];
    setView: (view: View) => void;
    vehicles: Vehicle[];
    golfCourses: GolfCourse[];
}

function PartsManagementScreen({ 
    parts, 
    setParts, 
    partsUsageLog, 
    setView,
    vehicles,
    golfCourses 
}: PartsManagementScreenProps) {
    const [filters, setFilters] = useState({
        golfCourse: '',
        system: '',
        jobType: '',
        partName: '',
        userName: '',
        vehicleNumber: '',
        serialNumber: '',
        dateFrom: '',
        dateTo: ''
    });
    
    const [sortBy, setSortBy] = useState<'date' | 'golfCourse' | 'system' | 'partName' | 'serialNumber'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // ฟังก์ชันสำหรับดึง Serial Numbers ตามสนามที่เลือก
    const getSerialNumbersByGolfCourse = useMemo(() => {
        if (!filters.golfCourse) {
            // ถ้าไม่ได้เลือกสนาม ให้แสดง Serial ทั้งหมด
            return vehicles.map(v => v.serial_number);
        }
        
        // หาสนามที่เลือก
        const selectedGolfCourse = golfCourses.find(gc => gc.name === filters.golfCourse);
        if (!selectedGolfCourse) return [];
        
        // กรองรถตามสนามที่เลือก
        return vehicles
            .filter(v => v.golf_course_id === selectedGolfCourse.id)
            .map(v => v.serial_number);
    }, [filters.golfCourse, vehicles, golfCourses]);

    // Filter และ Sort ข้อมูล
    const filteredAndSortedLogs = useMemo(() => {
        let filtered = partsUsageLog.filter(log => {
            const matchGolfCourse = !filters.golfCourse || log.golfCourseName.includes(filters.golfCourse);
            const matchSystem = !filters.system || log.system === filters.system;
            const matchJobType = !filters.jobType || log.jobType === filters.jobType;
            const matchPartName = !filters.partName || log.partName.toLowerCase().includes(filters.partName.toLowerCase());
            const matchUserName = !filters.userName || log.userName.toLowerCase().includes(filters.userName.toLowerCase());
            const matchVehicleNumber = !filters.vehicleNumber || log.vehicleNumber.includes(filters.vehicleNumber);
            const matchSerialNumber = !filters.serialNumber || log.serialNumber.toLowerCase().includes(filters.serialNumber.toLowerCase());
            
            const logDate = new Date(log.usedDate);
            const matchDateFrom = !filters.dateFrom || logDate >= new Date(filters.dateFrom);
            const matchDateTo = !filters.dateTo || logDate <= new Date(filters.dateTo + 'T23:59:59');
            
            return matchGolfCourse && matchSystem && matchJobType && matchPartName && 
                   matchUserName && matchVehicleNumber && matchSerialNumber && matchDateFrom && matchDateTo;
        });

        // Sort
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (sortBy) {
                case 'date':
                    aValue = new Date(a.usedDate);
                    bValue = new Date(b.usedDate);
                    break;
                case 'golfCourse':
                    aValue = a.golfCourseName;
                    bValue = b.golfCourseName;
                    break;
                case 'system':
                    aValue = a.system;
                    bValue = b.system;
                    break;
                case 'partName':
                    aValue = a.partName;
                    bValue = b.partName;
                    break;
                case 'serialNumber':
                    aValue = a.serialNumber;
                    bValue = b.serialNumber;
                    break;
                default:
                    return 0;
            }
            
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [partsUsageLog, filters, sortBy, sortOrder]);

    const handleFilterChange = (key: string, value: string) => {
        // ถ้าเปลี่ยนสนาม ให้ล้าง Serial Number filter
        if (key === 'golfCourse') {
            setFilters(prev => ({ ...prev, [key]: value, serialNumber: '' }));
        } else {
            setFilters(prev => ({ ...prev, [key]: value }));
        }
    };

    const clearFilters = () => {
        setFilters({
            golfCourse: '',
            system: '',
            jobType: '',
            partName: '',
            userName: '',
            vehicleNumber: '',
            serialNumber: '',
            dateFrom: '',
            dateTo: ''
        });
    };

    // ฟังก์ชันสำหรับ export ข้อมูลเป็น CSV
    const exportToCSV = () => {
        if (filteredAndSortedLogs.length === 0) {
            alert('ไม่มีข้อมูลสำหรับ export');
            return;
        }

        const headers = [
            'วันที่',
            'สนาม',
            'เบอร์รถ',
            'Serial รถ',
            'ระบบ',
            'ประเภทงาน',
            'ชื่ออะไหล่',
            'จำนวน',
            'ผู้ใช้',
            'Job ID'
        ];

        const csvContent = [
            headers.join(','),
            ...filteredAndSortedLogs.map(log => [
                formatDate(log.usedDate),
                log.golfCourseName,
                log.vehicleNumber,
                log.serialNumber,
                getSystemDisplayName(log.system),
                getJobTypeDisplayName(log.jobType),
                log.partName,
                log.quantity,
                log.userName,
                `#${log.jobId}`
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `parts_usage_log_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getJobTypeDisplayName = (type: string) => {
        const typeNames: Record<string, string> = {
            'PM': 'Preventive Maintenance',
            'BM': 'Breakdown Maintenance',
            'Recondition': 'Recondition'
        };
        return typeNames[type] || type;
    };

    const getSystemDisplayName = (system: string) => {
        const systemNames: Record<string, string> = {
            'brake': 'ระบบเบรก',
            'steering': 'ระบบพวงมาลัย',
            'motor': 'ระบบมอเตอร์',
            'electric': 'ระบบไฟฟ้า'
        };
        return systemNames[system] || system;
    };

    return (
        <div className="parts-log-container">
            {/* Enhanced Header */}
            <div className="parts-log-header">
                <h2>
                    📋 Log การใช้อะไหล่
                </h2>
                <div className="parts-log-header-actions">
                    <button className="btn-primary" onClick={exportToCSV}>
                        📊 Export Log
                    </button>
                    <button className="btn-outline" onClick={() => setView('admin_dashboard')}>
                        ← กลับไปหน้าหลัก
                    </button>
                </div>
            </div>
            
            {/* Enhanced Filter Section */}
            <div className="parts-log-filters">
                <div className="filter-section-title">
                    🔍 ตัวกรองข้อมูล
                </div>
                
                <div className="filter-row">
                    <div className="filter-group">
                        <label>🏌️ สนามกอล์ฟ:</label>
                        <select 
                            value={filters.golfCourse} 
                            onChange={(e) => handleFilterChange('golfCourse', e.target.value)}
                        >
                            <option value="">ทุกสนาม</option>
                            {golfCourses.map(gc => (
                                <option key={gc.id} value={gc.name}>{gc.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label>⚙️ ระบบ:</label>
                        <select 
                            value={filters.system} 
                            onChange={(e) => handleFilterChange('system', e.target.value)}
                        >
                            <option value="">ทุกระบบ</option>
                            <option value="brake">ระบบเบรก</option>
                            <option value="steering">ระบบพวงมาลัย</option>
                            <option value="motor">ระบบมอเตอร์</option>
                            <option value="electric">ระบบไฟฟ้า</option>
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label>🔧 ประเภทงาน:</label>
                        <select 
                            value={filters.jobType} 
                            onChange={(e) => handleFilterChange('jobType', e.target.value)}
                        >
                            <option value="">ทุกประเภท</option>
                            <option value="PM">PM - Preventive Maintenance</option>
                            <option value="BM">BM - Breakdown Maintenance</option>
                            <option value="Recondition">Recondition</option>
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label>🚗 เบอร์รถ:</label>
                        <input 
                            type="text" 
                            placeholder="ค้นหาเบอร์รถ..." 
                            value={filters.vehicleNumber}
                            onChange={(e) => handleFilterChange('vehicleNumber', e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="filter-row">
                    <div className="filter-group">
                        <label>🔢 Serial รถ:</label>
                        <select 
                            value={filters.serialNumber}
                            onChange={(e) => handleFilterChange('serialNumber', e.target.value)}
                            disabled={!filters.golfCourse}
                        >
                            <option value="">
                                {filters.golfCourse ? 'เลือก Serial รถ' : 'เลือกสนามก่อน'}
                            </option>
                            {getSerialNumbersByGolfCourse.map(serial => (
                                <option key={serial} value={serial}>{serial}</option>
                            ))}
                        </select>
                        {!filters.golfCourse && (
                            <small style={{ color: '#666', fontSize: '12px', marginTop: '0.25rem' }}>
                                💡 กรุณาเลือกสนามก่อนเพื่อดู Serial รถ
                            </small>
                        )}
                    </div>
                    
                    <div className="filter-group">
                        <label>🔩 ชื่ออะไหล่:</label>
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่ออะไหล่..." 
                            value={filters.partName}
                            onChange={(e) => handleFilterChange('partName', e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <label>👤 ชื่อพนักงาน:</label>
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อพนักงาน..." 
                            value={filters.userName}
                            onChange={(e) => handleFilterChange('userName', e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <label>📅 วันที่เริ่มต้น:</label>
                        <input 
                            type="date" 
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="filter-row">
                    <div className="filter-group">
                        <label>📅 วันที่สิ้นสุด:</label>
                        <input 
                            type="date" 
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-actions">
                        <button className="btn-outline" onClick={clearFilters}>
                            🗑️ ล้างตัวกรอง
                        </button>
                    </div>
                </div>
            </div>

            {/* Enhanced Sort Section */}
            <div className="sort-controls">
                <div className="sort-group">
                    <label>📊 เรียงตาม:</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                        <option value="date">📅 วันที่</option>
                        <option value="golfCourse">🏌️ สนาม</option>
                        <option value="serialNumber">🔢 Serial รถ</option>
                        <option value="system">⚙️ ระบบ</option>
                        <option value="partName">🔩 ชื่ออะไหล่</option>
                    </select>
                </div>
                
                <div className="sort-group">
                    <label>🔄 ลำดับ:</label>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}>
                        <option value="desc">⬇️ ใหม่ไปเก่า</option>
                        <option value="asc">⬆️ เก่าไปใหม่</option>
                    </select>
                </div>
            </div>

            {/* Enhanced Results */}
            <div className="parts-log-results">
                <div className="results-header">
                    <h3>📋 ผลการค้นหา</h3>
                    <span className="results-count">
                        {filteredAndSortedLogs.length} รายการ
                    </span>
                </div>
                
                {filteredAndSortedLogs.length === 0 ? (
                    <div className="no-results">
                        <div className="no-results-icon">🔍</div>
                        <p>ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</p>
                        <small>ลองปรับเปลี่ยนตัวกรองหรือล้างตัวกรองเพื่อดูข้อมูลทั้งหมด</small>
                    </div>
                ) : (
                    <div className="log-table">
                        <table className="parts-log-table">
                            <thead>
                                <tr>
                                    <th>📅 วันที่</th>
                                    <th>🏌️ สนาม</th>
                                    <th>🚗 เบอร์รถ</th>
                                    <th>🔢 Serial รถ</th>
                                    <th>⚙️ ระบบ</th>
                                    <th>🔧 ประเภทงาน</th>
                                    <th>🔩 ชื่ออะไหล่</th>
                                    <th>📦 จำนวน</th>
                                    <th>👤 ผู้ใช้</th>
                                    <th>🆔 Job ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedLogs.map(log => (
                                    <tr key={log.id}>
                                        <td className="date-cell">{formatDate(log.usedDate)}</td>
                                        <td>{log.golfCourseName}</td>
                                        <td className="vehicle-number-cell">{log.vehicleNumber}</td>
                                        <td>
                                            <span className="serial-number-cell">
                                                {log.serialNumber}
                                            </span>
                                        </td>
                                        <td>{getSystemDisplayName(log.system)}</td>
                                        <td>
                                            <span className={`status-badge ${log.jobType.toLowerCase()}`}>
                                                {getJobTypeDisplayName(log.jobType)}
                                            </span>
                                        </td>
                                        <td>{log.partName}</td>
                                        <td className="quantity-cell">{log.quantity}</td>
                                        <td>{log.userName}</td>
                                        <td className="job-id-cell">#{log.jobId}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PartsManagementScreen;
