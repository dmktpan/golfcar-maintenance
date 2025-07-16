'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, JobType, Vehicle, GolfCourse, MOCK_SYSTEMS } from '@/lib/data';
import { View } from '@/app/page';

interface AssignedJobFormScreenProps {
    user: User;
    job: Job;
    onJobUpdate: (updatedJob: Job) => void;
    setView: (view: View) => void;
    vehicles: Vehicle[];
    golfCourses: GolfCourse[];
}

// รายการอะไหล่ตามระบบ
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
    // ใช้ข้อมูลจาก job ที่ได้รับมอบหมาย
    const [jobType, setJobType] = useState<JobType>(job.type);
    const [system, setSystem] = useState(job.system);
    const [subTasks, setSubTasks] = useState<string[]>(job.subTasks || []);
    const [partsNotes, setPartsNotes] = useState(job.partsNotes || '');
    const [remarks, setRemarks] = useState(job.remarks || '');
    const [selectedParts, setSelectedParts] = useState<string[]>([]);
    const [showPartsModal, setShowPartsModal] = useState(false);
    const [activePartsTab, setActivePartsTab] = useState('brake');
    const [workStartTime, setWorkStartTime] = useState('');
    const [workEndTime, setWorkEndTime] = useState('');
    const [additionalSubTasks, setAdditionalSubTasks] = useState<string[]>([]);
    const [newSubTask, setNewSubTask] = useState('');
    
    // ข้อมูลรถและสนามจาก job ที่ได้รับมอบหมาย
    const assignedVehicle = vehicles.find(v => v.id === job.vehicle_id);
    const golfCourse = golfCourses.find(gc => gc.id === assignedVehicle?.golf_course_id);
    
    // Get available subtasks for selected system
    const getAvailableSubTasks = () => {
        if (!system || !MOCK_SYSTEMS[system]) return [];
        const systemData = MOCK_SYSTEMS[system];
        const allTasks: string[] = [];
        
        Object.values(systemData).forEach(tasks => {
            allTasks.push(...tasks.filter(task => task !== 'blank'));
        });
        
        return allTasks;
    };
    
    const availableSubTasks = getAvailableSubTasks();

    const handleSubTaskChange = (task: string, isChecked: boolean) => {
        setSubTasks(prev => isChecked ? [...prev, task] : prev.filter(t => t !== task));
    }
    
    const handlePartSelection = (partName: string) => {
        setSelectedParts(prev => {
            if (prev.includes(partName)) {
                return prev.filter(p => p !== partName);
            } else {
                return [...prev, partName];
            }
        });
    }
    
    const handleRemovePart = (partName: string) => {
        setSelectedParts(prev => prev.filter(p => p !== partName));
    }

    const handleAddSubTask = () => {
        if (newSubTask.trim() && !additionalSubTasks.includes(newSubTask.trim())) {
            setAdditionalSubTasks(prev => [...prev, newSubTask.trim()]);
            setNewSubTask('');
        }
    }

    const handleRemoveAdditionalSubTask = (task: string) => {
        setAdditionalSubTasks(prev => prev.filter(t => t !== task));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!workStartTime || !workEndTime) {
            alert('กรุณากรอกเวลาเริ่มต้นและเวลาสิ้นสุดการทำงาน');
            return;
        }
        
        if (new Date(`2000-01-01T${workEndTime}`) <= new Date(`2000-01-01T${workStartTime}`)) {
            alert('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
            return;
        }

        const allSubTasks = [...subTasks, ...additionalSubTasks];
        if (allSubTasks.length === 0) {
            alert('กรุณาเลือกงานย่อยอย่างน้อย 1 รายการ');
            return;
        }
        
        try {
            // อัปเดตข้อมูลงาน
            const updatedJob: Job = {
                ...job,
                type: jobType,
                system: system,
                subTasks: allSubTasks,
                partsNotes: partsNotes + (selectedParts.length > 0 ? '\n' + selectedParts.join(', ') : ''),
                remarks: remarks,
                updated_at: new Date().toISOString(),
                status: 'pending' // เปลี่ยนสถานะเป็น pending เพื่อรอการอนุมัติ
            };
            
            onJobUpdate(updatedJob);
            alert('บันทึกข้อมูลงานเรียบร้อยแล้ว');
            setView('dashboard');
            
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
            console.error('Error updating job:', error);
        }
    };
    
    const jobInfo = {
        courseName: golfCourse?.name || '-',
        serialNumber: assignedVehicle?.serial_number || '-',
        vehicleNumber: assignedVehicle?.vehicle_number || '-',
        assignedBy: job.assigned_by_name || 'ระบบ'
    };

    // Group subtasks by category for better UI
    const getSubTasksByCategory = () => {
        if (!system || !MOCK_SYSTEMS[system]) return {};
        const systemData = MOCK_SYSTEMS[system];
        const categories: Record<string, string[]> = {};
        
        Object.entries(systemData).forEach(([category, tasks]) => {
            const validTasks = tasks.filter(task => task !== 'blank');
            if (validTasks.length > 0) {
                categories[category] = validTasks;
            }
        });
        
        return categories;
    };
    
    const subTaskCategories = getSubTasksByCategory();
    
    const getCategoryDisplayName = (category: string) => {
        const categoryNames: Record<string, string> = {
            'cleaning': 'ทำความสะอาด',
            'lubrication': 'หล่อลื่น',
            'tightening': 'ขันแน่น',
            'inspection': 'ตรวจเช็ค'
        };
        return categoryNames[category] || category;
    };
    
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

    return (
        <div className="card">
            <div className="page-header">
                <h2>กรอกรายละเอียดงาน</h2>
                <div className="header-actions">
                    <span className="status-badge assigned">งานที่ได้รับมอบหมาย</span>
                </div>
            </div>
            
            <div className="info-box">
                <h4>ข้อมูลงานที่ได้รับมอบหมาย:</h4>
                <p><strong>สนาม:</strong> {jobInfo.courseName}</p>
                <p><strong>Serial Number:</strong> {jobInfo.serialNumber}</p>
                <p><strong>เบอร์รถ:</strong> {jobInfo.vehicleNumber}</p>
                <p><strong>มอบหมายโดย:</strong> {jobInfo.assignedBy}</p>
                <p><strong>ประเภทงาน:</strong> {jobType === 'PM' ? 'Preventive Maintenance (PM)' : jobType === 'BM' ? 'Breakdown Maintenance (BM)' : 'Recondition (ซ่อมปรับสภาพ)'}</p>
                {system && <p><strong>ระบบที่ต้องซ่อม:</strong> {system === 'brake' ? 'ระบบเบรก/เพื่อห้าม' : system === 'steering' ? 'ระบบพวงมาลัย' : system === 'motor' ? 'ระบบมอเตอร์/เพื่อขับ' : 'ระบบไฟฟ้า'}</p>}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="golf-course">ชื่อสนาม *</label>
                        <input id="golf-course" type="text" value={jobInfo.courseName} disabled />
                    </div>
                    <div className="form-group">
                        <label htmlFor="serial-number">หมายเลขซีเรียล *</label>
                        <input id="serial-number" type="text" value={jobInfo.serialNumber} disabled />
                    </div>
                    <div className="form-group">
                        <label htmlFor="vehicle-number">เบอร์รถ *</label>
                        <input id="vehicle-number" type="text" value={jobInfo.vehicleNumber} disabled />
                    </div>
                    <div className="form-group">
                        <label htmlFor="staff-name">ชื่อพนักงาน *</label>
                        <input id="staff-name" type="text" value={user.name} disabled />
                    </div>
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="work-start-time">เวลาเริ่มงาน *</label>
                        <input 
                            id="work-start-time" 
                            type="time" 
                            value={workStartTime} 
                            onChange={e => setWorkStartTime(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="work-end-time">เวลาเสร็จงาน *</label>
                        <input 
                            id="work-end-time" 
                            type="time" 
                            value={workEndTime} 
                            onChange={e => setWorkEndTime(e.target.value)} 
                            required 
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="job-type">ประเภทการบำรุงรักษา *</label>
                    <select id="job-type" value={jobType} onChange={e => setJobType(e.target.value as JobType)} disabled>
                        <option value="PM">Preventive Maintenance (PM)</option>
                        <option value="BM">Breakdown Maintenance (BM)</option>
                        <option value="Recondition">Recondition (ซ่อมปรับสภาพ)</option>
                    </select>
                </div>

                {jobType === 'PM' && (
                    <div className="form-group">
                        <label htmlFor="system">ระบบที่ต้องการบำรุงรักษา *</label>
                        <select id="system" value={system} onChange={e => setSystem(e.target.value)} disabled>
                            <option value="" disabled>-- กรุณาเลือกระบบ --</option>
                            <option value="brake">ระบบเบรก/เพื่อห้าม (brake)</option>
                            <option value="steering">ระบบพวงมาลัย (steering)</option>
                            <option value="motor">ระบบมอเตอร์/เพื่อขับ (motor)</option>
                            <option value="electric">ระบบไฟฟ้า (electric)</option>
                        </select>
                    </div>
                )}
                
                {jobType === 'PM' && Object.keys(subTaskCategories).length > 0 && (
                    <div className="form-group">
                        <label>รายการงานย่อยที่แนะนำ</label>
                        <div className="maintenance-categories">
                            {Object.entries(subTaskCategories).map(([category, tasks]) => (
                                <div key={category} className="category-section">
                                    <h4 className="category-title">{getCategoryDisplayName(category)}</h4>
                                    <div className="task-buttons">
                                        {tasks.map(task => (
                                            <button
                                                key={task}
                                                type="button"
                                                className={`task-button ${subTasks.includes(task) ? 'selected' : ''}`}
                                                onClick={() => handleSubTaskChange(task, !subTasks.includes(task))}
                                            >
                                                {task}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label>เพิ่มงานย่อยเพิ่มเติม</label>
                    <div className="add-subtask-section">
                        <div className="input-with-button">
                            <input 
                                type="text" 
                                value={newSubTask} 
                                onChange={e => setNewSubTask(e.target.value)}
                                placeholder="กรอกงานย่อยเพิ่มเติม..."
                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubTask())}
                            />
                            <button type="button" onClick={handleAddSubTask} className="btn-add">เพิ่ม</button>
                        </div>
                        
                        {additionalSubTasks.length > 0 && (
                            <div className="additional-subtasks-list">
                                <h5>งานย่อยเพิ่มเติม:</h5>
                                {additionalSubTasks.map((task, index) => (
                                    <div key={index} className="additional-subtask-item">
                                        <span>{task}</span>
                                        <button 
                                            type="button" 
                                            className="remove-subtask-btn"
                                            onClick={() => handleRemoveAdditionalSubTask(task)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label>งานย่อยที่เลือกทั้งหมด:</label>
                    <div className="display-box">
                        {[...subTasks, ...additionalSubTasks].length > 0 ? [...subTasks, ...additionalSubTasks].join(', ') : 'ยังไม่ได้เลือกงานย่อย'}
                    </div>
                </div>

                <div className="form-group">
                    <label>รายการอะไหล่ที่เปลี่ยน</label>
                    <div className="parts-section">
                        <button 
                            type="button" 
                            className="btn-add-parts"
                            onClick={() => setShowPartsModal(true)}
                        >
                            + เพิ่มอะไหล่
                        </button>
                        
                        {selectedParts.length > 0 && (
                            <div className="selected-parts-list">
                                {selectedParts.map((partName, index) => (
                                    <div key={index} className="selected-part-item">
                                        <span>{partName}</span>
                                        <button 
                                            type="button" 
                                            className="remove-part-btn"
                                            onClick={() => handleRemovePart(partName)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="parts-notes">รายการอะไหล่ที่เปลี่ยน (เพิ่มเติม)</label>
                    <textarea id="parts-notes" value={partsNotes} onChange={e => setPartsNotes(e.target.value)} placeholder="เช่น เปลี่ยนหลอดไฟหน้า, อัดจารี..."></textarea>
                </div>

                <div className="form-group">
                    <label htmlFor="remarks">หมายเหตุ</label>
                    <textarea id="remarks" value={remarks} onChange={e => setRemarks(e.target.value)}></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="photo">รูปภาพ</label>
                  <input type="file" id="photo" accept="image/jpeg, image/png" />
                  <small>รองรับไฟล์ .jpg, .jpeg, .png ขนาดไม่เกิน 5MB</small>
                </div>

                {/* Summary Section */}
                <div className="form-group summary-section">
                    <h3>สรุปข้อมูลงาน</h3>
                    <div className="summary-box">
                        <div className="summary-item">
                            <strong>ประเภทการบำรุงรักษา:</strong> {jobType === 'PM' ? 'Preventive Maintenance (PM)' : jobType === 'BM' ? 'Breakdown Maintenance (BM)' : 'Recondition (ซ่อมปรับสภาพ)'}
                        </div>
                        {jobType === 'PM' && system && (
                            <div className="summary-item">
                                <strong>ระบบที่บำรุงรักษา:</strong> {system === 'brake' ? 'ระบบเบรก/เพื่อห้าม' : system === 'steering' ? 'ระบบพวงมาลัย' : system === 'motor' ? 'ระบบมอเตอร์/เพื่อขับ' : 'ระบบไฟฟ้า'}
                            </div>
                        )}
                        {workStartTime && workEndTime && (
                            <div className="summary-item">
                                <strong>เวลาทำงาน:</strong> {workStartTime} - {workEndTime}
                            </div>
                        )}
                        {[...subTasks, ...additionalSubTasks].length > 0 && (
                            <div className="summary-item">
                                <strong>งานย่อยที่เลือก:</strong>
                                <ul className="subtasks-list">
                                    {[...subTasks, ...additionalSubTasks].map((task, index) => (
                                        <li key={index}>{task}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {(selectedParts.length > 0 || partsNotes.trim()) && (
                            <div className="summary-item">
                                <strong>อะไหล่ที่เปลี่ยน:</strong>
                                <div className="parts-summary">
                                    {selectedParts.length > 0 && (
                                        <div>
                                            <em>อะไหล่ที่เลือกจากระบบ:</em>
                                            <ul className="parts-list">
                                                {selectedParts.map((part, index) => (
                                                    <li key={index}>{part}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {partsNotes.trim() && (
                                        <div>
                                            <em>อะไหล่เพิ่มเติม:</em>
                                            <p className="parts-notes">{partsNotes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {remarks.trim() && (
                            <div className="summary-item">
                                <strong>หมายเหตุ:</strong> {remarks}
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-success">บันทึกและส่งงาน</button>
                    <button type="button" className="btn-secondary" onClick={() => setView('dashboard')}>ยกเลิก</button>
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
}

export default AssignedJobFormScreen;