
'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, JobType, Vehicle, GolfCourse, MOCK_SYSTEMS, View, BMCause, RepairAction, BMSymptom } from '@/lib/data';
import { getPartsBySystem, PartsBySystem, CategorizedPart } from '@/lib/partsService';
import ImageUpload from './ImageUpload';
import { cn } from '@/lib/utils';
import { Plus, X, CheckCircle2, MapPin, AlertCircle, Wrench, Search, Info, Car, Battery, Cog, Package, Camera, FileText } from 'lucide-react';


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
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [activePartsTab, setActivePartsTab] = useState('brake');
    const [partsSearchTerm, setPartsSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [bmCause, setBmCause] = useState<BMCause | ''>(''); // เพิ่ม state สำหรับสาเหตุ BM
    const [bmSymptom, setBmSymptom] = useState<BMSymptom | ''>('');
    const [repairActions, setRepairActions] = useState<RepairAction[]>([]);
    const [bmSystems, setBmSystems] = useState<string[]>([]);
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
            setBmSymptom('');
            setRepairActions([]);
            setBmSystems([]);
        }
    }, [jobType]);

    const handleSubTaskChange = (task: string, isChecked: boolean) => {
        setSubTasks(prev => isChecked ? [...prev, task] : prev.filter(t => t !== task));
    }

    const toggleRepairAction = (action: RepairAction) => {
        setRepairActions(prev => prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]);
    };

    const toggleBmSystem = (sys: string) => {
        setBmSystems(prev => prev.includes(sys) ? prev.filter(s => s !== sys) : [...prev, sys]);
    };

    // Auto update 'replace' action
    useEffect(() => {
        if (selectedParts.length > 0) {
            if (!repairActions.includes('replace')) {
                setRepairActions(prev => [...prev, 'replace']);
            }
        } else {
            setRepairActions(prev => prev.filter(a => a !== 'replace'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedParts]);

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
            const mwr = availableMWRs.find(j => j.bplus_code === code);
            if (mwr) {
                // ใช้ mwrVehicleItems เป็นหลัก (ถ้ามี) เพราะเป็นข้อมูลแยกคัน
                // ถ้าไม่มี ค่อย fallback ไปใช้ mwr.parts
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

        // แทนที่จะส่งทันที ให้เปิด Modal สรุปข้อมูล
        setShowSummaryModal(true);
    };

    const confirmSubmit = () => {
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
                ...(jobType === 'BM' && bmCause && { bmCause }),
                ...(jobType === 'BM' && bmSymptom && { bmSymptom }),
                ...(jobType === 'BM' && repairActions.length > 0 && { repairActions }),
                ...(jobType === 'BM' && {
                    systems: Array.from(new Set([
                        ...bmSystems,
                        ...selectedParts.map(p => {
                            const entry = Object.entries(partsBySystem).find(([_, parts]) => (parts as any[]).some(sp => sp.id === p.id));
                            return entry ? entry[0] : '';
                        }).filter(s => s !== '')
                    ]))
                })
            };

            onJobCreate(newJob as Job);
            setShowSummaryModal(false);

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



    const FormRow = ({ label, required, children, id }: { label: React.ReactNode, required?: boolean, children: React.ReactNode, id?: string }) => (
        <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] md:grid-cols-[240px_1fr] gap-2 sm:gap-6 items-start py-5 border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-0">
            <label htmlFor={id} className="text-sm font-medium text-zinc-900 dark:text-zinc-50 pt-2 flex items-center gap-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="w-full flex flex-col gap-2">
                {children}
            </div>
        </div>
    );

    const SectionDivider = ({ icon, title, color }: { icon: React.ReactNode, title: string, color: 'blue' | 'emerald' | 'amber' | 'violet' | 'rose' }) => {
        const colors = {
            blue: 'border-l-blue-500 bg-gradient-to-r from-blue-50/60 to-transparent dark:from-blue-500/5 dark:to-transparent text-blue-600 dark:text-blue-400',
            emerald: 'border-l-emerald-500 bg-gradient-to-r from-emerald-50/60 to-transparent dark:from-emerald-500/5 dark:to-transparent text-emerald-600 dark:text-emerald-400',
            amber: 'border-l-amber-500 bg-gradient-to-r from-amber-50/60 to-transparent dark:from-amber-500/5 dark:to-transparent text-amber-600 dark:text-amber-400',
            violet: 'border-l-violet-500 bg-gradient-to-r from-violet-50/60 to-transparent dark:from-violet-500/5 dark:to-transparent text-violet-600 dark:text-violet-400',
            rose: 'border-l-rose-500 bg-gradient-to-r from-rose-50/60 to-transparent dark:from-rose-500/5 dark:to-transparent text-rose-600 dark:text-rose-400',
        };
        return (
            <div className={cn("flex items-center gap-2.5 px-5 py-3 -mx-6 mt-4 first:mt-0 border-l-4", colors[color])}>
                {icon}
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">{title}</span>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fadeIn text-zinc-900 dark:text-zinc-50">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-semibold tracking-tighter text-zinc-900 dark:text-zinc-50">สร้างงานซ่อมใหม่</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">กรอกรายละเอียดเพื่อเปิดใบแจ้งซ่อมใหม่เข้าระบบ</p>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-[0_2px_10px_rgb(0,0,0,0.02)] p-6 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                    <MapPin size={16} className="text-indigo-500" />
                    ข้อมูลเบื้องต้น
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">สนาม (ปลายทาง)</span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{jobInfo.courseName}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">Serial Number</span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{jobInfo.serialNumber}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">เบอร์รถ</span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{jobInfo.vehicleNumber}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">ซีเรียลแบต</span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{batterySerial || '-'}</span>
                    </div>
                </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="px-6 py-2">
                    <SectionDivider icon={<Car size={16} strokeWidth={1.5} />} title="ข้อมูลรถกอล์ฟ" color="blue" />

                    <FormRow label="หมายเลขซีเรียล / เบอร์รถ" required>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <select
                                value={vehicleId}
                                onChange={e => setVehicleId(e.target.value)}
                                required
                                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                            >
                                <option value="" disabled>-- เลือกหมายเลขซีเรียล --</option>
                                {availableVehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.serial_number}</option>
                                ))}
                            </select>
                            <select
                                value={vehicleId}
                                onChange={e => setVehicleId(e.target.value)}
                                required
                                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                            >
                                <option value="" disabled>-- เลือกเบอร์รถ --</option>
                                {availableVehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.vehicle_number}</option>
                                ))}
                            </select>
                        </div>
                    </FormRow>

                    <SectionDivider icon={<Battery size={16} strokeWidth={1.5} />} title="ข้อมูลแบตเตอรี่" color="emerald" />

                    <FormRow label="ซีเรียลแบต" required id="battery-serial">
                        <input
                            id="battery-serial"
                            type="text"
                            value={batterySerial}
                            onChange={e => setBatterySerial(e.target.value)}
                            placeholder="กรอกซีเรียลแบต หรือ 'ไม่มีสติ๊กเกอร์' หรือ 'หลุด'"
                            required
                            className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                        />
                    </FormRow>

                    <SectionDivider icon={<Cog size={16} strokeWidth={1.5} />} title="รายละเอียดงานซ่อม" color="amber" />

                    <FormRow label="ประเภการบำรุงรักษา" required id="job-type">
                        <select
                            id="job-type"
                            value={jobType}
                            onChange={e => setJobType(e.target.value as JobType)}
                            className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                        >
                            <option value="PM">บำรุงรักษาเชิงป้องกัน (PM)</option>
                            <option value="BM">ซ่อมด่วน (BM)</option>
                            <option value="Recondition">ปรับสภาพ (Recondition)</option>
                        </select>
                    </FormRow>

                    {jobType === 'BM' && (
                        <FormRow label="สาเหตุของการเสีย" required>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setBmCause('breakdown')}
                                    className={cn(
                                        "flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-200 active:scale-[0.98]",
                                        bmCause === 'breakdown'
                                            ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-2 ring-red-500/20"
                                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                    )}
                                >
                                    <AlertCircle size={20} className={bmCause === 'breakdown' ? "text-red-500" : "text-zinc-400"} />
                                    <span className="font-semibold text-sm">เสีย / เครื่องขัดข้อง</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBmCause('accident')}
                                    className={cn(
                                        "flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-200 active:scale-[0.98]",
                                        bmCause === 'accident'
                                            ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/20"
                                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                    )}
                                >
                                    <Wrench size={20} className={bmCause === 'accident' ? "text-amber-500" : "text-zinc-400"} />
                                    <span className="font-semibold text-sm">อุบัติเหตุ / ความเสียหาย</span>
                                </button>
                            </div>
                        </FormRow>
                    )}

                    {jobType === 'BM' && (
                        <FormRow label="อาการเสียเบื้องต้น" id="bm-symptom">
                            <select
                                id="bm-symptom"
                                value={bmSymptom}
                                onChange={e => setBmSymptom(e.target.value as BMSymptom)}
                                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                            >
                                <option value="">-- ระบุอาการเสีย --</option>
                                <option value="wont_start">สตาร์ทไม่ติด / วิ่งไม่ได้</option>
                                <option value="strange_noise">มีเสียงดังผิดปกติ</option>
                                <option value="performance_drop">ไม่มีกำลัง / แบตหมดเร็ว</option>
                                <option value="control_issue">บังคับเลี้ยวไม่ได้ / เบรกไม่อยู่</option>
                                <option value="physical_damage">แตกหัก / เสียรูปจากภายนอก</option>
                                <option value="other">อื่นๆ</option>
                            </select>
                        </FormRow>
                    )}

                    {jobType === 'BM' && (
                        <FormRow label="วิธีแก้ไข (Action Taken)">
                            <div className="flex flex-wrap gap-2 pt-1">
                                {[
                                    { id: 'replace', label: '🔄 เปลี่ยนชิ้นส่วน' },
                                    { id: 'adjust', label: '🔧 ปรับตั้ง/คาลิเบรต' },
                                    { id: 'clean', label: '🧹 ทำความสะอาด' },
                                    { id: 'tighten', label: '🔩 ขันแน่น' },
                                    { id: 'software', label: '💻 รีเซ็ตระบบ' },
                                ].map(action => (
                                    <button
                                        key={action.id}
                                        type="button"
                                        onClick={() => toggleRepairAction(action.id as RepairAction)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 active:scale-[0.95]",
                                            repairActions.includes(action.id as RepairAction)
                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                                : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-indigo-500 dark:hover:border-indigo-500"
                                        )}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </FormRow>
                    )}

                    {jobType === 'BM' && selectedParts.length === 0 && (
                        <FormRow label="ระบบที่เสีย">
                            <div className="flex flex-wrap gap-2 pt-1">
                                {[
                                    { id: 'brake', label: '🔘 เบรก' },
                                    { id: 'steering', label: '🏎️ บังคับเลี้ยว' },
                                    { id: 'motor', label: '⚡ มอเตอร์' },
                                    { id: 'electric', label: '🔌 ไฟฟ้า' },
                                    { id: 'other', label: '❓ อื่นๆ' },
                                ].map(sys => (
                                    <button
                                        key={sys.id}
                                        type="button"
                                        onClick={() => toggleBmSystem(sys.id)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 active:scale-[0.95]",
                                            bmSystems.includes(sys.id)
                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                                : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-indigo-500 dark:hover:border-indigo-500"
                                        )}
                                    >
                                        {sys.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-1">* กรณีไม่ได้เบิกอะไหล่ กรุณาระบุระบบที่เสียเพื่อให้ระบบ Analytics ทำงานได้ถูกต้อง</p>
                        </FormRow>
                    )}

                    {jobType === 'PM' && (
                        <FormRow label="ระบบที่ต้องการบำรุงรักษา" required id="system">
                            <select
                                id="system"
                                value={system}
                                onChange={e => setSystem(e.target.value)}
                                required
                                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                            >
                                <option value="" disabled>-- กรุณาเลือกระบบ --</option>
                                <option value="brake">ระบบเบรก/เพื่อห้าม (brake)</option>
                                <option value="steering">ระบบบังคับเลี้ยว (steering)</option>
                                <option value="motor">ระบบมอเตอร์/เพื่อขับ (motor)</option>
                                <option value="electric">ระบบไฟฟ้า (electric)</option>
                            </select>
                        </FormRow>
                    )}

                    {jobType === 'PM' && Object.keys(subTaskCategories).length > 0 && (
                        <FormRow label="รายการงานย่อย">
                            <div className="space-y-4">
                                {Object.entries(subTaskCategories).map(([category, tasks]) => (
                                    <div key={category} className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
                                        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{getCategoryDisplayName(category)}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {(tasks as string[]).map((task: string) => (
                                                <button
                                                    key={task}
                                                    type="button"
                                                    onClick={() => handleSubTaskChange(task, !subTasks.includes(task))}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-md text-sm transition-all duration-200 flex items-center gap-2",
                                                        subTasks.includes(task)
                                                            ? "bg-indigo-600 text-white shadow-sm"
                                                            : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                                    )}
                                                >
                                                    {subTasks.includes(task) && <CheckCircle2 size={14} />}
                                                    {task}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FormRow>
                    )}

                    <SectionDivider icon={<Package size={16} strokeWidth={1.5} />} title="อะไหล่และวัสดุ" color="violet" />

                    <FormRow label="รายการอะไหล่ที่เปลี่ยน">
                        <div className="space-y-4">
                            <button
                                type="button"
                                onClick={() => setShowPartsModal(true)}
                                className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm"
                            >
                                <Plus size={16} />
                                เพิ่มอะไหล่
                            </button>

                            {selectedParts.length > 0 && (
                                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800">
                                            <tr>
                                                <th className="px-4 py-3">ชื่ออะไหล่</th>
                                                <th className="px-4 py-3 w-32 text-center">จำนวน</th>
                                                <th className="px-4 py-3 w-16"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                            {selectedParts.map((part) => (
                                                <tr key={part.id}>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-zinc-900 dark:text-zinc-50">{part.name}</div>
                                                        <div className="text-xs text-zinc-500">({part.unit})</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-900 rounded-md p-1 border border-zinc-200/50 dark:border-zinc-800/50">
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePartQuantityChange(part.id, part.quantity - 1)}
                                                                className="w-6 h-6 flex items-center justify-center rounded text-zinc-500 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm transition-all"
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                value={part.quantity}
                                                                onChange={(e) => handlePartQuantityChange(part.id, parseInt(e.target.value) || 0)}
                                                                className="w-10 text-center bg-transparent border-none focus:ring-0 text-sm font-medium p-0"
                                                                min="1"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePartQuantityChange(part.id, part.quantity + 1)}
                                                                className="w-6 h-6 flex items-center justify-center rounded text-zinc-500 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm transition-all"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemovePart(part.id)}
                                                            className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                                                            aria-label="Remove part"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </FormRow>

                    <SectionDivider icon={<FileText size={16} strokeWidth={1.5} />} title="หมายเหตุ" color="rose" />

                    <FormRow label="หมายเหตุอะไหล่เพิ่มเติม" id="parts-notes">
                        <textarea
                            id="parts-notes"
                            value={partsNotes}
                            onChange={e => setPartsNotes(e.target.value)}
                            placeholder="เช่น เปลี่ยนหลอดไฟหน้า, อัดจารบี..."
                            className="w-full min-h-[80px] rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 resize-y"
                        />
                    </FormRow>

                    <FormRow label="หมายเหตุอื่นๆ" id="remarks">
                        <textarea
                            id="remarks"
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            className="w-full min-h-[80px] rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 resize-y"
                        />
                    </FormRow>

                    <SectionDivider icon={<Camera size={16} strokeWidth={1.5} />} title="แนบรูปภาพ" color="rose" />

                    <FormRow label="แนบรูปภาพ">
                        <div className="w-full">
                            <ImageUpload
                                images={images}
                                onImagesChange={setImages}
                                maxImages={20}
                            />
                        </div>
                    </FormRow>
                </div>

                {/* Footer Actions */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row justify-end gap-3">
                    <button
                        type="button"
                        className="bg-transparent border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 w-full sm:w-auto text-center"
                        onClick={() => setView('dashboard')}
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={cn(
                            "bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm w-full sm:w-auto text-center flex items-center justify-center gap-2",
                            isSubmitting && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? 'กำลังส่งงาน...' : 'บันทึกสร้างงาน'}
                    </button>
                </div>
            </form>

            {/* Parts Selection Modal */}
            {/* Parts Selection Modal */}
            {/* Parts Selection Modal */}
            {showPartsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowPartsModal(false)}></div>

                    <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">เลือกรายการอะไหล่</h3>
                                <p className="text-xs text-zinc-500 font-medium">ค้นหาและเลือกอะไหล่ที่ใช้ในการซ่อมครั้งนี้</p>
                            </div>
                            <button
                                onClick={() => setShowPartsModal(false)}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Search & Tabs Section */}
                        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 space-y-4">
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="ค้นหาชื่ออะไหล่ หรือรหัสอะไหล่..."
                                    value={partsSearchTerm}
                                    onChange={(e) => setPartsSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-10 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                />
                                {partsSearchTerm && (
                                    <button
                                        onClick={() => setPartsSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Mobile Dropdown */}
                            <div className="block sm:hidden w-full">
                                <select
                                    value={activePartsTab}
                                    onChange={(e) => setActivePartsTab(e.target.value)}
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm appearance-none font-medium"
                                >
                                    {[...Object.keys(partsBySystem), 'mwr'].map(tab => (
                                        <option key={tab} value={tab}>{getTabDisplayName(tab)}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Desktop Buttons */}
                            <div className="hidden sm:flex flex-wrap gap-2">
                                {[...Object.keys(partsBySystem), 'mwr'].map(tab => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActivePartsTab(tab)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200",
                                            activePartsTab === tab
                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                                : "bg-white dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                                        )}
                                    >
                                        {getTabDisplayName(tab)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                            {activePartsTab === 'mwr' && (
                                <div className="mb-6 p-5 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                        <label className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest">เลือกใบเบิกอะไหล่ (MWR)</label>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {availableMWRs.length === 0 ? (
                                            <p className="text-sm text-indigo-500/60 italic py-2 px-1">ไม่พบใบเบิกที่อนุมัติแล้วของพนักงานท่านนี้</p>
                                        ) : availableMWRs.map(mwr => (
                                            <button
                                                key={mwr.id}
                                                type="button"
                                                onClick={() => setSelectedMWRs(prev => prev.includes(mwr.bplus_code!) ? prev.filter(c => c !== mwr.bplus_code) : [...prev, mwr.bplus_code!])}
                                                className={cn(
                                                    "px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200",
                                                    selectedMWRs.includes(mwr.bplus_code!)
                                                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:border-indigo-400"
                                                )}
                                            >
                                                {mwr.bplus_code || mwr.id.slice(-6)}
                                            </button>
                                        ))}
                                    </div>

                                    {selectedMWRs.length > 0 && (
                                        <div className="p-4 bg-white/50 dark:bg-zinc-950/50 rounded-xl border border-indigo-100/50 dark:border-indigo-500/10">
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter mb-2">สรุปโควตาจากใบเบิกที่เลือก</p>
                                            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                                {getMwrFilteredParts().map(part => (
                                                    <div key={part.id} className="flex justify-between items-center text-xs">
                                                        <span className="text-zinc-600 dark:text-zinc-400 truncate pr-4">{part.name}</span>
                                                        <span className="font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                                            คงเหลือ {(part as any).mwr_remaining} {part.unit}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isLoadingParts ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-10 h-10 border-4 border-zinc-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                    <p className="text-sm text-zinc-500 font-medium animate-pulse">กำลังเรียกข้อมูลอะไหล่...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {(activePartsTab === 'mwr' ? getMwrFilteredParts() : getFilteredParts()).map(part => {
                                        const isSelected = selectedParts.some(p => p.id === part.id);
                                        return (
                                            <button
                                                key={part.id}
                                                type="button"
                                                onClick={() => handlePartSelection(part)}
                                                className={cn(
                                                    "group flex flex-col p-4 rounded-2xl border transition-all duration-200 text-left relative overflow-hidden",
                                                    isSelected
                                                        ? "bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-500 ring-1 ring-indigo-500 shadow-md shadow-indigo-500/5"
                                                        : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm"
                                                )}
                                            >
                                                {isSelected && (
                                                    <div className="absolute top-3 right-3 text-indigo-600">
                                                        <CheckCircle2 size={16} fill="currentColor" className="text-white" />
                                                        <CheckCircle2 size={16} className="absolute inset-0" />
                                                    </div>
                                                )}
                                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight mb-1">
                                                    {part.part_number || 'NO CODE'}
                                                </div>
                                                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3 line-clamp-2 leading-snug">
                                                    {part.name}
                                                </div>
                                                <div className="mt-auto flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded uppercase tracking-wider">
                                                        {part.unit}
                                                    </span>
                                                    {(part as any).mwr_remaining !== undefined && (
                                                        <span className={cn(
                                                            "text-[10px] font-bold px-2 py-0.5 rounded",
                                                            (part as any).mwr_remaining > 0 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" : "text-red-500 bg-red-50"
                                                        )}>
                                                            โควตา {(part as any).mwr_remaining}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {(activePartsTab === 'mwr' ? getMwrFilteredParts() : getFilteredParts()).length === 0 && (
                                        <div className="col-span-full py-12 text-center space-y-2">
                                            <div className="text-zinc-300 dark:text-zinc-700 flex justify-center mb-4">
                                                <Info size={48} strokeWidth={1} />
                                            </div>
                                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ไม่พบอะไหล่ที่ค้นหา</p>
                                            <p className="text-xs text-zinc-500">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <Plus size={16} />
                                </div>
                                <div className="text-sm font-medium">
                                    เลือกแล้ว <span className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedParts.length}</span> รายการ
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowPartsModal(false)}
                                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPartsModal(false);
                                        if (activePartsTab === 'mwr' && selectedMWRs.length > 0) {
                                            const tag = `[ใช้จากใบเบิก: ${selectedMWRs.join(', ')}]`;
                                            if (!partsNotes.includes(tag)) {
                                                setPartsNotes(prev => prev ? `${prev}\n${tag}` : tag);
                                            }
                                        }
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                                >
                                    เพิ่มอะไหล่ที่เลือก
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Job Summary Modal */}
            {showSummaryModal && selectedVehicle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowSummaryModal(false)}></div>
                    <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">ตรวจสอบข้อมูลการซ่อม</h3>
                                <p className="text-xs text-zinc-500 font-medium">กรุณาตรวจสอบรายละเอียดก่อนบันทึก</p>
                            </div>
                            <button
                                onClick={() => setShowSummaryModal(false)}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <span className="text-zinc-500 font-medium text-xs uppercase">สนามกอล์ฟ</span>
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{userGolfCourse?.name || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-zinc-500 font-medium text-xs uppercase">รหัสรถ</span>
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedVehicle.vehicle_number}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-zinc-500 font-medium text-xs uppercase">ประเภทงาน</span>
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{jobType === 'PM' ? 'บำรุงรักษาเชิงป้องกัน (PM)' : 'ซ่อมด่วน (BM)'}</p>
                                </div>
                                {jobType === 'BM' && (
                                    <div className="space-y-1">
                                        <span className="text-zinc-500 font-medium text-xs uppercase">สาเหตุหลัก</span>
                                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{bmCause}</p>
                                    </div>
                                )}
                            </div>

                            {selectedParts.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-zinc-500 font-medium text-xs uppercase">รายการอะไหล่ที่ใช้ ({selectedParts.length} รายการ)</span>
                                    <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-sm">
                                        {selectedParts.map((part, index) => (
                                            <div key={index} className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                                <span className="text-zinc-700 dark:text-zinc-300">{part.name}</span>
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100">{part.quantity} {part.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {images.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-zinc-500 font-medium text-xs uppercase">รูปภาพแนบ ({images.length} รูป)</span>
                                    <div className="flex gap-2 flex-wrap">
                                        {images.map((img, index) => (
                                            <div key={index} className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                                                <img src={img} alt="Attached" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowSummaryModal(false)}
                                className="px-5 py-2.5 rounded-xl font-bold text-sm text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                            >
                                กลับไปแก้ไข
                            </button>
                            <button
                                type="button"
                                onClick={confirmSubmit}
                                disabled={isSubmitting}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200 shadow-sm",
                                    isSubmitting
                                        ? "bg-indigo-400 cursor-not-allowed"
                                        : "bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] shadow-indigo-500/20"
                                )}
                            >
                                {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการบันทึกงาน'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateJobScreen;
