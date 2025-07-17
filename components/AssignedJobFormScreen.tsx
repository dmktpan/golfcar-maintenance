'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, JobType, JobStatus, Vehicle, GolfCourse, MOCK_SYSTEMS, View, SelectedPart } from '@/lib/data';

interface AssignedJobFormScreenProps {
    user: User;
    job: Job;
    onJobUpdate: (updatedJob: Job) => void;
    setView: (view: View) => void;
    vehicles: Vehicle[];
    golfCourses: GolfCourse[];
}

// รายการอะไหล่ตามระบบ (เอาราคาออกแล้ว)
const PARTS_BY_SYSTEM = {
    'brake': [
        { id: 1, name: 'แป้นเบรค', unit: 'ชิ้น' },
        { id: 2, name: 'ชุดล็อคเบรค', unit: 'ชุด' },
        { id: 3, name: 'เฟืองปาร์คเบรค', unit: 'ชิ้น' },
        { id: 4, name: 'สปริงคันเร่ง', unit: 'ชิ้น' },
        { id: 5, name: 'สายเบรกสั้น', unit: 'เส้น' },
        { id: 6, name: 'สายเบรกยาว', unit: 'เส้น' },
        { id: 7, name: 'ผ้าเบรก EZGO', unit: 'ชุด' },
        { id: 8, name: 'ผ้าเบรก EZGO สั้น', unit: 'ชุด' },
        { id: 9, name: 'ผ้าเบรก EZGO ยาว', unit: 'ชุด' },
        { id: 10, name: 'ซีลล้อหลัง', unit: 'ชิ้น' },
        { id: 11, name: 'ลูกปืน 6205', unit: 'ชิ้น' },
        { id: 12, name: 'น๊อตยึดแป้นเบรก', unit: 'ชิ้น' }
    ],
    'steering': [
        { id: 13, name: 'ยอยด์', unit: 'ชิ้น' },
        { id: 14, name: 'ระปุกพวงมาลัย', unit: 'ชิ้น' },
        { id: 15, name: 'เอ็นแร็ค', unit: 'ชิ้น' },
        { id: 16, name: 'ลูกหมาก', unit: 'ชิ้น' },
        { id: 17, name: 'ลูกหมากใต้โช๊ค', unit: 'ชิ้น' },
        { id: 18, name: 'ลูกปืน 6005', unit: 'ชิ้น' },
        { id: 19, name: 'ลูกปืน 6204', unit: 'ชิ้น' },
        { id: 20, name: 'ยางกันฝุ่น', unit: 'ชิ้น' },
        { id: 21, name: 'โช้คหน้า', unit: 'ชิ้น' },
        { id: 22, name: 'ลูกหมากหัวโช้คบน', unit: 'ชิ้น' },
        { id: 23, name: 'ปีกนก L+R', unit: 'คู่' }
    ],
    'motor': [
        { id: 24, name: 'แปรงถ่าน', unit: 'ชิ้น' },
        { id: 25, name: 'ลูกปืน 6205', unit: 'ชิ้น' },
        { id: 26, name: 'แม่เหล็กมอเตอร์', unit: 'ชิ้น' },
        { id: 27, name: 'เซ็นเซอร์มอเตอร์', unit: 'ชิ้น' }
    ],
    'electric': [
        { id: 28, name: 'แบตเตอรี่ 12V', unit: 'ก้อน' },
        { id: 29, name: 'ชุดควบคุมมอเตอร์', unit: 'ชุด' },
        { id: 30, name: 'สายไฟหลัก', unit: 'เมตร' }
    ],
    'others': [
        { id: 31, name: 'บอดี้หน้า', unit: 'ชิ้น' },
        { id: 32, name: 'บอดี้หลัง', unit: 'ชิ้น' },
        { id: 33, name: 'โครงหลังคาหน้า', unit: 'ชิ้น' },
        { id: 34, name: 'โครงหลังคาหลัง', unit: 'ชิ้น' },
        { id: 35, name: 'หลังคา', unit: 'ชิ้น' },
        { id: 36, name: 'เบาะนั่ง', unit: 'ชิ้น' },
        { id: 37, name: 'พนักพิง', unit: 'ชิ้น' },
        { id: 38, name: 'ยาง', unit: 'เส้น' },
        { id: 39, name: 'แคดดี้เพลต', unit: 'ชิ้น' }
    ]
};

