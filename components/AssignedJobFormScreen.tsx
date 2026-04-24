'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, JobType, Vehicle, GolfCourse, MOCK_SYSTEMS, View, BMCause, RepairAction, BMSymptom } from '@/lib/data';
import { getPartsBySystem, PartsBySystem, CategorizedPart } from '@/lib/partsService';
import ImageUpload from './ImageUpload';
import { cn } from '@/lib/utils';
import { AlertCircle, Wrench, Settings, X, Search, Info, Plus, CheckCircle2, Battery, Cog, Package, Camera, FileText, ClipboardList } from 'lucide-react';

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
    jobs: Job[];
}

const AssignedJobFormScreen = ({ user, job, onJobUpdate, setView, vehicles, golfCourses, jobs }: AssignedJobFormScreenProps) => {
    // ข้อมูลรถและสนามจาก job ที่ได้รับมอบหมาย
    const assignedVehicle = vehicles.find(v => v.id === job.vehicle_id);
    const golfCourse = golfCourses.find(gc => gc.id === assignedVehicle?.golf_course_id);

    // State สำหรับข้อมูลอะไหล่จากระบบ stock
    const [partsBySystem, setPartsBySystem] = useState<PartsBySystem>({
        brake: [],
        steering: [],
        motor: [],
        electric: [],
        other: []
    });
    const [isLoadingParts, setIsLoadingParts] = useState(true);

    // ใช้ข้อมูลจาก job ที่ได้รับมอบหมาย
    const [jobType, setJobType] = useState<JobType>(job.type);
    const [system, setSystem] = useState(job.system);
    const [subTasks, setSubTasks] = useState<string[]>(job.subTasks || []);
    const [partsNotes, setPartsNotes] = useState(job.partsNotes || '');
    const [remarks, setRemarks] = useState(job.remarks || '');
    const [bmCause, setBmCause] = useState<BMCause | ''>(job.bmCause || '');
    const [bmSymptom, setBmSymptom] = useState<BMSymptom | ''>(job.bmSymptom || '');
    const [repairActions, setRepairActions] = useState<RepairAction[]>(job.repairActions || []);
    const [bmSystems, setBmSystems] = useState<string[]>(job.systems || []);
    const [batterySerial, setBatterySerial] = useState(job.battery_serial || assignedVehicle?.battery_serial || ''); 
    const [selectedParts, setSelectedParts] = useState<LocalSelectedPart[]>(() => {
        return job.parts?.map(part => ({
            id: part.part_id,
            name: part.part_name || 'ไม่ทราบชื่อ',
            quantity: part.quantity_used,
            unit: 'ชิ้น'
        })) || [];
    });
    const [images, setImages] = useState<string[]>(job.images || []);
    const [showPartsModal, setShowPartsModal] = useState(false);
    const [activePartsTab, setActivePartsTab] = useState('brake');
    const [partsSearchTerm, setPartsSearchTerm] = useState('');
    const [additionalSubTasks, setAdditionalSubTasks] = useState<string[]>([]);
    const [newSubTask, setNewSubTask] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedMWRs, setSelectedMWRs] = useState<string[]>([]);

    // โหลดข้อมูลอะไหล่จากระบบ stock
    useEffect(() => {
        const loadParts = async () => {
            setIsLoadingParts(true);
            try {
                const parts = await getPartsBySystem();
                setPartsBySystem(parts);

                setSelectedParts(prev => prev.map(selectedPart => {
                    const allParts = Object.values(parts).flat();
                    const partInfo = allParts.find(p => p.id.toString() === selectedPart.id.toString());
                    return {
                        ...selectedPart,
                        unit: partInfo?.unit || selectedPart.unit
                    };
                }));
            } catch (error) {
                console.error('Error loading parts:', error);
            } finally {
                setIsLoadingParts(false);
            }
        };

        loadParts();
    }, []);



    const getTabDisplayName = (tab: string) => {
        const tabNames: Record<string, string> = {
            'brake': 'ระบบเบรก',
            'steering': 'ระบบบังคับเลี้ยว',
            'motor': 'ระบบมอเตอร์',
            'electric': 'ระบบไฟฟ้า',
            'other': 'อื่นๆ',
            'mwr': 'รายการในใบเบิก'
        };
        return tabNames[tab] || tab;
    };

    const handleCategorySelect = (tab: string) => {
        setActivePartsTab(tab);
    };

    const getFilteredParts = () => {
        const currentParts = partsBySystem[activePartsTab as keyof PartsBySystem] || [];
        if (!partsSearchTerm.trim()) {
            return currentParts;
        }

        const allParts = Object.values(partsBySystem).flat();
        const searchTerm = partsSearchTerm.toLowerCase().trim();
        return allParts.filter((part: CategorizedPart) =>
            part.name.toLowerCase().includes(searchTerm) ||
            (part.part_number && part.part_number.toLowerCase().includes(searchTerm))
        );
    };

    const availableMWRs = React.useMemo(() => {
        return jobs.filter(j => 
            j.type === 'PART_REQUEST' && 
            j.status === 'completed' && 
            j.golf_course_id === job.golf_course_id &&
            j.bplus_code
        );
    }, [jobs, job.golf_course_id]);

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

    const getMaxAllowedQty = (partId: string | number) => {
        if (selectedMWRs.length === 0) return Infinity;
        const mwrParts = getMwrFilteredParts();
        const mwrPart = mwrParts.find(p => p.id === partId);
        return mwrPart && (mwrPart as any).mwr_remaining !== undefined ? (mwrPart as any).mwr_remaining : Infinity;
    };

    const handleSubTaskChange = (task: string, isChecked: boolean) => {
        setSubTasks(prev => isChecked ? [...prev, task] : prev.filter(t => t !== task));
    }

    const toggleRepairAction = (action: RepairAction) => {
        setRepairActions(prev => prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]);
    };

    const toggleBmSystem = (sys: string) => {
        setBmSystems(prev => prev.includes(sys) ? prev.filter(s => s !== sys) : [...prev, sys]);
    };

    useEffect(() => {
        if (selectedParts.length > 0) {
            if (!repairActions.includes('replace')) {
                setRepairActions(prev => [...prev, 'replace']);
            }
        } else {
            setRepairActions(prev => prev.filter(a => a !== 'replace'));
        }
    }, [selectedParts]);

    const handleAddSubTask = () => {
        if (newSubTask.trim() && !additionalSubTasks.includes(newSubTask.trim())) {
            setAdditionalSubTasks(prev => [...prev, newSubTask.trim()]);
            setNewSubTask('');
        }
    };

    const handleRemoveAdditionalSubTask = (taskToRemove: string) => {
        setAdditionalSubTasks(prev => prev.filter(task => task !== taskToRemove));
    };

    const handlePartSelection = (part: CategorizedPart & { mwr_qty?: number }) => {
        const existingPart = selectedParts.find(p => p.id === part.id);
        const maxAllowed = getMaxAllowedQty(part.id);
        
        if (existingPart) {
            const newQty = existingPart.quantity + 1;
            if (newQty > maxAllowed) {
                alert(`ไม่สามารถระบุจำนวนเกินกว่าที่เบิกมาได้ (สูงสุด ${maxAllowed})`);
                return;
            }
            setSelectedParts(prev => prev.map(p =>
                p.id === part.id ? { ...p, quantity: newQty } : p
            ));
        } else {
            if (1 > maxAllowed) {
                alert(`ไม่มีจำนวนอะไหล่นี้คงเหลือในใบเบิกที่เลือก`);
                return;
            }
            setSelectedParts(prev => [...prev, { ...part, quantity: 1 }]);
        }
    };

    const handleRemovePart = (partId: string | number) => {
        setSelectedParts(prev => prev.filter(p => p.id !== partId));
    };

    const handlePartQuantityChange = (partId: string | number, quantity: number) => {
        if (quantity <= 0) {
            setSelectedParts(prev => prev.filter(p => p.id !== partId));
            return;
        }
        
        const maxAllowed = getMaxAllowedQty(partId);
        if (quantity > maxAllowed) {
            alert(`ไม่สามารถระบุจำนวนเกินกว่าที่เบิกมาได้ (สูงสุด ${maxAllowed})`);
            quantity = maxAllowed;
        }

        setSelectedParts(prev => prev.map(p =>
            p.id === partId ? { ...p, quantity } : p
        ));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        const allSubTasks = [...subTasks, ...additionalSubTasks];
        if (jobType === 'PM' && allSubTasks.length === 0) {
            alert('กรุณาเลือกงานย่อยอย่างน้อย 1 รายการ');
            return;
        }

        if (jobType === 'BM' && !bmCause) {
            alert('กรุณาเลือกสาเหตุของการเสีย');
            return;
        }

        try {
            setIsSubmitting(true);
            const updatedJob: Job = {
                ...job,
                type: jobType,
                status: 'pending',
                vehicle_id: job.vehicle_id,
                vehicle_number: job.vehicle_number || assignedVehicle?.vehicle_number || '',
                golf_course_id: job.golf_course_id || assignedVehicle?.golf_course_id || '',
                user_id: job.user_id,
                userName: job.userName,
                system: system,
                subTasks: jobType === 'PM' ? allSubTasks : [],
                parts: selectedParts.map(part => ({
                    part_id: part.id.toString(),
                    quantity_used: part.quantity,
                    part_name: part.name
                })),
                partsNotes: partsNotes,
                remarks: remarks,
                battery_serial: batterySerial,
                images: images,
                updated_at: new Date().toISOString(),
                ...(jobType === 'BM' && bmCause && { bmCause }),
                ...(jobType === 'BM' && bmSymptom && { bmSymptom }),
                ...(jobType === 'BM' && repairActions.length > 0 && { repairActions }),
                ...(jobType === 'BM' && { systems: Array.from(new Set([
                    ...bmSystems,
                    ...selectedParts.map(p => {
                        const entry = Object.entries(partsBySystem).find(([_, parts]) => (parts as any[]).some(sp => sp.id === p.id));
                        return entry ? entry[0] : '';
                    }).filter(s => s !== '')
                ]))})
            };

            onJobUpdate(updatedJob);

        } catch (error) {
            setIsSubmitting(false);
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

    useEffect(() => {
        if (jobType !== 'PM') {
            setAdditionalSubTasks([]);
        }
    }, [jobType]);

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen pb-20 text-zinc-900 dark:text-zinc-50">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/20">
                            <Settings size={20} strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight">บันทึกผลการดำเนินงาน</h2>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">กรอกรายละเอียดเพื่อปิดงานที่ได้รับมอบหมาย</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setView('dashboard')}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all active:scale-95 text-zinc-400"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                {/* Vehicle Quick Info Card */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
                    <div className="space-y-1.5">
                        <span className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400">รถหมายเลข</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{jobInfo.vehicleNumber}</span>
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[9px] font-mono text-zinc-500">{jobInfo.serialNumber}</span>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <span className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400">สนาม</span>
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{jobInfo.courseName}</span>
                    </div>
                    <div className="space-y-1.5">
                        <span className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400">มอบหมายโดย</span>
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{jobInfo.assignedBy}</span>
                    </div>
                    <div className="space-y-1.5">
                        <span className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400">ประเภทงาน</span>
                        <span className={cn(
                            "inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            jobType === 'BM' ? "bg-red-50 text-red-600 dark:bg-red-500/10" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
                        )}>
                            {jobType === 'PM' ? 'Preventive' : jobType === 'BM' ? 'Breakdown' : 'Recondition'}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Group */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2">
                            <Battery size={16} className="text-emerald-500" strokeWidth={2} />
                            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">ข้อมูลพื้นฐาน</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ซีเรียลแบตเตอรี่ <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={batterySerial}
                                    onChange={e => setBatterySerial(e.target.value)}
                                    placeholder="กรอกซีเรียลแบต หรือ 'ไม่มีสติ๊กเกอร์' หรือ 'หลุด'"
                                    required
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Job Details Section */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2">
                            <Cog size={16} className="text-amber-500" strokeWidth={2} />
                            <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">รายละเอียดการซ่อม</h3>
                        </div>
                        <div className="p-6 space-y-8">
                            {jobType === 'BM' && (
                                <>
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">สาเหตุของการเสีย *</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setBmCause('breakdown')}
                                                className={cn(
                                                    "flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-200 active:scale-[0.98]",
                                                    bmCause === 'breakdown' 
                                                        ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-2 ring-red-500/20" 
                                                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                                                )}
                                            >
                                                <AlertCircle size={18} className={bmCause === 'breakdown' ? "text-red-500" : "text-zinc-400"} />
                                                <span className="font-semibold text-sm">เสีย / เครื่องขัดข้อง</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBmCause('accident')}
                                                className={cn(
                                                    "flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-200 active:scale-[0.98]",
                                                    bmCause === 'accident' 
                                                        ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/20" 
                                                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                                                )}
                                            >
                                                <Wrench size={18} className={bmCause === 'accident' ? "text-amber-500" : "text-zinc-400"} />
                                                <span className="font-semibold text-sm">อุบัติเหตุ / ความเสียหาย</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">อาการเสียเบื้องต้น</label>
                                        <select 
                                            value={bmSymptom} 
                                            onChange={e => setBmSymptom(e.target.value as BMSymptom)}
                                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        >
                                            <option value="">-- ระบุอาการเสีย --</option>
                                            <option value="wont_start">สตาร์ทไม่ติด / วิ่งไม่ได้</option>
                                            <option value="strange_noise">มีเสียงดังผิดปกติ</option>
                                            <option value="performance_drop">ไม่มีกำลัง / แบตหมดเร็ว</option>
                                            <option value="control_issue">บังคับเลี้ยวไม่ได้ / เบรกไม่อยู่</option>
                                            <option value="physical_damage">แตกหัก / เสียรูปจากภายนอก</option>
                                            <option value="other">อื่นๆ</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">วิธีแก้ไข (Action Taken)</label>
                                        <div className="flex flex-wrap gap-2">
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
                                                            : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-indigo-500"
                                                    )}
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedParts.length === 0 && (
                                        <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">ระบุระบบที่เสีย (กรณีไม่มีอะไหล่)</label>
                                            <div className="flex flex-wrap gap-2">
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
                                                                : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-indigo-500"
                                                        )}
                                                    >
                                                        {sys.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {jobType === 'PM' && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">ระบบที่กำลังบำรุงรักษา</label>
                                        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                            {system === 'brake' ? '🔘 ระบบเบรก' : system === 'steering' ? '🏎️ ระบบบังคับเลี้ยว' : system === 'motor' ? '⚡ ระบบมอเตอร์' : system === 'electric' ? '🔌 ระบบไฟฟ้า' : system}
                                        </div>
                                    </div>

                                    {Object.keys(subTaskCategories).length > 0 && (
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">รายการงานที่แนะนำ</label>
                                            <div className="grid grid-cols-1 gap-6">
                                                {Object.entries(subTaskCategories).map(([category, tasks]) => (
                                                    <div key={category} className="space-y-3">
                                                        <h4 className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider px-2">{getCategoryDisplayName(category)}</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(tasks as string[]).map((task: string) => (
                                                                <button
                                                                    key={task}
                                                                    type="button"
                                                                    onClick={() => handleSubTaskChange(task, !subTasks.includes(task))}
                                                                    className={cn(
                                                                        "px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200 active:scale-[0.95]",
                                                                        subTasks.includes(task)
                                                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                                                            : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-indigo-500"
                                                                    )}
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
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Subtasks (PM Only) */}
                    {jobType === 'PM' && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2">
                                <ClipboardList size={16} className="text-blue-500" strokeWidth={2} />
                                <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">งานย่อยเพิ่มเติม</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSubTask}
                                        onChange={e => setNewSubTask(e.target.value)}
                                        placeholder="กรอกงานย่อยเพิ่มเติม..."
                                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubTask())}
                                        className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleAddSubTask}
                                        className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl px-6 py-2.5 text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
                                    >
                                        เพิ่ม
                                    </button>
                                </div>

                                {additionalSubTasks.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {additionalSubTasks.map((task, index) => (
                                            <div key={`subtask-${index}`} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                                <span className="text-xs font-medium">{task}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAdditionalSubTask(task)}
                                                    className="text-zinc-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Parts & Notes Section */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package size={16} className="text-violet-500" strokeWidth={2} />
                                <h3 className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">อะไหล่และหมายเหตุ</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPartsModal(true)}
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                                <Plus size={14} /> เลือกอะไหล่
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {selectedParts.length > 0 && (
                                <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 font-bold text-[10px] uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3">ชื่ออะไหล่</th>
                                                <th className="px-4 py-3 text-center">จำนวน</th>
                                                <th className="px-4 py-3 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {selectedParts.map((part) => (
                                                <tr key={part.id}>
                                                    <td className="px-4 py-4">
                                                        <div className="font-semibold">{part.name}</div>
                                                        <div className="text-[10px] text-zinc-400">({part.unit})</div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center justify-center gap-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 w-fit mx-auto border border-zinc-200/50 dark:border-zinc-700/50">
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePartQuantityChange(part.id, part.quantity - 1)}
                                                                className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-zinc-900 text-zinc-500 shadow-sm hover:text-zinc-900 transition-all"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-6 text-center font-bold">{part.quantity}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePartQuantityChange(part.id, part.quantity + 1)}
                                                                className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-zinc-900 text-zinc-500 shadow-sm hover:text-zinc-900 transition-all"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemovePart(part.id)}
                                                            className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">หมายเหตุอะไหล่เพิ่มเติม</label>
                                    <textarea 
                                        value={partsNotes} 
                                        onChange={e => setPartsNotes(e.target.value)} 
                                        placeholder="เช่น เบิกผ่านใบเบิกเลขที่..., หรือเปลี่ยนหลอดไฟหน้า"
                                        className="w-full min-h-[100px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">หมายเหตุงานซ่อม</label>
                                    <textarea 
                                        value={remarks} 
                                        onChange={e => setRemarks(e.target.value)}
                                        className="w-full min-h-[100px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Images Section */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2">
                            <Camera size={16} className="text-rose-500" strokeWidth={2} />
                            <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">แนบรูปภาพผลการซ่อม</h3>
                        </div>
                        <div className="p-6">
                            <ImageUpload
                                images={images}
                                onImagesChange={setImages}
                                maxImages={20}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setView('dashboard')}
                            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl px-6 py-4 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.99] transition-all"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={cn(
                                "flex-[2] bg-indigo-600 text-white rounded-xl px-6 py-4 text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 active:scale-[0.99] transition-all flex items-center justify-center gap-2",
                                isSubmitting && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'ส่งผลการดำเนินงาน'}
                        </button>
                    </div>
                </form>
            </div>

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
                                    className="w-full pl-10 pr-10 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
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
                                    onChange={(e) => handleCategorySelect(e.target.value)}
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
                                        onClick={() => handleCategorySelect(tab)}
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
                                            <p className="text-sm text-indigo-500/60 italic py-2 px-1">ไม่พบใบเบิกที่สามารถใช้งานได้สำหรับสนามนี้</p>
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
                                                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto">
                                                    <Info size={24} strokeWidth={1.5} />
                                                </div>
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
        </div>
    );
};

export default AssignedJobFormScreen;
