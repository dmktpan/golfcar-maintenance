'use client';

import React, { useState } from 'react';
import { Job, JobStatus, User, Vehicle, GolfCourse } from '@/lib/data';
import StatusBadge from './StatusBadge';
import JobDetailsModal from './JobDetailsModal';
import styles from './JobCard.module.css';
import { getSystemDisplayName } from '../lib/systemUtils';

interface JobCardProps {
    job: Job;
    user: User;
    vehicles: Vehicle[];
    golfCourses: GolfCourse[];
    users: User[];
    partsUsageLog?: any[]; // เพิ่ม props สำหรับ PartsUsageLog
    onUpdateStatus: (jobId: string, status: JobStatus) => void;
    onFillJobForm?: (job: Job) => void;
    onDeleteJob?: (jobId: string) => void; // เพิ่ม callback สำหรับลบงาน
    isHistory?: boolean;
}

const JobCard = ({ job, user, vehicles, golfCourses, users, partsUsageLog = [], onUpdateStatus, onFillJobForm, onDeleteJob }: JobCardProps) => {
    const [showDetails, setShowDetails] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // ดึงข้อมูลรถจาก vehicles prop แทน MOCK_VEHICLES
    const vehicleInfo = vehicles.find(v => v.id === job.vehicle_id);

    // ฟังก์ชันสำหรับดึงชื่อสนามกอล์ฟ
    const getGolfCourseName = (courseId: string) => {
        const course = golfCourses.find(c => c.id === courseId);
        return course ? course.name : 'ไม่ระบุ';
    };

    // แปลงวันที่ให้อยู่ในรูปแบบที่อ่านง่าย
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Bangkok' // ระบุ timezone ไทยอย่างชัดเจน
        });
    };

    // ฟังก์ชันสำหรับจัดการการลบงาน
    const handleDeleteConfirm = () => {
        if (onDeleteJob) {
            onDeleteJob(job.id);
        }
        setShowDeleteConfirm(false);
    };

    // ตรวจสอบสิทธิ์ในการลบงาน (เฉพาะหัวหน้างานและผู้ดูแลระบบ)
    const canDeleteJob = (user.role === 'supervisor' || user.role === 'admin') &&
        (job.status === 'assigned' || job.status === 'in_progress' || job.status === 'completed');

    // ฟังก์ชันสำหรับแสดงปุ่มตามสถานะและบทบาท
    const renderActionButtons = () => {
        const buttons = [];

        // ปุ่มดูรายละเอียด (แสดงเสมอ)
        buttons.push(
            <button
                key="details"
                className={`${styles.actionButton} ${styles.info}`}
                onClick={() => setShowDetails(true)}
            >
                <span className="btn-icon">👁️</span> ดูรายละเอียด
            </button>
        );

        // ปุ่มสำหรับพนักงานที่ได้รับงานมอบหมาย
        if (user.role === 'staff' && job.status === 'assigned' && job.assigned_to === user.id.toString() && onFillJobForm) {
            buttons.push(
                <button
                    key="fill-form"
                    className={`${styles.actionButton} ${styles.primary}`}
                    onClick={() => onFillJobForm(job)}
                >
                    <span className="btn-icon">📝</span> เริ่มปฏิบัติงาน
                </button>
            );
        }

        // ปุ่มแก้ไขสำหรับงานที่พนักงานสร้างเอง
        if (user.role === 'staff' &&
            job.status === 'pending' &&
            job.user_id === user.id.toString() &&
            !job.assigned_by &&
            onFillJobForm) {
            buttons.push(
                <button
                    key="edit"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => onFillJobForm(job)}
                >
                    <span className="btn-icon">✏️</span> แก้ไข
                </button>
            );
        }

        // ปุ่มสำหรับหัวหน้างาน
        if (user.role === 'supervisor' && job.status === 'pending') {
            buttons.push(
                <button
                    key="approve"
                    className={`${styles.actionButton} ${styles.success}`}
                    onClick={() => onUpdateStatus(job.id, 'approved')}
                >
                    <span className="btn-icon">✓</span> อนุมัติ
                </button>,
                <button
                    key="reject"
                    className={`${styles.actionButton} ${styles.danger}`}
                    onClick={() => onUpdateStatus(job.id, 'rejected')}
                >
                    <span className="btn-icon">✕</span> ไม่อนุมัติ
                </button>
            );
        }

        // ปุ่มแก้ไขสำหรับ admin/supervisor/central ที่สร้างงาน pending เอง
        if ((user.role === 'supervisor' || user.role === 'admin' || user.role === 'central') &&
            job.status === 'pending' &&
            job.user_id === user.id.toString() &&
            onFillJobForm) {
            buttons.push(
                <button
                    key="edit-pending"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => onFillJobForm(job)}
                >
                    <span className="btn-icon">✏️</span> แก้ไข
                </button>
            );
        }

        // ปุ่มดูและแก้ไขสำหรับหัวหน้างานและผู้ดูแลระบบในงานที่มอบหมายแล้ว
        if ((user.role === 'supervisor' || user.role === 'admin') &&
            (job.status === 'assigned' || job.status === 'in_progress' || job.status === 'completed') &&
            onFillJobForm) {
            buttons.push(
                <button
                    key="view-edit"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => onFillJobForm(job)}
                >
                    <span className="btn-icon">✏️</span> ดู/แก้ไข
                </button>
            );
        }

        return buttons;
    };

    return (
        <>
            <div className={`${styles.jobCard} ${styles[`status${job.status.charAt(0).toUpperCase() + job.status.slice(1)}`]}`}>
                {/* Delete Button - แสดงเฉพาะสำหรับหัวหน้างานและผู้ดูแลระบบ */}
                {canDeleteJob && onDeleteJob && (
                    <button
                        className={styles.deleteButton}
                        onClick={() => setShowDeleteConfirm(true)}
                        title="ลบงานที่มอบหมาย"
                    >
                        ✕
                    </button>
                )}

                <div className={styles.jobCardHeader}>
                    <div className={styles.jobHeaderLeft}>
                        <h3 className={styles.vehicleNumber}>รถเบอร์ {job.vehicle_number}</h3>
                        <span className={styles.jobType}>{job.type}</span>
                    </div>
                    <StatusBadge status={job.status} />
                </div>

                <div className={styles.jobCardBody}>
                    <div className={styles.jobSummary}>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>สนามกอล์ฟ:</span>
                            <span className={styles.summaryValue}>{getGolfCourseName(job.golf_course_id)}</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>ซีเรียลแบต:</span>
                            <span className={styles.summaryValue}>{job.battery_serial || vehicleInfo?.battery_serial || '-'}</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>ระบบ:</span>
                            <span className={styles.summaryValue}>
                                {job.type === 'BM' ? 'ซ่อมด่วน' : job.type === 'Recondition' ? 'ปรับสภาพ' : job.system ? getSystemDisplayName(job.system) : '-'}
                            </span>
                        </div>
                        {job.type === 'BM' && job.bmCause && (
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>สาเหตุ:</span>
                                <span className={styles.summaryValue}>
                                    {job.bmCause === 'breakdown' ? 'เสีย' : 'อุบัติเหตุ'}
                                </span>
                            </div>
                        )}
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>ผู้แจ้ง:</span>
                            <span className={styles.summaryValue}>{job.userName}</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>วันที่:</span>
                            <span className={styles.summaryValue}>{formatDate((job as any).createdAt)}</span>
                        </div>
                        {job.assigned_by_name && (
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>มอบหมายโดย:</span>
                                <span className={styles.summaryValue}>{job.assigned_by_name}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.jobCardFooter}>
                    {renderActionButtons()}
                </div>
            </div>

            {/* Confirmation Modal สำหรับลบงาน */}
            {showDeleteConfirm && (
                <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmHeader}>
                            <h3>ยืนยันการลบงาน</h3>
                        </div>
                        <div className={styles.confirmBody}>
                            <p>คุณต้องการลบงาน <strong>รถเบอร์ {job.vehicle_number}</strong> หรือไม่?</p>
                            <p className={styles.warningText}>การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
                        </div>
                        <div className={styles.confirmFooter}>
                            <button
                                className={styles.cancelButton}
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                ยกเลิก
                            </button>
                            <button
                                className={styles.confirmDeleteButton}
                                onClick={handleDeleteConfirm}
                            >
                                ลบงาน
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDetails && (
                <JobDetailsModal
                    job={job}
                    golfCourses={golfCourses}
                    users={users}
                    vehicles={vehicles}
                    partsUsageLog={partsUsageLog}
                    onClose={() => setShowDetails(false)}
                />
            )}
        </>
    );
}

export default JobCard;