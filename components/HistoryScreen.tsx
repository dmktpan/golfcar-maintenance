'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Job, Vehicle, Part, PARTS_BY_SYSTEM_DISPLAY, User, GolfCourse } from '@/lib/data';
import StatusBadge from './StatusBadge';
import * as XLSX from 'xlsx';

interface HistoryScreenProps {
    vehicles: Vehicle[];
    jobs: Job[];
    users: User[];
    golfCourses: GolfCourse[];
    parts: Part[]; // เพิ่ม props parts
}

interface PartsUsageLog {
    id: string;
    jobId: string;
    partId: string;
    partName: string;
    quantityUsed: number;
    vehicleNumber: string;
    usedBy: string;
    usedDate: string;
}

interface PartsModalProps {
    isOpen: boolean;
    onClose: () => void;
    parts: PartsUsageLog[];
    allParts: Part[]; // เพิ่ม props allParts
}

const HistoryScreen = ({ vehicles, jobs, users, golfCourses, parts }: HistoryScreenProps) => {
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
    const [partsData, setPartsData] = useState<Map<string, PartsUsageLog[]>>(new Map());
    const [partsModalOpen, setPartsModalOpen] = useState(false);
    const [selectedJobParts, setSelectedJobParts] = useState<PartsUsageLog[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string>('');

    // ใช้ข้อมูลงานจากระบบแทนข้อมูล mock
    // กรองเฉพาะงานที่เสร็จสิ้นแล้วหรืออนุมัติแล้วเพื่อแสดงในประวัติ
    const historyJobs = jobs.filter(job =>
        job.status === 'completed' ||
        job.status === 'approved' ||
        job.status === 'rejected'
    );

    // ฟังก์ชันดึงข้อมูล parts usage logs
    const fetchPartsData = async () => {
        try {
            console.log('🔍 Fetching parts usage logs...');
            const response = await fetch('/api/proxy/parts-usage-logs');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            console.log('📦 Parts usage logs response:', result);

            if (result.success && result.data) {
                // สร้าง Map ของ parts โดยใช้ jobId เป็น key
                const partsMap = new Map<string, PartsUsageLog[]>();

                result.data.forEach((log: any) => {
                    if (log.jobId) {
                        const partsLog: PartsUsageLog = {
                            id: log.id,
                            jobId: log.jobId,
                            partId: log.partId,
                            partName: log.partName,
                            quantityUsed: log.quantityUsed,
                            vehicleNumber: log.vehicleNumber,
                            usedBy: log.usedBy,
                            usedDate: log.usedDate
                        };

                        if (!partsMap.has(log.jobId)) {
                            partsMap.set(log.jobId, []);
                        }
                        partsMap.get(log.jobId)!.push(partsLog);
                    }
                });

                console.log('🔧 Parts map created:', partsMap);
                setPartsData(partsMap);
            }
        } catch (error) {
            console.error('❌ Error fetching parts data:', error);
        }
    };

    // โหลดข้อมูล parts เมื่อ component mount
    useEffect(() => {
        fetchPartsData();
    }, []);

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
        const filtered = historyJobs.filter(job => {
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
        console.log('🔍 getPartName called with:', part);

        // ใช้ part_name ที่บันทึกไว้เป็นหลัก
        if (part.part_name) {
            console.log('✅ Found part_name:', part.part_name);
            return part.part_name;
        }

        console.log('⚠️ No part_name, searching in PARTS_BY_SYSTEM_DISPLAY for part_id:', part.part_id);
        console.log('📊 PARTS_BY_SYSTEM_DISPLAY:', PARTS_BY_SYSTEM_DISPLAY);

        // หากไม่มี part_name ให้ค้นหาจาก PARTS_BY_SYSTEM_DISPLAY
        for (const [systemName, system] of Object.entries(PARTS_BY_SYSTEM_DISPLAY)) {
            console.log(`🔍 Searching in system ${systemName}:`, system);
            const partInfo = system.find((p: any) => p.id.toString() === part.part_id.toString());
            if (partInfo) {
                console.log('✅ Found in PARTS_BY_SYSTEM_DISPLAY:', partInfo.name);
                return partInfo.name;
            }
        }

        console.log('❌ Part not found, returning default');
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

    const exportToExcel = async () => {
        console.log('🔍 Debug Excel Export - Sample jobs data:', filteredAndSortedJobs.slice(0, 3).map(job => ({
            id: job.id,
            vehicle_number: job.vehicle_number,
            parts: job.parts,
            partsLength: job.parts?.length || 0
        })));

        try {
            // ดึงข้อมูล parts usage logs
            console.log('🔧 Fetching parts usage logs...');
            const partsResponse = await fetch('/api/proxy/parts-usage-logs');
            const partsData = await partsResponse.json();
            console.log('🔧 Parts usage logs response:', partsData);

            // สร้าง map ของ parts ตาม jobId
            const partsMap = new Map();
            if (partsData.success && partsData.data && Array.isArray(partsData.data)) {
                partsData.data.forEach((partLog: any) => {
                    if (partLog.jobId) {
                        if (!partsMap.has(partLog.jobId)) {
                            partsMap.set(partLog.jobId, []);
                        }
                        partsMap.get(partLog.jobId).push(partLog);
                    }
                });
            }
            console.log('🔧 Parts map created:', partsMap.size, 'jobs have parts');

            const exportData = filteredAndSortedJobs.map(job => {
                // ดึงข้อมูล parts จาก parts usage logs
                const jobParts = partsMap.get(job.id) || [];
                console.log(`🔧 Job ${job.vehicle_number} (${job.id}) parts from logs:`, jobParts);

                // Helper to find part info
                const getPartInfo = (partId: string) => {
                    return parts.find(p => p.id === partId);
                };

                // สร้างข้อความอะไหล่ที่ใช้
                let partsText = '-';
                if (jobParts.length > 0) {
                    partsText = jobParts.map((partLog: any) => {
                        const partInfo = getPartInfo(partLog.partId);
                        const partCode = partInfo?.part_number ? `${partInfo.part_number} - ` : '';
                        const partName = partLog.partName || getPartName({ part_id: partLog.partId });
                        const unit = partInfo?.unit || 'ชิ้น';
                        return `${partCode}${partName} ${partLog.quantityUsed || 1} ${unit}`;
                    }).join(', ');
                } else if (job.parts && job.parts.length > 0) {
                    // fallback ใช้ข้อมูลจาก job.parts ถ้ามี
                    partsText = job.parts.map(p => {
                        const partInfo = getPartInfo(p.part_id);
                        const partCode = partInfo?.part_number ? `${partInfo.part_number} - ` : '';
                        const partName = getPartName(p);
                        const unit = partInfo?.unit || 'ชิ้น';
                        return `${partCode}${partName} ${p.quantity_used} ${unit}`;
                    }).join(', ');
                } else if ((job as any).parts_used && Array.isArray((job as any).parts_used) && (job as any).parts_used.length > 0) {
                    // fallback ใช้ข้อมูลจาก job.parts_used ถ้ามี
                    partsText = (job as any).parts_used.join(', ');
                }

                return {
                    'วันที่': formatDateForExcel((job as any).createdAt || job.created_at),
                    'เบอร์รถ': job.vehicle_number,
                    'Serial รถ': getVehicleSerial(job.vehicle_id),
                    'Serial แบต': job.battery_serial || getVehicleSerial(job.vehicle_id),
                    'สนาม': getGolfCourseName(job.golf_course_id),
                    'ประเภทงาน': job.type,
                    'ระบบ': job.system ? getSystemDisplayName(job.system) : '-',
                    'อะไหล่ที่ใช้': partsText,
                    'บันทึกอะไหล่': job.partsNotes || '-',
                    'ผู้ดำเนินการ': job.userName,
                    'สถานะ': getStatusText(job.status),
                    'หมายเหตุ': job.remarks || '-',
                    'วันที่อัปเดต': ((job as any).updatedAt || job.updated_at) && ((job as any).updatedAt || job.updated_at) !== ((job as any).createdAt || job.created_at) ? formatDateForExcel((job as any).updatedAt || job.updated_at) : '-'
                };
            });

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
                { wch: 15 }  // วันที่อัปเดต
            ];
            ws['!cols'] = colWidths;

            const fileName = `ประวัติการซ่อมบำรุง_${new Date().toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }).replace(/\//g, '-')}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error('❌ Error exporting to Excel:', error);
            alert('เกิดข้อผิดพลาดในการ export ข้อมูล');
        }
    };

    const getSortIcon = (field: typeof sortField) => {
        if (sortField !== field) return '↕️';
        return sortDirection === 'asc' ? '↑' : '↓';
    };

    // ฟังก์ชันเปิด parts modal
    const openPartsModal = (jobId: string) => {
        const jobParts = partsData.get(jobId) || [];
        setSelectedJobParts(jobParts);
        setSelectedJobId(jobId);
        setPartsModalOpen(true);
    };

    // ฟังก์ชันปิด parts modal
    const closePartsModal = () => {
        setPartsModalOpen(false);
        setSelectedJobParts([]);
        setSelectedJobId('');
    };

    // Parts Modal Component
    const PartsModal = ({ isOpen, onClose, parts, allParts }: PartsModalProps) => {
        if (!isOpen) return null;

        // Helper function to find part code
        const getPartCode = (partId: string) => {
            const part = allParts.find(p => p.id === partId);
            return part ? part.part_number : '-';
        };

        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>🔧 อะไหล่ที่ใช้ในงาน</h3>
                        <button className="modal-close" onClick={onClose}>×</button>
                    </div>
                    <div className="modal-body">
                        {parts.length > 0 ? (
                            <div className="parts-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>รหัสอะไหล่</th>
                                            <th>ชื่ออะไหล่</th>
                                            <th>จำนวน</th>
                                            <th>ใช้โดย</th>
                                            <th>วันที่ใช้</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parts.map((part) => (
                                            <tr key={part.id}>
                                                <td>{getPartCode(part.partId)}</td>
                                                <td className="part-name">{part.partName}</td>
                                                <td className="quantity">{part.quantityUsed}</td>
                                                <td>{part.usedBy}</td>
                                                <td>{formatDate(part.usedDate)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="no-parts-message">
                                <div className="no-parts-icon">📦</div>
                                <p>ไม่มีข้อมูลอะไหล่สำหรับงานนี้</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
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
                                            {(() => {
                                                const jobParts = partsData.get(job.id) || [];
                                                if (jobParts.length > 0) {
                                                    return (
                                                        <button
                                                            className="parts-button"
                                                            onClick={() => openPartsModal(job.id)}
                                                        >
                                                            🔧 {jobParts.length} รายการ
                                                        </button>
                                                    );
                                                } else {
                                                    return <span className="no-parts">-</span>;
                                                }
                                            })()}
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

                                                        {(() => {
                                                            const jobParts = partsData.get(job.id) || [];
                                                            if (jobParts.length > 0) {
                                                                return (
                                                                    <div className="detail-section">
                                                                        <h4>อะไหล่ที่ใช้</h4>
                                                                        <ul className="parts-list">
                                                                            {jobParts.map((part) => (
                                                                                <li key={part.id}>
                                                                                    {part.partName} (จำนวน {part.quantityUsed})
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                        {job.partsNotes && (
                                                                            <div className="detail-item">
                                                                                <strong>บันทึกอะไหล่:</strong> {job.partsNotes}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })()}

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

            {/* Parts Modal */}
            <PartsModal
                isOpen={partsModalOpen}
                onClose={closePartsModal}
                parts={selectedJobParts}
                allParts={parts}
            />

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

                .parts-button {
                    background: #e3f2fd;
                    color: #1565c0;
                    border: 1px solid #bbdefb;
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }

                .parts-button:hover {
                    background: #bbdefb;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }

                .modal-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 80vh;
                    overflow: hidden;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    animation: modalSlideIn 0.3s ease-out;
                }

                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid #dee2e6;
                    background: #f8f9fa;
                }

                .modal-header h3 {
                    margin: 0;
                    color: #495057;
                    font-size: 18px;
                    font-weight: 600;
                }

                .modal-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #6c757d;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .modal-close:hover {
                    background: #e9ecef;
                    color: #495057;
                }

                .modal-body {
                    padding: 24px;
                    max-height: 60vh;
                    overflow-y: auto;
                }

                .parts-table table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 0;
                }

                .parts-table th {
                    background: #f8f9fa;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 2px solid #dee2e6;
                    color: #495057;
                    font-size: 14px;
                }

                .parts-table td {
                    padding: 12px;
                    border-bottom: 1px solid #dee2e6;
                    font-size: 14px;
                }

                .parts-table .part-name {
                    font-weight: 500;
                    color: #495057;
                }

                .parts-table .quantity {
                    text-align: center;
                    font-weight: 600;
                    color: #1565c0;
                }

                .no-parts-message {
                    text-align: center;
                    padding: 40px 20px;
                    color: #6c757d;
                }

                .no-parts-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .no-parts-message p {
                    margin: 0;
                    font-size: 16px;
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