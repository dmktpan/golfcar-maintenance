'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Job, GolfCourse, Vehicle } from '@/lib/data';
import { getPartsBySystem, PartsBySystem, CategorizedPart } from '@/lib/partsService';

interface CreatePartRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onJobCreate: (newJob: Job) => void;
    golfCourses: GolfCourse[];
    vehicles: Vehicle[];
    requestMode?: 'repair' | 'spare';
}

interface VehiclePartEntry {
    vehicle_id: string;
    vehicle_number: string;
    serial_number: string;
    vehicle_type: string;
    part_id: string;
    part_name: string;
    part_number?: string;
    quantity: number;
}

const CreatePartRequestModal = ({ isOpen, onClose, user, onJobCreate, golfCourses, vehicles, requestMode = 'repair' }: CreatePartRequestModalProps) => {
    const isSpareMode = requestMode === 'spare';
    // Step control: 'info' -> 'vehicles' (repair only) -> 'parts' -> 'preview'
    const [step, setStep] = useState<'info' | 'vehicles' | 'parts' | 'preview'>('info');

    // Step 1: Request Info
    const [destinationCourseId, setDestinationCourseId] = useState<string>(user.golf_course_id || '');
    const [requestReason, setRequestReason] = useState('');
    const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'urgent' | 'critical'>('normal');
    const [partsNotes, setPartsNotes] = useState('');

    // Step 2: Vehicle Selection
    const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set());
    const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');

    // Step 3: Parts Selection (per vehicle for repair, flat list for spare)
    const [activeVehicleId, setActiveVehicleId] = useState<string>('');
    const [activeTab, setActiveTab] = useState('brake');
    const [partsSearchTerm, setPartsSearchTerm] = useState('');
    const [vehiclePartEntries, setVehiclePartEntries] = useState<VehiclePartEntry[]>([]);
    // Spare mode: simple parts list (no vehicle)
    const [spareSelectedParts, setSpareSelectedParts] = useState<{ part_id: string; part_name: string; part_number?: string; unit: string; quantity: number }[]>([]);

    // Parts data
    const [partsBySystem, setPartsBySystem] = useState<PartsBySystem>({
        brake: [], steering: [], motor: [], electric: [], other: []
    });
    const [isLoadingParts, setIsLoadingParts] = useState(true);

    // Submit state
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Print ref
    const printRef = useRef<HTMLDivElement>(null);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            loadParts();
            setStep('info');
            setDestinationCourseId(user.golf_course_id || '');
            setRequestReason('');
            setUrgencyLevel('normal');
            setPartsNotes('');
            setSelectedVehicleIds(new Set());
            setVehicleSearchTerm('');
            setActiveVehicleId('');
            setVehiclePartEntries([]);
            setSpareSelectedParts([]);
            setPartsSearchTerm('');
        }
    }, [isOpen, user.golf_course_id]);

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

    if (!isOpen) return null;

    // === Helpers ===
    const getDestinationCourseName = () => {
        const course = golfCourses.find(gc => gc.id === destinationCourseId);
        return course?.name || 'ไม่ระบุ';
    };

    const getUrgencyLabel = (level: string) => {
        const labels: Record<string, string> = {
            'normal': 'ปกติ', 'urgent': 'เร่งด่วน', 'critical': 'เร่งด่วนมาก'
        };
        return labels[level] || level;
    };

    const getTabDisplayName = (tab: string) => {
        const tabNames: Record<string, string> = {
            'brake': 'ระบบเบรก', 'steering': 'ระบบบังคับเลี้ยว',
            'motor': 'ระบบมอเตอร์/เพื่อขับ', 'electric': 'ระบบไฟฟ้า', 'other': 'อื่นๆ'
        };
        return tabNames[tab] || tab;
    };

    // Get vehicles for selected course
    const courseVehicles = vehicles.filter(v => v.golf_course_id === destinationCourseId && v.status === 'active');

    const filteredCourseVehicles = vehicleSearchTerm.trim()
        ? courseVehicles.filter(v =>
            v.vehicle_number.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
            v.serial_number.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
            (v.model || '').toLowerCase().includes(vehicleSearchTerm.toLowerCase())
        )
        : courseVehicles;

    const selectedVehicles = courseVehicles.filter(v => selectedVehicleIds.has(v.id));

    const toggleVehicle = (vehicleId: string) => {
        setSelectedVehicleIds(prev => {
            const next = new Set(prev);
            if (next.has(vehicleId)) {
                next.delete(vehicleId);
                // Remove parts associated with this vehicle
                setVehiclePartEntries(entries => entries.filter(e => e.vehicle_id !== vehicleId));
            } else {
                next.add(vehicleId);
            }
            return next;
        });
    };

    // Parts filtering
    const getFilteredParts = () => {
        const currentParts = partsBySystem[activeTab as keyof PartsBySystem] || [];
        if (!partsSearchTerm.trim()) return currentParts;
        const term = partsSearchTerm.toLowerCase().trim();
        const allParts = Object.values(partsBySystem).flat();
        return allParts.filter(p =>
            p.name.toLowerCase().includes(term) ||
            (p.part_number && p.part_number.toLowerCase().includes(term))
        );
    };

    // Add/remove part for active vehicle
    const handlePartToggle = (part: CategorizedPart) => {
        if (isSpareMode) {
            // Spare mode: simple flat list
            setSpareSelectedParts(prev => {
                const exists = prev.find(p => p.part_id === part.id.toString());
                if (exists) {
                    return prev.filter(p => p.part_id !== part.id.toString());
                }
                return [...prev, {
                    part_id: part.id.toString(),
                    part_name: part.name,
                    part_number: part.part_number,
                    unit: part.unit,
                    quantity: 1
                }];
            });
            return;
        }
        // Repair mode: per-vehicle
        if (!activeVehicleId) return;
        const vehicle = selectedVehicles.find(v => v.id === activeVehicleId);
        if (!vehicle) return;

        setVehiclePartEntries(prev => {
            const exists = prev.find(e => e.vehicle_id === activeVehicleId && e.part_id === part.id.toString());
            if (exists) {
                return prev.filter(e => !(e.vehicle_id === activeVehicleId && e.part_id === part.id.toString()));
            }
            return [...prev, {
                vehicle_id: activeVehicleId,
                vehicle_number: vehicle.vehicle_number,
                serial_number: vehicle.serial_number,
                vehicle_type: `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || '-',
                part_id: part.id.toString(),
                part_name: part.name,
                part_number: part.part_number,
                quantity: 1
            }];
        });
    };

    const handlePartQuantity = (vehicleId: string, partId: string, delta: number) => {
        if (isSpareMode) {
            setSpareSelectedParts(prev => prev.map(p =>
                p.part_id === partId ? { ...p, quantity: Math.max(1, p.quantity + delta) } : p
            ));
            return;
        }
        setVehiclePartEntries(prev => prev.map(e =>
            (e.vehicle_id === vehicleId && e.part_id === partId)
                ? { ...e, quantity: Math.max(1, e.quantity + delta) }
                : e
        ));
    };

    const handleRemoveEntry = (vehicleId: string, partId: string) => {
        if (isSpareMode) {
            setSpareSelectedParts(prev => prev.filter(p => p.part_id !== partId));
            return;
        }
        setVehiclePartEntries(prev => prev.filter(e => !(e.vehicle_id === vehicleId && e.part_id === partId)));
    };

    const isPartSelectedForVehicle = (vehicleId: string, partId: string | number) =>
        vehiclePartEntries.some(e => e.vehicle_id === vehicleId && e.part_id === partId.toString());

    const getPartsForVehicle = (vehicleId: string) =>
        vehiclePartEntries.filter(e => e.vehicle_id === vehicleId);

    // === Validation ===
    const validateStep = (s: string): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];
        if (s === 'info') {
            if (!destinationCourseId) errors.push('กรุณาเลือกสนาม');
            if (!requestReason.trim()) errors.push('กรุณาระบุเหตุผลในการเบิก');
        }
        if (s === 'vehicles') {
            if (selectedVehicleIds.size === 0) errors.push('กรุณาเลือกรถอย่างน้อย 1 คัน');
        }
        if (s === 'parts') {
            if (isSpareMode) {
                if (spareSelectedParts.length === 0) errors.push('กรุณาเลือกอะไหล่อย่างน้อย 1 รายการ');
            } else {
                if (vehiclePartEntries.length === 0) errors.push('กรุณาเลือกอะไหล่อย่างน้อย 1 รายการ');
            }
        }
        return { isValid: errors.length === 0, errors };
    };

    const handleNextStep = () => {
        const { isValid, errors } = validateStep(step);
        if (!isValid) {
            alert('ข้อมูลไม่ครบถ้วน:\n' + errors.map((e, i) => `${i + 1}. ${e}`).join('\n'));
            return;
        }
        if (step === 'info') {
            if (isSpareMode) {
                // spare mode: skip vehicle selection
                setStep('parts');
            } else {
                setStep('vehicles');
            }
        } else if (step === 'vehicles') {
            // Auto-select first vehicle as active
            const firstId = Array.from(selectedVehicleIds)[0];
            if (firstId) setActiveVehicleId(firstId);
            setStep('parts');
        } else if (step === 'parts') {
            setStep('preview');
        }
    };

    const handlePrevStep = () => {
        if (step === 'vehicles') setStep('info');
        else if (step === 'parts') setStep(isSpareMode ? 'info' : 'vehicles');
        else if (step === 'preview') setStep('parts');
    };

    // === Submit ===
    const handleSubmit = async () => {
        const hasItems = isSpareMode ? spareSelectedParts.length > 0 : vehiclePartEntries.length > 0;
        if (!hasItems) {
            alert('ไม่มีรายการอะไหล่');
            return;
        }

        setIsSubmitting(true);
        try {
            // Aggregate parts for stock logic (sum by part_id)
            const partAgg: Record<string, { part_id: string; part_name: string; quantity_used: number }> = {};
            for (const entry of vehiclePartEntries) {
                if (partAgg[entry.part_id]) {
                    partAgg[entry.part_id].quantity_used += entry.quantity;
                } else {
                    partAgg[entry.part_id] = {
                        part_id: entry.part_id,
                        part_name: entry.part_name,
                        quantity_used: entry.quantity
                    };
                }
            }

            const newJob: any = {
                user_id: user.id.toString(),
                userName: user.name,
                vehicle_id: undefined,
                vehicle_number: isSpareMode ? 'สแปร์' : `${selectedVehicleIds.size} คัน`,
                golf_course_id: destinationCourseId,
                type: 'PART_REQUEST',
                status: 'pending',
                parts: isSpareMode
                    ? spareSelectedParts.map(p => ({ part_id: p.part_id, part_name: p.part_name, quantity_used: p.quantity }))
                    : Object.values(partAgg),
                system: isSpareMode ? 'spare_request' : 'part_request',
                subTasks: [],
                partsNotes: partsNotes,
                remarks: `[${isSpareMode ? 'สแปร์' : getUrgencyLabel(urgencyLevel)}] เหตุผล: ${requestReason}`,
                images: [],
                battery_serial: undefined,
                mwrVehicleItems: isSpareMode ? [] : vehiclePartEntries.map(e => ({
                    vehicle_id: e.vehicle_id,
                    vehicle_number: e.vehicle_number,
                    serial_number: e.serial_number,
                    vehicle_type: e.vehicle_type,
                    part_id: e.part_id,
                    part_name: e.part_name,
                    part_number: e.part_number,
                    quantity: e.quantity
                }))
            };

            await onJobCreate(newJob as Job);
            onClose();
        } catch (error) {
            console.error('Error creating request:', error);
            alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
        } finally {
            setIsSubmitting(false);
        }
    };

    // === Print ===
    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) { alert('กรุณาอนุญาต popup เพื่อพิมพ์เอกสาร'); return; }
        const styles = `
            <style>
                @page { size: A4; margin: 15mm; }
                body { font-family: 'Sarabun', 'TH SarabunPSK', sans-serif; margin: 0; padding: 20px; }
                .req-form { max-width: 210mm; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 15px; margin-bottom: 20px; }
                .header h1 { font-size: 24px; margin: 0 0 5px 0; color: #1e293b; }
                .header p { font-size: 12px; margin: 0; color: #64748b; }
                .info-row { display: flex; gap: 2rem; margin-bottom: 0.5rem; font-size: 14px; }
                .info-label { color: #64748b; min-width: 120px; }
                .info-value { color: #1e293b; font-weight: 600; }
                table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
                th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 13px; }
                th { background: #1e3a5f; color: white; text-align: center; font-weight: 600; }
                td { color: #334155; }
                tr:nth-child(even) { background: #f8fafc; }
                .sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 3rem; }
                .sig-box { text-align: center; }
                .sig-line { height: 50px; border-bottom: 1px solid #334155; margin-bottom: 8px; }
                .sig-title { font-weight: bold; font-size: 14px; }
                .sig-date { font-size: 12px; color: #64748b; }
                .reason-box { background: #fef3c7; padding: 10px 14px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 1rem; }
            </style>`;
        printWindow.document.write(`<!DOCTYPE html><html><head><title>ใบเบิกอะไหล่ - ${new Date().toLocaleDateString('th-TH')}</title>${styles}</head><body>${printContent.innerHTML}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 250);
    };

    const currentDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const currentTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const totalItems = isSpareMode
        ? spareSelectedParts.reduce((sum, p) => sum + p.quantity, 0)
        : vehiclePartEntries.reduce((sum, e) => sum + e.quantity, 0);
    const displayedParts = getFilteredParts();

    // === Step Indicator ===
    const allSteps = [
        { key: 'info', label: 'ข้อมูลเบิก', icon: '📋' },
        ...(!isSpareMode ? [{ key: 'vehicles', label: 'เลือกรถ', icon: '🚗' }] : []),
        { key: 'parts', label: 'เลือกอะไหล่', icon: '🔧' },
        { key: 'preview', label: 'ตัวอย่างใบเบิก', icon: '📄' }
    ];
    const steps = allSteps;
    const stepIndex = steps.findIndex(s => s.key === step);

    // ============== RENDER ==============
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '1rem'
        }}>
            <div style={{
                background: 'white', borderRadius: '1rem', width: '100%',
                maxWidth: step === 'preview' ? '900px' : '850px', maxHeight: '92vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
            }}>
                {/* ===== HEADER ===== */}
                <div style={{
                    padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    borderRadius: '1rem 1rem 0 0'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white' }}>{isSpareMode ? '📦 เบิกสแปร์ (Spare Request)' : '🔧 เบิกซ่อม (Repair Request)'}</h3>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.2)', border: 'none', fontSize: '1.25rem',
                        cursor: 'pointer', color: 'white', width: '32px', height: '32px', borderRadius: '50%'
                    }}>×</button>
                </div>

                {/* ===== STEP INDICATOR ===== */}
                <div style={{
                    display: 'flex', gap: '0.25rem', padding: '0.75rem 1.5rem',
                    background: '#f8fafc', borderBottom: '1px solid #e2e8f0'
                }}>
                    {steps.map((s, i) => (
                        <div key={s.key} style={{
                            flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                            background: i === stepIndex ? '#1e40af' : i < stepIndex ? '#dcfce7' : '#f1f5f9',
                            color: i === stepIndex ? 'white' : i < stepIndex ? '#166534' : '#64748b',
                            fontSize: '0.8rem', fontWeight: i === stepIndex ? 'bold' : 'normal',
                            transition: 'all 0.2s'
                        }}>
                            <span>{i < stepIndex ? '✓' : s.icon}</span>
                            <span style={{ display: i === stepIndex ? 'inline' : 'none' }}>{s.label}</span>
                            <span style={{ display: i !== stepIndex ? 'inline' : 'none', fontSize: '0.7rem' }}>{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* ===== BODY ===== */}
                <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

                    {/* ========== STEP 1: INFO ========== */}
                    {step === 'info' && (
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600', fontSize: '0.875rem', color: '#1e293b' }}>
                                        📍 สนามที่ต้องการเบิก *
                                    </label>
                                    <select value={destinationCourseId} onChange={(e) => setDestinationCourseId(e.target.value)}
                                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', background: 'white', fontSize: '0.875rem' }}>
                                        <option value="">-- เลือกสนาม --</option>
                                        {golfCourses.map(gc => (<option key={gc.id} value={gc.id}>{gc.name}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600', fontSize: '0.875rem', color: '#1e293b' }}>
                                        ⚡ ความเร่งด่วน
                                    </label>
                                    <select value={urgencyLevel} onChange={(e) => setUrgencyLevel(e.target.value as any)}
                                        style={{
                                            width: '100%', padding: '0.625rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem',
                                            background: urgencyLevel === 'critical' ? '#fecaca' : urgencyLevel === 'urgent' ? '#fed7aa' : 'white',
                                            fontWeight: urgencyLevel !== 'normal' ? 'bold' : 'normal', fontSize: '0.875rem'
                                        }}>
                                        <option value="normal">ปกติ</option>
                                        <option value="urgent">⚠️ เร่งด่วน</option>
                                        <option value="critical">🚨 เร่งด่วนมาก</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600', fontSize: '0.875rem', color: '#1e293b' }}>
                                    📝 เหตุผลในการเบิก *
                                </label>
                                <textarea value={requestReason} onChange={(e) => setRequestReason(e.target.value)}
                                    placeholder="เช่น ซ่อมบำรุงประจำเดือน / รถเบอร์ 12 เบรกเสีย"
                                    rows={3}
                                    style={{ width: '100%', padding: '0.625rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'vertical' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem', color: '#64748b' }}>
                                    💬 หมายเหตุเพิ่มเติม (ถ้ามี)
                                </label>
                                <input type="text" value={partsNotes} onChange={(e) => setPartsNotes(e.target.value)}
                                    placeholder="ข้อมูลอื่นๆ ที่ต้องการแจ้ง..."
                                    style={{ width: '100%', padding: '0.625rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                            </div>
                        </div>
                    )}

                    {/* ========== STEP 2: VEHICLES ========== */}
                    {step === 'vehicles' && (
                        <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>
                                    🚗 เลือกรถที่ต้องการเบิกอะไหล่ — {getDestinationCourseName()}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: '600' }}>
                                    เลือกแล้ว {selectedVehicleIds.size} คัน
                                </span>
                            </div>
                            <input type="text" value={vehicleSearchTerm} onChange={(e) => setVehicleSearchTerm(e.target.value)}
                                placeholder="🔍 ค้นหาเบอร์รถ, Serial, รุ่น..."
                                style={{ width: '100%', padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '0.75rem' }} />

                            {courseVehicles.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                    <span style={{ fontSize: '2rem' }}>🚫</span>
                                    <p>ไม่มีรถในสนามที่เลือก</p>
                                </div>
                            ) : (
                                <div style={{ flex: 1, overflow: 'auto', maxHeight: '400px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
                                        {filteredCourseVehicles.map(v => {
                                            const selected = selectedVehicleIds.has(v.id);
                                            return (
                                                <div key={v.id} onClick={() => toggleVehicle(v.id)} style={{
                                                    padding: '0.75rem', border: selected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                                    borderRadius: '0.625rem', cursor: 'pointer',
                                                    background: selected ? '#eff6ff' : 'white', transition: 'all 0.15s'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                        <span style={{ fontWeight: '700', fontSize: '1rem', color: selected ? '#1d4ed8' : '#1e293b' }}>
                                                            {v.vehicle_number}
                                                        </span>
                                                        {selected && <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                        <div>Serial: {v.serial_number}</div>
                                                        <div>{v.brand} {v.model}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========== STEP 3: PARTS ========== */}
                    {step === 'parts' && (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            {/* Vehicle Tabs (repair mode only) */}
                            {!isSpareMode && (
                                <div style={{ display: 'flex', gap: '0.25rem', padding: '0.5rem 1rem', background: '#eff6ff', borderBottom: '1px solid #bfdbfe', overflowX: 'auto' }}>
                                    {selectedVehicles.map(v => (
                                        <button key={v.id} onClick={() => setActiveVehicleId(v.id)} style={{
                                            padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
                                            fontWeight: activeVehicleId === v.id ? 'bold' : 'normal',
                                            background: activeVehicleId === v.id ? '#1d4ed8' : 'white',
                                            color: activeVehicleId === v.id ? 'white' : '#475569',
                                            fontSize: '0.8rem', whiteSpace: 'nowrap', transition: 'all 0.15s'
                                        }}>
                                            🚗 {v.vehicle_number}
                                            {getPartsForVehicle(v.id).length > 0 && (
                                                <span style={{
                                                    marginLeft: '0.5rem', background: activeVehicleId === v.id ? 'rgba(255,255,255,0.3)' : '#dcfce7',
                                                    color: activeVehicleId === v.id ? 'white' : '#166534',
                                                    padding: '0.1rem 0.4rem', borderRadius: '1rem', fontSize: '0.7rem'
                                                }}>
                                                    {getPartsForVehicle(v.id).length}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Spare mode header */}
                            {isSpareMode && (
                                <div style={{ padding: '0.5rem 1rem', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                                    <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#166534' }}>
                                        📦 เบิกสแปร์ — เลือกอะไหล่ที่ต้องการสำรอง
                                    </span>
                                </div>
                            )}

                            {/* Category Tabs */}
                            <div style={{ display: 'flex', gap: '0.25rem', padding: '0.5rem 1rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                                {Object.keys(partsBySystem).map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                        padding: '0.375rem 0.75rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
                                        fontWeight: activeTab === tab ? 'bold' : 'normal',
                                        background: activeTab === tab ? '#475569' : 'white',
                                        color: activeTab === tab ? 'white' : '#475569', fontSize: '0.8rem'
                                    }}>
                                        {getTabDisplayName(tab)}
                                    </button>
                                ))}
                            </div>

                            {/* Search */}
                            <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                                <input type="text" placeholder="🔍 ค้นหาอะไหล่..." value={partsSearchTerm}
                                    onChange={(e) => setPartsSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.85rem' }} />
                            </div>

                            {/* Parts Grid */}
                            <div style={{ flex: 1, minHeight: '180px', maxHeight: '220px', overflow: 'auto', padding: '0.75rem 1rem' }}>
                                {isLoadingParts ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>กำลังโหลด...</div>
                                ) : (!isSpareMode && !activeVehicleId) ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>กรุณาเลือกรถด้านบนก่อน</div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                                        {displayedParts.map(part => {
                                            const selected = isSpareMode
                                                ? spareSelectedParts.some(p => p.part_id === part.id.toString())
                                                : isPartSelectedForVehicle(activeVehicleId, part.id);
                                            return (
                                                <div key={part.id} onClick={() => handlePartToggle(part)} style={{
                                                    padding: '0.625rem', border: selected ? '2px solid #059669' : '1px solid #e2e8f0',
                                                    borderRadius: '0.5rem', cursor: 'pointer',
                                                    background: selected ? '#ecfdf5' : 'white', transition: 'all 0.15s'
                                                }}>
                                                    <div style={{ fontWeight: '500', fontSize: '0.8rem', color: '#1e293b', marginBottom: '0.15rem' }}>{part.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                        {part.part_number && <span>[{part.part_number}] </span>}
                                                        <span>({part.unit})</span>
                                                    </div>
                                                    {selected && <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 'bold' }}>✓ เลือกแล้ว</span>}
                                                </div>
                                            );
                                        })}
                                        {displayedParts.length === 0 && (
                                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#64748b' }}>ไม่พบอะไหล่</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Selected Summary */}
                            {(isSpareMode ? spareSelectedParts.length > 0 : vehiclePartEntries.length > 0) && (
                                <div style={{ padding: '0.75rem 1rem', background: '#ecfdf5', borderTop: '2px solid #10b981', maxHeight: '180px', overflow: 'auto' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#065f46', fontSize: '0.85rem' }}>
                                        ✅ รายการทั้งหมด ({isSpareMode ? spareSelectedParts.length : vehiclePartEntries.length} รายการ • {totalItems} ชิ้น)
                                    </h4>
                                    {isSpareMode ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                            {spareSelectedParts.map(entry => (
                                                <div key={entry.part_id} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                    padding: '0.25rem 0.5rem', background: 'white', borderRadius: '0.375rem',
                                                    border: '1px solid #10b981', fontSize: '0.8rem'
                                                }}>
                                                    <span>{entry.part_name}</span>
                                                    <button onClick={(e) => { e.stopPropagation(); handlePartQuantity('', entry.part_id, -1); }}
                                                        style={{ width: '20px', height: '20px', border: 'none', background: '#d1fae5', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}>-</button>
                                                    <span style={{ fontWeight: 'bold', minWidth: '18px', textAlign: 'center', color: '#059669' }}>{entry.quantity}</span>
                                                    <button onClick={(e) => { e.stopPropagation(); handlePartQuantity('', entry.part_id, 1); }}
                                                        style={{ width: '20px', height: '20px', border: 'none', background: '#d1fae5', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}>+</button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveEntry('', entry.part_id); }}
                                                        style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        selectedVehicles.map(v => {
                                            const vParts = getPartsForVehicle(v.id);
                                            if (vParts.length === 0) return null;
                                            return (
                                                <div key={v.id} style={{ marginBottom: '0.5rem' }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                                                        🚗 {v.vehicle_number} ({v.serial_number})
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                                        {vParts.map(entry => (
                                                            <div key={`${entry.vehicle_id}-${entry.part_id}`} style={{
                                                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                                padding: '0.25rem 0.5rem', background: 'white', borderRadius: '0.375rem',
                                                                border: '1px solid #10b981', fontSize: '0.8rem'
                                                            }}>
                                                                <span>{entry.part_name}</span>
                                                                <button onClick={(e) => { e.stopPropagation(); handlePartQuantity(entry.vehicle_id, entry.part_id, -1); }}
                                                                    style={{ width: '20px', height: '20px', border: 'none', background: '#d1fae5', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}>-</button>
                                                                <span style={{ fontWeight: 'bold', minWidth: '18px', textAlign: 'center', color: '#059669' }}>{entry.quantity}</span>
                                                                <button onClick={(e) => { e.stopPropagation(); handlePartQuantity(entry.vehicle_id, entry.part_id, 1); }}
                                                                    style={{ width: '20px', height: '20px', border: 'none', background: '#d1fae5', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}>+</button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleRemoveEntry(entry.vehicle_id, entry.part_id); }}
                                                                    style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========== STEP 4: PREVIEW ========== */}
                    {step === 'preview' && (
                        <div ref={printRef} style={{ flex: 1, overflow: 'auto', padding: '1.5rem', background: 'white' }}>
                            {/* Print Header */}
                            <div style={{ textAlign: 'center', borderBottom: '3px double #1e40af', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.25rem 0', color: '#1e40af' }}>{isSpareMode ? 'ใบเบิกสแปร์' : 'ใบเบิกอะไหล่'}</h1>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>{isSpareMode ? 'Spare Parts Withdraw Request' : 'Material Withdraw Request (MWR)'}</p>
                            </div>

                            {/* Info */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{ background: '#f1f5f9', padding: '0.875rem', borderRadius: '0.5rem' }}>
                                    <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.875rem' }}><strong>📅 วันที่:</strong> {currentDate}</p>
                                    <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.875rem' }}><strong>⏰ เวลา:</strong> {currentTime}</p>
                                    <p style={{ margin: 0, fontSize: '0.875rem' }}><strong>👤 ผู้ขอเบิก:</strong> {user.name}</p>
                                </div>
                                <div style={{ background: '#f1f5f9', padding: '0.875rem', borderRadius: '0.5rem' }}>
                                    <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.875rem' }}><strong>📍 สนาม:</strong> {getDestinationCourseName()}</p>
                                    <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.875rem' }}><strong>{isSpareMode ? '� ประเภท:' : '�🚗 จำนวนรถ:'}</strong> {isSpareMode ? 'เบิกสแปร์' : `${selectedVehicleIds.size} คัน`}</p>
                                    <p style={{ margin: 0, fontSize: '0.875rem' }}>
                                        <strong>⚡ ความเร่งด่วน:</strong>{' '}
                                        <span style={{
                                            padding: '0.15rem 0.5rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold',
                                            background: urgencyLevel === 'critical' ? '#fecaca' : urgencyLevel === 'urgent' ? '#fed7aa' : '#e2e8f0',
                                            color: urgencyLevel === 'critical' ? '#b91c1c' : urgencyLevel === 'urgent' ? '#c2410c' : '#475569'
                                        }}>
                                            {getUrgencyLabel(urgencyLevel)}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Reason */}
                            <div style={{ background: '#fef3c7', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
                                <h4 style={{ margin: '0 0 0.25rem 0', color: '#92400e', fontSize: '0.875rem' }}>📝 เหตุผลในการเบิก</h4>
                                <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{requestReason}</p>
                            </div>

                            {partsNotes && (
                                <div style={{ background: '#ecfdf5', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.25rem', borderLeft: '4px solid #10b981' }}>
                                    <h4 style={{ margin: '0 0 0.25rem 0', color: '#065f46', fontSize: '0.875rem' }}>💬 หมายเหตุ</h4>
                                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{partsNotes}</p>
                                </div>
                            )}

                            {/* ===== MAIN TABLE ===== */}
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '0.9rem' }}>
                                📦 รายการอะไหล่ ({isSpareMode ? spareSelectedParts.length : vehiclePartEntries.length} รายการ • {totalItems} ชิ้น)
                            </h4>

                            {isSpareMode ? (
                                /* SPARE MODE TABLE: simple columns */
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#166534', color: 'white', width: '45px', fontSize: '0.8rem' }}>ลำดับ</th>
                                            <th style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#166534', color: 'white', fontSize: '0.8rem', textAlign: 'left' }}>อะไหล่</th>
                                            <th style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#166534', color: 'white', fontSize: '0.8rem' }}>Part no</th>
                                            <th style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#166534', color: 'white', fontSize: '0.8rem' }}>หน่วย</th>
                                            <th style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#166534', color: 'white', width: '55px', fontSize: '0.8rem' }}>จำนวน</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {spareSelectedParts.map((entry, i) => (
                                            <tr key={entry.part_id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                                <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>{i + 1}</td>
                                                <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', fontSize: '0.8rem' }}>{entry.part_name}</td>
                                                <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem', fontFamily: 'monospace' }}>{entry.part_number || '-'}</td>
                                                <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>{entry.unit}</td>
                                                <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: '#166534' }}>{entry.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={4} style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem', background: '#f1f5f9' }}>รวมทั้งหมด</td>
                                            <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1rem', color: '#166534', background: '#f1f5f9' }}>{totalItems}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            ) : (
                                /* REPAIR MODE TABLE: with vehicle columns */
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#1e3a5f', color: 'white', width: '45px', fontSize: '0.8rem' }}>ลำดับ</th>
                                            <th style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#1e3a5f', color: 'white', fontSize: '0.8rem', textAlign: 'left' }}>Serial No.</th>
                                            <th style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#1e3a5f', color: 'white', fontSize: '0.8rem' }}>เบอร์รถ</th>
                                            <th style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#1e3a5f', color: 'white', fontSize: '0.8rem' }}>Type</th>
                                            <th style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#1e3a5f', color: 'white', fontSize: '0.8rem', textAlign: 'left' }}>อะไหล่ที่ใช้</th>
                                            <th style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#1e3a5f', color: 'white', fontSize: '0.8rem' }}>Part no</th>
                                            <th style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#1e3a5f', color: 'white', width: '55px', fontSize: '0.8rem' }}>จำนวน</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vehiclePartEntries.map((entry, i) => (
                                            <tr key={`${entry.vehicle_id}-${entry.part_id}`} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                                <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>{i + 1}</td>
                                                <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', fontSize: '0.8rem', fontFamily: 'monospace' }}>{entry.serial_number}</td>
                                                <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600' }}>{entry.vehicle_number}</td>
                                                <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>{entry.vehicle_type}</td>
                                                <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', fontSize: '0.8rem' }}>{entry.part_name}</td>
                                                <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem', fontFamily: 'monospace' }}>{entry.part_number || '-'}</td>
                                                <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: '#1e40af' }}>{entry.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={6} style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem', background: '#f1f5f9' }}>รวมทั้งหมด</td>
                                            <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1rem', color: '#1e40af', background: '#f1f5f9' }}>{totalItems}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            )}

                            {/* Signatures */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
                                {['ผู้ขอเบิก', 'หัวหน้างาน', 'ผู้จ่ายของ'].map(label => (
                                    <div key={label} style={{ textAlign: 'center' }}>
                                        <div style={{ height: '50px', borderBottom: '1px solid #334155' }}></div>
                                        <p style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold', fontSize: '0.875rem' }}>{label}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>วันที่ ____/____/____</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* ===== FOOTER ===== */}
                <div style={{
                    padding: '0.875rem 1.5rem', borderTop: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', background: '#f8fafc',
                    borderRadius: '0 0 1rem 1rem'
                }}>
                    <div>
                        {step !== 'info' && (
                            <button onClick={handlePrevStep} style={{
                                padding: '0.625rem 1.25rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem',
                                background: 'white', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem'
                            }}>← ย้อนกลับ</button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={onClose} style={{
                            padding: '0.625rem 1.25rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem',
                            background: 'white', cursor: 'pointer', fontSize: '0.875rem'
                        }}>ปิด</button>

                        {step === 'preview' ? (
                            <>
                                <button onClick={handlePrint} style={{
                                    padding: '0.625rem 1.25rem', border: 'none', borderRadius: '0.5rem',
                                    background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.875rem'
                                }}>🖨️ พิมพ์ / PDF</button>
                                <button onClick={handleSubmit} disabled={isSubmitting} style={{
                                    padding: '0.625rem 1.25rem', border: 'none', borderRadius: '0.5rem',
                                    background: '#059669', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.875rem',
                                    opacity: isSubmitting ? 0.5 : 1
                                }}>{isSubmitting ? 'กำลังส่ง...' : '✓ ยืนยันส่งคำขอ'}</button>
                            </>
                        ) : (
                            <button onClick={handleNextStep} style={{
                                padding: '0.625rem 1.5rem', border: 'none', borderRadius: '0.5rem',
                                background: '#1e40af', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.875rem'
                            }}>ถัดไป →</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePartRequestModal;
