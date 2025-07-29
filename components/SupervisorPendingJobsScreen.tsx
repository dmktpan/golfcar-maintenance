'use client';

import React, { useState, useEffect } from 'react';
import { Job, JobStatus, User, GolfCourse, Vehicle } from '@/lib/data';
import StatusBadge from './StatusBadge';
import styles from './SupervisorPendingJobsScreen.module.css';

interface SupervisorPendingJobsScreenProps {
    user: User;
    jobs: Job[]; 
    golfCourses: GolfCourse[];
    users: User[];
    vehicles: Vehicle[];
    onUpdateStatus: (jobId: number, status: JobStatus) => void;
    onFillJobForm?: (job: Job) => void;
    addPartsUsageLog?: (jobId: number, partsNotes?: string, jobData?: Job) => Promise<void>;
}

function SupervisorPendingJobsScreen({ 
    user, 
    jobs, 
    golfCourses, 
    users, 
    vehicles,
    onUpdateStatus,
    onFillJobForm,
    addPartsUsageLog 
}: SupervisorPendingJobsScreenProps) {
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedJobType, setSelectedJobType] = useState<string>('');

    // Filter jobs based on user permissions and selected course
    useEffect(() => {
        let filtered = jobs.filter(job => job.status === 'pending');

        // Filter by golf course if user is not admin
        if (user.role !== 'admin') {
            if (user.managed_golf_courses && user.managed_golf_courses.length > 0) {
                filtered = filtered.filter(job => 
                    user.managed_golf_courses!.includes(String(job.golf_course_id))
                );
            } else if (user.golf_course_id) {
                filtered = filtered.filter(job => String(job.golf_course_id) === user.golf_course_id);
            }
        }

        // Apply course filter if selected
        if (selectedCourseId) {
            filtered = filtered.filter(job => String(job.golf_course_id) === selectedCourseId);
        }

        // Apply job type filter if selected
        if (selectedJobType) {
            filtered = filtered.filter(job => job.type === selectedJobType);
        }

        setFilteredJobs(filtered);
    }, [jobs, user, selectedCourseId, selectedJobType]);

    // Get available golf courses for filter
    const getAvailableGolfCourses = () => {
        if (user.role === 'admin') {
            return golfCourses;
        } else if (user.managed_golf_courses && user.managed_golf_courses.length > 0) {
            return golfCourses.filter(gc => user.managed_golf_courses!.includes(gc.id));
        } else if (user.golf_course_id) {
            return golfCourses.filter(gc => gc.id === user.golf_course_id);
        }
        return [];
    };

    const formatDate = (dateInput: string | Date | undefined | null) => {
        try {
            // ตรวจสอบว่ามีข้อมูลวันที่หรือไม่
            if (!dateInput) {
                return 'ไม่ระบุวันที่';
            }

            let date: Date;
            
            // ถ้าเป็น Date object อยู่แล้ว
            if (dateInput instanceof Date) {
                date = dateInput;
            }
            // ถ้าเป็น string
            else if (typeof dateInput === 'string') {
                // ตรวจสอบว่าเป็น string ว่างหรือไม่
                if (dateInput.trim() === '') {
                    return 'ไม่ระบุวันที่';
                }
                
                // ถ้าเป็น timestamp (number string)
                if (!isNaN(Number(dateInput))) {
                    date = new Date(Number(dateInput));
                } else {
                    // ถ้าเป็น ISO string หรือ date string อื่นๆ
                    date = new Date(dateInput);
                }
            }
            // ถ้าเป็น number
            else if (typeof dateInput === 'number') {
                date = new Date(dateInput);
            }
            else {
                console.warn('Unknown date format:', dateInput);
                return 'รูปแบบวันที่ไม่รู้จัก';
            }

            // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
            if (isNaN(date.getTime())) {
                console.warn('Invalid date:', dateInput);
                return 'วันที่ไม่ถูกต้อง';
            }

            // ตรวจสอบว่าวันที่อยู่ในช่วงที่สมเหตุสมผลหรือไม่
            const now = new Date();
            const minDate = new Date('2020-01-01');
            const maxDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 ปีข้างหน้า

            if (date < minDate || date > maxDate) {
                console.warn('Date out of reasonable range:', dateInput, date);
                return 'วันที่ไม่อยู่ในช่วงที่เหมาะสม';
            }

            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Bangkok'
            });
        } catch (error) {
            console.error('Error formatting date:', error, 'Input:', dateInput);
            return 'เกิดข้อผิดพลาดในการแสดงวันที่';
        }
    };

    const getVehicleInfo = (vehicleId: string) => {
        return vehicles.find(v => v.id === vehicleId);
    };

    const getGolfCourseName = (golfCourseId: string) => {
        const course = golfCourses.find(gc => String(gc.id) === String(golfCourseId));
        return course?.name || 'ไม่ระบุ';
    };

    const getUserName = (userId: string) => {
        const user = users.find(u => String(u.id) === String(userId));
        return user?.name || 'ไม่ระบุ';
    };

    const handleApprove = async (jobId: string) => {
        if (confirm('ยืนยันการอนุมัติงานนี้?')) {
            try {
                // ใช้ onUpdateStatus ที่จะจัดการทั้ง UI update และ API call
                if (onUpdateStatus) {
                    await onUpdateStatus(parseInt(jobId), 'approved');
                    
                    // เพิ่ม Log การใช้อะไหล่เมื่องานได้รับการอนุมัติ
                    const job = jobs.find(j => j.id === jobId);
                    if (addPartsUsageLog && job) {
                        try {
                            await addPartsUsageLog(parseInt(jobId), job.partsNotes, job);
                        } catch (logError) {
                            console.error('Error adding parts usage log:', logError);
                            // ไม่ต้อง alert เพราะงานอนุมัติสำเร็จแล้ว แค่ log ไม่สำเร็จ
                        }
                    }
                    
                    alert('อนุมัติงานเรียบร้อยแล้ว');
                }
            } catch (error) {
                console.error('Error approving job:', error);
                alert('เกิดข้อผิดพลาดในการอนุมัติงาน');
            }
        }
    };

    const handleReject = async (jobId: string) => {
        if (confirm('ยืนยันการไม่อนุมัติงานนี้?')) {
            try {
                // ใช้ onUpdateStatus ที่จะจัดการทั้ง UI update และ API call
                if (onUpdateStatus) {
                    await onUpdateStatus(parseInt(jobId), 'rejected');
                    alert('ไม่อนุมัติงานเรียบร้อยแล้ว');
                }
            } catch (error) {
                console.error('Error rejecting job:', error);
                alert('เกิดข้อผิดพลาดในการไม่อนุมัติงาน');
            }
        }
    };

    const [selectedJobForDetails, setSelectedJobForDetails] = useState<Job | null>(null);

    const handleViewDetails = (job: Job) => {
        setSelectedJobForDetails(job);
    };

    const closeDetailsModal = () => {
        setSelectedJobForDetails(null);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.pageTitle}>งานรออนุมัติ</h2>
                    {filteredJobs.length > 0 && (
                        <span className={styles.pendingBadge}>
                            {filteredJobs.length} งานรออนุมัติ
                        </span>
                    )}
                </div>
            </div>

            {/* Filter Controls */}
            <div className={styles.filtersSection}>
                <div className={styles.filtersGrid}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>กรองตามสนาม:</label>
                        <select 
                            value={selectedCourseId || ''} 
                            onChange={(e) => setSelectedCourseId(e.target.value || null)}
                            className={styles.filterSelect}
                        >
                            <option value="">ทุกสนาม</option>
                            {getAvailableGolfCourses().map(course => (
                                <option key={course.id} value={String(course.id)}>
                                    {course.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>กรองตามประเภทงาน:</label>
                        <select 
                            value={selectedJobType} 
                            onChange={(e) => setSelectedJobType(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">ทุกประเภท</option>
                            <option value="PM">PM (Preventive Maintenance)</option>
                            <option value="BM">BM (Breakdown Maintenance)</option>
                            <option value="Recondition">Recondition</option>
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <button 
                            className={styles.btnReset}
                            onClick={() => {
                                setSelectedCourseId(null);
                                setSelectedJobType('');
                            }}
                        >
                            รีเซ็ตตัวกรอง
                        </button>
                    </div>
                </div>
            </div>

            {/* Jobs List */}
            <div className={styles.jobsList}>
                {filteredJobs.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📋</div>
                        <h3>ไม่มีงานรออนุมัติ</h3>
                        <p>ขณะนี้ไม่มีงานที่รออนุมัติจากคุณ</p>
                    </div>
                ) : (
                    filteredJobs.map(job => {
                        const vehicleInfo = getVehicleInfo(job.vehicle_id);
                        return (
                            <div key={job.id} className={styles.jobCardEnhanced}>
                                <div className={styles.jobCardHeader}>
                                    <div className={styles.jobHeaderLeft}>
                                        <h3 className={styles.vehicleNumber}>
                                            รถเบอร์ {job.vehicle_number}
                                        </h3>
                                        <span className={styles.jobTypeLabel}>
                                            {job.type}
                                        </span>
                                        <StatusBadge status={job.status} />
                                    </div>
                                    <div className={styles.jobHeaderRight}>
                                        <span className={styles.jobDate}>
                                            {formatDate((job as any).createdAt)}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.jobDetails}>
                                    <div className={styles.detailsGrid}>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>สนาม:</span>
                                            <span className={styles.detailValue}>
                                                {getGolfCourseName(job.golf_course_id)}
                                            </span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>ผู้แจ้ง:</span>
                                            <span className={styles.detailValue}>
                                                {getUserName(job.user_id)}
                                            </span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>ซีเรียลแบต:</span>
                                            <span className={styles.detailValue}>
                                                {job.battery_serial || vehicleInfo?.battery_serial || '-'}
                                            </span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>ระบบ:</span>
                                            <span className={styles.detailValue}>
                                                {job.system || '-'}
                                            </span>
                                        </div>
                                        {job.type === 'BM' && job.bmCause && (
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>สาเหตุ:</span>
                                                <span className={styles.detailValue}>
                                                    {job.bmCause === 'breakdown' ? 'เสีย' : 'อุบัติเหตุ'}
                                                </span>
                                            </div>
                                        )}
                                        {job.remarks && (
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>หมายเหตุ:</span>
                                                <span className={styles.detailValue}>
                                                    {job.remarks}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.actionButtons}>
                                    <button 
                                        className={`${styles.actionButton} ${styles.approveButton}`}
                                        onClick={() => handleApprove(job.id)}
                                    >
                                        <span className={styles.buttonIcon}>✓</span>
                                        อนุมัติ
                                    </button>
                                    <button 
                                        className={`${styles.actionButton} ${styles.rejectButton}`}
                                        onClick={() => handleReject(job.id)}
                                    >
                                        <span className={styles.buttonIcon}>✕</span>
                                        ไม่อนุมัติ
                                    </button>
                                    <button 
                                        className={`${styles.actionButton} ${styles.detailsButton}`}
                                        onClick={() => handleViewDetails(job)}
                                    >
                                        <span className={styles.buttonIcon}>👁️</span>
                                        ดูรายละเอียด
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Job Details Modal */}
            {selectedJobForDetails && (
                <div className={styles.modalOverlay} onClick={closeDetailsModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>รายละเอียดงาน - รถเบอร์ {selectedJobForDetails.vehicle_number}</h3>
                            <button className={styles.closeButton} onClick={closeDetailsModal}>
                                ✕
                            </button>
                        </div>
                        
                        <div className={styles.modalBody}>
                            <div className={styles.detailsSection}>
                                <h4>ข้อมูลทั่วไป</h4>
                                <div className={styles.detailsGrid}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>ประเภทงาน:</span>
                                        <span className={styles.detailValue}>{selectedJobForDetails.type}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>สถานะ:</span>
                                        <StatusBadge status={selectedJobForDetails.status} />
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>วันที่สร้าง:</span>
                                        <span className={styles.detailValue}>{formatDate((selectedJobForDetails as any).createdAt)}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>สนามกอล์ฟ:</span>
                                        <span className={styles.detailValue}>{getGolfCourseName(selectedJobForDetails.golf_course_id)}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>ผู้แจ้ง:</span>
                                        <span className={styles.detailValue}>{getUserName(selectedJobForDetails.user_id)}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>รถเบอร์:</span>
                                        <span className={styles.detailValue}>{selectedJobForDetails.vehicle_number}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.detailsSection}>
                                <h4>ข้อมูลเทคนิค</h4>
                                <div className={styles.detailsGrid}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>ซีเรียลแบตเตอรี่:</span>
                                        <span className={styles.detailValue}>{selectedJobForDetails.battery_serial || '-'}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>ระบบ:</span>
                                        <span className={styles.detailValue}>{selectedJobForDetails.system || '-'}</span>
                                    </div>
                                    {selectedJobForDetails.type === 'BM' && selectedJobForDetails.bmCause && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>สาเหตุ BM:</span>
                                            <span className={styles.detailValue}>
                                                {selectedJobForDetails.bmCause === 'breakdown' ? 'เสีย' : 
                                                 selectedJobForDetails.bmCause === 'accident' ? 'อุบัติเหตุ' :
                                                 selectedJobForDetails.bmCause === 'wear' ? 'สึกหรอ' : 'อื่นๆ'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedJobForDetails.subTasks && selectedJobForDetails.subTasks.length > 0 && (
                                <div className={styles.detailsSection}>
                                    <h4>งานย่อย</h4>
                                    <ul className={styles.tasksList}>
                                        {selectedJobForDetails.subTasks.map((task, index) => (
                                            <li key={index} className={styles.taskItem}>{task}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedJobForDetails.parts && selectedJobForDetails.parts.length > 0 && (
                                <div className={styles.detailsSection}>
                                    <h4>อะไหล่ที่ใช้</h4>
                                    <div className={styles.partsList}>
                                        {selectedJobForDetails.parts.map((part, index) => (
                                            <div key={index} className={styles.partItem}>
                                                <span className={styles.partName}>{part.part_name}</span>
                                                <span className={styles.partQuantity}>จำนวน: {part.quantity_used}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedJobForDetails.partsNotes && (
                                        <div className={styles.partsNotes}>
                                            <strong>หมายเหตุอะไหล่:</strong> {selectedJobForDetails.partsNotes}
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedJobForDetails.remarks && (
                                <div className={styles.detailsSection}>
                                    <h4>หมายเหตุ</h4>
                                    <div className={styles.remarksText}>
                                        {selectedJobForDetails.remarks}
                                    </div>
                                </div>
                            )}

                            {selectedJobForDetails.images && selectedJobForDetails.images.length > 0 && (
                                <div className={styles.detailsSection}>
                                    <h4>รูปภาพ</h4>
                                    <div className={styles.imagesGrid}>
                                        {selectedJobForDetails.images.map((image, index) => (
                                            <img 
                                                key={index} 
                                                src={image} 
                                                alt={`รูปภาพงาน ${index + 1}`}
                                                className={styles.jobImage}
                                                onClick={() => window.open(image, '_blank')}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <button 
                                className={`${styles.actionButton} ${styles.approveButton}`}
                                onClick={() => {
                                    handleApprove(selectedJobForDetails.id);
                                    closeDetailsModal();
                                }}
                            >
                                <span className={styles.buttonIcon}>✓</span>
                                อนุมัติ
                            </button>
                            <button 
                                className={`${styles.actionButton} ${styles.rejectButton}`}
                                onClick={() => {
                                    handleReject(selectedJobForDetails.id);
                                    closeDetailsModal();
                                }}
                            >
                                <span className={styles.buttonIcon}>✕</span>
                                ไม่อนุมัติ
                            </button>
                            <button 
                                className={`${styles.actionButton} ${styles.cancelButton}`}
                                onClick={closeDetailsModal}
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SupervisorPendingJobsScreen;