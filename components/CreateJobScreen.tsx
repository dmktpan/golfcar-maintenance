
'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, JobType, Vehicle, GolfCourse, MOCK_SYSTEMS } from '@/lib/data';
import { View } from '@/app/page';

interface CreateJobScreenProps {
    user: User;
    onJobCreate: (newJob: Job) => void;
    setView: (view: View) => void;
    vehicles: Vehicle[];
    golfCourses: GolfCourse[];
    jobs: Job[]; // เพิ่ม jobs prop
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

const CreateJobScreen = ({ user, onJobCreate, setView, vehicles, golfCourses, jobs }: CreateJobScreenProps) => {
    const [vehicleId, setVehicleId] = useState('');
    const [jobType, setJobType] = useState<JobType>('PM');
    const [system, setSystem] = useState('');
    const [subTasks, setSubTasks] = useState<string[]>([]);
    const [partsNotes, setPartsNotes] = useState('');
    const [remarks, setRemarks] = useState('');
    const [selectedParts, setSelectedParts] = useState<string[]>([]);
    const [showPartsModal, setShowPartsModal] = useState(false);
    const [activePartsTab, setActivePartsTab] = useState('brake');
    
    // กรองรถเฉพาะที่อยู่ในสนามเดียวกับพนักงานที่ล็อกอิน
    const userGolfCourse = golfCourses.find(gc => gc.id === user.golf_course_id);
    const availableVehicles = vehicles.filter(v => v.golf_course_id === user.golf_course_id);
    const selectedVehicle = availableVehicles.find(v => v.id === parseInt(vehicleId));
    const golfCourse = userGolfCourse;
    
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

    useEffect(() => {
        setSubTasks([]);
    }, [system]);
    
    useEffect(() => {
        // รีเซ็ตข้อมูลเมื่อเปลี่ยนประเภทการบำรุงรักษา
        if (jobType !== 'PM') {
            setSystem('');
            setSubTasks([]);
        }
    }, [jobType]);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // เพิ่ม validation ที่ครอบคลุมมากขึ้น
        if (!selectedVehicle) {
            alert('กรุณาเลือกรถที่ต้องการซ่อม');
            return;
        }
        
        // แก้ไขจาก selectedSystem เป็น system
        if (jobType === 'PM' && !system) {
            alert('กรุณาเลือกระบบที่ต้องการบำรุงรักษา');
            return;
        }
        
        if (subTasks.length === 0) {
            alert('กรุณาเพิ่มงานย่อยอย่างน้อย 1 รายการ');
            return;
        }
        
        // ตรวจสอบว่ามีงานซ้ำหรือไม่
        const duplicateJob = jobs.find(job => 
            job.vehicle_id === selectedVehicle.id && 
            job.status === 'pending' &&
            job.type === jobType
        );
        
        if (duplicateJob) {
            const confirmCreate = confirm(`มีงาน ${jobType} สำหรับรถ ${selectedVehicle.vehicle_number} อยู่แล้ว\nต้องการสร้างงานใหม่หรือไม่?`);
            if (!confirmCreate) return;
        }
        
        try {
            // สร้างงานใหม่
            const newJob: Job = {
                id: Math.max(...jobs.map(j => j.id), 0) + 1,
                user_id: user.id,
                userName: user.name,
                vehicle_id: selectedVehicle.id,
                vehicle_number: selectedVehicle.vehicle_number,
                type: jobType,
                status: 'pending',
                created_at: new Date().toISOString(),
                // แก้ไขจาก selectedParts เป็น array ว่าง หรือแปลง selectedParts ให้ตรงกับ interface
                parts: [], // ใช้ array ว่างเนื่องจาก selectedParts เป็นแค่ชื่ออะไหล่
                system: system || '',
                subTasks,
                partsNotes: partsNotes, // ใช้ partsNotes สำหรับเก็บรายการอะไหล่ที่เลือก
                remarks: remarks
            };
            
            onJobCreate(newJob);
            alert('สร้างงานเรียบร้อยแล้ว');
            setView('dashboard');
            
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการสร้างงาน กรุณาลองใหม่อีกครั้ง');
            console.error('Error creating job:', error);
        }
    };
    
    const jobInfo = {
        courseName: userGolfCourse?.name || '-',
        serialNumber: selectedVehicle?.serial_number || '-',
        vehicleNumber: selectedVehicle?.vehicle_number || '-'
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
                <h2>สร้างงานซ่อมใหม่</h2>
            </div>
            
            <div className="info-box">
                <h4>ข้อมูลงานที่ได้รับมอบหมาย:</h4>
                <p><strong>สนาม:</strong> {jobInfo.courseName}</p>
                <p><strong>Serial Number:</strong> {jobInfo.serialNumber}</p>
                <p><strong>เบอร์รถ:</strong> {jobInfo.vehicleNumber}</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="golf-course">ชื่อสนาม *</label>
                        <input id="golf-course" type="text" value={jobInfo.courseName} disabled />
                    </div>
                    <div className="form-group">
                        <label htmlFor="serial-number">หมายเลขซีเรียล *</label>
                        <select id="serial-number" value={vehicleId} onChange={e => setVehicleId(e.target.value)} required>
                            <option value="" disabled>-- กรุณาเลือกรถ --</option>
                            {availableVehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.serial_number}</option>
                            ))}
                        </select>
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

                <div className="form-group">
                    <label htmlFor="job-type">ประเภทการบำรุงรักษา *</label>
                    <select id="job-type" value={jobType} onChange={e => setJobType(e.target.value as JobType)}>
                        <option value="PM">Preventive Maintenance (PM)</option>
                        <option value="BM">Breakdown Maintenance (BM)</option>
                        <option value="Recondition">Recondition (ซ่อมปรับสภาพ)</option>
                    </select>
                </div>

                {jobType === 'PM' && (
                    <div className="form-group">
                        <label htmlFor="system">ระบบที่ต้องการบำรุงรักษา *</label>
                        <select id="system" value={system} onChange={e => setSystem(e.target.value)} required>
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
                        <label>รายการงานย่อย</label>
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
                        <label>งานย่อยที่เลือก:</label>
                        <div className="display-box">
                            {subTasks.length > 0 ? subTasks.join(', ') : 'ยังไม่ได้เลือกงานย่อย'}
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
                        {jobType === 'PM' && subTasks.length > 0 && (
                            <div className="summary-item">
                                <strong>งานย่อยที่เลือก:</strong>
                                <ul className="subtasks-list">
                                    {subTasks.map((task, index) => (
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
                    <button type="submit" className="btn-success">ส่งงาน</button>
                    <button type="button" className="btn-secondary" onClick={() => setView('admin_dashboard')}>ยกเลิก</button>
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

export default CreateJobScreen;
