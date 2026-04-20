'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, JobType, Vehicle, GolfCourse, MOCK_SYSTEMS, View, BMCause } from '@/lib/data';
import { getPartsBySystem, PartsBySystem, CategorizedPart } from '@/lib/partsService';
import ImageUpload from './ImageUpload';
import styles from './CentralCreateJobScreen.module.css';

// Local interface for selected parts in this component
interface LocalSelectedPart {
    id: string | number;
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
    const [selectedMWRs, setSelectedMWRs] = useState<string[]>([]); // สำหรับเก็บ bplus_code หลายบิล
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // ป้องกันการกดซ้ำ

    // State for dynamic parts
    const [partsBySystem, setPartsBySystem] = useState<PartsBySystem>({
        brake: [],
        steering: [],
        motor: [],
        electric: [],
        other: []
    });
    const [isLoadingParts, setIsLoadingParts] = useState(true);

    // Load parts on mount
    useEffect(() => {
        const loadParts = async () => {
            setIsLoadingParts(true);
            try {
                const parts = await getPartsBySystem();
                setPartsBySystem(parts);
            } catch (error) {
                console.error('Error loading parts:', error);
            } finally {
                setIsLoadingParts(false);
            }
        };
        loadParts();
    }, []);

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
            // ไม่ควรไปรีเซ็ต remarks เพราะผู้ใช้อาจจะพิมพ์หมายเหตุไปแล้วแล้วค่อยเปลี่ยนประเภทงาน
            // setRemarks('');
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



    const handlePartSelection = (part: CategorizedPart) => {
        setSelectedParts(prev => {
            const existingPart = prev.find(p => p.id === part.id);
            if (existingPart) {
                return prev.filter(p => p.id !== part.id);
            } else {
                return [...prev, { ...part, quantity: 1 }];
            }
        });
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

    const getFilteredParts = () => {
        const currentParts = partsBySystem[activePartsTab as keyof PartsBySystem] || [];
        if (!partsSearchTerm.trim()) {
            return currentParts;
        }

        const allParts = Object.values(partsBySystem).flat();
        const searchTerm = partsSearchTerm.toLowerCase().trim();
        return allParts.filter(part =>
            part.name.toLowerCase().includes(searchTerm) ||
            (part.part_number && part.part_number.toLowerCase().includes(searchTerm))
        );
    };

    const getMwrFilteredParts = () => {
        if (selectedMWRs.length === 0) return [];
        const mwrJobs = jobs.filter(j => j.bplus_code && selectedMWRs.includes(j.bplus_code));
        const allParts = Object.values(partsBySystem).flat();
        
        return allParts.filter(dbPart => 
            mwrJobs.some(mwr => mwr.parts?.some(mp => mp.part_id === dbPart.id.toString()))
        );
    };

    const availableMwrJobs = jobs.filter(j => 
        j.type === 'PART_REQUEST' && 
        j.status === 'completed' && 
        j.bplus_code && 
        (!selectedGolfCourseId || j.golf_course_id === selectedGolfCourseId)
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return; // ป้องกันการกดซ้ำ

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
            setIsSubmitting(true); // เริ่มส่งงาน
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
            setIsSubmitting(false); // ยกเลิกสถานะ loading
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
            'mwr': 'รายการในใบเบิก (MWR)',
            'other': 'อื่นๆ'
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
                            <option value="steering">ระบบบังคับเลี้ยว (steering)</option>
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
                    maxImages={20}
                />

                <div className="form-actions">
                    <button type="submit" className={`btn-primary ${styles.createJobBtn}`} disabled={isSubmitting}>
                        {isSubmitting ? 'กำลังสร้างงาน...' : 'สร้างงานซ่อม'}
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
                                        {Object.keys(partsBySystem).map(tab => (
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
                                {['brake', 'steering', 'motor', 'electric', 'mwr', 'other'].map(tab => (
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
                                {/* MWR Selector Display */}
                                {activePartsTab === 'mwr' && (
                                    <div className="form-group" style={{ padding: '0 20px', marginBottom: '15px' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem', display: 'block' }}>เลือกใบเบิกที่ต้องการดึงอะไหล่</label>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {availableMwrJobs.length === 0 ? (
                                                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>ไม่มีใบเบิกที่จ่ายเสร็จสิ้นในสนามนี้</span>
                                            ) : (
                                                availableMwrJobs.map(mwr => (
                                                    <button 
                                                        key={mwr.id}
                                                        type="button"
                                                        onClick={() => setSelectedMWRs(prev => prev.includes(mwr.bplus_code!) ? prev.filter(c => c !== mwr.bplus_code) : [...prev, mwr.bplus_code!])}
                                                        style={{
                                                            padding: '6px 16px',
                                                            borderRadius: '20px',
                                                            border: '1px solid',
                                                            borderColor: selectedMWRs.includes(mwr.bplus_code!) ? '#2563eb' : '#d1d5db',
                                                            background: selectedMWRs.includes(mwr.bplus_code!) ? '#eff6ff' : '#f9fafb',
                                                            color: selectedMWRs.includes(mwr.bplus_code!) ? '#1d4ed8' : '#374151',
                                                            fontSize: '0.875rem',
                                                            fontWeight: 500,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                    >
                                                        {mwr.bplus_code} {selectedMWRs.includes(mwr.bplus_code!) && <span style={{ color: '#2563eb', fontWeight: 'bold' }}>✓</span>}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {isLoadingParts ? (
                                    <div className="loading-parts" style={{ textAlign: 'center', padding: '20px' }}>
                                        <p>กำลังโหลดข้อมูลอะไหล่...</p>
                                    </div>
                                ) : (
                                    <>
                                        {(activePartsTab === 'mwr' ? getMwrFilteredParts() : getFilteredParts()).map(part => {
                                            const selectedPart = selectedParts.find(p => p.id === part.id);
                                            return (
                                                <div
                                                    key={part.id}
                                                    className={`part-item ${selectedPart ? 'selected' : ''}`}
                                                    onClick={() => handlePartSelection(part)}
                                                >
                                                    <div className="part-name">{part.name}</div>
                                                    <div className="part-details">
                                                        {part.part_number && (
                                                            <span className="part-code">[รหัส: {part.part_number}]</span>
                                                        )}
                                                        <span className="part-unit">({part.unit})</span>
                                                    </div>
                                                    {selectedPart && (
                                                        <div className="selected-quantity" style={{ marginTop: '4px', fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>
                                                            จำนวนที่เลือก: {selectedPart.quantity}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {(activePartsTab === 'mwr' ? getMwrFilteredParts() : getFilteredParts()).length === 0 && (
                                            <div className="no-parts-found">
                                                <p>ไม่พบอะไหล่ที่ค้นหา &quot;{partsSearchTerm}&quot;</p>
                                                <p>ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => {
                                    setShowPartsModal(false);
                                    if (activePartsTab === 'mwr' && selectedMWRs.length > 0) {
                                        const tag = `[ใช้จากใบเบิก: ${selectedMWRs.join(', ')}]`;
                                        if (!partsNotes.includes(tag)) {
                                            setPartsNotes(prev => prev ? `${prev}\n${tag}` : tag);
                                        }
                                    }
                                }}
                            >
                                อัปเดตและเพิ่มอะไหล่
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CentralCreateJobScreen;