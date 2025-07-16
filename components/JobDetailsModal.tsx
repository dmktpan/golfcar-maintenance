'use client';

import React from 'react';
import { Job, MOCK_PARTS, MOCK_GOLF_COURSES, MOCK_USERS } from '@/lib/data';
import StatusBadge from './StatusBadge';
import styles from './JobDetailsModal.module.css';

interface JobDetailsModalProps {
  job: Job;
  onClose: () => void;
}

const JobDetailsModal = ({ job, onClose }: JobDetailsModalProps) => {
  const getPartName = (partId: number) => MOCK_PARTS.find(p => p.id === partId)?.name || 'ไม่พบอะไหล่';
  const getGolfCourseName = (courseId: number) => MOCK_GOLF_COURSES.find(c => c.id === courseId)?.name || 'ไม่พบสนาม';
  const getAssignedByName = (userId: number) => MOCK_USERS.find(u => u.id === userId)?.name || 'ไม่พบผู้มอบหมาย';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getJobTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'PM': 'Preventive Maintenance',
      'BM': 'Breakdown Maintenance',
      'Recondition': 'Recondition'
    };
    return typeLabels[type] || type;
  };

  const getSystemLabel = (system: string) => {
    const systemLabels: Record<string, string> = {
      'brake': 'ระบบเบรก',
      'steering': 'ระบบพวงมาลัย',
      'motor': 'ระบบมอเตอร์',
      'electric': 'ระบบไฟฟ้า'
    };
    return systemLabels[system] || system;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>รายละเอียดงาน #{job.id}</h2>
          <button className={styles.modalCloseBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* ข้อมูลพื้นฐาน */}
          <div className={styles.jobInfoSection}>
            <h3>ข้อมูลทั่วไป</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>ประเภทงาน:</label>
                <span className={styles.jobTypeBadge}>{getJobTypeLabel(job.type)}</span>
              </div>
              <div className={styles.infoItem}>
                <label>สถานะ:</label>
                <StatusBadge status={job.status} />
              </div>
              <div className={styles.infoItem}>
                <label>หมายเลขรถ:</label>
                <span>{job.vehicle_number}</span>
              </div>
              <div className={styles.infoItem}>
                <label>สนามกอล์ฟ:</label>
                <span>{getGolfCourseName(job.golf_course_id)}</span>
              </div>
              <div className={styles.infoItem}>
                <label>ระบบที่ซ่อม:</label>
                <span>{getSystemLabel(job.system)}</span>
              </div>
              <div className={styles.infoItem}>
                <label>ผู้รับผิดชอบ:</label>
                <span>{job.userName}</span>
              </div>
              {job.assigned_by && (
                <div className={styles.infoItem}>
                  <label>ผู้มอบหมาย:</label>
                  <span>{job.assigned_by_name || getAssignedByName(job.assigned_by)}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <label>วันที่สร้าง:</label>
                <span>{formatDate(job.created_at)}</span>
              </div>
              {job.updated_at && (
                <div className={styles.infoItem}>
                  <label>วันที่อัปเดต:</label>
                  <span>{formatDate(job.updated_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* งานย่อย */}
          {job.subTasks && job.subTasks.length > 0 && (
            <div className={styles.jobInfoSection}>
              <h3>งานย่อยที่ต้องทำ</h3>
              <ul className={styles.subtasksList}>
                {job.subTasks.map((task, index) => (
                  <li key={index} className={styles.subtaskItem}>
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* อะไหล่ที่ใช้ */}
          {job.parts && job.parts.length > 0 && (
            <div className={styles.jobInfoSection}>
              <h3>อะไหล่ที่ใช้</h3>
              <div className={styles.partsTable}>
                <table>
                  <thead>
                    <tr>
                      <th>ชื่ออะไหล่</th>
                      <th>จำนวน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.parts.map((part, index) => (
                      <tr key={index}>
                        <td>{getPartName(part.part_id)}</td>
                        <td>{part.quantity_used}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* หมายเหตุอะไหล่ */}
          {job.partsNotes && (
            <div className={styles.jobInfoSection}>
              <h3>หมายเหตุอะไหล่</h3>
              <p className={styles.notesText}>{job.partsNotes}</p>
            </div>
          )}

          {/* หมายเหตุ */}
          {job.remarks && (
            <div className={styles.jobInfoSection}>
              <h3>หมายเหตุ</h3>
              <p className={styles.notesText}>{job.remarks}</p>
            </div>
          )}

          {/* รูปภาพ */}
          {job.imageUrl && (
            <div className={styles.jobInfoSection}>
              <h3>รูปภาพ</h3>
              <img src={job.imageUrl} alt="รูปภาพงาน" className={styles.jobImage} />
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary} onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;