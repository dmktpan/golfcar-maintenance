import React, { useEffect } from 'react';
import { Job, GolfCourse } from '@/lib/data';
import {
    X,
    Calendar,
    User,
    MapPin,
    CheckCircle2,
    XCircle,
    Clock,
    PackageSearch,
    MessageSquare,
    ShieldCheck,
    AlertCircle
} from 'lucide-react';
import styles from './MWRDetailsModal.module.css';

interface MWRDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: Job | null;
    golfCourses: GolfCourse[];
}

export default function MWRDetailsModal({ isOpen, onClose, job, golfCourses }: MWRDetailsModalProps) {
    // === Effect: Lock body scroll ===
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || !job) return null;

    // === UI Helpers ===
    const getGolfCourseName = (id: string) => {
        const course = golfCourses.find(c => c.id === id);
        return course ? course.name : 'ไม่ระบุสนาม';
    };

    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed':
                return {
                    label: 'เบิกจ่ายเสร็จสิ้น',
                    badgeClass: styles.statusApproved,
                    Icon: CheckCircle2
                };
            case 'approved':
                return {
                    label: 'อนุมัติแล้ว',
                    badgeClass: styles.statusApproved,
                    Icon: CheckCircle2
                };
            case 'stock_pending':
                return {
                    label: 'รอฝ่ายสต๊อกตัดจ่าย',
                    badgeClass: styles.statusPending,
                    Icon: PackageSearch
                };
            case 'rejected':
                return {
                    label: 'ไม่อนุมัติ',
                    badgeClass: styles.statusRejected,
                    Icon: XCircle
                };
            default:
                return {
                    label: 'รอตรวจสอบ',
                    badgeClass: styles.statusPending,
                    Icon: Clock
                };
        }
    };

    const statusConfig = getStatusConfig(job.status);
    const StatusIcon = statusConfig.Icon;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            {/* Modal Container */}
            <div
                className={styles.modalContent}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerTitleGroup}>
                        <div className={styles.headerTitleRow}>
                            <h2 className={styles.modalTitle}>
                                รายละเอียดใบเบิก
                            </h2>
                            <span className={`${styles.statusBadge} ${statusConfig.badgeClass}`}>
                                <StatusIcon size={14} />
                                {statusConfig.label}
                            </span>
                        </div>
                        <p className={styles.mwrCode}>
                            {job.mwr_code || 'N/A'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={styles.closeButton}
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Body */}
                <div className={styles.modalBody}>

                    {/* Section: General Info */}
                    <div className={styles.infoGrid}>
                        <div className={styles.infoColumn}>
                            <div className={styles.infoItem}>
                                <div className={styles.infoIconWrapper}>
                                    <User size={16} />
                                </div>
                                <div className={styles.infoText}>
                                    <span className={styles.infoLabel}>ผู้ขอเบิก</span>
                                    <p className={styles.infoValue}>{job.userName}</p>
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <div className={styles.infoIconWrapper}>
                                    <MapPin size={16} />
                                </div>
                                <div className={styles.infoText}>
                                    <span className={styles.infoLabel}>สนามปลายทาง</span>
                                    <p className={styles.infoValue}>{getGolfCourseName(job.golf_course_id)}</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.infoColumn}>
                            <div className={styles.infoItem}>
                                <div className={styles.infoIconWrapper}>
                                    <Calendar size={16} />
                                </div>
                                <div className={styles.infoText}>
                                    <span className={styles.infoLabel}>วันที่ขอกเบิก</span>
                                    <p className={styles.infoValue}>{formatDate(job.created_at || (job as any).createdAt)}</p>
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <div className={styles.infoIconWrapper}>
                                    <AlertCircle size={16} />
                                </div>
                                <div className={styles.infoText}>
                                    <span className={styles.infoLabel}>ความเร่งด่วน</span>
                                    <p className={styles.infoValue}>
                                        {job.remarks?.includes('เร่งด่วนมาก') ? '🚨 มาก' : job.remarks?.includes('เร่งด่วน') ? '⚠️ ด่วน' : 'ปกติ'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Remarks/Reason */}
                    {job.remarks && (
                        <div>
                            <h3 className={styles.sectionTitle}>
                                <MessageSquare size={16} className={styles.sectionTitleIcon} /> หมายเหตุ / เหตุผล
                            </h3>
                            <div className={styles.remarksBox}>
                                {job.remarks.replace(/^\[.*?\]\s*/, '') /* Remove urgency tag from remarks if present */}
                            </div>
                        </div>
                    )}

                    {/* Section: Parts List */}
                    <div>
                        <h3 className={styles.sectionTitle}>
                            <PackageSearch size={16} className={styles.sectionTitleIcon} /> รายการอะไหล่ที่ขอกเบิก
                        </h3>
                        <div className={styles.tableContainer}>
                            <table className={styles.partsTable}>
                                <thead>
                                    <tr>
                                        <th>รายการ</th>
                                        <th>จำนวน</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {job.parts && job.parts.length > 0 ? (
                                        job.parts.map((part, index) => (
                                            <tr key={index}>
                                                <td>{part.part_name}</td>
                                                <td>
                                                    <span className={styles.quantityBadge}>
                                                        {part.quantity_used}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr className={styles.emptyTableRow}>
                                            <td colSpan={2}>
                                                ไม่มีรายการอะไหล่
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section: Approval Info */}
                    {(['approved', 'stock_pending', 'completed', 'rejected'].includes(job.status)) && (
                        <div className={`${styles.approvalCard} ${job.status !== 'rejected' ? styles.approvalCardApproved : styles.approvalCardRejected}`}>
                            <h3 className={`${styles.approvalCardTitle} ${job.status !== 'rejected' ? styles.approvalCardTitleApproved : styles.approvalCardTitleRejected}`}>
                                <ShieldCheck size={16} /> ข้อมูลการพิจารณา
                            </h3>
                            <div className={styles.approvalGrid}>
                                <div className={styles.approvalInfo}>
                                    <span className={`${styles.approvalLabel} ${job.status !== 'rejected' ? styles.approvalLabelApproved : styles.approvalLabelRejected}`}>ผู้อนุมัติ / ผู้ตรวจสอบ</span>
                                    <p className={`${styles.approvalValue} ${job.status !== 'rejected' ? styles.approvalValueApproved : styles.approvalValueRejected}`}>
                                        {job.approved_by_name || '-'}
                                    </p>
                                </div>
                                <div className={styles.approvalInfo}>
                                    <span className={`${styles.approvalLabel} ${job.status !== 'rejected' ? styles.approvalLabelApproved : styles.approvalLabelRejected}`}>วันที่พิจารณา</span>
                                    <p className={`${styles.approvalValue} ${job.status !== 'rejected' ? styles.approvalValueApproved : styles.approvalValueRejected}`}>
                                        {formatDate(job.approved_at)}
                                    </p>
                                </div>
                                {job.status === 'rejected' && job.rejection_reason && (
                                    <div className={styles.rejectionReason}>
                                        <span className={`${styles.approvalLabel} ${styles.approvalLabelRejected}`}>เหตุผลที่ไม่อนุมัติ</span>
                                        <p className={`${styles.approvalValue} ${styles.approvalValueRejected}`}>
                                            {job.rejection_reason}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button
                        onClick={onClose}
                        className={styles.closeFooterButton}
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>

            </div>
        </div>
    );
}
