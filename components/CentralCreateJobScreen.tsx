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

    const availableMwrJobs = React.useMemo(() => {
        return jobs.filter(j => 
            j.type === 'PART_REQUEST' && 
            j.status === 'completed' && 
            j.bplus_code && 
            (!selectedGolfCourseId || j.golf_course_id === selectedGolfCourseId)
        );
    }, [jobs, selectedGolfCourseId]);

    // หา job ที่เคยใช้อะไหล่จากใบเบิกเหล่านี้ไปแล้ว
    const consumedByJobs = React.useMemo(() => {
        return jobs.filter(j =>
            (j.type === 'PM' || j.type === 'BM' || j.type === 'Recondition') &&
            j.partsNotes && j.partsNotes.includes('[ใช้จากใบเบิก:')
        );
    }, [jobs]);

    const getMwrFilteredParts = () => {
        if (selectedMWRs.length === 0) return [];
        
        const mwrPartsMap = new Map<string, CategorizedPart>();
        const allParts = Object.values(partsBySystem).flat();
        
        // --- ขั้น 1: รวมยอดขอเบิกจาก MWR ที่เลือก ---
        selectedMWRs.forEach(code => {
            const mwr = availableMwrJobs.find(j => j.bplus_code === code);
            if (mwr) {
                const hasMwrItems = (mwr as any).mwrVehicleItems && (mwr as any).mwrVehicleItems.length > 0;
                
                if (hasMwrItems) {
                    (mwr as any).mwrVehicleItems.forEach((p: any) => {
                        const systemPart = allParts.find(sp => sp.id.toString() === p.part_id.toString());
                        if (systemPart) {
                            const existing = mwrPartsMap.get(systemPart.id.toString());
                            const qty = parseInt(p.quantity || p.quantity_used || '0', 10);
                            if (existing) {
                                (existing as any).mwr_qty = ((existing as any).mwr_qty || 0) + qty;
                            } else {
                                mwrPartsMap.set(systemPart.id.toString(), { ...systemPart, mwr_qty: qty, mwr_used: 0, mwr_remaining: qty } as any);
                            }
                        }
                    });
                } else if (mwr.parts) {
                    mwr.parts.forEach((p: any) => {
                        const systemPart = allParts.find(sp => sp.id.toString() === p.part_id.toString());
                        if (systemPart) {
                            const existing = mwrPartsMap.get(systemPart.id.toString());
                            const qty = parseInt(p.quantity_used || p.quantity || '0', 10);
                            if (existing) {
                                (existing as any).mwr_qty = ((existing as any).mwr_qty || 0) + qty;
                            } else {
                                mwrPartsMap.set(systemPart.id.toString(), { ...systemPart, mwr_qty: qty, mwr_used: 0, mwr_remaining: qty } as any);
                            }
                        }
                    });
                }
            }
        });

        // --- ขั้น 2: หักยอดที่ถูกใช้ไปแล้วจาก job อื่น ---
        selectedMWRs.forEach(code => {
            const relatedJobs = consumedByJobs.filter(cj => cj.partsNotes?.includes(code));
            relatedJobs.forEach(rj => {
                rj.parts?.forEach(jp => {
                    const key = jp.part_id.toString();
                    const existing = mwrPartsMap.get(key);
                    if (existing) {
                        (existing as any).mwr_used = ((existing as any).mwr_used || 0) + jp.quantity_used;
                    }
                });
            });
        });

        // --- ขั้น 3: คำนวณยอดคงเหลือ ---
        mwrPartsMap.forEach((part: any) => {
            const requested = part.mwr_qty || 0;
            const used = Math.min(part.mwr_used || 0, requested);
            part.mwr_used = used;
            part.mwr_remaining = requested - used;
        });
        
        const partsList = Array.from(mwrPartsMap.values());
        if (!partsSearchTerm.trim()) {
            return partsList;
        }
        const searchTerm = partsSearchTerm.toLowerCase().trim();
        return partsList.filter(part =>
            part.name.toLowerCase().includes(searchTerm) ||
            (part.part_number && part.part_number.toLowerCase().includes(searchTerm))
        );
    };

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
                            {/* Mobile Category Dropdown in Header */}
                            <div className="mobile-header-dropdown">
                                <button
                                    type="button"
                                    className={`header-category-dropdown-button ${isDropdownOpen ? 'open' : ''}`}
                                    onClick={toggleDropdown}
                                >
                                    <span>{getTabDisplayName(activePartsTab)}</span>
                                    <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
                                </button>
                                {isDropdownOpen && (
                                    <div className="header-category-dropdown-menu">
                                        {[...Object.keys(partsBySystem), 'mwr'].map(tab => (
                                            <div
                                                key={tab}
                                                className={`header-category-dropdown-item ${activePartsTab === tab ? 'active' : ''}`}
                                                onClick={() => handleCategorySelect(tab)}
                                            >
                                                {getTabDisplayName(tab)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Desktop Tabs */}
                        <div className="modal-tabs">
                            {[...Object.keys(partsBySystem), 'mwr'].map(tab => (
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

                        {/* Mobile Dropdown */}
                        <div className="mobile-category-dropdown">
                            <button
                                type="button"
                                className={`category-dropdown-button ${isDropdownOpen ? 'open' : ''}`}
                                onClick={toggleDropdown}
                            >
                                <span>{getTabDisplayName(activePartsTab)}</span>
                                <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
                            </button>
                            {isDropdownOpen && (
                                <div className="category-dropdown-menu">
                                    {[...Object.keys(partsBySystem), 'mwr'].map(tab => (
                                        <div
                                            key={tab}
                                            className={`category-dropdown-item ${activePartsTab === tab ? 'active' : ''}`}
                                            onClick={() => handleCategorySelect(tab)}
                                        >
                                            {getTabDisplayName(tab)}
                                        </div>
                                    ))}
                                </div>
                            )}
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
                            {activePartsTab === 'mwr' && (
                                <div className="mb-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100/50 shadow-sm">
                                    <label className="block text-sm font-semibold text-indigo-900 mb-2 whitespace-nowrap">เลือกใบเบิก (MWR) ที่ต้องการดึงอะไหล่:</label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableMwrJobs.length === 0 ? (
                                            <span className="text-sm text-gray-500">ไม่มีใบเบิกที่สามารถใช้งานได้{selectedGolfCourseId ? ' ในสนามนี้' : ''}</span>
                                        ) : availableMwrJobs.map(mwr => (
                                            <button
                                                key={mwr.id}
                                                type="button"
                                                onClick={() => setSelectedMWRs(prev => prev.includes(mwr.bplus_code!) ? prev.filter(c => c !== mwr.bplus_code) : [...prev, mwr.bplus_code!])}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 active:scale-[0.98] ${selectedMWRs.includes(mwr.bplus_code!) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-indigo-50 hover:border-indigo-200'}`}
                                            >
                                                {mwr.bplus_code || mwr.id.slice(-6)}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {selectedMWRs.length === 0 && availableMwrJobs.length > 0 && (
                                        <p className="text-xs text-indigo-500 mt-3">* กรุณาคลิกเลือกเลขที่ใบเบิกเพื่อแสดงรายการอะไหล่</p>
                                    )}

                                    {/* กล่องสรุปรายการอะไหล่ที่ได้จากใบเบิกที่เลือก */}
                                    {selectedMWRs.length > 0 && (
                                        <div className="mt-4 p-3 bg-white rounded-xl border border-indigo-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                                            <div className="text-xs font-semibold text-indigo-900 mb-2 border-b border-indigo-50 pb-2 flex items-center justify-between">
                                                <span>สรุปโควตาอะไหล่จากใบเบิกที่เลือก</span>
                                                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px]">{getMwrFilteredParts().length} รายการ</span>
                                            </div>
                                            <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                                {getMwrFilteredParts().map(part => (
                                                    <div key={part.id} className="flex justify-between items-center text-xs py-0.5">
                                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"></div>
                                                            {part.part_number && (
                                                                <span className="text-zinc-500 font-mono text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded flex-shrink-0">{part.part_number}</span>
                                                            )}
                                                            <span className="font-medium text-zinc-700 truncate">{part.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <span className="text-zinc-400 text-[10px]">เบิก {(part as any).mwr_qty}</span>
                                                            {(part as any).mwr_used > 0 && <span className="text-orange-500 text-[10px]">ใช้แล้ว {(part as any).mwr_used}</span>}
                                                            <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${(part as any).mwr_remaining > 0 ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-red-500 bg-red-50 border border-red-100'}`}>
                                                                คงเหลือ {(part as any).mwr_remaining} {part.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isLoadingParts ? (
                                <div className="loading-parts" style={{ textAlign: 'center', padding: '20px' }}>
                                    <p>กำลังโหลดข้อมูลอะไหล่...</p>
                                </div>
                            ) : (
                                <div className="parts-grid">
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
                                                {/* แสดงโควตาคงเหลือจากใบเบิก */}
                                                {(part as any).mwr_qty !== undefined && (
                                                    <div style={{ fontSize: '0.8rem', marginBottom: '6px', fontWeight: 500, color: (part as any).mwr_remaining > 0 ? '#059669' : '#ef4444' }}>
                                                        คงเหลือ {(part as any).mwr_remaining}/{(part as any).mwr_qty} {part.unit}
                                                    </div>
                                                )}
                                                {selectedPart && (
                                                    <div className="selected-quantity">
                                                        จำนวน: {selectedPart.quantity}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* แสดงข้อความเมื่อไม่พบผลลัพธ์ */}
                                    {(activePartsTab === 'mwr' ? getMwrFilteredParts() : getFilteredParts()).length === 0 && (
                                        <div className="no-parts-found">
                                            <p>ไม่พบอะไหล่ที่ค้นหา &quot;{partsSearchTerm}&quot;</p>
                                            <p>ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
                                        </div>
                                    )}
                                </div>
                            )}
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
                                เพิ่มอะไหล่ที่เลือก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CentralCreateJobScreen;