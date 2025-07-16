'use client';

import React, { useState } from 'react';
import { Job, JobStatus, User, MOCK_PARTS } from '@/lib/data';
import StatusBadge from './StatusBadge';
import JobDetailsModal from './JobDetailsModal';
import styles from './JobCard.module.css';

interface JobCardProps {
  job: Job;
  user: User;
  onUpdateStatus: (jobId: number, status: JobStatus) => void;
  onFillJobForm?: (job: Job) => void;
  isHistory?: boolean;
}

const JobCard = ({ job, user, onUpdateStatus, onFillJobForm, isHistory = false }: JobCardProps) => {
    const [showDetails, setShowDetails] = useState(false);
    
    // แปลงวันที่ให้อยู่ในรูปแบบที่อ่านง่าย
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
        if (user.role === 'staff' && job.status === 'assigned' && job.assigned_to === user.id && onFillJobForm) {
            buttons.push(
                <button 
                    key="fill-form"
                    className={`${styles.actionButton} ${styles.primary}`} 
                    onClick={() => onFillJobForm(job)}
                >
                    <span className="btn-icon">📝</span> กรอกรายละเอียด
                </button>
            );
        }

        // ปุ่มเสร็จสิ้นงาน
        if (user.role === 'staff' && 
            (job.status === 'assigned' || job.status === 'in_progress') && 
            job.assigned_to === user.id) {
            buttons.push(
                <button 
                    key="complete"
                    className={`${styles.actionButton} ${styles.success}`} 
                    onClick={() => onUpdateStatus(job.id, 'completed')}
                >
                    <span className="btn-icon">✓</span> เสร็จสิ้น
                </button>
            );
        }

        // ปุ่มแก้ไขสำหรับงานที่พนักงานสร้างเอง
        if (user.role === 'staff' && 
            job.status === 'pending' && 
            job.user_id === user.id && 
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

        return buttons;
    };

    return (
        <>
            <div className={`${styles.jobCard} ${styles[`status${job.status.charAt(0).toUpperCase() + job.status.slice(1)}`]}`}>
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
                            <span className={styles.summaryLabel}>ระบบ:</span>
                            <span className={styles.summaryValue}>{job.system}</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>ผู้แจ้ง:</span>
                            <span className={styles.summaryValue}>{job.userName}</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>วันที่:</span>
                            <span className={styles.summaryValue}>{formatDate(job.created_at)}</span>
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

            {showDetails && (
                <JobDetailsModal 
                    job={job} 
                    onClose={() => setShowDetails(false)} 
                />
            )}
        </>
    );
}

export default JobCard;