'use client';

import React, { useState, useEffect } from 'react';
import { Job, JobStatus, User, GolfCourse, Vehicle, MOCK_GOLF_COURSES, MOCK_USERS, MOCK_VEHICLES, View } from '@/lib/data';
import StatusBadge from './StatusBadge';
import styles from './SupervisorPendingJobsScreen.module.css';

interface SupervisorPendingJobsScreenProps {
    user: User;
    jobs: Job[];
    setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
    setView: (view: View) => void;
    addPartsUsageLog?: (jobId: number, partsNotes?: string, jobData?: Job) => void;
}

interface FilterState {
    golfCourseId: number | null;
    employeeId: number | null;
    dateFrom: string;
    dateTo: string;
    status: 'all' | 'pending' | 'completed' | 'in_progress' | 'assigned';
}

const SupervisorPendingJobsScreen = ({ user, jobs, setJobs, setView, addPartsUsageLog }: SupervisorPendingJobsScreenProps) => {
    const [filters, setFilters] = useState<FilterState>({
        golfCourseId: null,
        employeeId: null,
        dateFrom: '',
        dateTo: '',
        status: 'pending'
    });
    
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [showNotification, setShowNotification] = useState(false);

    // คำนวณจำนวนงานที่รอการอนุมัติ
    const pendingJobsCount = jobs.filter(job => job.status === 'pending').length;

    // ฟังก์ชันกรองงาน
    useEffect(() => {
        let filtered = jobs;

        // กรองตามสถานะ
        if (filters.status !== 'all') {
            filtered = filtered.filter(job => job.status === filters.status);
        }

        // กรองตามสนาม
        if (filters.golfCourseId) {
            filtered = filtered.filter(job => job.golf_course_id === filters.golfCourseId);
        }

        // กรองตามพนักงาน
        if (filters.employeeId) {
            filtered = filtered.filter(job => job.user_id === filters.employeeId);
        }

        // กรองตามวันที่
        if (filters.dateFrom) {
            filtered = filtered.filter(job => 
                new Date(job.created_at) >= new Date(filters.dateFrom)
            );
        }

        if (filters.dateTo) {
            filtered = filtered.filter(job => 
                new Date(job.created_at) <= new Date(filters.dateTo + 'T23:59:59')
            );
        }

        // เรียงตามวันที่สร้าง (ล่าสุดก่อน)
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setFilteredJobs(filtered);
    }, [jobs, filters]);

    // แสดง notification เมื่อมีงานรอการอนุมัติ
    useEffect(() => {
        if (pendingJobsCount > 0) {
            setShowNotification(true);
            const timer = setTimeout(() => setShowNotification(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [pendingJobsCount]);

    // ฟังก์ชันอัปเดตสถานะงาน
    const handleUpdateStatus = (jobId: number, status: JobStatus) => {
        const updatedJob = jobs.find(job => job.id === jobId);
        if (updatedJob) {
            const newJob = { ...updatedJob, status };
            setJobs(prevJobs => 
                prevJobs.map(job => 
                    job.id === jobId ? newJob : job
                )
            );
            
            // เพิ่ม Log การใช้อะไหล่เมื่อสถานะเปลี่ยนเป็น approved
            // ส่ง newJob ที่มีสถานะ approved แล้วไปด้วย
            if (status === 'approved' && addPartsUsageLog) {
                addPartsUsageLog(jobId, newJob.partsNotes, newJob);
            }
        }
    };

    // ฟังก์ชันรีเซ็ตฟิลเตอร์
    const resetFilters = () => {
        setFilters({
            golfCourseId: null,
            employeeId: null,
            dateFrom: '',
            dateTo: '',
            status: 'pending'
        });
    };

    // ฟังก์ชันแปลงวันที่
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

    // ฟังก์ชันหาข้อมูลรถ
    const getVehicleInfo = (vehicleId: number) => {
        return MOCK_VEHICLES.find(v => v.id === vehicleId);
    };

    // ฟังก์ชันหาชื่อสนาม
    const getGolfCourseName = (golfCourseId: number) => {
        return MOCK_GOLF_COURSES.find(gc => gc.id === golfCourseId)?.name || 'ไม่ระบุ';
    };

    // ฟังก์ชันสำหรับ CSS class ตามสถานะ
    const getStatusClass = (status: JobStatus) => {
        switch (status) {
            case 'pending': return styles.statusPending;
            case 'assigned': return styles.statusAssigned;
            case 'in_progress': return styles.statusInProgress;
            case 'completed': return styles.statusCompleted;
            case 'approved': return styles.statusApproved;
            case 'rejected': return styles.statusRejected;
            default: return '';
        }
    };

    return (
        <div className={styles.container}>
            {/* Notification */}
            {showNotification && pendingJobsCount > 0 && (
                <div className={styles.notificationBanner}>
                    <div className={styles.notificationContent}>
                        <span className={styles.notificationIcon}>🔔</span>
                        <span className={styles.notificationText}>
                            มีงาน {pendingJobsCount} รายการที่รอการอนุมัติ
                        </span>
                        <button 
                            className={styles.notificationClose}
                            onClick={() => setShowNotification(false)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.headerLeft}>
                    <button className={styles.btnBack} onClick={() => setView('dashboard')}>
                        ← กลับ
                    </button>
                    <h2 className={styles.pageTitle}>งานที่รอตรวจสอบ</h2>
                    {pendingJobsCount > 0 && (
                        <span className={styles.pendingBadge}>{pendingJobsCount}</span>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filtersSection}>
                <div className={styles.filtersGrid}>
                    {/* สถานะ */}
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>สถานะ:</label>
                        <select 
                            className={styles.filterSelect}
                            value={filters.status}
                            onChange={(e) => setFilters((prev: FilterState) => ({ 
                                ...prev, 
                                status: e.target.value as FilterState['status'] 
                            }))}
                        >
                            <option value="all">ทั้งหมด</option>
                            <option value="pending">รอตรวจสอบ</option>
                            <option value="assigned">มอบหมายแล้ว</option>
                            <option value="in_progress">กำลังดำเนินการ</option>
                            <option value="completed">เสร็จสิ้น</option>
                        </select>
                    </div>

                    {/* สนาม */}
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>สนาม:</label>
                        <select 
                            className={styles.filterSelect}
                            value={filters.golfCourseId || ''}
                            onChange={(e) => setFilters((prev: FilterState) => ({ 
                                ...prev, 
                                golfCourseId: e.target.value ? Number(e.target.value) : null 
                            }))}
                        >
                            <option value="">ทุกสนาม</option>
                            {MOCK_GOLF_COURSES.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* พนักงาน */}
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>พนักงาน:</label>
                        <select 
                            className={styles.filterSelect}
                            value={filters.employeeId || ''}
                            onChange={(e) => setFilters((prev: FilterState) => ({ 
                                ...prev, 
                                employeeId: e.target.value ? Number(e.target.value) : null 
                            }))}
                        >
                            <option value="">ทุกคน</option>
                            {MOCK_USERS.filter(u => u.role === 'staff').map(employee => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* วันที่เริ่มต้น */}
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>วันที่เริ่มต้น:</label>
                        <input 
                            type="date"
                            className={styles.filterInput}
                            value={filters.dateFrom}
                            onChange={(e) => setFilters((prev: FilterState) => ({ 
                                ...prev, 
                                dateFrom: e.target.value 
                            }))}
                        />
                    </div>

                    {/* วันที่สิ้นสุด */}
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>วันที่สิ้นสุด:</label>
                        <input 
                            type="date"
                            className={styles.filterInput}
                            value={filters.dateTo}
                            onChange={(e) => setFilters((prev: FilterState) => ({ 
                                ...prev, 
                                dateTo: e.target.value 
                            }))}
                        />
                    </div>

                    {/* ปุ่มรีเซ็ต */}
                    <div className={styles.filterGroup}>
                        <button className={styles.btnReset} onClick={resetFilters}>
                            รีเซ็ตฟิลเตอร์
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className={styles.summarySection}>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>จำนวนงานที่แสดง:</span>
                    <span className={styles.summaryValue}>{filteredJobs.length} รายการ</span>
                </div>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>งานรอการอนุมัติ:</span>
                    <span className={`${styles.summaryValue} ${styles.pending}`}>{pendingJobsCount} รายการ</span>
                </div>
            </div>

            {/* Jobs List */}
            <div className={styles.jobsSection}>
                {filteredJobs.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📋</div>
                        <p>ไม่พบงานตามเงื่อนไขที่เลือก</p>
                        <p className={styles.emptySubtitle}>ลองปรับเปลี่ยนฟิลเตอร์เพื่อค้นหางาน</p>
                    </div>
                ) : (
                    <div className={styles.jobsGrid}>
                        {filteredJobs.map(job => {
                            const vehicleInfo = getVehicleInfo(job.vehicle_id);
                            const golfCourseName = getGolfCourseName(job.golf_course_id);
                            
                            return (
                                <div key={job.id} className={`${styles.jobCardEnhanced} ${getStatusClass(job.status)}`}>
                                    <div className={styles.jobCardHeader}>
                                        <div className={styles.headerLeft}>
                                            <div className={styles.vehicleInfo}>
                                                <span className={styles.vehicleNumber}>รถเบอร์: {job.vehicle_number}</span>
                                                {vehicleInfo && (
                                                    <>
                                                        <span className={styles.serialNumber}>
                                                            Serial: {vehicleInfo.serial_number}
                                                        </span>
                                                        <span className={styles.batterySerial}>
                                                            ซีเรียลแบต: {job.battery_serial || vehicleInfo.battery_serial || '-'}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            <div className={styles.jobMeta}>
                                                <span className={styles.jobDate}>{formatDate(job.created_at)}</span>
                                                <span className={styles.golfCourse}>{golfCourseName}</span>
                                            </div>
                                        </div>
                                        <StatusBadge status={job.status} />
                                    </div>

                                    <div className={styles.jobCardBody}>
                                        <div className={styles.jobInfoGrid}>
                                            <div className={styles.jobInfoItem}>
                                                <span className={styles.infoLabel}>ประเภท:</span>
                                                <span className={styles.infoValue}>{job.type}</span>
                                            </div>
                                            <div className={styles.jobInfoItem}>
                                                <span className={styles.infoLabel}>ผู้แจ้ง:</span>
                                                <span className={styles.infoValue}>{job.userName}</span>
                                            </div>
                                            <div className={styles.jobInfoItem}>
                                                <span className={styles.infoLabel}>ระบบ:</span>
                                                <span className={styles.infoValue}>{job.system}</span>
                                            </div>
                                            {job.assigned_by_name && (
                                                <div className={styles.jobInfoItem}>
                                                    <span className={styles.infoLabel}>มอบหมายโดย:</span>
                                                    <span className={styles.infoValue}>{job.assigned_by_name}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.jobDetails}>
                                            {job.subTasks && job.subTasks.length > 0 && (
                                                <div className={styles.jobDetailItem}>
                                                    <span className={styles.detailLabel}>งานย่อย:</span>
                                                    <div className={styles.detailValue}>
                                                        <ul className={styles.subtasksList}>
                                                            {job.subTasks.map((task, index) => (
                                                                <li key={index}>{task}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}

                                            {job.parts && job.parts.length > 0 && (
                                                <div className={styles.jobDetailItem}>
                                                    <span className={styles.detailLabel}>รายการอะไหล่ที่ใช้:</span>
                                                    <div className={styles.detailValue}>
                                                        <div className={styles.partsList}>
                                                            {job.parts.map((part, index) => (
                                                                <div key={index} className={styles.partItem}>
                                                                    <span className={styles.partName}>
                                                                        🔧 {part.part_name || `อะไหล่ ID: ${part.part_id}`}
                                                                    </span>
                                                                    <span className={styles.partQuantity}>
                                                                        จำนวน: {part.quantity_used}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {job.partsNotes && (
                                                <div className={styles.jobDetailItem}>
                                                    <span className={styles.detailLabel}>หมายเหตุอะไหล่:</span>
                                                    <span className={`${styles.detailValue} ${styles.partsNotes}`}>{job.partsNotes}</span>
                                                </div>
                                            )}

                                            {job.remarks && (
                                                <div className={styles.jobDetailItem}>
                                                    <span className={styles.detailLabel}>หมายเหตุ:</span>
                                                    <span className={styles.detailValue}>{job.remarks}</span>
                                                </div>
                                            )}

                                            {job.images && job.images.length > 0 && (
                                                <div className={styles.jobDetailItem}>
                                                    <span className={styles.detailLabel}>รูปภาพ:</span>
                                                    <div className={styles.detailValue}>
                                                        <div className={styles.imageGallery}>
                                                            {job.images.map((image, index) => (
                                                                <div key={index} className={styles.imageItem}>
                                                                    <img 
                                                                        src={image} 
                                                                        alt={`รูปภาพงาน ${index + 1}`}
                                                                        className={styles.jobImage}
                                                                        onClick={() => window.open(image, '_blank')}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {job.status === 'pending' && (
                                        <div className={styles.jobCardFooter}>
                                            <button 
                                                className={styles.btnSuccess}
                                                onClick={() => handleUpdateStatus(job.id, 'approved')}
                                            >
                                                <span className={styles.btnIcon}>✓</span> อนุมัติ
                                            </button>
                                            <button 
                                                className={styles.btnDanger}
                                                onClick={() => handleUpdateStatus(job.id, 'rejected')}
                                            >
                                                <span className={styles.btnIcon}>✕</span> ไม่อนุมัติ
                                            </button>
                                        </div>
                                    )}

                                    {job.status === 'completed' && (
                                        <div className={styles.jobCardFooter}>
                                            <button 
                                                className={styles.btnSuccess}
                                                onClick={() => handleUpdateStatus(job.id, 'approved')}
                                            >
                                                <span className={styles.btnIcon}>✓</span> อนุมัติงานเสร็จ
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupervisorPendingJobsScreen;