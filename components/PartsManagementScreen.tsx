
'use client';

import React, { useState, useMemo } from 'react';
import { PartsUsageLog, Vehicle, GolfCourse, View } from '../lib/data';
import PartsHistoryModal from './PartsHistoryModal';

interface PartsManagementScreenProps {
    parts: any[];
    setParts: (parts: any[]) => void;
    partsUsageLog: PartsUsageLog[];
    setPartsUsageLog: (logs: PartsUsageLog[]) => void;
    addPartsUsageLog: (jobId: number, partsNotes: string) => void;
    setView: (view: View) => void;
    vehicles: Vehicle[];
    golfCourses: GolfCourse[];
}

function PartsManagementScreen({ 
    parts, 
    setParts, 
    partsUsageLog, 
    setPartsUsageLog,
    addPartsUsageLog,
    setView,
    vehicles,
    golfCourses 
}: PartsManagementScreenProps) {
    console.log('🔍 PartsManagementScreen rendered with partsUsageLog:', partsUsageLog);
    console.log('📊 PartsUsageLog count:', partsUsageLog.length);
    
    const [selectedSerial, setSelectedSerial] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        golfCourse: '',
        vehicleNumber: '',
        serialNumber: '',
        dateFrom: '',
        dateTo: ''
    });
    
    const [sortBy, setSortBy] = useState<'serial' | 'vehicle' | 'golfCourse' | 'partsCount' | 'lastUpdate'>('lastUpdate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // ดึง Serial Numbers ทั้งหมดที่มีในระบบ
    const allSerialNumbers = useMemo(() => {
        const uniqueSerials = Array.from(new Set(vehicles.map(v => v.serial_number)));
        return uniqueSerials.sort();
    }, [vehicles]);

    // ดึง Serial Numbers ที่มีประวัติการใช้อะไหล่
    const serialsWithHistory = useMemo(() => {
        const serialsWithLogs = Array.from(new Set(partsUsageLog.map(log => log.serialNumber)));
        return serialsWithLogs.sort();
    }, [partsUsageLog]);

    // ฟังก์ชันสำหรับดึงข้อมูลรถจาก Serial Number
    const getVehicleBySerial = (serialNumber: string) => {
        return vehicles.find(v => v.serial_number === serialNumber);
    };

    // ฟังก์ชันสำหรับดึงชื่อสนามจาก Vehicle
    const getGolfCourseNameByVehicle = (vehicle: Vehicle | undefined) => {
        if (!vehicle) return 'ไม่ระบุ';
        const golfCourse = golfCourses.find(gc => gc.id === vehicle.golf_course_id);
        return golfCourse?.name || 'ไม่ระบุ';
    };

    // ฟังก์ชันสำหรับนับจำนวนอะไหล่ที่ใช้ในแต่ละ Serial
    const getPartsCountBySerial = (serialNumber: string) => {
        return partsUsageLog.filter(log => log.serialNumber === serialNumber).length;
    };

    // ฟังก์ชันสำหรับกรองและเรียงลำดับข้อมูล
    const filteredAndSortedSerials = useMemo(() => {
        let filtered = serialsWithHistory.filter(serial => {
            const vehicle = getVehicleBySerial(serial);
            const golfCourseName = getGolfCourseNameByVehicle(vehicle);
            
            // ค้นหาทั่วไป
            const matchesSearch = !searchTerm || 
                serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (vehicle?.vehicle_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                golfCourseName.toLowerCase().includes(searchTerm.toLowerCase());
            
            // กรองตามสนาม
            const matchesGolfCourse = !filters.golfCourse || 
                golfCourseName === filters.golfCourse;
            
            // กรองตามหมายเลขรถ
            const matchesVehicleNumber = !filters.vehicleNumber || 
                (vehicle?.vehicle_number || '').toLowerCase().includes(filters.vehicleNumber.toLowerCase());
            
            // กรองตาม Serial Number
            const matchesSerialNumber = !filters.serialNumber || 
                serial.toLowerCase().includes(filters.serialNumber.toLowerCase());
            
            // กรองตามวันที่
            let matchesDateRange = true;
            if (filters.dateFrom || filters.dateTo) {
                const serialLogs = partsUsageLog.filter(log => log.serialNumber === serial);
                if (serialLogs.length > 0) {
                    const latestDate = new Date(Math.max(...serialLogs.map(log => new Date(log.usedDate).getTime())));
                    const earliestDate = new Date(Math.min(...serialLogs.map(log => new Date(log.usedDate).getTime())));
                    
                    if (filters.dateFrom) {
                        matchesDateRange = matchesDateRange && latestDate >= new Date(filters.dateFrom);
                    }
                    if (filters.dateTo) {
                        matchesDateRange = matchesDateRange && earliestDate <= new Date(filters.dateTo);
                    }
                }
            }
            
            return matchesSearch && matchesGolfCourse && matchesVehicleNumber && 
                   matchesSerialNumber && matchesDateRange;
        });

        // เรียงลำดับ
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'serial':
                    aValue = a;
                    bValue = b;
                    break;
                case 'vehicle':
                    aValue = getVehicleBySerial(a)?.vehicle_number || '';
                    bValue = getVehicleBySerial(b)?.vehicle_number || '';
                    break;
                case 'golfCourse':
                    aValue = getGolfCourseNameByVehicle(getVehicleBySerial(a));
                    bValue = getGolfCourseNameByVehicle(getVehicleBySerial(b));
                    break;
                case 'partsCount':
                    aValue = getPartsCountBySerial(a);
                    bValue = getPartsCountBySerial(b);
                    break;
                case 'lastUpdate':
                    const aLatest = partsUsageLog
                        .filter(log => log.serialNumber === a)
                        .sort((x, y) => new Date(y.usedDate).getTime() - new Date(x.usedDate).getTime())[0];
                    const bLatest = partsUsageLog
                        .filter(log => log.serialNumber === b)
                        .sort((x, y) => new Date(y.usedDate).getTime() - new Date(x.usedDate).getTime())[0];
                    aValue = aLatest ? new Date(aLatest.usedDate).getTime() : 0;
                    bValue = bLatest ? new Date(bLatest.usedDate).getTime() : 0;
                    break;
                default:
                    return 0;
            }
            
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            } else {
                return sortOrder === 'asc' ? 
                    (aValue as number) - (bValue as number) : 
                    (bValue as number) - (aValue as number);
            }
        });

        return filtered;
    }, [serialsWithHistory, searchTerm, filters, sortBy, sortOrder, partsUsageLog, vehicles, golfCourses]);

    // ดึงรายการสนามกอล์ฟที่ไม่ซ้ำ
    const uniqueGolfCourses = useMemo(() => {
        const courses = serialsWithHistory.map(serial => {
            const vehicle = getVehicleBySerial(serial);
            return getGolfCourseNameByVehicle(vehicle);
        });
        return Array.from(new Set(courses)).sort();
    }, [serialsWithHistory, vehicles, golfCourses]);

    // ฟังก์ชันสำหรับแสดง Modal
    const handleShowHistory = (serialNumber: string) => {
        setSelectedSerial(serialNumber);
        setShowModal(true);
    };

    // ฟังก์ชันสำหรับปิด Modal
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedSerial('');
    };

    const exportToCSV = () => {
        if (serialsWithHistory.length === 0) {
            alert('ไม่มีข้อมูลสำหรับ export');
            return;
        }

        const headers = [
            'Serial Number',
            'หมายเลขรถ',
            'สนามกอล์ฟ',
            'จำนวนรายการอะไหล่',
            'วันที่อัปเดตล่าสุด'
        ];

        const csvContent = [
            headers.join(','),
            ...serialsWithHistory.map(serial => {
                const vehicle = getVehicleBySerial(serial);
                const golfCourseName = getGolfCourseNameByVehicle(vehicle);
                const partsCount = getPartsCountBySerial(serial);
                const latestLog = partsUsageLog
                    .filter(log => log.serialNumber === serial)
                    .sort((a, b) => new Date(b.usedDate).getTime() - new Date(a.usedDate).getTime())[0];
                
                return [
                    serial,
                    vehicle?.vehicle_number || 'ไม่ระบุ',
                    golfCourseName,
                    partsCount,
                    latestLog ? formatDate(latestLog.usedDate) : 'ไม่มีข้อมูล'
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `serial_parts_summary_${new Date().toISOString().split('T')[0]}.csv`);
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

    return (
        <div className="parts-log-container">
            <div className="parts-log-header">
                <h2>🔧 ประวัติการใช้อะไหล่ตาม Serial</h2>
                <div className="parts-log-header-actions">
                    <button className="btn-primary" onClick={exportToCSV}>
                        📊 Export สรุป
                    </button>
                    <button className="btn-outline" onClick={() => setView('admin_dashboard')}>
                        ← กลับไปหน้าหลัก
                    </button>
                </div>
            </div>
            
            <div className="serial-selection-section">
                <div className="selection-header">
                    <h3>🏷️ ประวัติการใช้อะไหล่ตาม Serial Number</h3>
                    <p className="selection-description">
                        ค้นหาและดูประวัติการใช้อะไหล่ของรถแต่ละคัน
                    </p>
                </div>

                {/* ส่วนค้นหาและกรองข้อมูล */}
                <div className="search-filter-section">
                    <div className="search-row">
                        <div className="search-input-group">
                            <label>🔍 ค้นหาทั่วไป</label>
                            <input
                                type="text"
                                placeholder="ค้นหา Serial, หมายเลขรถ, หรือสนาม..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <div className="filter-row">
                        <div className="filter-group">
                            <label>🏌️ สนามกอล์ฟ</label>
                            <select
                                value={filters.golfCourse}
                                onChange={(e) => setFilters({...filters, golfCourse: e.target.value})}
                                className="filter-select"
                            >
                                <option value="">ทุกสนาม</option>
                                {uniqueGolfCourses.map(course => (
                                    <option key={course} value={course}>{course}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>🚗 หมายเลขรถ</label>
                            <input
                                type="text"
                                placeholder="เช่น A01, B02..."
                                value={filters.vehicleNumber}
                                onChange={(e) => setFilters({...filters, vehicleNumber: e.target.value})}
                                className="filter-input"
                            />
                        </div>

                        <div className="filter-group">
                            <label>🏷️ Serial Number</label>
                            <input
                                type="text"
                                placeholder="เช่น KT-20220601..."
                                value={filters.serialNumber}
                                onChange={(e) => setFilters({...filters, serialNumber: e.target.value})}
                                className="filter-input"
                            />
                        </div>
                    </div>

                    <div className="date-filter-row">
                        <div className="filter-group">
                            <label>📅 วันที่เริ่มต้น</label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                                className="filter-input"
                            />
                        </div>

                        <div className="filter-group">
                            <label>📅 วันที่สิ้นสุด</label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                                className="filter-input"
                            />
                        </div>

                        <div className="filter-group">
                            <label>📊 เรียงลำดับตาม</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="filter-select"
                            >
                                <option value="lastUpdate">วันที่อัปเดตล่าสุด</option>
                                <option value="serial">Serial Number</option>
                                <option value="vehicle">หมายเลขรถ</option>
                                <option value="golfCourse">สนามกอล์ฟ</option>
                                <option value="partsCount">จำนวนอะไหล่</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>🔄 ลำดับ</label>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                                className="filter-select"
                            >
                                <option value="desc">มากไปน้อย</option>
                                <option value="asc">น้อยไปมาก</option>
                            </select>
                        </div>
                    </div>

                    {/* ปุ่มล้างตัวกรอง */}
                    <div className="filter-actions">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilters({
                                    golfCourse: '',
                                    vehicleNumber: '',
                                    serialNumber: '',
                                    dateFrom: '',
                                    dateTo: ''
                                });
                            }}
                            className="btn-clear-filters"
                        >
                            🗑️ ล้างตัวกรอง
                        </button>
                        <div className="results-count">
                            📋 พบ {filteredAndSortedSerials.length} รายการ จากทั้งหมด {serialsWithHistory.length} รายการ
                        </div>
                    </div>
                </div>
                
                <div className="serial-grid">
                    {filteredAndSortedSerials.length === 0 ? (
                        <div className="no-data">
                            <div className="no-data-icon">
                                {serialsWithHistory.length === 0 ? '📦' : '🔍'}
                            </div>
                            <h3>
                                {serialsWithHistory.length === 0 
                                    ? 'ยังไม่มีประวัติการใช้อะไหล่' 
                                    : 'ไม่พบข้อมูลที่ตรงกับการค้นหา'
                                }
                            </h3>
                            <p>
                                {serialsWithHistory.length === 0 
                                    ? 'ยังไม่มีข้อมูลการใช้อะไหล่ในระบบ'
                                    : 'ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือล้างตัวกรอง'
                                }
                            </p>
                        </div>
                    ) : (
                        filteredAndSortedSerials.map(serial => {
                            const vehicle = getVehicleBySerial(serial);
                            const golfCourseName = getGolfCourseNameByVehicle(vehicle);
                            const partsCount = getPartsCountBySerial(serial);
                            const latestLog = partsUsageLog
                                .filter(log => log.serialNumber === serial)
                                .sort((a, b) => new Date(b.usedDate).getTime() - new Date(a.usedDate).getTime())[0];

                            return (
                                <div key={serial} className="serial-card">
                                    <div className="serial-card-header">
                                        <div className="serial-info">
                                            <h4 className="serial-number">🏷️ {serial}</h4>
                                            <p className="vehicle-number">🚗 {vehicle?.vehicle_number || 'ไม่ระบุ'}</p>
                                        </div>
                                        <div className="parts-count-badge">
                                            {partsCount} รายการ
                                        </div>
                                    </div>
                                    
                                    <div className="serial-card-body">
                                        <div className="info-row">
                                            <span className="info-label">🏌️ สนาม:</span>
                                            <span className="info-value">{golfCourseName}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">📅 อัปเดตล่าสุด:</span>
                                            <span className="info-value">
                                                {latestLog ? formatDate(latestLog.usedDate) : 'ไม่มีข้อมูล'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="serial-card-footer">
                                        <button 
                                            className="btn-view-history"
                                            onClick={() => handleShowHistory(serial)}
                                        >
                                            📋 ดูประวัติอะไหล่
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modal สำหรับแสดงประวัติอะไหล่ */}
            {showModal && selectedSerial && (
                <PartsHistoryModal 
                    serialNumber={selectedSerial}
                    partsUsageLog={partsUsageLog}
                    onClose={handleCloseModal}
                />
            )}

            <style jsx>{`
                .parts-log-container {
                    padding: 24px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .parts-log-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                    padding-bottom: 16px;
                    border-bottom: 2px solid #e2e8f0;
                }

                .parts-log-header h2 {
                    margin: 0;
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #FFFFFFFF;
                }

                .parts-log-header-actions {
                    display: flex;
                    gap: 12px;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #667eea 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.9rem;
                }

                .btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }

                .btn-outline {
                    background: transparent;
                    color: #DDEAFFFF;
                    border: 2px solid #CFE4FFFF;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.9rem;
                }

                .btn-outline:hover {
                    border-color: #667eea;
                    color: #667eea;
                    transform: translateY(-1px);
                }

                .serial-selection-section {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e2e8f0;
                }

                .selection-header {
                    margin-bottom: 24px;
                    text-align: center;
                }

                .selection-header h3 {
                    margin: 0 0 8px 0;
                    font-size: 1.4rem;
                    font-weight: 600;
                    color: #2d3748;
                }

                .selection-description {
                    margin: 0;
                    color: #718096;
                    font-size: 1rem;
                }

                /* ส่วนค้นหาและกรองข้อมูล */
                .search-filter-section {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e5e7eb;
                }

                .search-row {
                    margin-bottom: 20px;
                }

                .search-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .search-input-group label {
                    font-weight: 600;
                    color: #374151;
                    font-size: 14px;
                }

                .search-input {
                    padding: 12px 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: all 0.2s ease;
                    background: #f9fafb;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .filter-row, .date-filter-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 16px;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .filter-group label {
                    font-weight: 600;
                    color: #374151;
                    font-size: 14px;
                }

                .filter-input, .filter-select {
                    padding: 10px 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    background: white;
                }

                .filter-input:focus, .filter-select:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .filter-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                }

                .btn-clear-filters {
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .btn-clear-filters:hover {
                    background: #dc2626;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                }

                .results-count {
                    font-size: 14px;
                    color: #6b7280;
                    font-weight: 500;
                    background: #f3f4f6;
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: 1px solid #e5e7eb;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .filter-row, .date-filter-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .filter-actions {
                        flex-direction: column;
                        gap: 12px;
                        align-items: stretch;
                    }
                    
                    .results-count {
                        text-align: center;
                    }
                }

                .serial-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 20px;
                }

                .serial-card {
                    background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 20px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }

                .serial-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                    border-color: #667eea;
                }

                .serial-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;
                }

                .serial-info h4 {
                    margin: 0 0 4px 0;
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #2d3748;
                }

                .serial-info p {
                    margin: 0;
                    color: #4a5568;
                    font-size: 0.9rem;
                }

                .parts-count-badge {
                    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.8rem;
                }

                .serial-card-body {
                    margin-bottom: 16px;
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .info-label {
                    font-weight: 600;
                    color: #4a5568;
                    font-size: 0.85rem;
                }

                .info-value {
                    color: #2d3748;
                    font-size: 0.85rem;
                }

                .serial-card-footer {
                    text-align: center;
                }

                .btn-view-history {
                    background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.9rem;
                    width: 100%;
                }

                .btn-view-history:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
                }

                .no-data {
                    grid-column: 1 / -1;
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
            `}</style>
        </div>
    );
}

export default PartsManagementScreen;
