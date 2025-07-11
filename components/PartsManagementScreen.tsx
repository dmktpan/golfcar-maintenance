
'use client';

import React, { useState, useMemo } from 'react';
import { Part } from '@/lib/data';
import { View } from '@/app/page';

export interface PartsUsageLog {
    id: number;
    jobId: number;
    partName: string;
    partId: string;
    quantity: number;
    usedDate: string;
    userName: string;
    vehicleNumber: string;
    golfCourseName: string;
    jobType: 'PM' | 'BM' | 'Recondition';
    system: string;
}

interface PartsManagementScreenProps {
    parts: Part[];
    setParts: (parts: Part[]) => void;
    partsUsageLog: PartsUsageLog[];
    setView: (view: View) => void;
}

function PartsManagementScreen({ parts, setParts, partsUsageLog, setView }: PartsManagementScreenProps) {
    const [filters, setFilters] = useState({
        golfCourse: '',
        system: '',
        jobType: '',
        partName: '',
        userName: '',
        vehicleNumber: '',
        dateFrom: '',
        dateTo: ''
    });
    
    const [sortBy, setSortBy] = useState<'date' | 'golfCourse' | 'system' | 'partName'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Filter และ Sort ข้อมูล
    const filteredAndSortedLogs = useMemo(() => {
        let filtered = partsUsageLog.filter(log => {
            const matchGolfCourse = !filters.golfCourse || log.golfCourseName.includes(filters.golfCourse);
            const matchSystem = !filters.system || log.system === filters.system;
            const matchJobType = !filters.jobType || log.jobType === filters.jobType;
            const matchPartName = !filters.partName || log.partName.toLowerCase().includes(filters.partName.toLowerCase());
            const matchUserName = !filters.userName || log.userName.toLowerCase().includes(filters.userName.toLowerCase());
            const matchVehicleNumber = !filters.vehicleNumber || log.vehicleNumber.includes(filters.vehicleNumber);
            
            const logDate = new Date(log.usedDate);
            const matchDateFrom = !filters.dateFrom || logDate >= new Date(filters.dateFrom);
            const matchDateTo = !filters.dateTo || logDate <= new Date(filters.dateTo + 'T23:59:59');
            
            return matchGolfCourse && matchSystem && matchJobType && matchPartName && 
                   matchUserName && matchVehicleNumber && matchDateFrom && matchDateTo;
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
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            golfCourse: '',
            system: '',
            jobType: '',
            partName: '',
            userName: '',
            vehicleNumber: '',
            dateFrom: '',
            dateTo: ''
        });
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
        <div className="card">
            <div className="page-header">
                <h2>Log การใช้อะไหล่</h2>
                <button className="btn-outline" onClick={() => setView('admin_dashboard')}>กลับไปหน้าหลัก</button>
            </div>
            
            {/* Filter Section */}
            <div className="parts-log-filters">
                <div className="filter-row">
                    <div className="filter-group">
                        <label>สนาม:</label>
                        <select 
                            value={filters.golfCourse} 
                            onChange={(e) => handleFilterChange('golfCourse', e.target.value)}
                        >
                            <option value="">ทุกสนาม</option>
                            <option value="วอเตอร์แลนด์">วอเตอร์แลนด์</option>
                            <option value="กรีนวัลเลย์">กรีนวัลเลย์</option>
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label>ระบบ:</label>
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
                        <label>ประเภทงาน:</label>
                        <select 
                            value={filters.jobType} 
                            onChange={(e) => handleFilterChange('jobType', e.target.value)}
                        >
                            <option value="">ทุกประเภท</option>
                            <option value="PM">PM</option>
                            <option value="BM">BM</option>
                            <option value="Recondition">Recondition</option>
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label>เบอร์รถ:</label>
                        <input 
                            type="text" 
                            placeholder="ค้นหาเบอร์รถ" 
                            value={filters.vehicleNumber}
                            onChange={(e) => handleFilterChange('vehicleNumber', e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="filter-row">
                    <div className="filter-group">
                        <label>ชื่ออะไหล่:</label>
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่ออะไหล่" 
                            value={filters.partName}
                            onChange={(e) => handleFilterChange('partName', e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <label>ชื่อพนักงาน:</label>
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อพนักงาน" 
                            value={filters.userName}
                            onChange={(e) => handleFilterChange('userName', e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <label>วันที่เริ่มต้น:</label>
                        <input 
                            type="date" 
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <label>วันที่สิ้นสุด:</label>
                        <input 
                            type="date" 
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="filter-actions">
                    <button className="btn-outline" onClick={clearFilters}>ล้างตัวกรอง</button>
                </div>
            </div>

            {/* Sort Section */}
            <div className="sort-controls">
                <div className="sort-group">
                    <label>เรียงตาม:</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                        <option value="date">วันที่</option>
                        <option value="golfCourse">สนาม</option>
                        <option value="system">ระบบ</option>
                        <option value="partName">ชื่ออะไหล่</option>
                    </select>
                </div>
                
                <div className="sort-group">
                    <label>ลำดับ:</label>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}>
                        <option value="desc">ใหม่ไปเก่า</option>
                        <option value="asc">เก่าไปใหม่</option>
                    </select>
                </div>
            </div>

            {/* Results */}
            <div className="parts-log-results">
                <div className="results-header">
                    <h3>ผลการค้นหา ({filteredAndSortedLogs.length} รายการ)</h3>
                </div>
                
                {filteredAndSortedLogs.length === 0 ? (
                    <div className="no-results">
                        <p>ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</p>
                    </div>
                ) : (
                    <div className="log-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>วันที่</th>
                                    <th>สนาม</th>
                                    <th>เบอร์รถ</th>
                                    <th>ระบบ</th>
                                    <th>ประเภทงาน</th>
                                    <th>ชื่ออะไหล่</th>
                                    <th>จำนวน</th>
                                    <th>ผู้ใช้</th>
                                    <th>Job ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedLogs.map(log => (
                                    <tr key={log.id}>
                                        <td>{formatDate(log.usedDate)}</td>
                                        <td>{log.golfCourseName}</td>
                                        <td>{log.vehicleNumber}</td>
                                        <td>{getSystemDisplayName(log.system)}</td>
                                        <td>
                                            <span className={`status-badge ${log.jobType.toLowerCase()}`}>
                                                {getJobTypeDisplayName(log.jobType)}
                                            </span>
                                        </td>
                                        <td>{log.partName}</td>
                                        <td>{log.quantity}</td>
                                        <td>{log.userName}</td>
                                        <td>#{log.jobId}</td>
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
