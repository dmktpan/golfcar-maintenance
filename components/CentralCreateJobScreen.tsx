'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, JobType, Vehicle, GolfCourse, MOCK_SYSTEMS, View, BMCause, RepairAction, BMSymptom } from '@/lib/data';
import { getPartsBySystem, PartsBySystem, CategorizedPart } from '@/lib/partsService';
import ImageUpload from './ImageUpload';
import { cn } from '@/lib/utils';
import { Plus, X, CheckCircle2, AlertCircle, Wrench, Search, Info, Car, Battery, Cog, Package, Camera, FileText } from 'lucide-react';


// Local interface for selected parts in this component
interface LocalSelectedPart {
    id: string | number;
    name: string;
    unit: string;
    quantity: number;
    part_number?: string;
}

interface CentralCreateJobScreenProps {
    user: User;
    onJobCreate: (newJob: Job) => void;
    setView: (view: View) => void;
    vehicles: Vehicle[];
    golfCourses: GolfCourse[];
    jobs: Job[];
}

const FormRow = ({ label, required, children, id }: { label: React.ReactNode, required?: boolean, children: React.ReactNode, id?: string }) => (
    <div className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
        <label htmlFor={id} className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 ml-0.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="w-full">
            {children}
        </div>
    </div>
);

const SectionDivider = ({ icon, title, color }: { icon: React.ReactNode, title: string, color: 'blue' | 'emerald' | 'amber' | 'violet' | 'rose' }) => {
    const colors = {
        blue: 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10',
        emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10',
        amber: 'text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/10',
        violet: 'text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-500/10',
        rose: 'text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-500/10',
    };
    return (
        <div className={cn("flex items-center gap-2.5 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 font-bold", colors[color])}>
            {icon}
            <span className="text-[11px] font-bold uppercase tracking-widest">{title}</span>
        </div>
    );
};

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
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [activePartsTab, setActivePartsTab] = useState('brake');
    const [partsSearchTerm, setPartsSearchTerm] = useState('');
    const [bmCause, setBmCause] = useState<BMCause | ''>('');
    const [bmSymptom, setBmSymptom] = useState<BMSymptom | ''>('');
    const [repairActions, setRepairActions] = useState<RepairAction[]>([]);
    const [bmSystems, setBmSystems] = useState<string[]>([]);
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

    // Filter vehicles by search term and course
    const filteredVehicles = vehicles.filter(v => {
        const matchesCourse = selectedGolfCourseId ? v.golf_course_id === selectedGolfCourseId : true;
        const matchesSearch = vehicleSearchTerm.trim() === '' ? true :
            v.vehicle_number?.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
            v.serial_number?.toLowerCase().includes(vehicleSearchTerm.toLowerCase());
        return matchesCourse && matchesSearch;
    });

    const selectedVehicle = vehicles.find(v => v.id === vehicleId);

    // Reset fields when dependencies change
    useEffect(() => {
        setVehicleId('');
    }, [selectedGolfCourseId]);

    useEffect(() => {
        setSubTasks([]);
    }, [system]);

    useEffect(() => {
        if (jobType !== 'PM') {
            setSystem('');
            setSubTasks([]);
        }
    }, [jobType]);

    const handleSubTaskChange = (task: string, isChecked: boolean) => {
        setSubTasks(prev => isChecked ? [...prev, task] : prev.filter(t => t !== task));
    };

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
    }, [selectedParts, repairActions]);

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

    const availableMWRs = React.useMemo(() => {
        if (!selectedGolfCourseId) return [];
        return jobs.filter(j =>
            j.type === 'PART_REQUEST' &&
            j.status === 'completed' &&
            j.golf_course_id === selectedGolfCourseId &&
            j.bplus_code
        );
    }, [jobs, selectedGolfCourseId]);

    const consumedByJobs = React.useMemo(() => {
        return jobs.filter(j =>
            (j.type === 'PM' || j.type === 'BM' || j.type === 'Recondition') &&
            j.partsNotes && j.partsNotes.includes('[ใช้จากใบเบิก:')
        );
    }, [jobs]);

    const getMwrFilteredParts = () => {
        if (selectedMWRs.length === 0) return [];

        const mwrPartsMap = new Map<string, CategorizedPart & { mwr_qty?: number; mwr_used?: number; mwr_remaining?: number }>();
        const allParts = Object.values(partsBySystem).flat();

        selectedMWRs.forEach(code => {
            const mwr = availableMWRs.find(j => j.bplus_code === code);
            if (mwr) {
                const hasMwrItems = (mwr as any).mwrVehicleItems && (mwr as any).mwrVehicleItems.length > 0;

                if (hasMwrItems) {
                    (mwr as any).mwrVehicleItems.forEach((p: any) => {
                        const systemPart = allParts.find(sp => sp.id.toString() === p.part_id.toString());
                        if (systemPart) {
                            const existing = mwrPartsMap.get(systemPart.id.toString());
                            const qty = parseInt(p.quantity || p.quantity_used || '0', 10);
                            if (existing) {
                                existing.mwr_qty = (existing.mwr_qty || 0) + qty;
                            } else {
                                mwrPartsMap.set(systemPart.id.toString(), { ...systemPart, mwr_qty: qty, mwr_used: 0, mwr_remaining: qty });
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
                                existing.mwr_qty = (existing.mwr_qty || 0) + qty;
                            } else {
                                mwrPartsMap.set(systemPart.id.toString(), { ...systemPart, mwr_qty: qty, mwr_used: 0, mwr_remaining: qty });
                            }
                        }
                    });
                }
            }
        });

        selectedMWRs.forEach(code => {
            const relatedJobs = consumedByJobs.filter(cj => cj.partsNotes?.includes(code));
            relatedJobs.forEach(rj => {
                rj.parts?.forEach(jp => {
                    const key = jp.part_id.toString();
                    const existing = mwrPartsMap.get(key);
                    if (existing) {
                        existing.mwr_used = (existing.mwr_used || 0) + jp.quantity_used;
                    }
                });
            });
        });

        mwrPartsMap.forEach((part) => {
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
        if (isSubmitting) return;

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

        const duplicateJob = jobs.find(job =>
            job.vehicle_id === selectedVehicle.id &&
            job.status === 'pending' &&
            job.type === jobType
        );

        if (duplicateJob) {
            const confirmCreate = confirm(`มีงาน ${jobType} สำหรับรถ ${selectedVehicle.vehicle_number} อยู่แล้ว\nต้องการสร้างงานใหม่หรือไม่?`);
            if (!confirmCreate) return;
        }

        // Open Summary Modal instead of immediate submission
        setShowSummaryModal(true);
    };

    const confirmSubmit = () => {
        try {
            setIsSubmitting(true); // เริ่มส่งงาน
            // สร้างงานใหม่ (ไม่ต้องสร้าง ID เอง ให้ API สร้างให้)
            const newJob: Omit<Job, 'id' | 'created_at' | 'updated_at'> = {
                user_id: user.id.toString(),
                userName: user.name,
                vehicle_id: selectedVehicle!.id,
                vehicle_number: selectedVehicle!.vehicle_number,
                golf_course_id: selectedVehicle!.golf_course_id,
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
                battery_serial: batterySerial,
                images: images,
                ...(jobType === 'BM' && bmCause && { bmCause }),
                ...(jobType === 'BM' && bmSymptom && { bmSymptom }),
                ...(jobType === 'BM' && repairActions.length > 0 && { repairActions }),
                ...(jobType === 'BM' && {
                    systems: Array.from(new Set([
                        ...bmSystems,
                        ...selectedParts.map(p => {
                            const entry = Object.entries(partsBySystem).find(([, parts]) => (parts as any[]).some(sp => sp.id === p.id));
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

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-28">
            <div className="max-w-4xl mx-auto px-4 pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        🏢 สร้างงานซ่อม - ส่วนกลาง
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">สามารถเลือกสนามและรถได้ทุกสนาม</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Vehicle Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
                        <SectionDivider icon={<Car size={18} />} title="ข้อมูลรถกอล์ฟ" color="blue" />
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                            <FormRow label="เลือกสนามกอล์ฟ" required id="golf-course">
                                <select
                                    id="golf-course"
                                    value={selectedGolfCourseId}
                                    onChange={e => setSelectedGolfCourseId(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all hover:bg-white dark:hover:bg-zinc-800"
                                >
                                    <option value="">-- เลือกสนามกอล์ฟ --</option>
                                    {golfCourses.map(course => (
                                        <option key={course.id} value={course.id}>{course.name}</option>
                                    ))}
                                </select>
                            </FormRow>

                            <FormRow label="ค้นหารถ" id="vehicle-search">
                                <div className="relative group">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                    <input
                                        id="vehicle-search"
                                        type="text"
                                        value={vehicleSearchTerm}
                                        onChange={e => setVehicleSearchTerm(e.target.value)}
                                        placeholder="พิมพ์เบอร์รถหรือซีเรียลเพื่อค้นหา..."
                                        disabled={!selectedGolfCourseId}
                                        className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-50"
                                    />
                                </div>
                            </FormRow>

                            <div className="sm:col-span-2">
                                <FormRow label="เลือกรถ" required id="vehicle-select">
                                    <select
                                        id="vehicle-select"
                                        value={vehicleId}
                                        onChange={e => setVehicleId(e.target.value)}
                                        required
                                        disabled={!selectedGolfCourseId}
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-50 font-semibold"
                                    >
                                        <option value="">-- {selectedGolfCourseId ? `เลือกรถ (${filteredVehicles.length} คัน)` : 'กรุณาเลือกสนามก่อน'} --</option>
                                        {filteredVehicles.map(v => (
                                            <option key={v.id} value={v.id}>เบอร์: {v.vehicle_number} (S/N: {v.serial_number})</option>
                                        ))}
                                    </select>
                                </FormRow>
                            </div>
                        </div>
                    </div>

                    {/* Battery Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
                        <SectionDivider icon={<Battery size={18} />} title="ข้อมูลแบตเตอรี่" color="emerald" />
                        <div className="p-6">
                            <FormRow label="ซีเรียลแบต" required id="battery-serial">
                                <input
                                    id="battery-serial"
                                    type="text"
                                    value={batterySerial}
                                    onChange={e => setBatterySerial(e.target.value)}
                                    placeholder="กรอกซีเรียลแบต หรือ 'ไม่มีสติ๊กเกอร์' หรือ 'หลุด'"
                                    required
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all hover:bg-white dark:hover:bg-zinc-800 font-mono"
                                />
                            </FormRow>
                        </div>
                    </div>

                    {/* Repair Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
                        <SectionDivider icon={<Cog size={18} />} title="รายละเอียดงานซ่อม" color="amber" />
                        <div className="p-6 space-y-6">
                            <FormRow label="ประเภทการบำรุงรักษา" required id="job-type">
                                <select
                                    id="job-type"
                                    value={jobType}
                                    onChange={e => setJobType(e.target.value as JobType)}
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all hover:bg-white dark:hover:bg-zinc-800 font-bold"
                                >
                                    <option value="BM">ซ่อมด่วน (BM)</option>
                                    <option value="PM">บำรุงรักษาเชิงป้องกัน (PM)</option>
                                    <option value="Recondition">ปรับสภาพ (Recondition)</option>
                                </select>
                            </FormRow>

                            {jobType === 'BM' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <FormRow label="สาเหตุของการเสีย" required>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {[
                                                { id: 'breakdown', label: 'เสีย / เครื่องขัดข้อง', icon: <AlertCircle size={20} />, color: 'red' },
                                                { id: 'accident', label: 'อุบัติเหตุ / ความเสียหาย', icon: <Wrench size={20} />, color: 'amber' }
                                            ].map((cause) => (
                                                <button
                                                    key={cause.id}
                                                    type="button"
                                                    onClick={() => setBmCause(cause.id as any)}
                                                    className={cn(
                                                        "flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-200 active:scale-[0.98]",
                                                        bmCause === cause.id
                                                            ? cause.color === 'red'
                                                                ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-2 ring-red-500/20"
                                                                : "border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/20"
                                                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                                    )}
                                                >
                                                    <span className={cn(bmCause === cause.id ? (cause.color === 'red' ? "text-red-500" : "text-amber-500") : "text-zinc-400")}>
                                                        {cause.icon}
                                                    </span>
                                                    <span className="font-semibold text-sm">{cause.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </FormRow>

                                    <FormRow label="อาการเสียเบื้องต้น" id="bm-symptom">
                                        <select
                                            id="bm-symptom"
                                            value={bmSymptom}
                                            onChange={e => setBmSymptom(e.target.value as BMSymptom)}
                                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all hover:bg-white dark:hover:bg-zinc-800"
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
                                                        "px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-[0.95]",
                                                        repairActions.includes(action.id as RepairAction)
                                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                                            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-indigo-500"
                                                    )}
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    </FormRow>

                                    {selectedParts.length === 0 && (
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
                                                            "px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-[0.95]",
                                                            bmSystems.includes(sys.id)
                                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                                                : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-indigo-500"
                                                        )}
                                                    >
                                                        {sys.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[10px] font-bold text-zinc-400 mt-2 uppercase tracking-tight">* กรณีไม่ได้เบิกอะไหล่ กรุณาระบุระบบที่เสีย</p>
                                        </FormRow>
                                    )}
                                </div>
                            )}

                            {jobType === 'PM' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <FormRow label="เลือกระบบที่ต้องการ PM" required id="pm-system">
                                        <select
                                            id="pm-system"
                                            value={system}
                                            onChange={e => setSystem(e.target.value)}
                                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all hover:bg-white dark:hover:bg-zinc-800 font-semibold"
                                        >
                                            <option value="">-- เลือกระบบ --</option>
                                            {MOCK_SYSTEMS.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </FormRow>
                                    {Object.keys(subTaskCategories).length > 0 && (
                                        <FormRow label="รายการงานย่อย">
                                            <div className="space-y-4">
                                                {Object.entries(subTaskCategories).map(([category, tasks]) => (
                                                    <div key={category} className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
                                                        <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">{getCategoryDisplayName(category)}</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(tasks as string[]).map((task: string) => (
                                                                <button
                                                                    key={task}
                                                                    type="button"
                                                                    onClick={() => handleSubTaskChange(task, !subTasks.includes(task))}
                                                                    className={cn(
                                                                        "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 border active:scale-[0.98]",
                                                                        subTasks.includes(task)
                                                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                                                            : "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-indigo-500"
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
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Parts Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
                        <SectionDivider icon={<Package size={18} />} title="อะไหล่และหมายเหตุ" color="violet" />
                        <div className="p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-violet-50/50 dark:bg-violet-500/5 rounded-2xl border border-violet-100 dark:border-violet-500/20">
                                <div className="flex items-center gap-3 text-violet-700 dark:text-violet-300">
                                    <Package size={20} strokeWidth={1.5} />
                                    <div>
                                        <p className="text-sm font-bold leading-tight">เลือกรายการอะไหล่</p>
                                        <p className="text-[11px] font-medium opacity-70">ค้นหาและเพิ่มอะไหล่ที่ต้องการใช้</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowPartsModal(true)}
                                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-violet-500/20 active:scale-[0.98]"
                                >
                                    <Search size={14} /> ค้นหาอะไหล่
                                </button>
                            </div>

                            {selectedParts.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1 mb-2">อะไหล่ที่เลือก ({selectedParts.length})</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {selectedParts.map(part => (
                                            <div key={part.id} className="flex items-center justify-between p-3.5 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 group hover:border-zinc-200 transition-all">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{part.part_number || 'NO CODE'}</span>
                                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{part.name}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200/50">
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePartQuantityChange(part.id, Math.max(1, part.quantity - 1))}
                                                            className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 rounded-md transition-colors text-zinc-600"
                                                        >-</button>
                                                        <input
                                                            type="number"
                                                            className="w-10 text-center bg-transparent text-sm font-bold focus:outline-none"
                                                            value={part.quantity}
                                                            onChange={(e) => handlePartQuantityChange(part.id, parseInt(e.target.value) || 1)}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePartQuantityChange(part.id, part.quantity + 1)}
                                                            className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 rounded-md transition-colors text-zinc-600"
                                                        >+</button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemovePart(part.id)}
                                                        className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <FormRow label="หมายเหตุอะไหล่เพิ่มเติม" id="parts-notes">
                                <textarea
                                    id="parts-notes"
                                    value={partsNotes}
                                    onChange={e => setPartsNotes(e.target.value)}
                                    placeholder="เช่น เปลี่ยนหลอดไฟหน้า, อัดจารบี..."
                                    className="w-full min-h-[80px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all hover:bg-white dark:hover:bg-zinc-800 resize-none"
                                />
                            </FormRow>

                            <FormRow label="หมายเหตุอื่นๆ" id="remarks">
                                <textarea
                                    id="remarks"
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                    placeholder="หมายเหตุเพิ่มเติมสำหรับการซ่อมครั้งนี้..."
                                    className="w-full min-h-[80px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all hover:bg-white dark:hover:bg-zinc-800 resize-none"
                                />
                            </FormRow>
                        </div>
                    </div>

                    {/* Images Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
                        <SectionDivider icon={<Camera size={18} />} title="แนบรูปภาพ" color="rose" />
                        <div className="p-6">
                            <ImageUpload
                                images={images}
                                onImagesChange={setImages}
                                maxImages={20}
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row justify-end gap-3 rounded-2xl">
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
            </div>

            {/* Parts Selection Modal */}
            {showPartsModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowPartsModal(false)}></div>

                    <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">เลือกอะไหล่</h3>
                                <p className="text-[11px] text-zinc-500 font-medium whitespace-nowrap">ค้นหาและเพิ่มอะไหล่</p>
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

                            {/* Mobile Category Dropdown */}
                            <div className="sm:hidden relative">
                                <select
                                    value={activePartsTab}
                                    onChange={(e) => setActivePartsTab(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                                >
                                    {[...Object.keys(partsBySystem), 'mwr'].map(tab => (
                                        <option key={tab} value={tab}>
                                            {getTabDisplayName(tab)}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                    <Cog size={16} />
                                </div>
                            </div>

                            {/* Desktop Category Tabs */}
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
                                            <p className="text-sm text-indigo-500/60 italic py-2 px-1">ไม่พบใบเบิกที่อนุมัติแล้วของสนามที่เลือก</p>
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
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowSummaryModal(false)}></div>
                    <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">ตรวจสอบข้อมูลการซ่อม</h3>
                                <p className="text-xs text-zinc-500 font-medium">กรุณาตรวจสอบข้อมูลก่อนยืนยันการบันทึก</p>
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
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{golfCourses.find(c => c.id === selectedGolfCourseId)?.name || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-zinc-500 font-medium text-xs uppercase">รหัสรถ</span>
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedVehicle.vehicle_number}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-zinc-500 font-medium text-xs uppercase">ประเภทงาน</span>
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{jobType === 'PM' ? 'บำรุงรักษาเชิงป้องกัน (PM)' : jobType === 'BM' ? 'ซ่อมด่วน (BM)' : 'ปรับสภาพ (Recondition)'}</p>
                                </div>
                                {jobType === 'BM' && (
                                    <div className="space-y-1">
                                        <span className="text-zinc-500 font-medium text-xs uppercase">สาเหตุหลัก</span>
                                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{bmCause === 'breakdown' ? 'เสีย / เครื่องขัดข้อง' : 'อุบัติเหตุ'}</p>
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

export default CentralCreateJobScreen;