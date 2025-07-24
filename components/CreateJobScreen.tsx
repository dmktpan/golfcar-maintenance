
'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, JobType, Vehicle, GolfCourse, MOCK_SYSTEMS, View, SelectedPart, BMCause } from '@/lib/data';
import ImageUpload from './ImageUpload';

// Local interface for selected parts in this component
interface LocalSelectedPart {
    id: number;
    name: string;
    unit: string;
    quantity: number;
}

interface CreateJobScreenProps {
    user: User;
    onJobCreate: (newJob: Job) => void;
    setView: (view: View) => void;
    vehicles: Vehicle[];
    golfCourses: GolfCourse[];
    jobs: Job[];
}

const CreateJobScreen = ({ user, onJobCreate, setView, vehicles, golfCourses, jobs }: CreateJobScreenProps) => {
    const [vehicleId, setVehicleId] = useState('');
    const [jobType, setJobType] = useState<JobType>('PM');
    const [system, setSystem] = useState('');
    const [subTasks, setSubTasks] = useState<string[]>([]);
    const [partsNotes, setPartsNotes] = useState('');
    const [remarks, setRemarks] = useState('');
    const [selectedParts, setSelectedParts] = useState<LocalSelectedPart[]>([]);
    const [showPartsModal, setShowPartsModal] = useState(false);
    const [activePartsTab, setActivePartsTab] = useState('brake');
    const [partsSearchTerm, setPartsSearchTerm] = useState('');
    const [newSubTask, setNewSubTask] = useState(''); // เพิ่ม state สำหรับงานย่อยใหม่
    const [bmCause, setBmCause] = useState<BMCause | ''>(''); // เพิ่ม state สำหรับสาเหตุ BM
    const [batterySerial, setBatterySerial] = useState('');
    const [images, setImages] = useState<string[]>([]);
    
    // กรองรถเฉพาะที่อยู่ในสนามเดียวกับพนักงานที่ล็อกอิน
    const userGolfCourse = golfCourses.find(gc => gc.id === user.golf_course_id);
    const availableVehicles = vehicles.filter(v => v.golf_course_id === user.golf_course_id);
    const selectedVehicle = availableVehicles.find(v => v.id === parseInt(vehicleId));
    const golfCourse = userGolfCourse;
    
    // Get available subtasks for selected system
    const getAvailableSubTasks = () => {
        if (!system) return [];
        const systemData = MOCK_SYSTEMS.find(s => s.id === system);
        if (!systemData) return [];
        return systemData.tasks || [];
    };
    
    const availableSubTasks = getAvailableSubTasks();

    useEffect(() => {
        setSubTasks([]);
    }, [system]);
    
    useEffect(() => {
        // รีเซ็ตข้อมูลเมื่อเปลี่ยนประเภการบำรุงรักษา
        if (jobType !== 'PM') {
            setSystem('');
            setSubTasks([]);
        }
        // รีเซ็ต remarks และ newSubTask เมื่อเปลี่ยนเป็น BM หรือ RC
        if (jobType === 'BM' || jobType === 'Recondition') {
            setRemarks('');
            setNewSubTask('');
        }
        // รีเซ็ต bmCause เมื่อไม่ใช่ BM
        if (jobType !== 'BM') {
            setBmCause('');
        }
    }, [jobType]);

    // เพิ่มฟังก์ชันสำหรับจัดการงานย่อยใหม่ (เฉพาะ PM)
    const handleAddSubTask = () => {
        if (jobType === 'PM' && newSubTask.trim() && !subTasks.includes(newSubTask.trim())) {
            setSubTasks(prev => [...prev, newSubTask.trim()]);
            setNewSubTask('');
        }
    };

    const handleSubTaskChange = (task: string, isChecked: boolean) => {
        setSubTasks(prev => isChecked ? [...prev, task] : prev.filter(t => t !== task));
    }
    
    // รายการอะไหล่ตามระบบ (เอาราคาออกแล้ว)
    const PARTS_BY_SYSTEM_DISPLAY = {
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
            { id: 23, name: 'ปีกนก L+R', unit: 'คู่', price: 300 }
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

    const handlePartSelection = (part: { id: number; name: string; unit: string }) => {
        setSelectedParts(prev => {
            const existingPart = prev.find(p => p.id === part.id);
            if (existingPart) {
                return prev.filter(p => p.id !== part.id);
            } else {
                return [...prev, { ...part, quantity: 1 }];
            }
        });
    };
    
    const handleRemovePart = (partId: number) => {
        setSelectedParts(prev => prev.filter(p => p.id !== partId));
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

    // ฟังก์ชันกรองอะไหล่ตามคำค้นหา
    const getFilteredParts = (parts: { id: number; name: string; unit: string }[]) => {
        if (!partsSearchTerm.trim()) {
            return parts;
        }
        
        // ถ้ามีคำค้นหา ให้ค้นหาจากทุก category
        const allParts = Object.values(PARTS_BY_SYSTEM_DISPLAY).flat();
        const searchTerm = partsSearchTerm.toLowerCase().trim();
        return allParts.filter(part => 
            part.name.toLowerCase().includes(searchTerm)
        );
    };
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
        
        // เพิ่ม validation สำหรับ BM cause
        if (jobType === 'BM' && !bmCause) {
            alert('กรุณาเลือกสาเหตุของการเสีย');
            return;
        }
        
        // แก้ไข: เฉพาะ PM เท่านั้นที่ต้องมีงานย่อย สำหรับ BM และ Recondition ไม่บังคับ
        if (jobType === 'PM' && subTasks.length === 0) {
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
                golf_course_id: selectedVehicle.golf_course_id,
                type: jobType,
                status: 'pending',
                created_at: new Date().toISOString(),
                parts: selectedParts.map(part => ({
                    part_id: part.id,
                    quantity_used: part.quantity,
                    part_name: part.name
                })),
                system: system || '',
                subTasks,
                partsNotes: partsNotes,
                remarks: remarks,
                battery_serial: batterySerial, // เก็บซีเรียลแบตที่พนักงานกรอก
                images: images, // เพิ่มรูปภาพ
                ...(jobType === 'BM' && bmCause && { bmCause })
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
                <p><strong>ซีเรียลแบต:</strong> {batterySerial || 'ยังไม่ได้กรอก'}</p>
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
                        <label htmlFor="battery-serial">ซีเรียลแบต *</label>
                        <input 
                            id="battery-serial" 
                            type="text" 
                            value={batterySerial} 
                            onChange={e => setBatterySerial(e.target.value)}
                            placeholder="กรอกซีเรียลแบต หรือ 'ไม่มีสติ๊กเกอร์' หรือ 'หลุด'"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="staff-name">ชื่อพนักงาน *</label>
                        <input id="staff-name" type="text" value={user.name} disabled />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="job-type">ประเภการบำรุงรักษา *</label>
                    <select id="job-type" value={jobType} onChange={e => setJobType(e.target.value as JobType)}>
                        <option value="PM">Preventive Maintenance (PM)</option>
                        <option value="BM">Breakdown Maintenance (BM)</option>
                        <option value="Recondition">Recondition (ซ่อมปรับสภาพ)</option>
                    </select>
                </div>

                {jobType === 'BM' && (
                    <div className="form-group">
                        <label htmlFor="bm-cause">สาเหตุของการเสีย *</label>
                        <div className="bm-cause-buttons">
                            <button
                                type="button"
                                className={`cause-button ${bmCause === 'breakdown' ? 'selected' : ''}`}
                                data-cause="breakdown"
                                onClick={() => setBmCause('breakdown')}
                            >
                                ⚠️ เสีย
                            </button>
                            <button
                                type="button"
                                className={`cause-button ${bmCause === 'accident' ? 'selected' : ''}`}
                                data-cause="accident"
                                onClick={() => setBmCause('accident')}
                            >
                                💥 อุบัติเหตุ
                            </button>
                        </div>
                    </div>
                )}

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

                {/* ลบส่วนของ BM และ Recondition ออก */}
                {/* เพิ่มส่วนสำหรับ BM และ Recondition */}
                {/* {(jobType === 'BM' || jobType === 'Recondition') && (
                    <div className="form-group">
                        <label htmlFor="job-details">รายละเอียดงาน (ไม่บังคับ)</label>
                        <textarea 
                            id="job-details" 
                            value={remarks} 
                            onChange={e => setRemarks(e.target.value)}
                            placeholder="กรุณาระบุรายละเอียดของงานที่ต้องการซ่อม..."
                        />
                    </div>
                )} */}

                {/* {(jobType === 'BM' || jobType === 'Recondition') && (
                    <div className="form-group">
                        <label>งานย่อยเพิ่มเติม (ไม่บังคับ)</label>
                        <div className="add-subtask-section">
                            <div className="add-subtask-input">
                                <input
                                    type="text"
                                    value={newSubTask}
                                    onChange={(e) => setNewSubTask(e.target.value)}
                                    placeholder="ระบุงานย่อยที่ต้องการเพิ่ม..."
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubTask())}
                                />
                                <button 
                                    type="button" 
                                    className="btn-add-subtask"
                                    onClick={handleAddSubTask}
                                    disabled={!newSubTask.trim()}
                                >
                                    เพิ่ม
                                </button>
                            </div>
                            {subTasks.length > 0 && (
                                <div className="added-subtasks">
                                    <h4>งานย่อยที่เพิ่ม:</h4>
                                    <ul>
                                        {subTasks.map((task: string, index: number) => (
                                            <li key={index}>
                                                {task}
                                                <button 
                                                    type="button" 
                                                    className="remove-subtask-btn"
                                                    onClick={() => setSubTasks(prev => prev.filter((_, i) => i !== index))}
                                                >
                                                    ×
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )} */}

                {/* แสดงงานย่อยที่เลือกสำหรับ BM และ Recondition */}
                {/* {(jobType === 'BM' || jobType === 'Recondition') && subTasks.length > 0 && (
                    <div className="form-group">
                        <label>งานย่อยที่เลือก:</label>
                        <div className="display-box">
                            {subTasks.join(', ')}
                        </div>
                    </div>
                )} */}

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
                                {selectedParts.map((part) => (
                                    <div key={part.id} className="selected-part-item">
                                        <div className="part-info">
                                            <span className="part-name">{part.name}</span>
                                            <span className="part-unit">({part.unit})</span>
                                        </div>
                                        <div className="quantity-controls">
                                            <button 
                                                type="button" 
                                                className="quantity-btn"
                                                onClick={() => handlePartQuantityChange(part.id, part.quantity - 1)}
                                            >
                                                -
                                            </button>
                                            <input 
                                                type="number" 
                                                value={part.quantity}
                                                onChange={(e) => handlePartQuantityChange(part.id, parseInt(e.target.value) || 0)}
                                                className="quantity-input"
                                                min="1"
                                            />
                                            <button 
                                                type="button" 
                                                className="quantity-btn"
                                                onClick={() => handlePartQuantityChange(part.id, part.quantity + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
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

                <div className="form-group">
                    <label htmlFor="parts-notes">รายการอะไหล่ที่เปลี่ยน (เพิ่มเติม)</label>
                    <textarea id="parts-notes" value={partsNotes} onChange={e => setPartsNotes(e.target.value)} placeholder="เช่น เปลี่ยนหลอดไฟหน้า, อัดจารี..."></textarea>
                </div>

                <div className="form-group">
                    <label htmlFor="remarks">หมายเหตุ</label>
                    <textarea id="remarks" value={remarks} onChange={e => setRemarks(e.target.value)}></textarea>
                </div>

                <div className="form-group">
                    <label>รูปภาพ</label>
                    <ImageUpload 
                        images={images}
                        onImagesChange={setImages}
                        maxImages={5}
                    />
                </div>

                {/* Summary Section */}
                <div className="form-group summary-section">
                    <h3>สรุปข้อมูลงาน</h3>
                    <div className="summary-box">
                        <div className="summary-item">
                            <strong>ประเภการบำรุงรักษา:</strong> {jobType === 'PM' ? 'Preventive Maintenance (PM)' : jobType === 'BM' ? 'Breakdown Maintenance (BM)' : 'Recondition (ซ่อมปรับสภาพ)'}
                        </div>
                        {jobType === 'BM' && bmCause && (
                            <div className="summary-item">
                                <strong>สาเหตุของการเสีย:</strong> {bmCause === 'breakdown' ? 'เสีย' : 'อุบัติเหตุ'}
                            </div>
                        )}
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
                                                {selectedParts.map((part) => (
                                                    <li key={part.id}>
                                                        {part.name} - จำนวน {part.quantity} {part.unit}
                                                    </li>
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
                            {Object.keys(PARTS_BY_SYSTEM_DISPLAY).map(tab => (
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
                        
                        {/* Search Input */}
                        <div className="parts-search-section">
                            <div className="search-input-container">
                                <input
                                    type="text"
                                    placeholder="ค้นหาอะไหล่..."
                                    value={partsSearchTerm}
                                    onChange={(e) => setPartsSearchTerm(e.target.value)}
                                    className="parts-search-input"
                                />
                                {partsSearchTerm && (
                                    <button
                                        type="button"
                                        className="clear-search-btn"
                                        onClick={() => setPartsSearchTerm('')}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="modal-body">
                            <div className="parts-grid">
                                {getFilteredParts(PARTS_BY_SYSTEM_DISPLAY[activePartsTab as keyof typeof PARTS_BY_SYSTEM_DISPLAY]).map(part => {
                                    const selectedPart = selectedParts.find(p => p.id === part.id);
                                    return (
                                        <div 
                                            key={part.id} 
                                            className={`part-item ${selectedPart ? 'selected' : ''}`}
                                            onClick={() => handlePartSelection(part)}
                                        >
                                            <div className="part-name">{part.name}</div>
                                            <div className="part-details">
                                                <span className="part-unit">{part.unit}</span>
                                            </div>
                                            {selectedPart && (
                                                <div className="selected-quantity">
                                                    จำนวน: {selectedPart.quantity}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                
                                {/* แสดงข้อความเมื่อไม่พบผลลัพธ์ */}
                                {getFilteredParts(PARTS_BY_SYSTEM_DISPLAY[activePartsTab as keyof typeof PARTS_BY_SYSTEM_DISPLAY]).length === 0 && (
                                    <div className="no-parts-found">
                                        <p>ไม่พบอะไหล่ที่ค้นหา "{partsSearchTerm}"</p>
                                        <p>ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
                                    </div>
                                )}
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
