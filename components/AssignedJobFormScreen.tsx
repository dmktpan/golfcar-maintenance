'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, JobType, Vehicle, GolfCourse, MOCK_SYSTEMS } from '@/lib/data';
import { View } from '@/app/page';
import styles from './AssignedJobFormScreen.module.css';

interface AssignedJobFormScreenProps {
    user: User;
    job: Job;
    onJobUpdate: (updatedJob: Job) => void;
    setView: (view: View) => void;
    vehicles: Vehicle[];
    golfCourses: GolfCourse[];
}

// เพิ่ม PARTS_BY_SYSTEM constant
const PARTS_BY_SYSTEM = {
    'brake': [
        { id: 'brake_1', name: 'แป้นเบรค' },
        { id: 'brake_2', name: 'ชุดล็อคเบรค' },
        { id: 'brake_3', name: 'เฟืองปาร์คเบรค' },
        { id: 'brake_4', name: 'สปริงคคันเร่ง' },
        { id: 'brake_5', name: 'สายเบรกสั้น' },
        { id: 'brake_6', name: 'สายเบรกยาว' },
        { id: 'brake_7', name: 'ผ้าเบรก EZGO' },
        { id: 'brake_8', name: 'ผ้าเบรก EZGO สั้น' },
        { id: 'brake_9', name: 'ผ้าเบรก EZGO ยาว' },
        { id: 'brake_10', name: 'ซีลล้อหลัง' },
        { id: 'brake_11', name: 'ลูกปืน 6205' },
        { id: 'brake_12', name: 'น๊อตยึดแป้นเบรก' }
    ],
    'steering': [
        { id: 'steering_1', name: 'ยอยด์' },
        { id: 'steering_2', name: 'ระปุกพวงมาลัย' },
        { id: 'steering_3', name: 'เอ็นแร็ค' },
        { id: 'steering_4', name: 'ลูกหมาก' },
        { id: 'steering_5', name: 'ลูกหมากใต้โช๊ค' },
        { id: 'steering_6', name: 'ลูกปืน 6005' },
        { id: 'steering_7', name: 'ลูกปืน 6204' },
        { id: 'steering_8', name: 'ยางกันฝัน' },
        { id: 'steering_9', name: 'โช้คหน้า' },
        { id: 'steering_10', name: 'ลูกหมากหัวโช้คบน' },
        { id: 'steering_11', name: 'ปีกนก L+R' }
    ],
    'motor': [
        { id: 'motor_1', name: 'แปลงถ่าน' },
        { id: 'motor_2', name: 'ลูกปืน 6205' },
        { id: 'motor_3', name: 'แม่เหล็กมอเตอร์' },
        { id: 'motor_4', name: 'เซ็นเซอร์มอเตอร์' }
    ],
    'electric': [],
    'others': [
        { id: 'others_1', name: 'บอดี้หน้า' },
        { id: 'others_2', name: 'บอดี้หลัง' },
        { id: 'others_3', name: 'โครงหลังคาหน้า' },
        { id: 'others_4', name: 'โครงหลังคาหลัง' },
        { id: 'others_5', name: 'หลังคา' },
        { id: 'others_6', name: 'เบาะนั่ง' },
        { id: 'others_7', name: 'พนักพิง' },
        { id: 'others_8', name: 'ยาง' },
        { id: 'others_9', name: 'แคดดี้เพลต' }
    ]
};

