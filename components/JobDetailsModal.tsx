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
  
  // ปรับปรุงฟังก์ชัน getPartName ให้รองรับข้อมูลจากหลายแหล่ง
  const getPartName = (part: any) => {
    // ลำดับความสำคัญ: name > part_name > ค้นหาจาก part_id
    if (part.name) {
      return part.name;
    }
    
    if (part.part_name) {
      return part.part_name;
    }
    
    // ถ้ามี part_id ให้ค้นหาจาก PARTS_BY_SYSTEM_DISPLAY
    if (part.part_id) {
      for (const system of Object.values(PARTS_BY_SYSTEM_DISPLAY)) {
        const partInfo = system.find((p: any) => p.id.toString() === part.part_id.toString());
        if (partInfo) {
          return partInfo.name;
        }
      }
      return `อะไหล่ ID: ${part.part_id}`;
    }
    
    // ถ้าไม่มีข้อมูลใดๆ
    return 'ไม่ระบุชื่ออะไหล่';
  };

  // ฟังก์ชันสำหรับดึงข้อมูลอะไหล่จาก PartsUsageLog
  const getPartsFromUsageLog = () => {
    if (!partsUsageLog || partsUsageLog.length === 0) {
      return [];
    }
    
    // หา logs ที่เกี่ยวข้องกับ job นี้
    // ตรวจสอบทั้ง jobId ที่ตรงกันทั้งหมด และ jobId ที่เป็นส่วนหน้าของ ObjectId
    let jobUsageLogs = partsUsageLog.filter(log => {
      // ตรวจสอบว่า jobId ตรงกันทั้งหมด
      const exactMatch = log.jobId === job.id;
      // ตรวจสอบว่า job.id เริ่มต้นด้วย log.jobId หรือไม่ (สำหรับกรณีที่ jobId เป็นส่วนหน้า)
      const startsWithJobId = job.id.startsWith(log.jobId.toString());
      // ตรวจสอบว่า log.jobId เริ่มต้นด้วย job.id หรือไม่ (สำหรับกรณีที่ job.id เป็นส่วนหน้า)
      const logStartsWithJobId = log.jobId.toString().startsWith(job.id);
      
      return exactMatch || startsWithJobId || logStartsWithJobId;
    });
    
    // ถ้ายังไม่เจอ ให้ลองค้นหาจาก vehicleNumber
    if (jobUsageLogs.length === 0) {
      jobUsageLogs = partsUsageLog.filter(log => 
        log.vehicleNumber === job.vehicle_number ||
        log.vehicleSerial === job.vehicle_number
      );
    }
    
    if (!jobUsageLogs || jobUsageLogs.length === 0) {
      return [];
    }
    
    // แปลง PartsUsageLog เป็น format ที่ใช้แสดงผล
    const parts = jobUsageLogs.map(log => ({
      name: log.partName, // ใช้ partName แทน name
      quantity_used: log.quantityUsed,
      system: log.system
    }));
    
    return parts;
  };

  // ใช้ข้อมูลอะไหล่จาก job.parts หรือจาก PartsUsageLog หรือจาก job.parts_used
  let partsToDisplay = [];
  
  // ลำดับความสำคัญขึ้นอยู่กับสถานะงาน:
  // - สำหรับงาน pending: job.parts > job.parts_used
  // - สำหรับงาน approved/completed: PartsUsageLog > job.parts > job.parts_used
  if (job.status === 'approved' || job.status === 'completed') {
    // สำหรับงานที่อนุมัติแล้ว ใช้ข้อมูลจาก PartsUsageLog ก่อน
    const partsFromUsageLog = getPartsFromUsageLog();
    if (partsFromUsageLog.length > 0) {
      partsToDisplay = partsFromUsageLog;
    } else if (job.parts && job.parts.length > 0) {
      partsToDisplay = job.parts;
    } else if ((job as any).parts_used && (job as any).parts_used.length > 0) {
      // แปลง parts_used string array เป็น object format
      partsToDisplay = (job as any).parts_used.map((partString: string, index: number) => {
        // แยกชื่อและจำนวนจาก string เช่น "แป้นเบรค (จำนวน: 1)"
        const match = partString.match(/^(.+?)\s*\(จำนวน:\s*(\d+)\)$/);
        if (match) {
          return {
            name: match[1].trim(),
            quantity_used: parseInt(match[2]),
            part_name: match[1].trim()
          };
        } else {
          return {
            name: partString,
            quantity_used: 1,
            part_name: partString
          };
        }
      });
    }
  } else {
    // สำหรับงาน pending ใช้ข้อมูลจาก job.parts ก่อน
    if (job.parts && job.parts.length > 0) {
      partsToDisplay = job.parts;
    } else {
      const partsFromUsageLog = getPartsFromUsageLog();
      if (partsFromUsageLog.length > 0) {
        partsToDisplay = partsFromUsageLog;
      } else if ((job as any).parts_used && (job as any).parts_used.length > 0) {
        // แปลง parts_used string array เป็น object format
        partsToDisplay = (job as any).parts_used.map((partString: string, index: number) => {
          // แยกชื่อและจำนวนจาก string เช่น "แป้นเบรค (จำนวน: 1)"
          const match = partString.match(/^(.+?)\s*\(จำนวน:\s*(\d+)\)$/);
          if (match) {
            return {
              name: match[1].trim(),
              quantity_used: parseInt(match[2]),
              part_name: match[1].trim()
            };
          } else {
            return {
              name: partString,
              quantity_used: 1,
              part_name: partString
            };
          }
        });
      }
    }
  }

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
        if (/^\d+$/.test(dateInput)) {
          date = new Date(parseInt(dateInput));
        } else {
          date = new Date(dateInput);
        }
      } else {
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
        timeZone: 'Asia/Bangkok' // ระบุ timezone ไทยอย่างชัดเจน
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateInput);
      return 'ข้อผิดพลาดในการแสดงวันที่';
    }
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
                <span>{formatDate((job as any).createdAt)}</span>
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
          {partsToDisplay && partsToDisplay.length > 0 ? (
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
                    {partsToDisplay.map((part: any, index: number) => (
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
          ) : (
            <div className={styles['job-info-section']}>
              <h3>
                <span className={styles['section-icon']}>🔧</span>
                อะไหล่ที่ใช้
              </h3>
              <div className={styles['notes-container']}>
                <div className={styles['notes-icon']}>ℹ️</div>
                <p className={styles['notes-text']}>ไม่มีข้อมูลอะไหล่ที่ใช้ในงานนี้</p>
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
                {job.images.map((image, index) => {
                  // ตรวจสอบและสร้าง URL ที่ถูกต้องสำหรับการแสดงผล
                  let displaySrc = image;
                  
                  // ถ้าเป็น external URL ให้ใช้ตามเดิม
                  if (image.startsWith('http://') || image.startsWith('https://')) {
                    displaySrc = image;
                  }
                  // ถ้ามี path ของ API อยู่แล้ว ให้ใช้ตามเดิม
                  else if (image.startsWith('/api/uploads/maintenance/')) {
                    displaySrc = image;
                  }
                  // ถ้าเป็นชื่อไฟล์เปล่า ให้เพิ่ม path
                  else {
                    displaySrc = `/api/uploads/maintenance/${image}`;
                  }
                  
                  return (
                    <div key={`image-${index}-${image.slice(-10)}`} className={styles['image-item']}>
                      <Image 
                        src={displaySrc} 
                        alt={`รูปภาพงาน ${index + 1}`} 
                        className={styles['job-image']}
                        width={200}
                        height={150}
                        onClick={() => window.open(displaySrc, '_blank')}
                        onError={(e) => {
                          // Fallback ถ้าโหลดรูปไม่ได้
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.svg';
                          console.error('Failed to load image:', displaySrc);
                        }}
                      />
                    </div>
                  );
                })}
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