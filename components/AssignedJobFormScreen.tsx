'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, JobType, Vehicle, GolfCourse, MOCK_SYSTEMS, View, BMCause } from '@/lib/data';
import ImageUpload from './ImageUpload';

// Interface สำหรับ local state ของอะไหล่ที่เลือก
interface LocalSelectedPart {
    id: string | number;
    name: string;
    quantity: number;
    unit: string;
}

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
    // ข้อมูลรถและสนามจาก job ที่ได้รับมอบหมาย
    const assignedVehicle = vehicles.find(v => v.id === job.vehicle_id);
    const golfCourse = golfCourses.find(gc => gc.id === assignedVehicle?.golf_course_id);
    
    // ใช้ข้อมูลจาก job ที่ได้รับมอบหมาย
    const [jobType, setJobType] = useState<JobType>(job.type);
    const [system, setSystem] = useState(job.system);
    const [subTasks, setSubTasks] = useState<string[]>(job.subTasks || []);
    const [partsNotes, setPartsNotes] = useState(job.partsNotes || '');
    const [remarks, setRemarks] = useState(job.remarks || '');
    const [bmCause, setBmCause] = useState<BMCause | ''>(job.bmCause || '');
    const [batterySerial, setBatterySerial] = useState(job.battery_serial || assignedVehicle?.battery_serial || ''); // ใช้ค่าจาก job หรือ vehicle
    const [selectedParts, setSelectedParts] = useState<LocalSelectedPart[]>(() => {
        // แปลงข้อมูลอะไหล่จาก job.parts ให้เป็น LocalSelectedPart[]
        return job.parts?.map(part => {
            // หาข้อมูลอะไหล่จาก PARTS_BY_SYSTEM
            const allParts = Object.values(PARTS_BY_SYSTEM).flat();
            const partInfo = allParts.find(p => p.id.toString() === part.part_id.toString());
            return {
                id: part.part_id, // ไม่ใช้ parseInt กับ ObjectID
                name: part.part_name || partInfo?.name || 'ไม่ทราบชื่อ',
                quantity: part.quantity_used,
                unit: partInfo?.unit || 'ชิ้น'
            };
        }) || [];
    });
    const [images, setImages] = useState<string[]>(job.images || []);
    const [showPartsModal, setShowPartsModal] = useState(false);
    const [activePartsTab, setActivePartsTab] = useState('brake');
    const [partsSearchTerm, setPartsSearchTerm] = useState(''); // เพิ่ม state สำหรับค้นหาอะไหล่
    const [additionalSubTasks, setAdditionalSubTasks] = useState<string[]>([]);
    const [newSubTask, setNewSubTask] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // ฟังก์ชันสำหรับเปิด/ปิด dropdown
    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
    
    // ฟังก์ชันกรองอะไหล่ตามคำค้นหา
    const getFilteredParts = () => {
        const currentParts = PARTS_BY_SYSTEM[activePartsTab as keyof typeof PARTS_BY_SYSTEM];
        if (!partsSearchTerm.trim()) {
            return currentParts;
        }
        
        // ถ้ามีคำค้นหา ให้ค้นหาจากทุก category
        const allParts = Object.values(PARTS_BY_SYSTEM).flat();
        return allParts.filter(part => 
            part.name.toLowerCase().includes(partsSearchTerm.toLowerCase())
        );
    };

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

    const handleRemovePart = (partId: string | number) => {
        setSelectedParts(prev => prev.filter(p => p.id !== partId));
    };

    const handlePartQuantityChange = (partId: string | number, quantity: number) => {
        if (quantity <= 0) {
            setSelectedParts(prev => prev.filter(p => p.id !== partId));
        } else {
            setSelectedParts(prev => prev.map(p => 
                p.id === partId ? { ...p, quantity } : p
            ));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const allSubTasks = [...subTasks, ...additionalSubTasks];
        // แก้ไข: เฉพาะ PM เท่านั้นที่ต้องมีงานย่อย สำหรับ BM และ RC ไม่บังคับ
        if (jobType === 'PM' && allSubTasks.length === 0) {
            alert('กรุณาเลือกงานย่อยอย่างน้อย 1 รายการ');
            return;
        }
        
        // เพิ่ม validation สำหรับ BM cause
        if (jobType === 'BM' && !bmCause) {
            alert('กรุณาเลือกสาเหตุของการเสีย');
            return;
        }
        
        try {
            // อัปเดตข้อมูลงาน - ส่งข้อมูลครบถ้วนตาม API requirements
            const updatedJob: Job = {
                ...job,
                type: jobType,
                status: 'pending', // เปลี่ยนสถานะเป็น pending เพื่อรอการอนุมัติ
                vehicle_id: job.vehicle_id, // ต้องมี
                vehicle_number: job.vehicle_number || assignedVehicle?.vehicle_number || '', // ต้องมี
                golf_course_id: job.golf_course_id || assignedVehicle?.golf_course_id || '', // ต้องมี
                user_id: job.user_id, // ต้องมี
                userName: job.userName, // ต้องมี
                system: system,
                subTasks: jobType === 'PM' ? allSubTasks : [],
                parts: selectedParts.map(part => ({
                    part_id: part.id.toString(),
                    quantity_used: part.quantity,
                    part_name: part.name
                })),
                partsNotes: jobType === 'PM' ? partsNotes : '',
                remarks: remarks,
                battery_serial: batterySerial, // เก็บซีเรียลแบตที่พนักงานกรอก
                images: images, // เพิ่มรูปภาพ
                updated_at: new Date().toISOString(),
                ...(jobType === 'BM' && bmCause && { bmCause })
            };
            
            onJobUpdate(updatedJob);
            
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
        if (!system) return {};
        const systemData = MOCK_SYSTEMS.find(s => s.id === system);
        if (!systemData || !systemData.tasks) return {};
        
        return systemData.tasks;
    };
    
    const subTaskCategories = getSubTasksByCategory();
    
    const getCategoryDisplayName = (category: string) => {
        const categoryNames: Record<string, string> = {
            'ทำความสะอาด': 'ทำความสะอาด',
            'หล่อลื่น': 'หล่อลื่น',
            'ขันแน่น': 'ขันแน่น',
            'ตรวจเช็ค': 'ตรวจเช็ค'
        };
        return categoryNames[category] || category;
    };

    // Reset additionalSubTasks และ partsNotes เมื่ยกคำค้นหา PM เป็น BM/RC
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
                <p><strong>ซีเรียลแบต:</strong> {batterySerial || 'ยังไม่ได้กรอก'}</p>
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
                    <label htmlFor="job-type">ประเภทการบำรุงรักษา *</label>
                    <select id="job-type" value={jobType} onChange={e => setJobType(e.target.value as JobType)} disabled>
                        <option value="PM">Preventive Maintenance (PM)</option>
                        <option value="BM">Breakdown Maintenance (BM)</option>
                        <option value="Recondition">Recondition (ซ่อมปรับสภาพ)</option>
                    </select>
                </div>

                {jobType === 'BM' && (
                    <div className="form-group">
                        <label>สาเหตุของการเสีย *</label>
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
                                        {(tasks as string[]).map((task: string) => (
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
                                        <div key={`subtask-${index}-${task.slice(0, 10)}`} className="subtask-item">
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
                                <div className="parts-table-header">
                                    <div className="part-name-col">ชื่ออะไหล่</div>
                                    <div className="quantity-col">ปรับจำนวน</div>
                                    <div className="remove-col">ยกเลิก</div>
                                </div>
                                {selectedParts.map((part, index) => (
                                    <div key={`part-${part.id}-${index}`} className="selected-part-item">
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
                            <strong>ประเภทการบำรุงรักษา:</strong> {jobType === 'PM' ? 'Preventive Maintenance (PM)' : jobType === 'BM' ? 'Breakdown Maintenance (BM)' : 'Recondition (ซ่อมปรับสภาพ)'}
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
                        {jobType === 'PM' && [...subTasks, ...additionalSubTasks].length > 0 && (
                            <div className="summary-item">
                                <strong>งานย่อยที่เลือก:</strong>
                                <ul className="subtasks-list">
                                    {[...subTasks, ...additionalSubTasks].map((task, index) => (
                                        <li key={`task-${index}-${task.slice(0, 10)}`}>{task}</li>
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
                                                    <li key={`part-summary-${part.id}-${index}`}>{part.name} - จำนวน: {part.quantity} {part.unit}</li>
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
                            <div className="mobile-header-dropdown">
                                <button 
                                    type="button" 
                                    className="header-category-dropdown-button"
                                    onClick={toggleDropdown}
                                >
                                    <span>{getTabDisplayName(activePartsTab)}</span>
                                    <span className="dropdown-arrow">▼</span>
                                </button>
                                {isDropdownOpen && (
                                    <div className="header-category-dropdown-menu">
                                        {Object.keys(PARTS_BY_SYSTEM).map(tab => (
                                            <div
                                                key={tab}
                                                className="header-category-dropdown-item"
                                                onClick={() => handleCategorySelect(tab)}
                                            >
                                                {getTabDisplayName(tab)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button 
                                type="button" 
                                className="modal-close desktop-only"
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
                        
                        {/* เพิ่มส่วนค้นหาอะไหล่ */}
                        <div className="parts-search-section">
                            <div className="search-input-container">
                                <input
                                    type="text"
                                    className="parts-search-input"
                                    placeholder="ค้นหาอะไหล่..."
                                    value={partsSearchTerm}
                                    onChange={(e) => setPartsSearchTerm(e.target.value)}
                                />
                                {partsSearchTerm && (
                                    <button
                                        type="button"
                                        className="clear-search-btn"
                                        onClick={() => setPartsSearchTerm('')}
                                        title="ล้างคำค้นหา"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="modal-body">
                            <div className="parts-grid">
                                {getFilteredParts().length > 0 ? (
                                    getFilteredParts().map(part => {
                                        const selectedPart = selectedParts.find(p => p.id === part.id);
                                        return (
                                            <div key={part.id} className="part-item">
                                                <div className="part-name">{part.name}</div>
                                                <div className="part-details">({part.unit})</div>
                                                {selectedPart && (
                                                    <div className="selected-quantity">
                                                        เลือกแล้ว: {selectedPart.quantity} {part.unit}
                                                    </div>
                                                )}
                                                <button 
                                                    type="button" 
                                                    className="btn-select-part"
                                                    onClick={() => handlePartSelection(part)}
                                                >
                                                    เลือก
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="no-parts-found">
                                        ไม่พบอะไหล่ที่ค้นหา &quot;{partsSearchTerm}&quot;
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

export default AssignedJobFormScreen;
