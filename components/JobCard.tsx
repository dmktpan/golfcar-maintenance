'use client';

import React from 'react';
import { Job, JobStatus, User, MOCK_PARTS } from '@/lib/data';
import StatusBadge from './StatusBadge';

interface JobCardProps {
  job: Job;
  user: User;
  onUpdateStatus: (jobId: number, status: JobStatus) => void;
  onFillJobForm?: (job: Job) => void;
  isHistory?: boolean;
}

const JobCard = ({ job, user, onUpdateStatus, onFillJobForm, isHistory = false }: JobCardProps) => {
    const getPartName = (partId: number) => MOCK_PARTS.find(p => p.id === partId)?.name || 'ไม่พบอะไหล่';
    
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

    return (
        <div className={`card job-card status-${job.status}`}>
            <div className="job-card-content">
                <div className="job-card-header">
                    <div className="job-header-left">
                        <span className="vehicle-number">รถเบอร์: {job.vehicle_number}</span>
                        <span className="job-date">{formatDate(job.created_at)}</span>
                        {job.assigned_by_name && (
                            <span className="job-assigned-by">มอบหมายโดย: {job.assigned_by_name}</span>
                        )}
                    </div>
                    <StatusBadge status={job.status} />
                </div>
                <div className="job-card-body">
                    <div className="job-info-grid">
                        <div className="job-info-item">
                            <span className="info-label">ประเภท:</span>
                            <span className="info-value">{job.type}</span>
                        </div>
                        <div className="job-info-item">
                            <span className="info-label">ผู้แจ้ง:</span>
                            <span className="info-value">{job.userName}</span>
                        </div>
                        <div className="job-info-item">
                            <span className="info-label">ระบบ:</span>
                            <span className="info-value">{job.system}</span>
                        </div>
                    </div>
                    
                    <div className="job-details">
                        {job.subTasks.length > 0 && (
                            <div className="job-detail-item">
                                <span className="detail-label">งานย่อย:</span>
                                <span className="detail-value">{job.subTasks.join(', ')}</span>
                            </div>
                        )}
                        
                        {job.partsNotes && (
                            <div className="job-detail-item">
                                <span className="detail-label">อะไหล่ที่เปลี่ยน:</span>
                                <span className="detail-value parts-notes-display">{job.partsNotes}</span>
                            </div>
                        )}
                        
                        {job.remarks && (
                            <div className="job-detail-item">
                                <span className="detail-label">หมายเหตุ:</span>
                                <span className="detail-value">{job.remarks}</span>
                            </div>
                        )}
                        
                        {job.parts.length > 0 && (
                            <div className="job-detail-item">
                                <span className="detail-label">อะไหล่ที่ใช้ (เก่า):</span>
                                <ul className="parts-list">
                                    {job.parts.map(p => (
                                        <li key={p.part_id}>{getPartName(p.part_id)} (x{p.quantity_used})</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* ปุ่มสำหรับพนักงานที่ได้รับงานมอบหมาย */}
            {user.role === 'staff' && job.status === 'assigned' && job.assigned_to === user.id && onFillJobForm && (
                <div className="job-card-footer">
                    <button className="btn-primary" onClick={() => onFillJobForm(job)}>
                        <span className="btn-icon">📝</span> กรอกรายละเอียดงาน
                    </button>
                </div>
            )}
            
            {/* เพิ่ม: ปุ่มแก้ไขสำหรับงานที่พนักงานสร้างเองและอยู่ในสถานะ pending */}
            {user.role === 'staff' && job.status === 'pending' && job.user_id === user.id && !job.assigned_by && onFillJobForm && (
                <div className="job-card-footer">
                    <button className="btn-secondary" onClick={() => onFillJobForm(job)}>
                        <span className="btn-icon">✏️</span> แก้ไขงาน
                    </button>
                </div>
            )}
            
            {/* ปุ่มสำหรับหัวหน้างานอนุมัติ/ไม่อนุมัติ */}
            {user.role === 'supervisor' && job.status === 'pending' && (
                <div className="job-card-footer">
                    <button className="btn-success" onClick={() => onUpdateStatus(job.id, 'approved')}>
                        <span className="btn-icon">✓</span> อนุมัติ
                    </button>
                    <button className="btn-danger" onClick={() => onUpdateStatus(job.id, 'rejected')}>
                        <span className="btn-icon">✕</span> ไม่อนุมัติ
                    </button>
                </div>
            )}
        </div>
    );
}

export default JobCard;