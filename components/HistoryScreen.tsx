'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Job, Vehicle, Part, PARTS_BY_SYSTEM_DISPLAY, User, GolfCourse } from '@/lib/data';
import RequisitionModal from './RequisitionModal';
import StatusBadge from './StatusBadge';
import MWRDetailsModal from './MWRDetailsModal';
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

const HistoryScreen = ({ vehicles, jobs, users, golfCourses, parts }: HistoryScreenProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [historyTab, setHistoryTab] = useState<'repair' | 'parts'>('repair');
    const [filterVehicle, setFilterVehicle] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
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
    const [isRequisitionOpen, setIsRequisitionOpen] = useState(false);
    const [selectedJobForRequisition, setSelectedJobForRequisition] = useState<Job | null>(null);
    const [isGeneratingRequisition, setIsGeneratingRequisition] = useState(false);

    // MWR Details Modal
    const [isMWRModalOpen, setIsMWRModalOpen] = useState(false);
    const [selectedMWR, setSelectedMWR] = useState<Job | null>(null);

    // ใช้ข้อมูลงานจากระบบแทนข้อมูล mock
    // กรองเฉพาะงานที่เสร็จสิ้นแล้วหรืออนุมัติแล้วเพื่อแสดงในประวัติ
    const historyJobs = jobs.filter(job =>
        job.status === 'completed' ||
        job.status === 'approved' ||
        job.status === 'rejected' ||
        job.status === 'stock_pending'
    );

    // ฟังก์ชันดึงข้อมูล parts usage logs
    const fetchPartsData = async () => {
        try {
            console.log('🔍 Fetching parts usage logs...');
            const response = await fetch('/api/proxy/parts-usage-logs');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} `);
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

    // กรองรถตามสนามที่เลือก
    const filteredVehicles = useMemo(() => {
        if (!filterGolfCourse || filterGolfCourse === '') {
            return vehicles; // แสดงรถทั้งหมดถ้าไม่ได้เลือกสนาม
        }
        return vehicles.filter(vehicle => vehicle.golf_course_id === filterGolfCourse);
    }, [vehicles, filterGolfCourse]);

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

    // Reset filter รถเมื่อเปลี่ยนสนาม
    useEffect(() => {
        if (filterGolfCourse && filterVehicle) {
            // ตรวจสอบว่ารถที่เลือกอยู่ในสนามใหม่หรือไม่
            const vehicleInSelectedCourse = filteredVehicles.find(vehicle => vehicle.id.toString() === filterVehicle);
            if (!vehicleInSelectedCourse) {
                setFilterVehicle(''); // reset ถ้ารถไม่อยู่ในสนามที่เลือก
            }
        }
    }, [filterGolfCourse, filteredVehicles, filterVehicle]);

    // Apply filters and sorting
    const filteredAndSortedJobs = useMemo(() => {
        const filtered = historyJobs.filter(job => {
            // Search term filter (search in vehicle number, username, or remarks)
            const searchMatch = searchTerm === '' ||
                (job.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                job.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (job.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

            // Vehicle filter
            const vehicleMatch = filterVehicle === '' || (job.vehicle_id ? job.vehicle_id.toString() === filterVehicle : false);

            // Status filter
            const statusMatch = filterStatus === '' || job.status === filterStatus;

            // Type filter
            const typeMatch = filterType === '' || job.type === filterType;

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

            return searchMatch && vehicleMatch && statusMatch && typeMatch && golfCourseMatch && userMatch && dateMatch;
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
    }, [historyJobs, searchTerm, filterVehicle, filterStatus, filterType, filterGolfCourse, filterUser, filterDateFrom, filterDateTo, sortField, sortDirection]);

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
            console.log(`🔍 Searching in system ${systemName}: `, system);
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
            'steering': 'ระบบบังคับเลี้ยว',
            'motor': 'ระบบมอเตอร์/เพื่อขับ',
            'electric': 'ระบบไฟฟ้า',
            'general': 'ทั่วไป',
            'suspension': 'ช่วงล่างและพวงมาลัย',
            'job': 'งานทั่วไป', // Map 'job' to 'General Job'
            'Test System': 'ทดสอบระบบ'
        };
        return systemNames[system] || system;
    };

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            'completed': 'เสร็จสิ้น',
            'approved': 'อนุมัติแล้ว',
            'rejected': 'ไม่อนุมัติ',
            'stock_pending': 'รอตัดสต๊อก (MWR)'
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
                console.log(`🔧 Job ${job.vehicle_number} (${job.id}) parts from logs: `, jobParts);

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
                        return `${partCode}${partName} ${partLog.quantityUsed || 1} ${unit} `;
                    }).join(', ');
                } else if (job.parts && job.parts.length > 0) {
                    // fallback ใช้ข้อมูลจาก job.parts ถ้ามี
                    partsText = job.parts.map(p => {
                        const partInfo = getPartInfo(p.part_id);
                        const partCode = partInfo?.part_number ? `${partInfo.part_number} - ` : '';
                        const partName = getPartName(p);
                        const unit = partInfo?.unit || 'ชิ้น';
                        return `${partCode}${partName} ${p.quantity_used} ${unit} `;
                    }).join(', ');
                } else if ((job as any).parts_used && Array.isArray((job as any).parts_used) && (job as any).parts_used.length > 0) {
                    // fallback ใช้ข้อมูลจาก job.parts_used ถ้ามี
                    partsText = (job as any).parts_used.join(', ');
                }

                return {
                    'วันที่': formatDateForExcel((job as any).createdAt || job.created_at),
                    'เบอร์รถ': job.vehicle_number,
                    'Serial รถ': job.vehicle_id ? getVehicleSerial(job.vehicle_id) : '-',
                    'Serial แบต': job.battery_serial || (job.vehicle_id ? getVehicleSerial(job.vehicle_id) : '-'),
                    'สนาม': getGolfCourseName(job.golf_course_id),
                    'ประเภทงาน': job.type,
                    'ระบบ': job.type === 'BM' ? 'ซ่อมด่วน' : job.type === 'Recondition' ? 'ปรับสภาพ' : job.system ? getSystemDisplayName(job.system) : '-',
                    'อะไหล่ที่ใช้': partsText,
                    'หมายเหตุอะไหล่': job.partsNotes || '-',
                    'ผู้ดำเนินการ': job.userName,
                    'สถานะ': getStatusText(job.status),
                    'ผู้อนุมัติ': job.approved_by_name || '-',
                    'วันที่อนุมัติ': job.approved_at ? formatDateForExcel(job.approved_at) : '-',
                    'เหตุผลที่ไม่อนุมัติ': job.rejection_reason || '-',
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
                { wch: 25 }, // หมายเหตุอะไหล่
                { wch: 20 }, // ผู้ดำเนินการ
                { wch: 12 }, // สถานะ
                { wch: 20 }, // ผู้อนุมัติ
                { wch: 15 }, // วันที่อนุมัติ
                { wch: 25 }, // เหตุผลที่ไม่อนุมัติ
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
        setPartsModalOpen(true);
    };

    const handleGenerateReport = async (job: Job) => {
        if (job.status !== 'approved') return;

        setSelectedJobForRequisition(job);
        setIsRequisitionOpen(true);

        if (!job.prrNumber) {
            setIsGeneratingRequisition(true);
            try {
                const response = await fetch('/api/jobs/requisition', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jobId: job.id })
                });
                const data = await response.json();
                if (data.success) {
                    // Update the local job object with the new prrNumber
                    job.prrNumber = data.prrNumber;
                }
            } catch (error) {
                console.error("Failed to generate PRR:", error);
            } finally {
                setIsGeneratingRequisition(false);
            }
        }
    };

    // ฟังก์ชันปิด parts modal
    const closePartsModal = () => {
        setPartsModalOpen(false);
        setSelectedJobParts([]);
    };

    const closeRequisitionModal = () => {
        setIsRequisitionOpen(false);
        setSelectedJobForRequisition(null);
    };

    const openMWRModal = (job: Job) => {
        setSelectedMWR(job);
        setIsMWRModalOpen(true);
    };

    const closeMWRModal = () => {
        setIsMWRModalOpen(false);
        setSelectedMWR(null);
    };

    // Parts Modal Component
    const PartsModal = ({ isOpen, onClose, parts, allParts }: {
        isOpen: boolean,
        onClose: () => void,
        parts: PartsUsageLog[],
        allParts: any[]
    }) => {
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

    // แยก jobs ตาม tab
    const repairJobs = filteredAndSortedJobs.filter(j => j.type !== 'PART_REQUEST');
    const partRequestJobs = filteredAndSortedJobs.filter(j => j.type === 'PART_REQUEST');
    const displayedJobs = historyTab === 'repair' ? repairJobs : partRequestJobs;

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

            {/* === TAB SELECTOR === */}
            <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e2e8f0', marginBottom: '1rem' }}>
                <button
                    onClick={() => setHistoryTab('repair')}
                    style={{
                        padding: '0.75rem 1.5rem', border: 'none', cursor: 'pointer',
                        fontWeight: historyTab === 'repair' ? '700' : '500',
                        fontSize: '0.95rem',
                        color: historyTab === 'repair' ? '#1e40af' : '#64748b',
                        background: 'transparent',
                        borderBottom: historyTab === 'repair' ? '3px solid #1e40af' : '3px solid transparent',
                        marginBottom: '-2px', transition: 'all 0.2s'
                    }}
                >
                    🔧 ประวัติการซ่อม
                    <span style={{
                        marginLeft: '0.5rem', padding: '0.15rem 0.5rem', borderRadius: '1rem',
                        fontSize: '0.75rem', fontWeight: '700',
                        background: historyTab === 'repair' ? '#dbeafe' : '#f1f5f9',
                        color: historyTab === 'repair' ? '#1e40af' : '#64748b'
                    }}>{repairJobs.length}</span>
                </button>
                <button
                    onClick={() => setHistoryTab('parts')}
                    style={{
                        padding: '0.75rem 1.5rem', border: 'none', cursor: 'pointer',
                        fontWeight: historyTab === 'parts' ? '700' : '500',
                        fontSize: '0.95rem',
                        color: historyTab === 'parts' ? '#166534' : '#64748b',
                        background: 'transparent',
                        borderBottom: historyTab === 'parts' ? '3px solid #166534' : '3px solid transparent',
                        marginBottom: '-2px', transition: 'all 0.2s'
                    }}
                >
                    📦 ประวัติการเบิกอะไหล่
                    <span style={{
                        marginLeft: '0.5rem', padding: '0.15rem 0.5rem', borderRadius: '1rem',
                        fontSize: '0.75rem', fontWeight: '700',
                        background: historyTab === 'parts' ? '#dcfce7' : '#f1f5f9',
                        color: historyTab === 'parts' ? '#166534' : '#64748b'
                    }}>{partRequestJobs.length}</span>
                </button>
            </div>

            {/* Filter Section */}
            <div className="filter-section" style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                {/* Row 1: Search */}
                <div style={{ marginBottom: '0.75rem' }}>
                    <input
                        type="text"
                        placeholder="🔍 ค้นหาตามเบอร์รถ, ชื่อพนักงาน, หมายเหตุ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem',
                            fontSize: '0.9rem', background: '#fff', outline: 'none', transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#93c5fd'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                    />
                </div>

                {/* Row 2: Dropdown Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="filter-group">
                        <label>สนาม:</label>
                        <select value={filterGolfCourse} onChange={(e) => setFilterGolfCourse(e.target.value)}>
                            <option value="">ทั้งหมด</option>
                            {golfCourses.map(course => (
                                <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>พนักงาน:</label>
                        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                            <option value="">ทั้งหมด</option>
                            {filteredUsers.map(user => (
                                <option key={user.id} value={user.id.toString()}>{user.name} ({user.code})</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>รถ:</label>
                        <select value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)}>
                            <option value="">ทั้งหมด</option>
                            {filteredVehicles.map(vehicle => (
                                <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicle_number} ({vehicle.serial_number})</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>ประเภทงาน:</label>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                            <option value="">ทั้งหมด</option>
                            <option value="PM">PM (บำรุงรักษาเชิงป้องกัน)</option>
                            <option value="BM">BM (ซ่อมด่วน)</option>
                            <option value="Recondition">Recondition (ปรับสภาพ)</option>
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
                </div>

                {/* Row 3: Date Range + Clear Button */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
                    <div className="filter-group" style={{ flex: '0 0 auto' }}>
                        <label>ตั้งแต่วันที่:</label>
                        <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
                    </div>
                    <div className="filter-group" style={{ flex: '0 0 auto' }}>
                        <label>ถึงวันที่:</label>
                        <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterGolfCourse('');
                                setFilterUser('');
                                setFilterVehicle('');
                                setFilterStatus('');
                                setFilterType('');
                                setFilterDateFrom('');
                                setFilterDateTo('');
                            }}
                            style={{
                                padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem',
                                background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem',
                                fontWeight: '600', transition: 'all 0.2s', whiteSpace: 'nowrap',
                                display: 'flex', alignItems: 'center', gap: '0.35rem'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        >
                            ✕ ล้างตัวกรอง
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="summary-section">
                <p>แสดงผลลัพธ์: <strong>{displayedJobs.length}</strong> รายการ จากทั้งหมด <strong>{historyTab === 'repair' ? historyJobs.filter(j => j.type !== 'PART_REQUEST').length : historyJobs.filter(j => j.type === 'PART_REQUEST').length}</strong> รายการ</p>
            </div>

            {/* Table */}
            <div className="table-container">
                {displayedJobs.length === 0 ? (
                    <div className="no-data">
                        <div className="no-data-icon">{historyTab === 'repair' ? '📋' : '📦'}</div>
                        <h3>{historyTab === 'repair' ? 'ไม่พบข้อมูลประวัติการซ่อม' : 'ไม่พบข้อมูลประวัติการเบิกอะไหล่'}</h3>
                        <p>ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</p>
                        <p className="text-muted">ประวัติจะแสดงเมื่องานได้รับการอนุมัติหรือเสร็จสิ้นแล้ว</p>
                    </div>
                ) : (
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th className="sortable" onClick={() => handleSort('created_at')}>
                                    วันที่ {getSortIcon('created_at')}
                                </th>
                                {historyTab === 'repair' ? (
                                    <>
                                        <th className="sortable" onClick={() => handleSort('vehicle_number')}>
                                            เบอร์รถ {getSortIcon('vehicle_number')}
                                        </th>
                                        <th>Serial รถ</th>
                                        <th>สนาม</th>
                                        <th className="sortable" onClick={() => handleSort('type')}>
                                            ประเภท {getSortIcon('type')}
                                        </th>
                                        <th>ระบบ</th>
                                        <th>อะไหล่ที่ใช้</th>
                                        <th>ผู้ดำเนินการ</th>
                                        <th>ผู้อนุมัติ</th>
                                    </>
                                ) : (
                                    <>
                                        <th>MWR Code</th>
                                        <th>สนามปลายทาง</th>
                                        <th>ประเภท</th>
                                        <th>รายการอะไหล่</th>
                                        <th>ความเร่งด่วน</th>
                                        <th>ผู้ขอเบิก</th>
                                        <th>ผู้อนุมัติ</th>
                                    </>
                                )}
                                <th className="sortable" onClick={() => handleSort('status')}>
                                    สถานะ {getSortIcon('status')}
                                </th>
                                <th>การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedJobs.map(job => (
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
                                        {historyTab === 'repair' ? (
                                            <>
                                                <td className="vehicle-number">{job.vehicle_number}</td>
                                                <td>{job.vehicle_id ? getVehicleSerial(job.vehicle_id) : '-'}</td>
                                                <td>{getGolfCourseName(job.golf_course_id)}</td>
                                                <td>
                                                    <span className={`job-type ${job.type.toLowerCase()}`}>
                                                        {job.type}
                                                    </span>
                                                </td>
                                                <td>{job.type === 'BM' ? 'ซ่อมด่วน' : job.type === 'Recondition' ? 'ปรับสภาพ' : job.system ? getSystemDisplayName(job.system) : '-'}</td>
                                                <td className="parts-summary">
                                                    {(() => {
                                                        const jobParts = partsData.get(job.id) || [];
                                                        if (jobParts.length > 0) {
                                                            return (
                                                                <button className="parts-button" onClick={() => openPartsModal(job.id)}>
                                                                    🔧 {jobParts.length} รายการ
                                                                </button>
                                                            );
                                                        } else {
                                                            return <span className="no-parts">-</span>;
                                                        }
                                                    })()}
                                                </td>
                                                <td>{job.userName}</td>
                                                <td>{job.approved_by_name || '-'}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td>
                                                    <button 
                                                        onClick={() => openMWRModal(job)}
                                                        style={{ 
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '0.5rem',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600',
                                                            background: '#eef2ff', 
                                                            color: '#4f46e5', 
                                                            border: '1px solid #e0e7ff',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.currentTarget.style.background = '#e0e7ff';
                                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.currentTarget.style.background = '#eef2ff';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                        }}
                                                    >
                                                        {(job as any).mwr_code || '-'}
                                                    </button>
                                                </td>
                                                <td>{getGolfCourseName(job.golf_course_id)}</td>
                                                <td>
                                                    <span style={{
                                                        padding: '0.2rem 0.6rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '600',
                                                        background: job.system === 'spare_request' ? '#dcfce7' : '#dbeafe',
                                                        color: job.system === 'spare_request' ? '#166534' : '#1e40af'
                                                    }}>
                                                        {job.system === 'spare_request' ? '📦 สแปร์' : '🔧 เบิกซ่อม'}
                                                    </span>
                                                </td>
                                                <td>{job.parts?.length || 0} รายการ</td>
                                                <td>
                                                    {job.remarks?.includes('เร่งด่วนมาก') ? '🚨 มาก' :
                                                        job.remarks?.includes('เร่งด่วน') ? '⚠️ ด่วน' : 'ปกติ'}
                                                </td>
                                                <td>{job.userName}</td>
                                                <td>{job.approved_by_name || '-'}</td>
                                            </>
                                        )}
                                        <td>
                                            <StatusBadge status={job.status} />
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {job.status === 'approved' && (
                                                    <button
                                                        className="btn-sm btn-outline"
                                                        onClick={() => handleGenerateReport(job)}
                                                    >
                                                        📄 รายงาน
                                                    </button>
                                                )}
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
                                                                <strong>Serial แบต:</strong> {job.battery_serial || (job.vehicle_id ? getVehicleSerial(job.vehicle_id) : '-')}
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
                                                            {job.approved_by_name && (
                                                                <div className="detail-item">
                                                                    <strong>อนุมัติโดย:</strong> {job.approved_by_name}
                                                                </div>
                                                            )}
                                                            {job.approved_at && (
                                                                <div className="detail-item">
                                                                    <strong>วันที่อนุมัติ:</strong> {formatDate(job.approved_at)}
                                                                </div>
                                                            )}
                                                            {job.rejection_reason && (
                                                                <div className="detail-item">
                                                                    <strong>เหตุผลที่ไม่อนุมัติ:</strong> <span style={{ color: '#dc3545' }}>{job.rejection_reason}</span>
                                                                </div>
                                                            )}
                                                            {((job as any).updatedAt || job.updated_at) && ((job as any).updatedAt || job.updated_at) !== ((job as any).createdAt || job.created_at) && (
                                                                <div className="detail-item">
                                                                    <strong>อัปเดตล่าสุด:</strong> {formatDate((job as any).updatedAt || job.updated_at)}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {(() => {
                                                            const jobPartsFromLog = partsData.get(job.id) || [];
                                                            const hasLogParts = jobPartsFromLog.length > 0;
                                                            const hasPartsObj = job.parts && job.parts.length > 0;
                                                            const hasPartsUsed = (job as any).parts_used && Array.isArray((job as any).parts_used) && (job as any).parts_used.length > 0;

                                                            if (hasLogParts || hasPartsObj || hasPartsUsed || job.partsNotes) {
                                                                return (
                                                                    <div className="detail-section" style={{ flex: '1 1 100%' }}>
                                                                        <h4>อะไหล่ที่ใช้ / หมายเหตุ</h4>
                                                                        
                                                                        {hasLogParts ? (
                                                                            <ul className="parts-list">
                                                                                {jobPartsFromLog.map((part) => (
                                                                                    <li key={part.id}>
                                                                                        {part.partName} (จำนวน {part.quantityUsed})
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        ) : hasPartsObj ? (
                                                                            <ul className="parts-list">
                                                                                {job.parts!.map((p) => (
                                                                                    <li key={p.part_id}>
                                                                                        {p.part_name || 'อะไหล่'} (จำนวน {p.quantity_used})
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        ) : hasPartsUsed && (
                                                                            <ul className="parts-list">
                                                                                {(job as any).parts_used.map((pu: string, idx: number) => (
                                                                                    <li key={idx}>{pu}</li>
                                                                                ))}
                                                                            </ul>
                                                                        )}

                                                                        {job.partsNotes && (
                                                                            <div className="detail-item parts-notes-box" style={{ marginTop: '0.75rem', background: '#eff6ff', padding: '0.75rem', borderRadius: '0.375rem', borderLeft: '4px solid #3b82f6', width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                                <span style={{ color: '#1e40af', fontWeight: 600 }}>หมายเหตุอะไหล่ / รหัสใบเบิกอ้างอิง:</span>
                                                                                <span style={{ color: '#1e3a8a', whiteSpace: 'pre-wrap', display: 'block' }}>{job.partsNotes}</span>
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
                                                                    {job.images.map((image, index) => {
                                                                        // Helper to fix localhost URLs for external access
                                                                        const getValidImageUrl = (url: string) => {
                                                                            if (!url) return '';
                                                                            // Replace localhost/127.0.0.1 with public domain
                                                                            return url
                                                                                .replace('http://localhost:8080', 'http://golfcar.go2kt.com:8080')
                                                                                .replace('http://127.0.0.1:8080', 'http://golfcar.go2kt.com:8080');
                                                                        };

                                                                        const validImageUrl = getValidImageUrl(image);

                                                                        return (
                                                                            <div key={`image-${job.id}-${index}-${image.slice(-10)}`} className="image-item">
                                                                                <Image
                                                                                    src={validImageUrl}
                                                                                    alt={`รูปภาพงาน ${index + 1}`}
                                                                                    className="job-image"
                                                                                    width={150}
                                                                                    height={100}
                                                                                    onClick={() => window.open(validImageUrl, '_blank')}
                                                                                />
                                                                            </div>
                                                                        );
                                                                    })}
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

            {/* Requisition Modal */}
            <RequisitionModal
                isOpen={isRequisitionOpen}
                onClose={closeRequisitionModal}
                job={selectedJobForRequisition}
                isGenerating={isGeneratingRequisition}
                parts={parts}
                vehicles={vehicles}
                golfCourses={golfCourses}
                jobParts={selectedJobForRequisition ? partsData.get(selectedJobForRequisition.id) || [] : []}
            />

            {/* MWR Details Modal */}
            <MWRDetailsModal
                isOpen={isMWRModalOpen}
                onClose={closeMWRModal}
                job={selectedMWR}
                golfCourses={golfCourses}
            />

            <style jsx>{`
                /* Print Styles */
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                }

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
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
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
        </div >
    );
};

export default HistoryScreen;