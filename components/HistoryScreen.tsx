'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Job, Vehicle, Part, View, PARTS_BY_SYSTEM_DISPLAY, User, GolfCourse, SerialHistoryEntry } from '@/lib/data';
import StatusBadge from './StatusBadge';
import * as XLSX from 'xlsx';

interface HistoryScreenProps {
    vehicles: Vehicle[];
    jobs: Job[];
    users: User[];
    golfCourses: GolfCourse[];
    serialHistory: SerialHistoryEntry[];
}

const HistoryScreen = ({ vehicles, jobs, users, golfCourses, serialHistory }: HistoryScreenProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVehicle, setFilterVehicle] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterGolfCourse, setFilterGolfCourse] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [sortField, setSortField] = useState<'created_at' | 'vehicle_number' | 'type' | 'status'>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    
    // ใช้ข้อมูลงานจากระบบแทนข้อมูล mock
    // กรองเฉพาะงานที่เสร็จสิ้นแล้วหรืออนุมัติแล้วเพื่อแสดงในประวัติ
    const historyJobs = jobs.filter(job => 
        job.status === 'completed' || 
        job.status === 'approved' || 
        job.status === 'rejected'
    );

    // กรองพนักงานตามสนามที่เลือก
    const filteredUsers = useMemo(() => {
        if (!filterGolfCourse || filterGolfCourse === '') {
            return users; // แสดงพนักงานทั้งหมดถ้าไม่ได้เลือกสนาม
        }
        return users.filter(user => user.golf_course_id === filterGolfCourse);
    }, [users, filterGolfCourse]);

    // Reset filter พนักงานเมื่อเปลี่ยนสนาม
  useEffect(() => {
    if (filterGolfCourse && filterUser) {
      // ตรวจสอบว่าพนักงานที่เลือกอยู่ในสนามใหม่หรือไม่
      const userInSelectedCourse = filteredUsers.find(user => user.id.toString() === filterUser);
      if (!userInSelectedCourse) {
        setFilterUser(''); // reset ถ้าพนักงานไม่อยู่ในสนามที่เลือก
      }
    }
  }, [filterGolfCourse, filteredUsers, filterUser]);

    // Apply filters and sorting
    const filteredAndSortedJobs = useMemo(() => {
        let filtered = historyJobs.filter(job => {
            // Search term filter (search in vehicle number, username, or remarks)
            const searchMatch = searchTerm === '' || 
                job.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (job.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
            
            // Vehicle filter
            const vehicleMatch = filterVehicle === '' || job.vehicle_id.toString() === filterVehicle;
            
            // Status filter
            const statusMatch = filterStatus === '' || job.status === filterStatus;
            
            // Golf Course filter
            const golfCourseMatch = filterGolfCourse === '' || filterGolfCourse === null || filterGolfCourse === undefined || job.golf_course_id === filterGolfCourse;
            
            // User filter
            const userMatch = filterUser === '' || job.user_id === filterUser;
            
            // Date range filter
            const jobDate = new Date((job as any).createdAt || job.created_at);
            const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
            const toDate = filterDateTo ? new Date(filterDateTo) : null;
            
            const dateMatch = 
                (!fromDate || jobDate >= fromDate) && 
                (!toDate || jobDate <= toDate);
            
            return searchMatch && vehicleMatch && statusMatch && golfCourseMatch && userMatch && dateMatch;
        });

        // Sort the filtered results
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (sortField) {
                case 'created_at':
                    aValue = new Date((a as any).createdAt || a.created_at).getTime();
                    bValue = new Date((b as any).createdAt || b.created_at).getTime();
                    break;
                case 'vehicle_number':
                    aValue = a.vehicle_number;
                    bValue = b.vehicle_number;
                    break;
                case 'type':
                    aValue = a.type;
                    bValue = b.type;
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                default:
                    aValue = (a as any).createdAt || a.created_at;
                    bValue = (b as any).createdAt || b.created_at;
            }
            
            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [historyJobs, searchTerm, filterVehicle, filterStatus, filterGolfCourse, filterUser, filterDateFrom, filterDateTo, sortField, sortDirection]);

    // ปรับปรุงฟังก์ชัน getPartName ให้ใช้ part_name ที่บันทึกไว้เป็นหลัก
    const getPartName = (part: { part_id: string; part_name?: string }) => {
        // ใช้ part_name ที่บันทึกไว้เป็นหลัก
        if (part.part_name) {
            return part.part_name;
        }
        
        // หากไม่มี part_name ให้ค้นหาจาก PARTS_BY_SYSTEM_DISPLAY
        for (const system of Object.values(PARTS_BY_SYSTEM_DISPLAY)) {
            const partInfo = system.find((p: any) => p.id === parseInt(part.part_id));
            if (partInfo) {
                return partInfo.name;
            }
        }
        
        return 'ไม่ระบุ';
    };

    const formatDate = (dateString: string | undefined) => {
        try {
            // ตรวจสอบว่า dateString มีค่าหรือไม่
            if (!dateString || dateString === 'null' || dateString === 'undefined') {
                return 'ไม่ระบุวันที่';
            }
            
            const date = new Date(dateString);
            
            // ตรวจสอบว่าเป็น valid date หรือไม่
            if (isNaN(date.getTime())) {
                return 'วันที่ไม่ถูกต้อง';
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
            console.error('Error formatting date:', error, 'Input:', dateString);
            return 'วันที่ไม่ถูกต้อง';
        }
    };

    const formatDateForExcel = (dateString: string | undefined) => {
        try {
            if (!dateString || dateString === 'null' || dateString === 'undefined') {
                return 'ไม่ระบุวันที่';
            }
            
            const date = new Date(dateString);
            
            if (isNaN(date.getTime())) {
                return 'วันที่ไม่ถูกต้อง';
            }
            
            return date.toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Bangkok' // ระบุ timezone ไทยอย่างชัดเจน
            });
        } catch (error) {
            console.error('Error formatting date for Excel:', error, 'Input:', dateString);
            return 'วันที่ไม่ถูกต้อง';
        }
    };

    // ฟังก์ชันแปลงชื่อระบบให้เป็นภาษาไทย
    const getSystemDisplayName = (system: string) => {
        const systemNames: Record<string, string> = {
            'brake': 'ระบบเบรก/เพื่อห้าม',
            'steering': 'ระบบพวงมาลัย', 
            'motor': 'ระบบมอเตอร์/เพื่อขับ',
            'electric': 'ระบบไฟฟ้า',
            'general': 'ทั่วไป',
            'suspension': 'ช่วงล่างและพวงมาลัย'
        };
        return systemNames[system] || system;
    };

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            'completed': 'เสร็จสิ้น',
            'approved': 'อนุมัติแล้ว',
            'rejected': 'ไม่อนุมัติ'
        };
        return statusMap[status] || status;
    };

    const getGolfCourseName = (id: string) => {
        const course = golfCourses.find(c => c.id === id);
        return course ? course.name : 'ไม่ระบุ';
    };

    const getUserName = (id: string) => {
        const user = users.find(u => u.id.toString() === id);
        return user ? user.name : 'ไม่ระบุ';
    };

    const getVehicleSerial = (vehicleId: string) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        return vehicle ? vehicle.serial_number : '-';
    };

    const handleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const toggleRowExpansion = (jobId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(jobId)) {
            newExpanded.delete(jobId);
        } else {
            newExpanded.add(jobId);
        }
        setExpandedRows(newExpanded);
    };

    const exportToExcel = () => {
        const exportData = filteredAndSortedJobs.map(job => ({
            'วันที่': formatDateForExcel((job as any).createdAt || job.created_at),
            'เบอร์รถ': job.vehicle_number,
            'Serial รถ': getVehicleSerial(job.vehicle_id),
            'Serial แบต': job.battery_serial || getVehicleSerial(job.vehicle_id),
            'สนาม': getGolfCourseName(job.golf_course_id),
            'ประเภทงาน': job.type,
            'ระบบ': job.system ? getSystemDisplayName(job.system) : '-',
            'อะไหล่ที่ใช้': job.parts && job.parts.length > 0 ? 
                job.parts.map(p => `${getPartName(p)} (จำนวน ${p.quantity_used})`).join(', ') : '-',
            'บันทึกอะไหล่': job.partsNotes || '-',
            'ผู้ดำเนินการ': job.userName,
            'สถานะ': getStatusText(job.status),
            'หมายเหตุ': job.remarks || '-',
            'มอบหมายโดย': job.assigned_by_name || '-',
            'วันที่อัปเดต': ((job as any).updatedAt || job.updated_at) && ((job as any).updatedAt || job.updated_at) !== ((job as any).createdAt || job.created_at) ? formatDateForExcel((job as any).updatedAt || job.updated_at) : '-'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'ประวัติการซ่อมบำรุง');
        
        // Set column widths
        const colWidths = [
            { wch: 15 }, // วันที่
            { wch: 10 }, // เบอร์รถ
            { wch: 15 }, // Serial รถ
            { wch: 15 }, // Serial แบต
            { wch: 20 }, // สนาม
            { wch: 12 }, // ประเภทงาน
            { wch: 20 }, // ระบบ
            { wch: 35 }, // อะไหล่ที่ใช้
            { wch: 25 }, // บันทึกอะไหล่
            { wch: 20 }, // ผู้ดำเนินการ
            { wch: 12 }, // สถานะ
            { wch: 25 }, // หมายเหตุ
            { wch: 20 }, // มอบหมายโดย
            { wch: 15 }  // วันที่อัปเดต
        ];
        ws['!cols'] = colWidths;

        const fileName = `ประวัติการซ่อมบำรุง_${new Date().toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }).replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const getSortIcon = (field: typeof sortField) => {
        if (sortField !== field) return '↕️';
        return sortDirection === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="card">
            <div className="page-header">
                <h2>ประวัติการซ่อมบำรุง</h2>
                <div className="header-actions">
                    <button 
                        className="btn-primary" 
                        onClick={exportToExcel}
                        disabled={filteredAndSortedJobs.length === 0}
                    >
                        📊 Export Excel
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="filter-section">
                <div className="search-box">
                    <input 
                        type="text" 
                        placeholder="ค้นหาตามเบอร์รถ, ชื่อพนักงาน, หมายเหตุ" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
                
                <div className="filter-controls">
                    <div className="filter-group">
                        <label>สนาม:</label>
                        <select value={filterGolfCourse} onChange={(e) => setFilterGolfCourse(e.target.value)}>
                            <option value="">ทั้งหมด</option>
                            {golfCourses.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>พนักงาน:</label>
                        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                            <option value="">ทั้งหมด</option>
                            {filteredUsers.map(user => (
                                <option key={user.id} value={user.id.toString()}>
                                    {user.name} ({user.code})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label>รถ:</label>
                        <select value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)}>
                            <option value="">ทั้งหมด</option>
                            {vehicles.map(vehicle => (
                                <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.vehicle_number} ({vehicle.serial_number})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label>สถานะ:</label>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="">ทั้งหมด</option>
                            <option value="completed">เสร็จสิ้น</option>
                            <option value="approved">อนุมัติแล้ว</option>
                            <option value="rejected">ไม่อนุมัติ</option>
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label>ตั้งแต่วันที่:</label>
                        <input 
                            type="date" 
                            value={filterDateFrom} 
                            onChange={(e) => setFilterDateFrom(e.target.value)} 
                        />
                    </div>
                    
                    <div className="filter-group">
                        <label>ถึงวันที่:</label>
                        <input 
                            type="date" 
                            value={filterDateTo} 
                            onChange={(e) => setFilterDateTo(e.target.value)} 
                        />
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="summary-section">
                <p>แสดงผลลัพธ์: <strong>{filteredAndSortedJobs.length}</strong> รายการ จากทั้งหมด <strong>{historyJobs.length}</strong> รายการ</p>
            </div>

            {/* Table */}
            <div className="table-container">
                {filteredAndSortedJobs.length === 0 ? (
                    <div className="no-data">
                        <div className="no-data-icon">📋</div>
                        <h3>ไม่พบข้อมูลประวัติการซ่อมบำรุง</h3>
                        <p>ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</p>
                        <p className="text-muted">ประวัติจะแสดงเมื่องานได้รับการอนุมัติหรือเสร็จสิ้นแล้ว</p>
                    </div>
                ) : (
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th 
                                    className="sortable" 
                                    onClick={() => handleSort('created_at')}
                                >
                                    วันที่ {getSortIcon('created_at')}
                                </th>
                                <th 
                                    className="sortable" 
                                    onClick={() => handleSort('vehicle_number')}
                                >
                                    เบอร์รถ {getSortIcon('vehicle_number')}
                                </th>
                                <th>Serial รถ</th>
                                <th>สนาม</th>
                                <th 
                                    className="sortable" 
                                    onClick={() => handleSort('type')}
                                >
                                    ประเภท {getSortIcon('type')}
                                </th>
                                <th>ระบบ</th>
                                <th>อะไหล่ที่ใช้</th>
                                <th>ผู้ดำเนินการ</th>
                                <th 
                                    className="sortable" 
                                    onClick={() => handleSort('status')}
                                >
                                    สถานะ {getSortIcon('status')}
                                </th>
                                <th>การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedJobs.map(job => (
                                <React.Fragment key={job.id}>
                                    <tr className="main-row">
                                        <td>
                                            <button 
                                                className="expand-btn"
                                                onClick={() => toggleRowExpansion(job.id)}
                                            >
                                                {expandedRows.has(job.id) ? '▼' : '▶'}
                                            </button>
                                        </td>
                                        <td>{formatDate((job as any).createdAt || job.created_at)}</td>
                                        <td className="vehicle-number">{job.vehicle_number}</td>
                                        <td>{getVehicleSerial(job.vehicle_id)}</td>
                                        <td>{getGolfCourseName(job.golf_course_id)}</td>
                                        <td>
                                            <span className={`job-type ${job.type.toLowerCase()}`}>
                                                {job.type}
                                            </span>
                                        </td>
                                        <td>{job.system ? getSystemDisplayName(job.system) : '-'}</td>
                                        <td className="parts-summary">
                                            {job.parts && job.parts.length > 0 ? (
                                                <div className="parts-preview">
                                                    {job.parts.slice(0, 2).map((part, index) => (
                                                        <span key={`${job.id}-${part.part_id}-${index}`} className="part-item">
                                                            {getPartName(part)} ({part.quantity_used})
                                                        </span>
                                                    ))}
                                                    {job.parts.length > 2 && (
                                                        <span className="more-parts">และอีก {job.parts.length - 2} รายการ</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="no-parts">-</span>
                                            )}
                                        </td>
                                        <td>{job.userName}</td>
                                        <td>
                                            <StatusBadge status={job.status} />
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-sm btn-outline">
                                                    📄 รายงาน
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {expandedRows.has(job.id) && (
                                        <tr className="expanded-row">
                                            <td colSpan={11}>
                                                <div className="expanded-content">
                                                    <div className="detail-grid">
                                                        <div className="detail-section">
                                                            <h4>รายละเอียดงาน</h4>
                                                            <div className="detail-item">
                                                                <strong>Serial แบต:</strong> {job.battery_serial || getVehicleSerial(job.vehicle_id)}
                                                            </div>
                                                            {job.subTasks && job.subTasks.length > 0 && (
                                                                <div className="detail-item">
                                                                    <strong>งานย่อย:</strong> {job.subTasks.join(', ')}
                                                                </div>
                                                            )}
                                                            {job.remarks && (
                                                                <div className="detail-item">
                                                                    <strong>หมายเหตุ:</strong> {job.remarks}
                                                                </div>
                                                            )}
                                                            {job.assigned_by_name && (
                                                                <div className="detail-item">
                                                                    <strong>มอบหมายโดย:</strong> {job.assigned_by_name}
                                                                </div>
                                                            )}
                                                            {((job as any).updatedAt || job.updated_at) && ((job as any).updatedAt || job.updated_at) !== ((job as any).createdAt || job.created_at) && (
                                                <div className="detail-item">
                                                    <strong>อัปเดตล่าสุด:</strong> {formatDate((job as any).updatedAt || job.updated_at)}
                                                </div>
                                            )}
                                                        </div>

                                                        {job.parts && job.parts.length > 0 && (
                                                            <div className="detail-section">
                                                                <h4>อะไหล่ที่ใช้</h4>
                                                                <ul className="parts-list">
                                                                    {job.parts.map((part, index) => (
                                                                        <li key={`${job.id}-${part.part_id}-${index}`}>
                                                                            {getPartName(part)} (จำนวน {part.quantity_used})
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                {job.partsNotes && (
                                                                    <div className="detail-item">
                                                                        <strong>บันทึกอะไหล่:</strong> {job.partsNotes}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {job.images && job.images.length > 0 && (
                                                            <div className="detail-section">
                                                                <h4>รูปภาพ</h4>
                                                                <div className="image-gallery">
                                                                    {job.images.map((image, index) => (
                                                                        <div key={`image-${job.id}-${index}-${image.slice(-10)}`} className="image-item">
                                                                            <Image 
                                                                                src={image} 
                                                                                alt={`รูปภาพงาน ${index + 1}`}
                                                                                className="job-image"
                                                                                width={150}
                                                                                height={100}
                                                                                onClick={() => window.open(image, '_blank')}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style jsx>{`
                .header-actions {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .filter-section {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }

                .filter-controls {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-top: 15px;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .filter-group label {
                    font-weight: 500;
                    color: #495057;
                    font-size: 14px;
                }

                .filter-group select,
                .filter-group input {
                    padding: 8px 12px;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .summary-section {
                    margin-bottom: 20px;
                    padding: 10px 0;
                    color: #6c757d;
                }

                .table-container {
                    overflow-x: auto;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .history-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    min-width: 1200px;
                }

                .history-table th {
                    background: #f8f9fa;
                    padding: 12px 8px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 2px solid #dee2e6;
                    white-space: nowrap;
                    font-size: 14px;
                }

                .history-table th.sortable {
                    cursor: pointer;
                    user-select: none;
                    transition: background-color 0.2s;
                }

                .history-table th.sortable:hover {
                    background: #e9ecef;
                }

                .history-table td {
                    padding: 12px 8px;
                    border-bottom: 1px solid #dee2e6;
                    vertical-align: top;
                    font-size: 14px;
                }

                .main-row:hover {
                    background: #f8f9fa;
                }

                .expanded-row {
                    background: #f8f9fa;
                }

                .expanded-content {
                    padding: 20px;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    margin: 10px;
                    background: white;
                }

                .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }

                .detail-section h4 {
                    margin: 0 0 10px 0;
                    color: #495057;
                    font-size: 16px;
                    border-bottom: 1px solid #dee2e6;
                    padding-bottom: 5px;
                }

                .detail-item {
                    margin-bottom: 8px;
                    line-height: 1.4;
                }

                .parts-list {
                    margin: 0;
                    padding-left: 20px;
                }

                .parts-list li {
                    margin-bottom: 4px;
                }

                .parts-summary {
                    max-width: 200px;
                }

                .parts-preview {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .part-item {
                    font-size: 12px;
                    background: #e3f2fd;
                    color: #1565c0;
                    padding: 2px 6px;
                    border-radius: 10px;
                    display: inline-block;
                    margin-right: 4px;
                    margin-bottom: 2px;
                }

                .more-parts {
                    font-size: 11px;
                    color: #6c757d;
                    font-style: italic;
                }

                .no-parts {
                    color: #6c757d;
                    font-style: italic;
                }

                .image-gallery {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .image-item {
                    border-radius: 4px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .image-item:hover {
                    transform: scale(1.05);
                }

                .job-image {
                    object-fit: cover;
                    border-radius: 4px;
                }

                .expand-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 14px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }

                .expand-btn:hover {
                    background: #e9ecef;
                }

                .vehicle-number {
                    font-weight: 600;
                    color: #495057;
                }

                .job-type {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .job-type.pm {
                    background: #d4edda;
                    color: #155724;
                }

                .job-type.bm {
                    background: #f8d7da;
                    color: #721c24;
                }

                .job-type.recondition {
                    background: #d1ecf1;
                    color: #0c5460;
                }

                .action-buttons {
                    display: flex;
                    gap: 5px;
                }

                .btn-sm {
                    padding: 4px 8px;
                    font-size: 12px;
                    border-radius: 4px;
                }

                .no-data {
                    text-align: center;
                    padding: 60px 20px;
                    color: #6c757d;
                }

                .no-data-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .no-data h3 {
                    margin: 0 0 8px 0;
                    color: #495057;
                }

                .no-data p {
                    margin: 4px 0;
                }

                .text-muted {
                    color: #6c757d !important;
                    font-size: 14px;
                }

                @media (max-width: 768px) {
                    .filter-controls {
                        grid-template-columns: 1fr;
                    }
                    
                    .header-actions {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .detail-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default HistoryScreen;