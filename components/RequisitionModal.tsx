'use client';

import React from 'react';
import { Job, Vehicle, Part, GolfCourse } from '@/lib/data';

interface PartsUsageLog {
    id: string;
    jobId: string;
    partId: string;
    partName: string;
    quantityUsed: number;
    vehicleNumber: string;
    usedBy: string;
    usedDate: string;
}

interface RequisitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: Job | null;
    isGenerating: boolean;
    parts: Part[];
    vehicles: Vehicle[];
    golfCourses: GolfCourse[];
    jobParts: PartsUsageLog[];
}

const RequisitionModal: React.FC<RequisitionModalProps> = ({
    isOpen,
    onClose,
    job,
    isGenerating,
    parts,
    vehicles,
    golfCourses,
    jobParts
}) => {
    if (!isOpen || !job) return null;

    const formatDate = (dateString: string | undefined) => {
        try {
            if (!dateString || dateString === 'null' || dateString === 'undefined') {
                return 'ไม่ระบุวันที่';
            }
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';
            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'ไม่ระบุ';
        }
    };

    const formatDateTime = (dateString: string | undefined) => {
        try {
            if (!dateString || dateString === 'null' || dateString === 'undefined') {
                return 'ไม่ระบุ';
            }
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'ไม่ถูกต้อง';
            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'ไม่ระบุ';
        }
    };

    const getGolfCourseName = (id: string) => {
        const course = golfCourses.find(c => c.id === id);
        return course ? course.name : 'ไม่ระบุ';
    };

    const getSystemDisplayName = (system: string) => {
        const systemNames: Record<string, string> = {
            'brake': 'ระบบเบรก',
            'steering': 'ระบบบังคับเลี้ยว',
            'motor': 'ระบบมอเตอร์',
            'electric': 'ระบบไฟฟ้า',
            'general': 'ทั่วไป',
            'suspension': 'ช่วงล่าง'
        };
        return systemNames[system] || system;
    };

    const getVehicleSerial = (vehicleId: string | undefined) => {
        if (!vehicleId) return '-';
        const vehicle = vehicles.find(v => v.id === vehicleId);
        return vehicle ? vehicle.serial_number : '-';
    };

    const handlePrint = () => {
        const printContent = document.getElementById('requisition-to-print');
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            alert('กรุณาอนุญาตให้เปิด popup เพื่อพิมพ์เอกสาร');
            return;
        }

        const styles = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                body {
                    font-family: 'Sarabun', sans-serif;
                    background: white;
                    padding: 20mm;
                }

                .requisition-document {
                    background: white;
                    padding: 0;
                    font-family: 'Sarabun', 'Inter', -apple-system, sans-serif;
                }

                .doc-header {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    gap: 20px;
                    align-items: start;
                    margin-bottom: 32px;
                    padding-bottom: 24px;
                    border-bottom: 2px solid #e2e8f0;
                }

                .brand-section { display: flex; align-items: flex-start; }
                .brand-logo { display: flex; align-items: center; gap: 12px; }
                .logo-emoji {
                    font-size: 36px;
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    width: 56px; height: 56px;
                    border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    border: 1px solid #bae6fd;
                }
                .brand-text h1 { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: 1px; }
                .brand-text span { font-size: 10px; color: #64748b; letter-spacing: 2px; font-weight: 600; }

                .doc-title-section { text-align: center; }
                .doc-title { margin: 0; font-size: 28px; font-weight: 800; color: #0f172a; }
                .doc-subtitle { margin: 4px 0 0; font-size: 11px; color: #94a3b8; letter-spacing: 3px; font-weight: 600; }

                .doc-meta-section { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
                .doc-number-badge {
                    background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
                    color: white; padding: 10px 16px; border-radius: 10px;
                    display: flex; flex-direction: column; align-items: flex-end;
                }
                .doc-number-badge .label { font-size: 10px; opacity: 0.7; text-transform: uppercase; }
                .doc-number-badge .value { font-size: 16px; font-weight: 700; letter-spacing: 1px; }
                .doc-date { font-size: 13px; color: #64748b; }
                .doc-date .value { color: #0f172a; font-weight: 600; margin-left: 4px; }

                .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
                .info-card {
                    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
                    padding: 16px; display: flex; align-items: flex-start; gap: 12px;
                }
                .info-icon { font-size: 24px; flex-shrink: 0; }
                .info-content { display: flex; flex-direction: column; gap: 2px; }
                .info-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
                .info-value { font-size: 15px; color: #0f172a; font-weight: 600; }
                .info-value.highlight { color: #2563eb; font-size: 18px; }

                .detail-section { background: #f8fafc; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
                .detail-row { display: flex; gap: 12px; padding: 6px 0; }
                .detail-label { color: #64748b; font-size: 14px; min-width: 120px; }
                .detail-value { color: #0f172a; font-weight: 500; font-size: 14px; }

                .parts-section { margin-bottom: 32px; }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .section-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; }
                .item-count { background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }

                .parts-table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
                .parts-table th {
                    background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
                    color: white; padding: 14px 16px; text-align: left;
                    font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
                }
                .parts-table td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; }
                .parts-table tbody tr:nth-child(even) { background: #f8fafc; }
                .col-no { width: 50px; text-align: center; }
                .col-code { width: 120px; }
                .col-qty { width: 80px; text-align: center; font-weight: 600; color: #0f172a; }
                .col-unit { width: 80px; text-align: center; }
                .parts-table th.col-no, .parts-table th.col-qty, .parts-table th.col-unit { text-align: center; }
                .parts-table tfoot td { background: #f1f5f9; font-weight: 700; border-top: 2px solid #cbd5e1; }
                .total-label { text-align: right; padding-right: 20px !important; }
                .total-value { text-align: center; color: #2563eb; font-size: 16px; }

                .signatures-section {
                    display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
                    margin-top: 48px; padding-top: 32px; border-top: 1px dashed #cbd5e1;
                }
                .signature-box { text-align: center; padding: 16px; }
                .sig-space { height: 50px; }
                .sig-line { border-bottom: 1.5px solid #94a3b8; margin-bottom: 12px; }
                .sig-title { margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; }
                .sig-subtitle { margin: 2px 0 8px; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
                .sig-date { margin: 0; font-size: 12px; color: #94a3b8; }

                .doc-footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; }
                .doc-footer p { margin: 0; font-size: 11px; color: #94a3b8; }

                @media print {
                    body { padding: 15mm; }
                    @page { size: A4; margin: 0; }
                }
            </style>
        `;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>ใบเบิกอะไหล่ - ${job.prrNumber || 'Draft'}</title>
                <meta charset="utf-8">
                ${styles}
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        };
    };

    // Calculate total items
    const totalItems = jobParts.reduce((sum, part) => sum + part.quantityUsed, 0);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="modal-header no-print">
                    <div className="header-left">
                        <div className="header-icon">📄</div>
                        <div>
                            <h2>ใบเบิกอะไหล่</h2>
                            <p className="header-subtitle">Parts Requisition Form</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-download" onClick={handlePrint} disabled={isGenerating}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                                <rect x="6" y="14" width="12" height="8" />
                            </svg>
                            พิมพ์ / PDF
                        </button>
                        <button className="btn-close" onClick={onClose}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="modal-body">
                    {isGenerating ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>กำลังสร้างเลขที่เอกสาร...</p>
                        </div>
                    ) : (
                        <div className="requisition-document" id="requisition-to-print">
                            {/* Document Header */}
                            <div className="doc-header">
                                <div className="brand-section">
                                    <div className="brand-logo">
                                        <span className="logo-emoji">🚗</span>
                                        <div className="brand-text">
                                            <h1>GOLF CAR</h1>
                                            <span>MAINTENANCE SYSTEM</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="doc-title-section">
                                    <h2 className="doc-title">ใบเบิกอะไหล่</h2>
                                    <p className="doc-subtitle">PARTS REQUISITION</p>
                                </div>
                                <div className="doc-meta-section">
                                    <div className="doc-number-badge">
                                        <span className="label">เลขที่</span>
                                        <span className="value">{job.prrNumber || 'รอออกเลข'}</span>
                                    </div>
                                    <div className="doc-date">
                                        <span className="label">วันที่:</span>
                                        <span className="value">{formatDate(new Date().toISOString())}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="info-grid">
                                <div className="info-card">
                                    <div className="info-icon">👤</div>
                                    <div className="info-content">
                                        <span className="info-label">ผู้เบิก</span>
                                        <span className="info-value">{job.userName}</span>
                                    </div>
                                </div>
                                <div className="info-card">
                                    <div className="info-icon">🏌️</div>
                                    <div className="info-content">
                                        <span className="info-label">สนาม</span>
                                        <span className="info-value">{getGolfCourseName(job.golf_course_id)}</span>
                                    </div>
                                </div>
                                <div className="info-card">
                                    <div className="info-icon">🚗</div>
                                    <div className="info-content">
                                        <span className="info-label">รถเบอร์</span>
                                        <span className="info-value highlight">{job.vehicle_number}</span>
                                    </div>
                                </div>
                                <div className="info-card">
                                    <div className="info-icon">🔧</div>
                                    <div className="info-content">
                                        <span className="info-label">ประเภทงาน</span>
                                        <span className="info-value">{job.type} - {getSystemDisplayName(job.system || '')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Details */}
                            <div className="detail-section">
                                <div className="detail-row">
                                    <span className="detail-label">Serial Number:</span>
                                    <span className="detail-value">{getVehicleSerial(job.vehicle_id)}</span>
                                </div>
                                {job.remarks && (
                                    <div className="detail-row">
                                        <span className="detail-label">หมายเหตุ:</span>
                                        <span className="detail-value">{job.remarks}</span>
                                    </div>
                                )}
                            </div>

                            {/* Parts Table */}
                            <div className="parts-section">
                                <div className="section-header">
                                    <h3>รายการอะไหล่</h3>
                                    <span className="item-count">{jobParts.length} รายการ</span>
                                </div>
                                <table className="parts-table">
                                    <thead>
                                        <tr>
                                            <th className="col-no">#</th>
                                            <th className="col-code">รหัส</th>
                                            <th className="col-name">รายการ</th>
                                            <th className="col-qty">จำนวน</th>
                                            <th className="col-unit">หน่วย</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobParts.length > 0 ? jobParts.map((part, index) => {
                                            const partInfo = parts.find(p => p.id === part.partId);
                                            return (
                                                <tr key={part.id}>
                                                    <td className="col-no">{index + 1}</td>
                                                    <td className="col-code">{partInfo?.part_number || '-'}</td>
                                                    <td className="col-name">{part.partName}</td>
                                                    <td className="col-qty">{part.quantityUsed}</td>
                                                    <td className="col-unit">{partInfo?.unit || 'ชิ้น'}</td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan={5} className="empty-row">
                                                    <div className="empty-state">
                                                        <span>📦</span>
                                                        <p>ไม่มีรายการอะไหล่</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {jobParts.length > 0 && (
                                        <tfoot>
                                            <tr>
                                                <td colSpan={3} className="total-label">รวมทั้งหมด</td>
                                                <td className="total-value">{totalItems}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>

                            {/* Signatures */}
                            <div className="signatures-section">
                                <div className="signature-box">
                                    <div className="sig-space"></div>
                                    <div className="sig-line"></div>
                                    <p className="sig-title">ผู้เบิก</p>
                                    <p className="sig-subtitle">Requested By</p>
                                    <p className="sig-date">วันที่: ___/___/___</p>
                                </div>
                                <div className="signature-box">
                                    <div className="sig-space"></div>
                                    <div className="sig-line"></div>
                                    <p className="sig-title">ผู้อนุมัติ</p>
                                    <p className="sig-subtitle">Approved By</p>
                                    <p className="sig-date">วันที่: ___/___/___</p>
                                </div>
                                <div className="signature-box">
                                    <div className="sig-space"></div>
                                    <div className="sig-line"></div>
                                    <p className="sig-title">ผู้จ่ายของ</p>
                                    <p className="sig-subtitle">Issued By</p>
                                    <p className="sig-date">วันที่: ___/___/___</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="doc-footer">
                                <p>พิมพ์เมื่อ: {formatDateTime(new Date().toISOString())}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                /* ===== Modal Container ===== */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }

                .modal-container {
                    background: #ffffff;
                    border-radius: 16px;
                    width: 100%;
                    max-width: 850px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    overflow: hidden;
                }

                /* ===== Modal Header ===== */
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 24px;
                    background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
                    color: white;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .header-icon {
                    font-size: 28px;
                    background: rgba(255,255,255,0.15);
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .header-left h2 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 700;
                }

                .header-subtitle {
                    margin: 0;
                    font-size: 12px;
                    opacity: 0.7;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .header-actions {
                    display: flex;
                    gap: 10px;
                }

                .btn-download {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 10px 18px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-download:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                }

                .btn-download:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .btn-close {
                    background: rgba(255,255,255,0.1);
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: white;
                    transition: background 0.2s;
                }

                .btn-close:hover {
                    background: rgba(255,255,255,0.2);
                }

                /* ===== Modal Body ===== */
                .modal-body {
                    flex: 1;
                    overflow-y: auto;
                    background: #f1f5f9;
                    padding: 24px;
                }

                /* ===== Loading State ===== */
                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 20px;
                    gap: 16px;
                }

                .loading-spinner {
                    width: 48px;
                    height: 48px;
                    border: 4px solid #e2e8f0;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .loading-state p {
                    color: #64748b;
                    font-size: 15px;
                }

                /* ===== Document Styles ===== */
                .requisition-document {
                    background: white;
                    border-radius: 12px;
                    padding: 40px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    font-family: 'Sarabun', 'Inter', -apple-system, sans-serif;
                }

                /* Document Header */
                .doc-header {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    gap: 20px;
                    align-items: start;
                    margin-bottom: 32px;
                    padding-bottom: 24px;
                    border-bottom: 2px solid #e2e8f0;
                }

                .brand-section {
                    display: flex;
                    align-items: flex-start;
                }

                .brand-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .logo-emoji {
                    font-size: 36px;
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    width: 56px;
                    height: 56px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #bae6fd;
                }

                .brand-text h1 {
                    margin: 0;
                    font-size: 22px;
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: 1px;
                }

                .brand-text span {
                    font-size: 10px;
                    color: #64748b;
                    letter-spacing: 2px;
                    font-weight: 600;
                }

                .doc-title-section {
                    text-align: center;
                }

                .doc-title {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 800;
                    color: #0f172a;
                }

                .doc-subtitle {
                    margin: 4px 0 0;
                    font-size: 11px;
                    color: #94a3b8;
                    letter-spacing: 3px;
                    font-weight: 600;
                }

                .doc-meta-section {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 10px;
                }

                .doc-number-badge {
                    background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
                    color: white;
                    padding: 10px 16px;
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                }

                .doc-number-badge .label {
                    font-size: 10px;
                    opacity: 0.7;
                    text-transform: uppercase;
                }

                .doc-number-badge .value {
                    font-size: 16px;
                    font-weight: 700;
                    letter-spacing: 1px;
                }

                .doc-date {
                    font-size: 13px;
                    color: #64748b;
                }

                .doc-date .value {
                    color: #0f172a;
                    font-weight: 600;
                    margin-left: 4px;
                }

                /* Info Grid */
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .info-card {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                }

                .info-icon {
                    font-size: 24px;
                    flex-shrink: 0;
                }

                .info-content {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .info-label {
                    font-size: 11px;
                    color: #64748b;
                    text-transform: uppercase;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                .info-value {
                    font-size: 15px;
                    color: #0f172a;
                    font-weight: 600;
                }

                .info-value.highlight {
                    color: #2563eb;
                    font-size: 18px;
                }

                /* Detail Section */
                .detail-section {
                    background: #f8fafc;
                    border-radius: 10px;
                    padding: 16px 20px;
                    margin-bottom: 24px;
                }

                .detail-row {
                    display: flex;
                    gap: 12px;
                    padding: 6px 0;
                }

                .detail-label {
                    color: #64748b;
                    font-size: 14px;
                    min-width: 120px;
                }

                .detail-value {
                    color: #0f172a;
                    font-weight: 500;
                    font-size: 14px;
                }

                /* Parts Section */
                .parts-section {
                    margin-bottom: 32px;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .section-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 700;
                    color: #0f172a;
                }

                .item-count {
                    background: #e0f2fe;
                    color: #0369a1;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .parts-table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    overflow: hidden;
                }

                .parts-table th {
                    background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
                    color: white;
                    padding: 14px 16px;
                    text-align: left;
                    font-size: 13px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .parts-table td {
                    padding: 14px 16px;
                    border-bottom: 1px solid #e2e8f0;
                    font-size: 14px;
                    color: #334155;
                }

                .parts-table tbody tr:nth-child(even) {
                    background: #f8fafc;
                }

                .parts-table tbody tr:hover {
                    background: #f1f5f9;
                }

                .col-no { width: 50px; text-align: center; }
                .col-code { width: 120px; }
                .col-name { }
                .col-qty { width: 80px; text-align: center; font-weight: 600; color: #0f172a; }
                .col-unit { width: 80px; text-align: center; }

                .parts-table th.col-no,
                .parts-table th.col-qty,
                .parts-table th.col-unit { text-align: center; }

                .parts-table tfoot td {
                    background: #f1f5f9;
                    font-weight: 700;
                    border-top: 2px solid #cbd5e1;
                }

                .total-label {
                    text-align: right;
                    padding-right: 20px !important;
                }

                .total-value {
                    text-align: center;
                    color: #2563eb;
                    font-size: 16px;
                }

                .empty-row {
                    padding: 40px !important;
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    color: #94a3b8;
                }

                .empty-state span {
                    font-size: 32px;
                }

                .empty-state p {
                    margin: 0;
                    font-size: 14px;
                }

                /* Signatures Section */
                .signatures-section {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    margin-top: 48px;
                    padding-top: 32px;
                    border-top: 1px dashed #cbd5e1;
                }

                .signature-box {
                    text-align: center;
                    padding: 16px;
                }

                .sig-space {
                    height: 50px;
                }

                .sig-line {
                    border-bottom: 1.5px solid #94a3b8;
                    margin-bottom: 12px;
                }

                .sig-title {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 700;
                    color: #0f172a;
                }

                .sig-subtitle {
                    margin: 2px 0 8px;
                    font-size: 11px;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .sig-date {
                    margin: 0;
                    font-size: 12px;
                    color: #94a3b8;
                }

                /* Document Footer */
                .doc-footer {
                    margin-top: 32px;
                    padding-top: 16px;
                    border-top: 1px solid #e2e8f0;
                    text-align: center;
                }

                .doc-footer p {
                    margin: 0;
                    font-size: 11px;
                    color: #94a3b8;
                }

                /* ===== Print Styles ===== */
                @media print {
                    .no-print {
                        display: none !important;
                    }

                    body * {
                        visibility: hidden;
                    }

                    .modal-overlay {
                        position: absolute;
                        background: white !important;
                        backdrop-filter: none;
                        padding: 0 !important;
                    }

                    .modal-container {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: auto;
                        max-width: none;
                        max-height: none;
                        box-shadow: none;
                        border-radius: 0;
                    }

                    .modal-body {
                        padding: 0;
                        background: white;
                        overflow: visible;
                    }

                    #requisition-to-print,
                    #requisition-to-print * {
                        visibility: visible;
                    }

                    #requisition-to-print {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 20mm;
                        margin: 0;
                        box-shadow: none;
                        border-radius: 0;
                    }

                    .requisition-document {
                        box-shadow: none;
                        border-radius: 0;
                    }

                    .doc-header {
                        grid-template-columns: 1fr auto 1fr;
                    }

                    .info-grid {
                        grid-template-columns: repeat(4, 1fr);
                    }

                    .parts-table th {
                        background: #1e3a5f !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    .parts-table tbody tr:nth-child(even) {
                        background: #f8fafc !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    .doc-number-badge {
                        background: #1e3a5f !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    @page {
                        size: A4;
                        margin: 0;
                    }
                }

                /* ===== Responsive ===== */
                @media (max-width: 768px) {
                    .doc-header {
                        grid-template-columns: 1fr;
                        text-align: center;
                    }

                    .doc-meta-section {
                        align-items: center;
                    }

                    .info-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .signatures-section {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default RequisitionModal;