const AssignedJobFormScreen = ({ user, job, onJobUpdate, setView, vehicles, golfCourses }: AssignedJobFormScreenProps) => {
    // ใช้ข้อมูลจาก job ที่ได้รับมอบหมาย
    const [jobType, setJobType] = useState<JobType>(job.type);
    const [system, setSystem] = useState(job.system);
    const [subTasks, setSubTasks] = useState<string[]>(job.subTasks || []);
    const [partsNotes, setPartsNotes] = useState(job.partsNotes || '');
    const [remarks, setRemarks] = useState(job.remarks || '');
    const [selectedParts, setSelectedParts] = useState<SelectedPart[]>(() => {
        // แปลงข้อมูลอะไหล่จาก job.parts ให้เป็น SelectedPart[]
        return job.parts?.map(part => {
            // หาข้อมูลอะไหล่จาก PARTS_BY_SYSTEM
            const allParts = Object.values(PARTS_BY_SYSTEM).flat();
            const partInfo = allParts.find(p => p.id === part.part_id);
            return {
                id: part.part_id,
                name: part.part_name || partInfo?.name || 'ไม่ทราบชื่อ',
                quantity: part.quantity_used,
                unit: partInfo?.unit || 'ชิ้น'
            };
        }) || [];
    });
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

    const handleAddSubTask = () => {
        if (newSubTask.trim() && !additionalSubTasks.includes(newSubTask.trim())) {
            setAdditionalSubTasks(prev => [...prev, newSubTask.trim()]);
            setNewSubTask('');
        }
    };

    const handleRemoveAdditionalSubTask = (taskToRemove: string) => {
        setAdditionalSubTasks(prev => prev.filter(task => task !== taskToRemove));
    };
    
    const handlePartSelection = (part: { id: number; name: string; unit: string }) => {
        const existingPart = selectedParts.find(p => p.id === part.id);
        if (existingPart) {
            // ถ้ามีอะไหล่นี้แล้ว ให้เพิ่มจำนวน
            setSelectedParts(prev => prev.map(p => 
                p.id === part.id ? { ...p, quantity: p.quantity + 1 } : p
            ));
        } else {
            // ถ้ายังไม่มี ให้เพิ่มใหม่
            setSelectedParts(prev => [...prev, { ...part, quantity: 1 }]);
        }
    };

    const handlePartQuantityChange = (partId: number, quantity: number) => {
        if (quantity <= 0) {
            setSelectedParts(prev => prev.filter(p => p.id !== partId));
        } else {
            setSelectedParts(prev => prev.map(p => 
                p.id === partId ? { ...p, quantity } : p
            ));
        }
    };

    const handleRemovePart = (partId: number) => {
        setSelectedParts(prev => prev.filter(p => p.id !== partId));
    };

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
        // แก้ไข: เฉพาะ PM เท่านั้นที่ต้องมีงานย่อย สำหรับ BM และ RC ไม่บังคับ
        if (jobType === 'PM' && allSubTasks.length === 0) {
            alert('กรุณาเลือกงานย่อยอย่างน้อย 1 รายการ');
            return;
        }
        
        try {
            // อัปเดตข้อมูลงาน - ไม่บันทึกข้อมูลที่ไม่เกี่ยวข้องสำหรับ BM และ RC
            const updatedJob: Job = {
                ...job,
                type: jobType,
                system: system,
                subTasks: jobType === 'PM' ? allSubTasks : [],
                parts: selectedParts.map(part => ({
                    part_id: part.id,
                    quantity_used: part.quantity,
                    part_name: part.name
                })),
                partsNotes: jobType === 'PM' ? partsNotes : '',
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

    // Reset additionalSubTasks และ partsNotes เมื่อเปลี่ยนจาก PM เป็น BM/RC
    useEffect(() => {
        if (jobType !== 'PM') {
            setAdditionalSubTasks([]);
            setPartsNotes('');
        }
    }, [jobType]);

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

                {jobType === 'PM' && (
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
                                        <div key={index} className="subtask-item">
                                            <span>{task}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveAdditionalSubTask(task)}
                                                className="btn-remove"
                                            >
                                                ลบ
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {jobType === 'PM' && (
                    <div className="form-group">
                        <label>งานย่อยที่เลือกทั้งหมด:</label>
                        <div className="display-box">
                            {[...subTasks, ...additionalSubTasks].length > 0 ? [...subTasks, ...additionalSubTasks].join(', ') : 'ยังไม่ได้เลือกงานย่อย'}
                        </div>
                    </div>
                )}

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
                                {selectedParts.map((part, index) => (
                                    <div key={index} className="selected-part-item">
                                        <span>{part.name} (จำนวน: {part.quantity} {part.unit})</span>
                                        <button 
                                            type="button" 
                                            className="remove-part-btn"
                                            onClick={() => handleRemovePart(part.id)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {jobType === 'PM' && (
                    <div className="form-group">
                        <label htmlFor="parts-notes">รายการอะไหล่ที่เปลี่ยน (เพิ่มเติม)</label>
                        <textarea id="parts-notes" value={partsNotes} onChange={e => setPartsNotes(e.target.value)} placeholder="เช่น เปลี่ยนหลอดไฟหน้า, อัดจารี..."></textarea>
                    </div>
                )}

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
                        {jobType === 'PM' && [...subTasks, ...additionalSubTasks].length > 0 && (
                            <div className="summary-item">
                                <strong>งานย่อยที่เลือก:</strong>
                                <ul className="subtasks-list">
                                    {[...subTasks, ...additionalSubTasks].map((task, index) => (
                                        <li key={index}>{task}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {(selectedParts.length > 0 || (jobType === 'PM' && partsNotes.trim())) && (
                            <div className="summary-item">
                                <strong>อะไหล่ที่เปลี่ยน:</strong>
                                <div className="parts-summary">
                                    {selectedParts.length > 0 && (
                                        <div>
                                            <em>อะไหล่ที่เลือกจากระบบ:</em>
                                            <ul className="parts-list">
                                                {selectedParts.map((part, index) => (
                                                    <li key={index}>{part.name} - จำนวน: {part.quantity} {part.unit}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {jobType === 'PM' && partsNotes.trim() && (
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
                                    <div key={part.id} className="part-item">
                                        <span>{part.name} ({part.unit})</span>
                                        <button 
                                            type="button" 
                                            className="btn-select-part"
                                            onClick={() => handlePartSelection(part)}
                                        >
                                            เลือก
                                        </button>
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