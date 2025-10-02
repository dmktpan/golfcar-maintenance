'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, JobType, Vehicle, GolfCourse, MOCK_SYSTEMS, View, BMCause } from '@/lib/data';
import ImageUpload from './ImageUpload';

// Local interface for selected parts in this component
interface LocalSelectedPart {
    id: number;
    name: string;
    unit: string;
    quantity: number;
}

interface CentralCreateJobScreenProps {
    user: User;
    onJobCreate: (newJob: Job) => void;
    setView: (view: View) => void;
    vehicles: Vehicle[];
    golfCourses: GolfCourse[];
    jobs: Job[];
}

const CentralCreateJobScreen = ({ user, onJobCreate, setView, vehicles, golfCourses, jobs }: CentralCreateJobScreenProps) => {
    const [selectedGolfCourseId, setSelectedGolfCourseId] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
    const [jobType, setJobType] = useState<JobType>('PM');
    const [system, setSystem] = useState('');
    const [subTasks, setSubTasks] = useState<string[]>([]);
    const [partsNotes, setPartsNotes] = useState('');
    const [remarks, setRemarks] = useState('');
    const [selectedParts, setSelectedParts] = useState<LocalSelectedPart[]>([]);
    const [showPartsModal, setShowPartsModal] = useState(false);
    const [activePartsTab, setActivePartsTab] = useState('brake');
    const [partsSearchTerm, setPartsSearchTerm] = useState('');
    const [bmCause, setBmCause] = useState<BMCause | ''>('');
    const [batterySerial, setBatterySerial] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // กรองรถตามสนามที่เลือกและคำค้นหา
    const availableVehicles = vehicles.filter(v => {
        const courseMatch = !selectedGolfCourseId || v.golf_course_id === selectedGolfCourseId;
        const searchMatch = !vehicleSearchTerm || 
            v.vehicle_number.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
            v.serial_number.toLowerCase().includes(vehicleSearchTerm.toLowerCase());
        return courseMatch && searchMatch;
    });
    
    const selectedVehicle = availableVehicles.find(v => v.id === vehicleId);
    const selectedGolfCourse = golfCourses.find(gc => gc.id === selectedGolfCourseId);
    
    useEffect(() => {
        setSubTasks([]);
    }, [system]);
    
    useEffect(() => {
        // รีเซ็ตข้อมูลเมื่อเปลี่ยนประเภการบำรุงรักษา
        if (jobType !== 'PM') {
            setSystem('');
            setSubTasks([]);
        }
        if (jobType === 'BM' || jobType === 'Recondition') {
            setRemarks('');
        }
        if (jobType !== 'BM') {
            setBmCause('');
        }
    }, [jobType]);

    // รีเซ็ตรถเมื่อเปลี่ยนสนาม
    useEffect(() => {
        setVehicleId('');
        setVehicleSearchTerm('');
    }, [selectedGolfCourseId]);

    const handleSubTaskChange = (task: string, isChecked: boolean) => {
        setSubTasks(prev => isChecked ? [...prev, task] : prev.filter(t => t !== task));
    }
    
    // รายการอะไหล่ตามระบบ
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

    const getFilteredParts = (parts: { id: number; name: string; unit: string }[]) => {
        if (!partsSearchTerm.trim()) {
            return parts;
        }
        
        const allParts = Object.values(PARTS_BY_SYSTEM_DISPLAY).flat();
        const searchTerm = partsSearchTerm.toLowerCase().trim();
        return allParts.filter(part => 
            part.name.toLowerCase().includes(searchTerm)
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedGolfCourseId) {
            alert('กรุณาเลือกสนามกอล์ฟ');
            return;
        }
        
        if (!selectedVehicle) {
            alert('กรุณาเลือกรถที่ต้องการซ่อม');
            return;
        }
        
        if (jobType === 'PM' && !system) {
            alert('กรุณาเลือกระบบที่ต้องการบำรุงรักษา');
            return;
        }
        
        if (jobType === 'BM' && !bmCause) {
            alert('กรุณาเลือกสาเหตุของการเสีย');
            return;
        }
        
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
            // สร้างงานใหม่ (ไม่ต้องสร้าง ID เอง ให้ API สร้างให้)
            const newJob: Omit<Job, 'id' | 'created_at' | 'updated_at'> = {
                user_id: user.id.toString(),
                userName: user.name,
                vehicle_id: selectedVehicle.id,
                vehicle_number: selectedVehicle.vehicle_number,
                golf_course_id: selectedVehicle.golf_course_id,
                type: jobType,
                status: 'pending',
                parts: selectedParts.map(part => ({
                    part_id: part.id.toString(),
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
            
            onJobCreate(newJob as Job);
            
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการสร้างงาน กรุณาลองใหม่อีกครั้ง');
            console.error('Error creating job:', error);
        }
    };

    // Get subtasks by category for PM jobs
    const subTaskCategories = jobType === 'PM' && system ? 
        MOCK_SYSTEMS.find(s => s.id === system)?.tasks || {} : {};

    const getCategoryDisplayName = (category: string) => {
        const categoryNames: Record<string, string> = {
            'ทำความสะอาด': 'ทำความสะอาด',
            'หล่อลื่น': 'หล่อลื่น',
            'ขันแน่น': 'ขันแน่น',
            'ตรวจเช็ค': 'ตรวจเช็ค'
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

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleCategorySelect = (category: string) => {
        setActivePartsTab(category);
        setIsDropdownOpen(false);
    };

    return (
        <div className="card">
            <div className="page-header">
                <h2>🏢 สร้างงานซ่อม - ส่วนกลาง</h2>
                <p className="text-muted">สามารถเลือกสนามและรถได้ทุกสนาม</p>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="golf-course">เลือกสนามกอล์ฟ *</label>
                        <select 
                            id="golf-course" 
                            value={selectedGolfCourseId} 
                            onChange={e => setSelectedGolfCourseId(e.target.value)} 
                            required
                        >
                            <option value="">-- เลือกสนามกอล์ฟ --</option>
                            {golfCourses.map(course => (
                                <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="vehicle-search">ค้นหารถ (เบอร์รถ หรือ ซีเรียล)</label>
                        <input 
                            id="vehicle-search"
                            type="text" 
                            value={vehicleSearchTerm}
                            onChange={e => setVehicleSearchTerm(e.target.value)}
                            placeholder="พิมพ์เบอร์รถหรือซีเรียลเพื่อค้นหา..."
                            disabled={!selectedGolfCourseId}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="vehicle-select">เลือกรถ *</label>
                        <select 
                            id="vehicle-select" 
                            value={vehicleId} 
                            onChange={e => setVehicleId(e.target.value)} 
                            required
                            disabled={!selectedGolfCourseId}
                        >
                            <option value="">-- เลือกรถ --</option>
                            {availableVehicles.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.vehicle_number} (Serial: {v.serial_number})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {selectedVehicle && (
                        <>
                            <div className="form-group">
                                <label>ข้อมูลรถที่เลือก</label>
                                <div className="info-box">
                                    <p><strong>สนาม:</strong> {selectedGolfCourse?.name}</p>
                                    <p><strong>เบอร์รถ:</strong> {selectedVehicle.vehicle_number}</p>
                                    <p><strong>Serial:</strong> {selectedVehicle.serial_number}</p>
                                    <p><strong>ยี่ห้อ:</strong> {selectedVehicle.brand} {selectedVehicle.model}</p>
                                </div>
                            </div>
                        </>
                    )}
                    
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
                        <option value="PM">บำรุงรักษาเชิงป้องกัน</option>
                        <option value="BM">ซ่อมด่วน</option>
                        <option value="Recondition">ปรับสภาพ</option>
                    </select>
                </div>

                {jobType === 'BM' && (
                    <div className="form-group">
                        <label htmlFor="bm-cause">สาเหตุของการเสีย *</label>
                        <div className="bm-cause-buttons">
                            <button
                                type="button"
                                className={`cause-button ${bmCause === 'breakdown' ? 'selected' : ''}`}
                                onClick={() => setBmCause('breakdown')}
                            >
                                ⚠️ เสีย
                            </button>
                            <button
                                type="button"
                                className={`cause-button ${bmCause === 'accident' ? 'selected' : ''}`}
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
                            <option value="">-- กรุณาเลือกระบบ --</option>
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
                        <label>งานย่อยที่เลือก:</label>
                        <div className="display-box">
                            {subTasks.length > 0 ? subTasks.join(', ') : 'ยังไม่ได้เลือกงานย่อย'}
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label>อะไหล่ที่เปลี่ยน</label>
                    <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={() => setShowPartsModal(true)}
                    >
                        🔧 เลือกอะไหล่
                    </button>
                    
                    {selectedParts.length > 0 && (
                        <div className="selected-parts">
                            <h4>อะไหล่ที่เลือก:</h4>
                            <div className="selected-parts-list">
                                <div className="parts-table-header">
                                    <div className="part-name-col">ชื่ออะไหล่</div>
                                    <div className="quantity-col">ปรับจำนวน</div>
                                    <div className="remove-col">ยกเลิก</div>
                                </div>
                                {selectedParts.map(part => (
                                    <div key={part.id} className="selected-part-item three-column">
                                        <div className="part-name-col">
                                            <span className="part-name">{part.name}</span>
                                            <span className="part-unit">({part.unit})</span>
                                        </div>
                                        <div className="quantity-col">
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
                                                    min="1" 
                                                    value={part.quantity}
                                                    onChange={e => handlePartQuantityChange(part.id, parseInt(e.target.value) || 1)}
                                                    className="quantity-input"
                                                />
                                                <button 
                                                    type="button" 
                                                    className="quantity-btn"
                                                    onClick={() => handlePartQuantityChange(part.id, part.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <div className="remove-col">
                                            <button 
                                                type="button" 
                                                className="remove-part-btn mobile-small-text"
                                                onClick={() => handleRemovePart(part.id)}
                                            >
                                                x
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="parts-notes">หมายเหตุอะไหล่</label>
                    <textarea 
                        id="parts-notes" 
                        value={partsNotes} 
                        onChange={e => setPartsNotes(e.target.value)}
                        placeholder="ระบุหมายเหตุเกี่ยวกับอะไหล่ที่ใช้..."
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="remarks">หมายเหตุเพิ่มเติม</label>
                    <textarea 
                        id="remarks" 
                        value={remarks} 
                        onChange={e => setRemarks(e.target.value)}
                        placeholder="ระบุหมายเหตุเพิ่มเติม..."
                    />
                </div>

                <ImageUpload 
                    images={images} 
                    onImagesChange={setImages}
                    maxImages={5}
                />

                <div className="form-actions">
                    <button type="submit" className="btn-primary">
                        สร้างงานซ่อม
                    </button>
                    <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={() => setView('dashboard')}
                    >
                        ยกเลิก
                    </button>
                </div>
            </form>

            {/* Parts Selection Modal */}
            {showPartsModal && (
                <div className="modal-overlay" onClick={() => setShowPartsModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
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
                                        {Object.keys(PARTS_BY_SYSTEM_DISPLAY).map(tab => (
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
                                className="modal-close desktop-only"
                                onClick={() => setShowPartsModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="parts-search">
                                <input 
                                    type="text"
                                    placeholder="ค้นหาอะไหล่..."
                                    value={partsSearchTerm}
                                    onChange={e => setPartsSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                            
                            <div className="parts-tabs">
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
                            
                            <div className="parts-list">
                                {partsSearchTerm.trim() ? (
                                    getFilteredParts(PARTS_BY_SYSTEM_DISPLAY[activePartsTab as keyof typeof PARTS_BY_SYSTEM_DISPLAY]).map(part => (
                                        <div 
                                            key={part.id} 
                                            className={`part-item ${selectedParts.some(p => p.id === part.id) ? 'selected' : ''}`}
                                            onClick={() => handlePartSelection(part)}
                                        >
                                            <span className="part-name">{part.name}</span>
                                            <span className="part-unit">({part.unit})</span>
                                            {selectedParts.some(p => p.id === part.id) && (
                                                <span className="selected-indicator">✓</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    PARTS_BY_SYSTEM_DISPLAY[activePartsTab as keyof typeof PARTS_BY_SYSTEM_DISPLAY].map(part => (
                                        <div 
                                            key={part.id} 
                                            className={`part-item ${selectedParts.some(p => p.id === part.id) ? 'selected' : ''}`}
                                            onClick={() => handlePartSelection(part)}
                                        >
                                            <span className="part-name">{part.name}</span>
                                            <span className="part-unit">({part.unit})</span>
                                            {selectedParts.some(p => p.id === part.id) && (
                                                <span className="selected-indicator">✓</span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                type="button"
                                className="btn-primary"
                                onClick={() => setShowPartsModal(false)}
                            >
                                เสร็จสิ้น
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CentralCreateJobScreen;