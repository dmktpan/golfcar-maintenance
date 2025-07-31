'use client';

import React from 'react';
import Image from 'next/image';
import { Job, GolfCourse, User, Vehicle, PARTS_BY_SYSTEM_DISPLAY } from '@/lib/data';
import StatusBadge from './StatusBadge';
import styles from './JobDetailsModal.module.css';
import { getSystemDisplayName, getSystemIcon } from '../lib/systemUtils';

interface JobDetailsModalProps {
  job: Job;
  golfCourses: GolfCourse[]; // เพิ่ม props
  users: User[];
  vehicles: Vehicle[];
  partsUsageLog?: any[]; // เพิ่ม props สำหรับ PartsUsageLog
  onClose: () => void;
}

const JobDetailsModal = ({ job, golfCourses, users, vehicles, partsUsageLog = [], onClose }: JobDetailsModalProps) => {
  // ปรับปรุงฟังก์ชัน getPartName ให้ใช้ part_name ที่บันทึกไว้เป็นหลัก
  const getPartName = (part: { part_id: string; part_name?: string }) => {
    if (part.part_name) {
      return part.part_name;
    }
    
    for (const system of Object.values(PARTS_BY_SYSTEM_DISPLAY)) {
      const partInfo = system.find((p: any) => p.id === parseInt(part.part_id));
      if (partInfo) {
        return partInfo.name;
      }
    }
    
    return `อะไหล่ ID: ${part.part_id}`;
  };

  // ฟังก์ชันสำหรับดึงข้อมูลอะไหล่จาก PartsUsageLog
  const getPartsFromUsageLog = () => {
    if (!partsUsageLog || partsUsageLog.length === 0) return [];
    
    return partsUsageLog
      .filter(log => log.jobId === parseInt(job.id))
      .map(log => ({
        part_name: log.partName,
        part_id: log.partId,
        quantity_used: log.quantityUsed
      }));
  };

  // ใช้ข้อมูลอะไหล่จาก job.parts หรือจาก PartsUsageLog
  const partsToDisplay = (job.parts && job.parts.length > 0) ? job.parts : getPartsFromUsageLog();

  const getGolfCourseName = (courseId: string | undefined) => {
    if (!courseId) return 'ไม่ระบุ';
    const course = golfCourses.find(c => c.id === courseId);
    return course ? course.name : 'ไม่ระบุ';
  };

  const getAssignedByName = (userId: string) => {
    const user = users.find(u => u.id.toString() === userId);
    return user ? user.name : 'ไม่ระบุ';
  };

  const getVehicleInfo = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const vehicleInfo = getVehicleInfo(job.vehicle_id);

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
                  <span className={styles['label-icon']}>🔋</span>
                  ซีเรียลแบต:
                </label>
                <span>{job.battery_serial || vehicleInfo?.battery_serial || '-'}</span>
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
                  <span className={styles['label-icon']}>{getSystemIcon(job.system || '')}</span>
                  ระบบที่ซ่อม:
                </label>
                <span>{getSystemDisplayName(job.system || '')}</span>
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
                  <li key={`subtask-${index}-${task.slice(0, 10)}`} className={styles['subtask-item']}>
                    <span className={styles['task-number']}>{index + 1}</span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* อะไหล่ที่ใช้ */}
          {partsToDisplay && partsToDisplay.length > 0 && (
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
                    {partsToDisplay.map((part, index) => (
                      <tr key={`part-${index}-${getPartName(part).slice(0, 10)}`}>
                        <td>{getPartName(part)}</td>
                        <td>
                            <span className={styles['quantity-badge']}>
                              {part.quantity_used || 'ไม่ระบุ'}
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
          {job.images && job.images.length > 0 && (
            <div className={styles['job-info-section']}>
              <h3>
                <span className={styles['section-icon']}>📷</span>
                รูปภาพ
              </h3>
              <div className={styles['image-gallery']}>
                {job.images.map((image, index) => (
                  <div key={`image-${index}-${image.slice(-10)}`} className={styles['image-item']}>
                    <Image 
                      src={image} 
                      alt={`รูปภาพงาน ${index + 1}`} 
                      className={styles['job-image']}
                      width={200}
                      height={150}
                      onClick={() => window.open(image, '_blank')}
                    />
                  </div>
                ))}
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