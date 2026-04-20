
'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, JobType, Vehicle, GolfCourse, MOCK_SYSTEMS, View, BMCause } from '@/lib/data';
import { getPartsBySystem, PartsBySystem, CategorizedPart } from '@/lib/partsService';
import ImageUpload from './ImageUpload';

// Local interface for selected parts in this component
interface LocalSelectedPart {
    id: string | number;
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
    initialJobType?: JobType;
}

const CreateJobScreen = ({ user, onJobCreate, setView, vehicles, golfCourses, jobs, initialJobType }: CreateJobScreenProps) => {
    const [vehicleId, setVehicleId] = useState('');
    const [jobType, setJobType] = useState<JobType>(initialJobType || 'PM');
    const [system, setSystem] = useState('');
    const [subTasks, setSubTasks] = useState<string[]>([]);
    const [partsNotes, setPartsNotes] = useState('');
    const [remarks, setRemarks] = useState('');
    const [selectedParts, setSelectedParts] = useState<LocalSelectedPart[]>([]);
    const [showPartsModal, setShowPartsModal] = useState(false);
    const [activePartsTab, setActivePartsTab] = useState('brake');
    const [partsSearchTerm, setPartsSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [bmCause, setBmCause] = useState<BMCause | ''>(''); // เพิ่ม state สำหรับสาเหตุ BM
    const [batterySerial, setBatterySerial] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false); // ป้องกันการกดซ้ำ
    const [selectedMWRs, setSelectedMWRs] = useState<string[]>([]); // สำหรับเลือกใบเบิก

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

    // กรองรถเฉพาะที่อยู่ในสนามเดียวกับพนักงานที่ล็อกอิน
    const userGolfCourse = golfCourses.find(gc => gc.id === user.golf_course_id);
    const availableVehicles = vehicles.filter(v => v.golf_course_id === user.golf_course_id);
    const selectedVehicle = availableVehicles.find(v => v.id === vehicleId);

    useEffect(() => {
        setSubTasks([]);
    }, [system]);

    useEffect(() => {
        // รีเซ็ตข้อมูลเมื่อเปลี่ยนประเภการบำรุงรักษา
        if (jobType !== 'PM') {
            setSystem('');
            setSubTasks([]);
        }
        // รีเซ็ต remarks เมื่อเปลี่ยนเป็น BM หรือ RC
        if (jobType === 'BM' || jobType === 'Recondition') {
            // ไม่ควรไปรีเซ็ต remarks เพราะผู้ใช้อาจจะพิมพ์หมายเหตุไปแล้วแล้วค่อยเปลี่ยนประเภทงาน
            // setRemarks('');
        }
        // รีเซ็ต bmCause เมื่อไม่ใช่ BM
        if (jobType !== 'BM') {
            setBmCause('');
        }
    }, [jobType]);

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

    // ฟังก์ชันกรองอะไหล่ตามคำค้นหา
    const getFilteredParts = () => {
        const currentParts = partsBySystem[activePartsTab as keyof PartsBySystem] || [];
        if (!partsSearchTerm.trim()) {
            return currentParts;
        }

        // ถ้ามีคำค้นหา ให้ค้นหาจากทุก category
        const allParts = Object.values(partsBySystem).flat();
        const searchTerm = partsSearchTerm.toLowerCase().trim();
        return allParts.filter(part =>
            part.name.toLowerCase().includes(searchTerm) ||
            (part.part_number && part.part_number.toLowerCase().includes(searchTerm))
        );
    };

    const availableMWRs = React.useMemo(() => {
        return jobs.filter(j => 
            j.type === 'PART_REQUEST' && 
            j.status === 'completed' && 
            j.golf_course_id === user.golf_course_id &&
            j.bplus_code
        );
    }, [jobs, user.golf_course_id]);

    const getMwrFilteredParts = () => {
        if (selectedMWRs.length === 0) return [];
        
        const mwrPartsMap = new Map<string, CategorizedPart>();
        const allParts = Object.values(partsBySystem).flat();
        
        selectedMWRs.forEach(code => {
            const mwr = availableMWRs.find(j => j.bplus_code === code);
            if (mwr && mwr.parts) {
                mwr.parts.forEach(p => {
                    const systemPart = allParts.find(sp => sp.id.toString() === p.part_id.toString());
                    if (systemPart && !mwrPartsMap.has(systemPart.id.toString())) {
                        mwrPartsMap.set(systemPart.id.toString(), systemPart);
                    }
                });
            }
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
            job.vehicle_id === (selectedVehicle?.id || '') &&
            job.status === 'pending' &&
            job.type === jobType
        );

        if (duplicateJob) {
            const confirmCreate = confirm(`มีงาน ${jobType} สำหรับรถ ${selectedVehicle?.vehicle_number} อยู่แล้ว\nต้องการสร้างงานใหม่หรือไม่?`);
            if (!confirmCreate) return;
        }

        try {
            setIsSubmitting(true); // เริ่มส่งงาน
            // สร้างงานใหม่ (ไม่ต้องสร้าง ID เอง ให้ API สร้างให้)
            const newJob: Omit<Job, 'id' | 'created_at' | 'updated_at'> = {
                user_id: user.id.toString(),
                userName: user.name,
                vehicle_id: selectedVehicle?.id,
                vehicle_number: selectedVehicle?.vehicle_number,
                golf_course_id: user.golf_course_id, // Default to user's course (Destination)
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

    const jobInfo = {
        courseName: userGolfCourse?.name || '-',
        serialNumber: selectedVehicle?.serial_number || '-',
        vehicleNumber: selectedVehicle?.vehicle_number || '-'
    };

    // Group subtasks by category for better UI
    const getSubTasksByCategory = () => {
        if (!system) return {};
        const systemData = MOCK_SYSTEMS.find(s => s.id === system);
        if (!systemData || !systemData.tasks) return {};

        // Return the categorized tasks directly
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

    const getTabDisplayName = (tab: string) => {
        const tabNames: Record<string, string> = {
            'brake': 'ระบบเบรก',
            'steering': 'ระบบบังคับเลี้ยว',
            'motor': 'ระบบมอเตอร์/เพื่อขับ',
            'electric': 'ระบบไฟฟ้า',
            'other': 'อื่นๆ',
            'mwr': 'รายการในใบเบิก'
        };
        return tabNames[tab] || tab;
    };

    const handleCategorySelect = (category: string) => {
        setActivePartsTab(category);
        setIsDropdownOpen(false);
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    return (
        <div className="card">
            <div className="page-header">
                <h2>สร้างงานซ่อมใหม่</h2>
            </div>

            <div className="info-box">
                <h4>ข้อมูลงาน:</h4>
                <p><strong>สนาม:</strong> {jobInfo.courseName}</p>
                <p><strong>Serial Number:</strong> {jobInfo.serialNumber}</p>
                <p><strong>เบอร์รถ:</strong> {jobInfo.vehicleNumber}</p>
                <p><strong>ซีเรียลแบต:</strong> {batterySerial || 'ยังไม่ได้กรอก'}</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="golf-course">ชื่อสนาม (ปลายทาง) *</label>
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
                        <select id="vehicle-number" value={vehicleId} onChange={e => setVehicleId(e.target.value)} required>
                            <option value="" disabled>-- กรุณาเลือกรถ --</option>
                            {availableVehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.vehicle_number}</option>
                            ))}
                        </select>
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
                        <option value="PM">บำรุงรักษาเชิงป้องกัน (PM)</option>
                        <option value="BM">ซ่อมด่วน (BM)</option>
                        <option value="Recondition">ปรับสภาพ (Recondition)</option>
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
                                            <li key={`subtask-${index}-${task.slice(0, 10)}`}>
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
                                <div className="parts-table-header">
                                    <div className="part-name-col">ชื่ออะไหล่</div>
                                    <div className="quantity-col">ปรับจำนวน</div>
                                    <div className="remove-col">ยกเลิก</div>
                                </div>
                                {selectedParts.map((part) => (
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
                        maxImages={20}
                    />
                </div>

                {/* Summary Section */}
                <div className="form-group summary-section">
                    <h3>สรุปข้อมูลงาน</h3>
                    <div className="summary-box">
                        <div className="summary-item">
                            <strong>ประเภท:</strong> {
                                jobType === 'PM' ? 'บำรุงรักษาเชิงป้องกัน' :
                                    jobType === 'BM' ? 'ซ่อมด่วน' :
                                        'ปรับสภาพ'
                            }
                        </div>
                        {jobType === 'BM' && bmCause && (
                            <div className="summary-item">
                                <strong>สาเหตุของการเสีย:</strong> {bmCause === 'breakdown' ? 'เสีย' : 'อุบัติเหตุ'}
                            </div>
                        )}
                        {jobType === 'PM' && system && (
                            <div className="summary-item">
                                <strong>ระบบที่บำรุงรักษา:</strong> {system === 'brake' ? 'ระบบเบรก/เพื่อห้าม' : system === 'steering' ? 'ระบบบังคับเลี้ยว' : system === 'motor' ? 'ระบบมอเตอร์/เพื่อขับ' : 'ระบบไฟฟ้า'}
                            </div>
                        )}
                        {jobType === 'PM' && subTasks.length > 0 && (
                            <div className="summary-item">
                                <strong>งานย่อยที่เลือก:</strong>
                                <ul className="subtasks-list">
                                    {subTasks.map((task, index) => (
                                        <li key={`summary-task-${index}-${task.slice(0, 10)}`}>{task}</li>
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
                    <button type="submit" className="btn-success" disabled={isSubmitting}>
                        {isSubmitting ? 'กำลังส่งงาน...' : 'ส่งงาน'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setView('dashboard')}>ยกเลิก</button>
                </div>
            </form>

            {/* Parts Selection Modal */}
            {showPartsModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
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
                                        {availableMWRs.length === 0 ? (
                                            <span className="text-sm text-gray-500">ไม่มีใบเบิกที่สามารถใช้งานได้ หรือยังไม่มีใบเบิกที่ได้รับการอนุมัติ/โอนคลัง</span>
                                        ) : availableMWRs.map(mwr => (
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
                                    {selectedMWRs.length === 0 && availableMWRs.length > 0 && <p className="text-xs text-indigo-500 mt-3">* กรุณาคลิกเลือกเลขที่ใบเบิกเพื่อแสดงรายการอะไหล่</p>}
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
                                        // Auto inject MWR tag to parts notes
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
}

export default CreateJobScreen;
