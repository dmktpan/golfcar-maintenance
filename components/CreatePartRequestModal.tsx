'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Job, GolfCourse } from '@/lib/data';
import { getPartsBySystem, PartsBySystem, CategorizedPart } from '@/lib/partsService';

interface CreatePartRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onJobCreate: (newJob: Job) => void;
    golfCourses: GolfCourse[];
}

interface LocalSelectedPart {
    id: string | number;
    name: string;
    unit: string;
    quantity: number;
    part_number?: string;
}

const CreatePartRequestModal = ({ isOpen, onClose, user, onJobCreate, golfCourses }: CreatePartRequestModalProps) => {
    const [activeTab, setActiveTab] = useState('brake');
    const [partsSearchTerm, setPartsSearchTerm] = useState('');
    const [selectedParts, setSelectedParts] = useState<LocalSelectedPart[]>([]);
    const [partsNotes, setPartsNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // NEW FIELDS
    const [destinationCourseId, setDestinationCourseId] = useState<string>(user.golf_course_id || '');
    const [requestReason, setRequestReason] = useState('');
    const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'urgent' | 'critical'>('normal');

    // Preview state
    const [showPreview, setShowPreview] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    // Parts Data
    const [partsBySystem, setPartsBySystem] = useState<PartsBySystem>({
        brake: [],
        steering: [],
        motor: [],
        electric: [],
        other: []
    });
    const [isLoadingParts, setIsLoadingParts] = useState(true);

    // Initial Load
    useEffect(() => {
        if (isOpen) {
            loadParts();
            setDestinationCourseId(user.golf_course_id || '');
            setRequestReason('');
            setUrgencyLevel('normal');
            setSelectedParts([]);
            setPartsNotes('');
            setShowPreview(false);
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

    const getDestinationCourseName = () => {
        const course = golfCourses.find(gc => gc.id === destinationCourseId);
        return course?.name || 'ไม่ระบุ';
    };

    const getTabDisplayName = (tab: string) => {
        const tabNames: Record<string, string> = {
            'brake': 'ระบบเบรก',
            'steering': 'ระบบบังคับเลี้ยว',
            'motor': 'ระบบมอเตอร์/เพื่อขับ',
            'electric': 'ระบบไฟฟ้า',
            'other': 'อื่นๆ'
        };
        return tabNames[tab] || tab;
    };

    const getUrgencyLabel = (level: string) => {
        const labels: Record<string, string> = {
            'normal': 'ปกติ',
            'urgent': 'เร่งด่วน',
            'critical': 'เร่งด่วนมาก'
        };
        return labels[level] || level;
    };

    const getFilteredParts = () => {
        const currentParts = partsBySystem[activeTab as keyof PartsBySystem] || [];
        if (!partsSearchTerm.trim()) {
            return currentParts;
        }
        const term = partsSearchTerm.toLowerCase().trim();
        const allParts = Object.values(partsBySystem).flat();
        return allParts.filter(p =>
            p.name.toLowerCase().includes(term) ||
            (p.part_number && p.part_number.toLowerCase().includes(term))
        );
    };

    const handlePartSelect = (part: CategorizedPart) => {
        setSelectedParts(prev => {
            const exists = prev.find(p => p.id === part.id);
            if (exists) {
                return prev.filter(p => p.id !== part.id);
            }
            return [...prev, { ...part, quantity: 1 }];
        });
    };

    const handleQuantityChange = (id: string | number, delta: number) => {
        setSelectedParts(prev => prev.map(p => {
            if (p.id === id) {
                const newQty = Math.max(1, p.quantity + delta);
                return { ...p, quantity: newQty };
            }
            return p;
        }));
    };

    const handleRemovePart = (id: string | number) => {
        setSelectedParts(prev => prev.filter(p => p.id !== id));
    };

    const validateForm = (): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];
        if (selectedParts.length === 0) {
            errors.push('กรุณาเลือกอะไหล่อย่างน้อย 1 รายการ');
        }
        if (!destinationCourseId) {
            errors.push('กรุณาระบุสถานที่ปลายทาง');
        }
        if (!requestReason.trim()) {
            errors.push('กรุณาระบุเหตุผลในการเบิก');
        }
        return { isValid: errors.length === 0, errors };
    };

    const handleShowPreview = () => {
        const { isValid, errors } = validateForm();
        if (!isValid) {
            alert('ข้อมูลไม่ครบถ้วน:\n' + errors.map((e, i) => `${i + 1}. ${e}`).join('\n'));
            return;
        }
        setShowPreview(true);
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('กรุณาอนุญาต popup เพื่อพิมพ์เอกสาร');
            return;
        }

        const styles = `
            <style>
                @page { size: A4; margin: 20mm; }
                body { font-family: 'Sarabun', 'TH SarabunPSK', sans-serif; margin: 0; padding: 20px; }
                .requisition-form { max-width: 210mm; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
                .header h1 { font-size: 24px; margin: 0 0 10px 0; }
                .header h2 { font-size: 18px; margin: 0; color: #555; }
                .parts-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .parts-table th, .parts-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                .parts-table th { background: #4a5568; color: white; }
                .parts-table tr:nth-child(even) { background: #f9f9f9; }
            </style>
        `;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>ใบเบิกอะไหล่ - ${new Date().toLocaleDateString('th-TH')}</title>
                ${styles}
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    const handleSubmit = async () => {
        const { isValid, errors } = validateForm();
        if (!isValid) {
            alert('ข้อมูลไม่ครบถ้วน:\n' + errors.map((e, i) => `${i + 1}. ${e}`).join('\n'));
            return;
        }

        setIsSubmitting(true);
        try {
            const newJob: Omit<Job, 'id' | 'created_at' | 'updated_at'> = {
                user_id: user.id.toString(),
                userName: user.name,
                vehicle_id: undefined,
                vehicle_number: 'N/A',
                golf_course_id: destinationCourseId,
                type: 'PART_REQUEST',
                status: 'pending',
                parts: selectedParts.map(p => ({
                    part_id: p.id.toString(),
                    quantity_used: p.quantity,
                    part_name: p.name
                })),
                system: 'part_request',
                subTasks: [],
                partsNotes: partsNotes,
                remarks: `[${getUrgencyLabel(urgencyLevel)}] เหตุผล: ${requestReason}`,
                images: [],
                battery_serial: undefined
            };

            await onJobCreate(newJob as Job);
            setSelectedParts([]);
            setPartsNotes('');
            setRequestReason('');
            setShowPreview(false);
            onClose();
        } catch (error) {
            console.error('Error creating request:', error);
            alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayedParts = getFilteredParts();
    const currentDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const currentTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    // ============ PREVIEW MODAL ============
    if (showPreview) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '1rem'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '1rem',
                    width: '100%',
                    maxWidth: '800px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
                }}>
                    {/* Preview Header */}
                    <div style={{
                        padding: '1rem 1.5rem',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f8fafc',
                        borderRadius: '1rem 1rem 0 0'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>📄 ตัวอย่างใบเบิกอะไหล่</h3>
                        <button
                            onClick={() => setShowPreview(false)}
                            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
                        >×</button>
                    </div>

                    {/* Printable Content */}
                    <div ref={printRef} style={{ flex: 1, overflow: 'auto', padding: '1.5rem', background: 'white' }}>
                        {/* Document Header */}
                        <div style={{ textAlign: 'center', borderBottom: '3px double #1e40af', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0', color: '#1e40af' }}>ใบเบิกอะไหล่</h1>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Material Withdraw Request (MWR)</p>
                        </div>

                        {/* Info Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '0.5rem' }}>
                                <p style={{ margin: '0 0 0.5rem 0' }}><strong>📅 วันที่:</strong> {currentDate}</p>
                                <p style={{ margin: '0 0 0.5rem 0' }}><strong>⏰ เวลา:</strong> {currentTime}</p>
                                <p style={{ margin: 0 }}><strong>👤 ผู้ขอเบิก:</strong> {user.name}</p>
                            </div>
                            <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '0.5rem' }}>
                                <p style={{ margin: '0 0 0.5rem 0' }}><strong>📍 สนามปลายทาง:</strong> {getDestinationCourseName()}</p>
                                <p style={{ margin: 0 }}>
                                    <strong>⚡ ความเร่งด่วน:</strong>{' '}
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.875rem',
                                        fontWeight: 'bold',
                                        background: urgencyLevel === 'critical' ? '#fecaca' : urgencyLevel === 'urgent' ? '#fed7aa' : '#e2e8f0',
                                        color: urgencyLevel === 'critical' ? '#b91c1c' : urgencyLevel === 'urgent' ? '#c2410c' : '#475569'
                                    }}>
                                        {getUrgencyLabel(urgencyLevel)}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Reason */}
                        <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>📝 เหตุผลในการเบิก</h4>
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{requestReason}</p>
                        </div>

                        {/* Parts Table */}
                        <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b' }}>📦 รายการอะไหล่</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem', background: '#1e40af', color: 'white', width: '50px' }}>ลำดับ</th>
                                    <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem', background: '#1e40af', color: 'white', textAlign: 'left' }}>ชื่ออะไหล่</th>
                                    <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem', background: '#1e40af', color: 'white', width: '100px' }}>รหัส</th>
                                    <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem', background: '#1e40af', color: 'white', width: '70px' }}>จำนวน</th>
                                    <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem', background: '#1e40af', color: 'white', width: '60px' }}>หน่วย</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedParts.map((part, i) => (
                                    <tr key={part.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '0.75rem', textAlign: 'center' }}>{i + 1}</td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '0.75rem' }}>{part.name}</td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '0.75rem', textAlign: 'center', fontFamily: 'monospace' }}>{part.part_number || '-'}</td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: '#1e40af' }}>{part.quantity}</td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '0.75rem', textAlign: 'center' }}>{part.unit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Notes */}
                        {partsNotes && (
                            <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #10b981' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#065f46' }}>💬 หมายเหตุเพิ่มเติม</h4>
                                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{partsNotes}</p>
                            </div>
                        )}

                        {/* Signatures */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
                            {['ผู้ขอเบิก', 'หัวหน้างาน', 'ผู้จ่ายของ'].map(label => (
                                <div key={label} style={{ textAlign: 'center' }}>
                                    <div style={{ height: '60px', borderBottom: '1px solid #334155' }}></div>
                                    <p style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold' }}>{label}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>วันที่ ____/____/____</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Preview Footer */}
                    <div style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.75rem',
                        background: '#f8fafc',
                        borderRadius: '0 0 1rem 1rem'
                    }}>
                        <button
                            onClick={() => setShowPreview(false)}
                            style={{ padding: '0.75rem 1.5rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', background: 'white', cursor: 'pointer' }}
                        >← กลับแก้ไข</button>
                        <button
                            onClick={handlePrint}
                            style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.5rem', background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                        >🖨️ พิมพ์ / ดาวน์โหลด</button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.5rem', background: '#059669', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                        >{isSubmitting ? 'กำลังส่ง...' : '✓ ยืนยันส่งคำขอ'}</button>
                    </div>
                </div>
            </div>
        );
    }

    // ============ MAIN FORM MODAL ============
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '1rem',
                width: '100%',
                maxWidth: '900px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
            }}>
                {/* ===== HEADER ===== */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    borderRadius: '1rem 1rem 0 0'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white' }}>📦 เบิกอะไหล่ (Part Request)</h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'white', width: '32px', height: '32px', borderRadius: '50%' }}
                    >×</button>
                </div>

                {/* ===== SCROLLABLE BODY ===== */}
                <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

                    {/* Section 1: Request Info */}
                    <div style={{ padding: '1rem 1.5rem', background: '#fffbeb', borderBottom: '1px solid #fbbf24' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600', fontSize: '0.875rem', color: '#92400e' }}>
                                    📍 สนามปลายทาง *
                                </label>
                                <select
                                    value={destinationCourseId}
                                    onChange={(e) => setDestinationCourseId(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #fbbf24', borderRadius: '0.5rem', background: 'white' }}
                                >
                                    <option value="">-- เลือกสนาม --</option>
                                    {golfCourses.map(gc => (
                                        <option key={gc.id} value={gc.id}>{gc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600', fontSize: '0.875rem', color: '#92400e' }}>
                                    ⚡ ความเร่งด่วน
                                </label>
                                <select
                                    value={urgencyLevel}
                                    onChange={(e) => setUrgencyLevel(e.target.value as 'normal' | 'urgent' | 'critical')}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #fbbf24',
                                        borderRadius: '0.5rem',
                                        background: urgencyLevel === 'critical' ? '#fecaca' : urgencyLevel === 'urgent' ? '#fed7aa' : 'white',
                                        fontWeight: urgencyLevel !== 'normal' ? 'bold' : 'normal'
                                    }}
                                >
                                    <option value="normal">ปกติ</option>
                                    <option value="urgent">⚠️ เร่งด่วน</option>
                                    <option value="critical">🚨 เร่งด่วนมาก</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600', fontSize: '0.875rem', color: '#92400e' }}>
                                📝 เหตุผลในการเบิก *
                            </label>
                            <input
                                type="text"
                                value={requestReason}
                                onChange={(e) => setRequestReason(e.target.value)}
                                placeholder="เช่น รถหมายเลข 12 เบรกเสีย ต้องเปลี่ยนผ้าเบรก"
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #fbbf24', borderRadius: '0.5rem' }}
                            />
                        </div>
                    </div>

                    {/* Section 2: Category Tabs */}
                    <div style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem 1.5rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                        {Object.keys(partsBySystem).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: activeTab === tab ? 'bold' : 'normal',
                                    background: activeTab === tab ? '#1e40af' : 'white',
                                    color: activeTab === tab ? 'white' : '#475569',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {getTabDisplayName(tab)}
                            </button>
                        ))}
                    </div>

                    {/* Section 3: Search */}
                    <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                        <input
                            type="text"
                            placeholder="🔍 ค้นหาอะไหล่..."
                            value={partsSearchTerm}
                            onChange={(e) => setPartsSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                        />
                    </div>

                    {/* Section 4: Parts Grid (Scrollable) */}
                    <div style={{ flex: 1, minHeight: '200px', maxHeight: '250px', overflow: 'auto', padding: '1rem 1.5rem' }}>
                        {isLoadingParts ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>กำลังโหลด...</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                {displayedParts.map(part => {
                                    const selected = selectedParts.find(p => p.id === part.id);
                                    return (
                                        <div
                                            key={part.id}
                                            onClick={() => handlePartSelect(part)}
                                            style={{
                                                padding: '0.75rem',
                                                border: selected ? '2px solid #059669' : '1px solid #e2e8f0',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer',
                                                background: selected ? '#ecfdf5' : 'white',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.25rem' }}>{part.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {part.part_number && <span style={{ marginRight: '0.5rem' }}>[{part.part_number}]</span>}
                                                <span>({part.unit})</span>
                                            </div>
                                            {selected && (
                                                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 'bold' }}>✓ เลือกแล้ว</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {displayedParts.length === 0 && (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        ไม่พบอะไหล่
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Section 5: Selected Parts Summary (Always visible when has items) */}
                    {selectedParts.length > 0 && (
                        <div style={{ padding: '1rem 1.5rem', background: '#ecfdf5', borderTop: '2px solid #10b981' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', color: '#065f46', fontSize: '0.875rem' }}>
                                ✅ รายการที่เลือก ({selectedParts.length} รายการ)
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {selectedParts.map(part => (
                                    <div key={part.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 0.75rem',
                                        background: 'white',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #10b981',
                                        fontSize: '0.875rem'
                                    }}>
                                        <span style={{ fontWeight: '500' }}>{part.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleQuantityChange(part.id, -1); }}
                                                style={{ width: '24px', height: '24px', border: 'none', background: '#d1fae5', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >-</button>
                                            <span style={{ fontWeight: 'bold', minWidth: '24px', textAlign: 'center', color: '#059669' }}>{part.quantity}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleQuantityChange(part.id, 1); }}
                                                style={{ width: '24px', height: '24px', border: 'none', background: '#d1fae5', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >+</button>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemovePart(part.id); }}
                                            style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}
                                        >×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section 6: Notes (optional) */}
                    <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem', color: '#64748b' }}>
                            💬 หมายเหตุเพิ่มเติม (ถ้ามี)
                        </label>
                        <input
                            type="text"
                            value={partsNotes}
                            onChange={(e) => setPartsNotes(e.target.value)}
                            placeholder="ข้อมูลอื่นๆ ที่ต้องการแจ้ง..."
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                        />
                    </div>
                </div>

                {/* ===== FOOTER ===== */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '0 0 1rem 1rem'
                }}>
                    <button
                        onClick={onClose}
                        style={{ padding: '0.75rem 1.5rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontWeight: '500' }}
                    >ปิด</button>
                    <button
                        onClick={handleShowPreview}
                        style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.5rem', background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                    >👁️ ดูตัวอย่างใบเบิก</button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.5rem', background: '#059669', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                    >{isSubmitting ? 'กำลังส่ง...' : 'ส่งคำขอเบิกอะไหล่'}</button>
                </div>
            </div>
        </div>
    );
};

export default CreatePartRequestModal;
