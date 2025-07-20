'use client';

import React from 'react';
import { Job, MOCK_PARTS, MOCK_GOLF_COURSES, MOCK_USERS, PARTS_BY_SYSTEM_DISPLAY } from '@/lib/data';
import StatusBadge from './StatusBadge';
import styles from './JobDetailsModal.module.css';

interface JobDetailsModalProps {
  job: Job;
  onClose: () => void;
}

const JobDetailsModal = ({ job, onClose }: JobDetailsModalProps) => {
  // ปรับปรุงฟังก์ชัน getPartName ให้ใช้ part_name ที่บันทึกไว้เป็นหลัก
  const getPartName = (part: { part_id: number; part_name?: string }) => {
    // ใช้ part_name ที่บันทึกไว้เป็นหลัก
    if (part.part_name) {
      return part.part_name;
    }
    
    // หากไม่มี part_name ให้ค้นหาจาก PARTS_BY_SYSTEM_DISPLAY
    for (const system of Object.values(PARTS_BY_SYSTEM_DISPLAY)) {
      const partInfo = system.find((p: any) => p.id === part.part_id);
      if (partInfo) {
        return partInfo.name;
      }
    }
    
    // สุดท้ายค้นหาจาก MOCK_PARTS
    const mockPart = MOCK_PARTS.find(p => p.id === part.part_id);
    if (mockPart) {
      return mockPart.name;
    }
    
    return 'ไม่พบอะไหล่';
  };

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

  const getSystemIcon = (system: string) => {
    const systemIcons: Record<string, string> = {
      'brake': '🛑',
      'steering': '🎯',
      'motor': '⚙️',
      'electric': '⚡'
    };
    return systemIcons[system] || '🔧';
  };

  const getJobTypeIcon = (type: string) => {
    const typeIcons: Record<string, string> = {
      'PM': '🔄',
      'BM': '🚨',
      'Recondition': '🔨'
    };
    return typeIcons[type] || '🔧';
  };

  return (
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
        <div className={styles['modal-header']}>
          <div className={styles['header-left']}>
            <div className={styles['job-icon']}>📋</div>
            <div>
              <h2>รายละเอียดงาน #{job.id}</h2>
              <p className={styles['vehicle-info']}>🚗 รถเบอร์ {job.vehicle_number}</p>
            </div>
          </div>
          <button className={styles['modal-close-btn']} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles['modal-body']}>
          {/* ข้อมูลพื้นฐาน */}
          <div className={styles['job-info-section']}>
            <h3>
              <span className={styles['section-icon']}>ℹ️</span>
              ข้อมูลทั่วไป
            </h3>
            <div className={styles['info-grid']}>
              <div className={styles['info-item']}>
                <label>
                  <span className={styles['label-icon']}>{getJobTypeIcon(job.type)}</span>
                  ประเภทงาน:
                </label>
                <span className={styles['job-type-badge']}>{getJobTypeLabel(job.type)}</span>
              </div>
              <div className={styles['info-item']}>
                <label>
                  <span className={styles['label-icon']}>📊</span>
                  สถานะ:
                </label>
                <StatusBadge status={job.status} />
              </div>
              <div className={styles['info-item']}>
                <label>
                  <span className={styles['label-icon']}>🚗</span>
                  หมายเลขรถ:
                </label>
                <span>{job.vehicle_number}</span>
              </div>
              <div className={styles['info-item']}>
                <label>
                  <span className={styles['label-icon']}>🏌️</span>
                  สนามกอล์ฟ:
                </label>
                <span>{getGolfCourseName(job.golf_course_id)}</span>
              </div>
              <div className={styles['info-item']}>
                <label>
                  <span className={styles['label-icon']}>{getSystemIcon(job.system)}</span>
                  ระบบที่ซ่อม:
                </label>
                <span>{getSystemLabel(job.system)}</span>
              </div>
              {job.type === 'BM' && job.bmCause && (
                <div className={styles['info-item']}>
                  <label>
                    <span className={styles['label-icon']}>⚠️</span>
                    สาเหตุของการเสีย:
                  </label>
                  <span>{job.bmCause === 'breakdown' ? 'เสีย' : 'อุบัติเหตุ'}</span>
                </div>
              )}
              <div className={styles['info-item']}>
                <label>
                  <span className={styles['label-icon']}>👤</span>
                  ผู้รับผิดชอบ:
                </label>
                <span>{job.userName}</span>
              </div>
              {job.assigned_by && (
                <div className={styles['info-item']}>
                  <label>
                    <span className={styles['label-icon']}>👨‍💼</span>
                    ผู้มอบหมาย:
                  </label>
                  <span>{job.assigned_by_name || getAssignedByName(job.assigned_by)}</span>
                </div>
              )}
              <div className={styles['info-item']}>
                <label>
                  <span className={styles['label-icon']}>📅</span>
                  วันที่สร้าง:
                </label>
                <span>{formatDate(job.created_at)}</span>
              </div>
              {job.updated_at && (
                <div className={styles['info-item']}>
                  <label>
                    <span className={styles['label-icon']}>🔄</span>
                    วันที่อัปเดต:
                  </label>
                  <span>{formatDate(job.updated_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* งานย่อย */}
          {job.subTasks && job.subTasks.length > 0 && (
            <div className={styles['job-info-section']}>
              <h3>
                <span className={styles['section-icon']}>📝</span>
                งานย่อยที่ต้องทำ
              </h3>
              <ul className={styles['subtasks-list']}>
                {job.subTasks.map((task, index) => (
                  <li key={index} className={styles['subtask-item']}>
                    <span className={styles['task-number']}>{index + 1}</span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* อะไหล่ที่ใช้ */}
          {job.parts && job.parts.length > 0 && (
            <div className={styles['job-info-section']}>
              <h3>
                <span className={styles['section-icon']}>🔧</span>
                อะไหล่ที่ใช้
              </h3>
              <div className={styles['parts-table']}>
                <table>
                  <thead>
                    <tr>
                      <th>
                        <span className={styles['table-icon']}>🔩</span>
                        ชื่ออะไหล่
                      </th>
                      <th>
                        <span className={styles['table-icon']}>📊</span>
                        จำนวน
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.parts.map((part, index) => (
                      <tr key={index}>
                        <td>{getPartName(part)}</td>
                        <td>
                          <span className={styles['quantity-badge']}>
                            {part.quantity_used}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* หมายเหตุอะไหล่ */}
          {job.partsNotes && (
            <div className={styles['job-info-section']}>
              <h3>
                <span className={styles['section-icon']}>📝</span>
                หมายเหตุอะไหล่
              </h3>
              <div className={styles['notes-container']}>
                <div className={styles['notes-icon']}>💬</div>
                <p className={styles['notes-text']}>{job.partsNotes}</p>
              </div>
            </div>
          )}

          {/* หมายเหตุ */}
          {job.remarks && (
            <div className={styles['job-info-section']}>
              <h3>
                <span className={styles['section-icon']}>📋</span>
                หมายเหตุ
              </h3>
              <div className={styles['notes-container']}>
                <div className={styles['notes-icon']}>💭</div>
                <p className={styles['notes-text']}>{job.remarks}</p>
              </div>
            </div>
          )}

          {/* รูปภาพ */}
          {job.imageUrl && (
            <div className={styles['job-info-section']}>
              <h3>
                <span className={styles['section-icon']}>📷</span>
                รูปภาพ
              </h3>
              <div className={styles['image-container']}>
                <img src={job.imageUrl} alt="รูปภาพงาน" className={styles['job-image']} />
              </div>
            </div>
          )}
        </div>

        <div className={styles['modal-footer']}>
          <button className={styles['btn-secondary']} onClick={onClose}>
            <span className={styles['btn-icon']}>✕</span>
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;