const AssignedJobFormScreen = ({ user, job, onJobUpdate, setView, vehicles, golfCourses }: AssignedJobFormScreenProps) => {
    const [jobType, setJobType] = useState<JobType>(job.type);
    const [selectedSystem, setSelectedSystem] = useState(job.system);
    const [subTasks, setSubTasks] = useState<string[]>(job.subTasks || []);
    const [newSubTask, setNewSubTask] = useState('');
    const [partsNotes, setPartsNotes] = useState(job.partsNotes || '');
    const [remarks, setRemarks] = useState(job.remarks || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPresetTasks, setShowPresetTasks] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');
    const [workDuration, setWorkDuration] = useState<string>('');
    
    // เพิ่ม state variables สำหรับ parts modal
    const [selectedParts, setSelectedParts] = useState<string[]>([]);
    const [showPartsModal, setShowPartsModal] = useState(false);
    const [activePartsTab, setActivePartsTab] = useState('brake');

    // ฟังก์ชันสำหรับการเลือกอะไหล่
    const handlePartSelection = (partName: string) => {
        setSelectedParts((prev: string[]) => {
            if (prev.includes(partName)) {
                return prev.filter((p: string) => p !== partName);
            } else {
                return [...prev, partName];
            }
        });
    }

    // ฟังก์ชันสำหรับการลบอะไหล่
    const handleRemovePart = (partName: string) => {
        setSelectedParts((prev: string[]) => prev.filter((p: string) => p !== partName));
    }

    // ฟังก์ชันสำหรับแสดงชื่อแท็บ
    const getTabDisplayName = (tab: string) => {
        const tabNames: Record<string, string> = {
            'brake': 'ระบบเบรก',
            'steering': 'ระบบบังคับเลี้ยว',
            'motor': 'ระบบมอเตอร์/เพื่อขับ',
            'electric': 'ระบบไฟฟ้า',
            'others': 'อื่นๆ'
        };
        return tabNames[tab] || tab;
    };

    const userGolfCourse = golfCourses.find(gc => gc.id === user.golf_course_id);
    const selectedVehicle = vehicles.find(v => v.id === job.vehicle_id);
    const golfCourse = userGolfCourse;

    const addSubTask = () => {
        if (newSubTask.trim() && !subTasks.includes(newSubTask.trim())) {
            setSubTasks([...subTasks, newSubTask.trim()]);
            setNewSubTask('');
        }
    };

    const removeSubTask = (index: number) => {
        setSubTasks(subTasks.filter((_, i) => i !== index));
    };

    // เพิ่มงานย่อยจากระบบที่เลือก
    const addPresetTask = (task: string) => {
        if (!subTasks.includes(task)) {
            setSubTasks([...subTasks, task]);
        }
    };

    // ล้างฟอร์ม
    const resetForm = () => {
        setJobType(job.type);
        setSelectedSystem(job.system);
        setSubTasks(job.subTasks || []);
        setPartsNotes(job.partsNotes || '');
        setRemarks(job.remarks || '');
        setStartTime('');
        setEndTime('');
        setWorkDuration('');
        setIsDirty(false);
    };

    // ฟังก์ชันสำหรับการยืนยันการออกจากหน้า
    const handleBack = () => {
        if (isDirty) {
            setShowConfirmDialog(true);
        } else {
            setView('dashboard');
        }
    };

    // บันทึกเป็น draft
    const saveDraft = () => {
        const draftData = {
            jobId: job.id,
            jobType,
            selectedSystem,
            subTasks,
            partsNotes,
            remarks,
            startTime,
            endTime,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(`draft_job_${job.id}`, JSON.stringify(draftData));
        alert('บันทึก Draft เรียบร้อยแล้ว');
    };

    // โหลด draft
    const loadDraft = () => {
        const draftData = localStorage.getItem(`draft_job_${job.id}`);
        if (draftData) {
            const draft = JSON.parse(draftData);
            setJobType(draft.jobType);
            setSelectedSystem(draft.selectedSystem);
            setSubTasks(draft.subTasks || []);
            setPartsNotes(draft.partsNotes || '');
            setRemarks(draft.remarks || '');
            setStartTime(draft.startTime || '');
            setEndTime(draft.endTime || '');
            alert('โหลด Draft เรียบร้อยแล้ว');
        }
    };

    // ตรวจสอบว่ามี draft หรือไม่
    const hasDraft = () => {
        return localStorage.getItem(`draft_job_${job.id}`) !== null;
    };

    // รับข้อมูลจากหน้าต่างงานที่เสร็จสิ้น
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'TASK_COMPLETED') {
                const { taskIndex, taskName, notes, completedItems, totalItems, duration } = event.data;
                
                // อัปเดตหมายเหตุด้วยข้อมูลจากการทำงาน
                const taskReport = `\n\n--- รายงานการทำงาน: ${taskName} ---\n` +
                    `เวลาที่ใช้: ${duration}\n` +
                    `รายการที่เสร็จ: ${completedItems}/${totalItems}\n` +
                    `หมายเหตุ: ${notes || 'ไม่มี'}\n` +
                    `เสร็จสิ้นเมื่อ: ${new Date().toLocaleString('th-TH')}\n`;
                
                setRemarks(prev => prev + taskReport);
                
                // แสดงการแจ้งเตือน
                alert(`งาน "${taskName}" เสร็จสิ้นแล้ว!\nเวลาที่ใช้: ${duration}`);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
    
        // สร้างงานที่อัปเดตแล้ว
        const updatedJob: Job = {
            ...job,
            type: jobType,
            system: selectedSystem,
            subTasks,
            partsNotes,
            remarks,
            status: 'pending' as const, // เปลี่ยนสถานะเป็น pending เมื่อส่งงาน
            updated_at: new Date().toISOString(),
            // ลบการจัดการ assigned_to ที่ผิด - ควรเก็บค่าเดิมไว้
            assigned_to: job.assigned_to // เก็บค่า assigned_to เดิมไว้
        };
    
        // เรียกฟังก์ชันอัปเดตงาน
        onJobUpdate(updatedJob);
        
        // ลบ draft หลังจากบันทึกเสร็จ (เฉพาะเมื่อส่งสำเร็จ)
        try {
            localStorage.removeItem(`draft_job_${job.id}`);
            setTimeout(() => {
                setIsSubmitting(false);
                alert('บันทึกข้อมูลงานเรียบร้อยแล้ว');
                setView('dashboard');
            }, 1000);
        } catch (error) {
            setIsSubmitting(false);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

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

    return (
        <div className={styles.card}>
            {/* Dialog ยืนยันการออกจากหน้า */}
            {showConfirmDialog && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</h3>
                        <p>คุณต้องการบันทึกเป็น Draft หรือออกโดยไม่บันทึก?</p>
                        <div className={styles.modalActions}>
                            <button 
                                className={styles.btnOutline} 
                                onClick={() => setShowConfirmDialog(false)}
                            >
                                ยกเลิก
                            </button>
                            <button 
                                className={styles.btnSecondary} 
                                onClick={() => {
                                    saveDraft();
                                    setView('dashboard');
                                }}
                            >
                                บันทึก Draft
                            </button>
                            <button 
                                className={styles.btnDanger} 
                                onClick={() => {
                                    setView('dashboard');
                                }}
                            >
                                ออกโดยไม่บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.pageHeader}>
                <div className={styles.headerContent}>
                    <h2>กรอกรายละเอียดงานที่ได้รับมอบหมาย</h2>
                    <div className={styles.headerStatus}>
                        {isDirty && <span className={styles.statusIndicator}>● มีการเปลี่ยนแปลง</span>}
                        {hasDraft() && <span className={styles.draftIndicator}>📄 มี Draft</span>}
                    </div>
                </div>
                <div className={styles.headerActions}>
                    {hasDraft() && (
                        <button className={styles.btnSecondary} onClick={loadDraft}>
                            โหลด Draft
                        </button>
                    )}
                    <button className={styles.btnOutline} onClick={saveDraft} disabled={!isDirty}>
                        บันทึก Draft
                    </button>
                    <button className={styles.btnOutline} onClick={handleBack}>กลับ</button>
                </div>
            </div>

            {/* ข้อมูลงานที่มอบหมาย */}
            <div className={styles.assignedJobInfo}>
                <h3>ข้อมูลงานที่ได้รับมอบหมาย</h3>
                <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>รหัสงาน:</span>
                        <span className={styles.infoValue}>#{job.id}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>รถเบอร์:</span>
                        <span className={styles.infoValue}>{job.vehicle_number}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>หมายเลขซีเรียล:</span>
                        <span className={styles.infoValue}>{selectedVehicle?.serial_number || 'ไม่ระบุ'}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>สนามกอล์ฟ:</span>
                        <span className={styles.infoValue}>{golfCourse?.name || 'ไม่ระบุ'}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>วันที่มอบหมาย:</span>
                        <span className={styles.infoValue}>{formatDate(job.created_at)}</span>
                    </div>
                    {job.assigned_by_name && (
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>มอบหมายโดย:</span>
                            <span className={styles.infoValue}>{job.assigned_by_name}</span>
                        </div>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.jobForm}>
                {/* เวลาทำงาน */}
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>เวลาเริ่มงาน</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className={styles.timeInput}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>เวลาเสร็จงาน</label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className={styles.timeInput}
                        />
                    </div>
                    {workDuration && (
                        <div className={styles.formGroup}>
                            <label>ระยะเวลาทำงาน</label>
                            <div className={styles.durationDisplay}>{workDuration}</div>
                        </div>
                    )}
                </div>

                {/* ประเภทงาน */}
                <div className={styles.formGroup}>
                    <label>ประเภทงาน *</label>
                    <div className={styles.radioGroup}>
                        <label className={styles.radioOption}>
                            <input 
                                type="radio" 
                                name="jobType" 
                                value="PM" 
                                checked={jobType === 'PM'}
                                onChange={(e) => setJobType(e.target.value as JobType)}
                            />
                            <span>PM (Preventive Maintenance)</span>
                        </label>
                        <label className={styles.radioOption}>
                            <input 
                                type="radio" 
                                name="jobType" 
                                value="BM" 
                                checked={jobType === 'BM'}
                                onChange={(e) => setJobType(e.target.value as JobType)}
                            />
                            <span>BM (Breakdown Maintenance)</span>
                        </label>
                        <label className={styles.radioOption}>
                            <input 
                                type="radio" 
                                name="jobType" 
                                value="Recondition" 
                                checked={jobType === 'Recondition'}
                                onChange={(e) => setJobType(e.target.value as JobType)}
                            />
                            <span>Recondition</span>
                        </label>
                    </div>
                </div>

                {/* ระบบที่ซ่อม */}
                <div className={styles.formGroup}>
                    <label>ระบบที่ซ่อม *</label>
                    <select 
                        value={selectedSystem} 
                        onChange={(e) => {
                            setSelectedSystem(e.target.value);
                            setShowPresetTasks(false);
                        }}
                        required
                        className={styles.systemSelect}
                    >
                        <option value="">เลือกระบบ</option>
                        {Object.keys(MOCK_SYSTEMS).map(systemKey => (
                            <option key={systemKey} value={systemKey}>
                                {systemKey === 'brake' ? '🔧 เบรก (Brake)' :
                                 systemKey === 'steering' ? '🎯 พวงมาลัย (Steering)' :
                                 systemKey === 'motor' ? '⚡ มอเตอร์ (Motor)' :
                                 systemKey === 'electric' ? '🔌 ไฟฟ้า (Electric)' :
                                 systemKey}
                            </option>
                        ))}
                    </select>
                </div>

                {/* งานย่อยที่แนะนำ */}
                {selectedSystem && (
                    <div className={styles.formGroup}>
                        <div className={styles.presetHeader}>
                            <label>งานย่อยที่แนะนำ</label>
                            <button 
                                type="button" 
                                onClick={() => setShowPresetTasks(!showPresetTasks)}
                                className={styles.toggleBtn}
                            >
                                {showPresetTasks ? '🔼 ซ่อน' : '🔽 แสดง'}
                            </button>
                        </div>
                        {showPresetTasks && (
                            <div className={styles.presetTasks}>
                                {selectedSystem && MOCK_SYSTEMS[selectedSystem] && 
                                    Object.entries(MOCK_SYSTEMS[selectedSystem]).map(([category, tasks]) => (
                                        <div key={category} className={styles.presetCategory}>
                                            <h4 className={styles.categoryTitle}>{category}</h4>
                                            {tasks.filter((task: string) => task !== 'blank').map((task: string, index: number) => (
                                                <div key={index} className={styles.presetTask}>
                                                    <span>{task}</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => addPresetTask(task)}
                                                        className={styles.addPresetBtn}
                                                    >
                                                        ➕ เพิ่ม
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                }
                            </div>
                        )}
                    </div>
                )}

                {/* งานย่อย */}
                <div className={styles.formGroup}>
                    <div className={styles.subtaskHeader}>
                        <label>งานย่อยที่เลือก ({subTasks.length})</label>
                        <div className={styles.subtaskActions}>
                            {subTasks.length > 0 && (
                                <button 
                                    type="button" 
                                    onClick={() => setSubTasks([])} 
                                    className={styles.clearBtn}
                                >
                                    🗑️ ล้างทั้งหมด
                                </button>
                            )}
                        </div>
                    </div>
                    <div className={styles.subtaskInput}>
                        <input
                            type="text"
                            value={newSubTask}
                            onChange={(e) => setNewSubTask(e.target.value)}
                            placeholder="เพิ่มงานย่อย"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubTask())}
                        />
                        <button type="button" onClick={addSubTask} className={styles.btnSecondary}>
                            ➕ เพิ่ม
                        </button>
                    </div>
                    {subTasks.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>ยังไม่มีงานย่อย กรุณาเพิ่มงานย่อยหรือเลือกจากงานที่แนะนำ</p>
                        </div>
                    ) : (
                        <div className={styles.subtaskList}>
                            {subTasks.map((task, index) => (
                                <div key={index} className={styles.subtaskItem}>
                                    <div className={styles.subtaskNumber}>{index + 1}</div>
                                    <span className={styles.taskText}>{task}</span>
                                    <div className={styles.taskActions}>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                // เปิดหน้าต่างใหม่สำหรับทำงาน task นี้
                                                const taskWindow = window.open('', '_blank', 'width=800,height=600');
                                                if (taskWindow) {
                                                    taskWindow.document.write(`
                                                        <!DOCTYPE html>
                                                        <html>
                                                            <head>
                                                                <title>งาน: ${task}</title>
                                                                <style>
                                                                    body { font-family: Arial, sans-serif; padding: 20px; }
                                                                    .task-header { text-align: center; margin-bottom: 30px; }
                                                                    .task-title { color: #2563eb; margin: 0; }
                                                                    .task-info { color: #666; margin: 5px 0; }
                                                                    .timer { text-align: center; margin: 20px 0; }
                                                                    .timer-display { font-size: 2em; font-weight: bold; margin: 10px 0; }
                                                                    .btn { padding: 10px 20px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; }
                                                                    .btn-primary { background: #2563eb; color: white; }
                                                                    .btn-primary:hover { background: #2980b9; }
                                                                    .btn-success { background: #27ae60; color: white; }
                                                                    .btn-success:hover { background: #229954; }
                                                                    .btn-secondary { background: #95a5a6; color: white; }
                                                                    .btn-secondary:hover { background: #7f8c8d; }
                                                                    .timer { text-align: center; margin: 20px 0; padding: 15px; background: #ecf0f1; border-radius: 8px; }
                                                                    .timer-display { font-size: 24px; font-weight: bold; color: #2c3e50; }
                                                                </style>
                                                            </head>
                                                            <body>
                                                                <div class="task-container">
                                                                    <div class="task-header">
                                                                        <h1 class="task-title">${task}</h1>
                                                                        <p class="task-info">งาน #${index + 1} | รถเบอร์: ${job.vehicle_number}</p>
                                                                    </div>
                                                                    
                                                                    <div class="timer">
                                                                        <div class="timer-display" id="timer">00:00:00</div>
                                                                        <button class="btn btn-primary" id="startTimer" onclick="startTimer()">⏱️ เริ่มจับเวลา</button>
                                                                        <button class="btn btn-secondary" id="stopTimer" onclick="stopTimer()" style="display:none;">⏹️ หยุดจับเวลา</button>
                                                                    </div>
                                                                    
                                                                    <div class="checklist">
                                                                        <h3>รายการตรวจสอบ:</h3>
                                                                        <div class="checklist-item">
                                                                            <input type="checkbox" id="check1">
                                                                            <label for="check1">ตรวจสอบอุปกรณ์และเครื่องมือที่จำเป็น</label>
                                                                        </div>
                                                                        <div class="checklist-item">
                                                                            <input type="checkbox" id="check2">
                                                                            <label for="check2">ดำเนินการตามขั้นตอนที่กำหนด</label>
                                                                        </div>
                                                                        <div class="checklist-item">
                                                                            <input type="checkbox" id="check3">
                                                                            <label for="check3">ทดสอบการทำงานหลังเสร็จสิ้น</label>
                                                                        </div>
                                                                        <div class="checklist-item">
                                                                            <input type="checkbox" id="check4">
                                                                            <label for="check4">ทำความสะอาดและเก็บเครื่องมือ</label>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div class="notes-section">
                                                                        <h3>บันทึกการทำงาน:</h3>
                                                                        <textarea id="taskNotes" rows="4" placeholder="บันทึกรายละเอียดการทำงาน ปัญหาที่พบ หรือข้อสังเกต..."></textarea>
                                                                    </div>
                                                                    
                                                                    <div class="action-buttons">
                                                                        <button class="btn btn-success" onclick="completeTask()">✅ งานเสร็จสิ้น</button>
                                                                        <button class="btn btn-secondary" onclick="window.close()">❌ ปิดหน้าต่าง</button>
                                                                    </div>
                                                                </div>
                                                                
                                                                <script>
                                                                    let startTime = null;
                                                                    let timerInterval = null;
                                                                    
                                                                    function startTimer() {
                                                                        startTime = new Date();
                                                                        document.getElementById('startTimer').style.display = 'none';
                                                                        document.getElementById('stopTimer').style.display = 'inline-block';
                                                                        
                                                                        timerInterval = setInterval(updateTimer, 1000);
                                                                    }
                                                                    
                                                                    function stopTimer() {
                                                                        if (timerInterval) {
                                                                            clearInterval(timerInterval);
                                                                            timerInterval = null;
                                                                        }
                                                                        document.getElementById('startTimer').style.display = 'inline-block';
                                                                        document.getElementById('stopTimer').style.display = 'none';
                                                                    }
                                                                    
                                                                    function updateTimer() {
                                                                        if (startTime) {
                                                                            const now = new Date();
                                                                            const diff = now - startTime;
                                                                            const hours = Math.floor(diff / 3600000);
                                                                            const minutes = Math.floor((diff % 3600000) / 60000);
                                                                            const seconds = Math.floor((diff % 60000) / 1000);
                                                                            
                                                                            document.getElementById('timer').textContent = 
                                                                                String(hours).padStart(2, '0') + ':' +
                                                                                String(minutes).padStart(2, '0') + ':' +
                                                                                String(seconds).padStart(2, '0');
                                                                        }
                                                                    }
                                                                    
                                                                    function completeTask() {
                                                                        const notes = document.getElementById('taskNotes').value;
                                                                        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
                                                                        const completedItems = Array.from(checkboxes).filter(cb => cb.checked).length;
                                                                        
                                                                        if (completedItems < checkboxes.length) {
                                                                            if (!confirm('คุณยังไม่ได้ทำรายการตรวจสอบครบทั้งหมด ต้องการดำเนินการต่อหรือไม่?')) {
                                                                                return;
                                                                            }
                                                                        }
                                                                        
                                                                        // บันทึกข้อมูลกลับไปยังหน้าหลัก
                                                                        if (window.opener && !window.opener.closed) {
                                                                            window.opener.postMessage({
                                                                                type: 'TASK_COMPLETED',
                                                                                taskIndex: ${index},
                                                                                taskName: '${task}',
                                                                                notes: notes,
                                                                                completedItems: completedItems,
                                                                                totalItems: checkboxes.length,
                                                                                duration: document.getElementById('timer').textContent
                                                                            }, '*');
                                                                        }
                                                                        
                                                                        alert('บันทึกการทำงานเรียบร้อยแล้ว!');
                                                                        window.close();
                                                                    }
                                                                </script>
                                                            </body>
                                                        </html>
                                                    `);
                                                    taskWindow.document.close();
                                                }
                                            }}
                                            className={styles.btnStartTask}
                                            title="เริ่มทำงาน task นี้"
                                        >
                                            🚀 เริ่มทำงาน
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setSubTasks(prev => prev.filter((_, i) => i !== index))}
                                            className={styles.btnRemove}
                                            title="ลบงานย่อยนี้"
                                        >
                                            ❌
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* หมายเหตุอะไหล่ */}
                <div className={styles.formGroup}>
                    <label>อะไหล่ที่เปลี่ยน/ใช้</label>
                    <textarea
                        value={partsNotes}
                        onChange={(e) => setPartsNotes(e.target.value)}
                        placeholder="ระบุอะไหล่ที่เปลี่ยนหรือใช้ในการซ่อม"
                        rows={3}
                    />
                </div>

                {/* หมายเหตุ */}
                <div className={styles.formGroup}>
                    <label>หมายเหตุ</label>
                    <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="หมายเหตุเพิ่มเติม"
                        rows={3}
                    />
                </div>

                {/* ปุ่มดำเนินการ */}
                <div className={styles.formActions}>
                    <div className={styles.actionRow}>
                        <button type="button" onClick={handleBack} className={styles.btnSecondary}>
                            {isDirty ? '← ย้อนกลับ (มีการเปลี่ยนแปลง)' : '← ย้อนกลับ'}
                        </button>
                        
                        <button type="button" onClick={resetForm} className={styles.btnReset}>
                            🔄 รีเซ็ตฟอร์ม
                        </button>
                    </div>
                    
                    <div className={styles.actionRow}>
                        {hasDraft() && (
                            <button type="button" onClick={loadDraft} className={styles.btnDraft}>
                                📄 โหลดแบบร่าง
                            </button>
                        )}
                        
                        {isDirty && (
                            <button type="button" onClick={saveDraft} className={styles.btnDraft}>
                                💾 บันทึกแบบร่าง
                            </button>
                        )}
                    </div>
                    
                    <div className={styles.submitRow}>
                        <button type="submit" className={styles.btnPrimary} disabled={!jobType || !selectedSystem}>
                            ✅ บันทึกงานและส่งให้ผู้จัดการ
                        </button>
                    </div>
                    
                    <div className={styles.formInfo}>
                        <small>
                            💡 เมื่อบันทึกแล้ว สถานะงานจะเปลี่ยนเป็น "รอการอนุมัติ" และส่งให้ผู้จัดการตรวจสอบ
                        </small>
                    </div>
                </div>
            </form>
            
            {/* Parts Selection Modal */}
            {showPartsModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>เลือกอะไหล่</h3>
                            <button 
                                type="button" 
                                className="modal-close"
                                onClick={() => setShowPartsModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-tabs">
                            {Object.keys(PARTS_BY_SYSTEM).map(tab => (
                                <button
                                    key={tab}
                                    type="button"
                                    className={`tab-button ${activePartsTab === tab ? 'active' : ''}`}
                                    onClick={() => setActivePartsTab(tab)}
                                >
                                    {getTabDisplayName(tab)}
                                </button>
                            ))}
                        </div>
                        
                        <div className="modal-body">
                            <div className="parts-grid">
                                {PARTS_BY_SYSTEM[activePartsTab as keyof typeof PARTS_BY_SYSTEM].map(part => (
                                    <div 
                                        key={part.id} 
                                        className={`part-item ${selectedParts.includes(part.name) ? 'selected' : ''}`}
                                        onClick={() => handlePartSelection(part.name)}
                                    >
                                        {part.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn-secondary"
                                onClick={() => setShowPartsModal(false)}
                            >
                                ปิด
                            </button>
                            <button 
                                type="button" 
                                className="btn-primary"
                                onClick={() => setShowPartsModal(false)}
                            >
                                เพิ่มอะไหล่ที่เลือก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignedJobFormScreen;

// CSS styles have been moved to AssignedJobFormScreen.module.css