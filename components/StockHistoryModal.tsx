'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    XMarkIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    ArrowsRightLeftIcon,
    CalendarIcon,
    UserIcon,
    DocumentTextIcon,
    MapPinIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Part } from '@/lib/data';

interface StockTransaction {
    id: string;
    type: 'IN' | 'OUT' | 'TRANSFER';
    quantity: number;
    previous_balance: number;
    new_balance: number;
    createdAt: string;
    location_id: string | null;
    to_location_id: string | null;
    ref_type: string | null;
    ref_document: string | null;
    notes: string | null;
    user?: { name: string } | null;
}

interface StockHistoryModalProps {
    part: Part | null;
    onClose: () => void;
    golfCourses: { id: string; name: string }[];
}

export default function StockHistoryModal({ part, onClose, golfCourses }: StockHistoryModalProps) {
    const [logs, setLogs] = useState<StockTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [filterType, setFilterType] = useState<string>('ALL');

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!part) return;

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/stock/transactions?partId=${part.id}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to fetch history');
                setLogs(data.data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [part]);

    if (!part) return null;

    const getLocationName = (id: string | null) => {
        if (!id) return 'คลังส่วนกลาง (Central)';
        const course = golfCourses.find((gc) => gc.id === id);
        return course ? `⛳ ${course.name}` : `Location ID: ${id}`;
    };

    const getTransactionStyle = (type: string) => {
        switch (type) {
            case 'IN': return {
                label: 'รับเข้า',
                color: '#059669',
                bg: '#ecfdf5',
                border: '#a7f3d0',
                Icon: ArrowDownTrayIcon,
            };
            case 'OUT': return {
                label: 'เบิกออก',
                color: '#dc2626',
                bg: '#fef2f2',
                border: '#fecaca',
                Icon: ArrowUpTrayIcon,
            };
            case 'TRANSFER': return {
                label: 'โยกย้าย',
                color: '#4f46e5',
                bg: '#eef2ff',
                border: '#c7d2fe',
                Icon: ArrowsRightLeftIcon,
            };
            default: return {
                label: type,
                color: '#6b7280',
                bg: '#f3f4f6',
                border: '#d1d5db',
                Icon: ArrowPathIcon,
            };
        }
    };

    const filteredLogs = logs.filter((log) => {
        if (filterType !== 'ALL' && log.type !== filterType) return false;
        return true;
    });

    const filterButtons = [
        { key: 'ALL', label: 'ทั้งหมด' },
        { key: 'IN', label: 'รับเข้า' },
        { key: 'OUT', label: 'เบิกออก' },
        { key: 'TRANSFER', label: 'โยกย้าย' },
    ];

    if (!mounted) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 99999,
                padding: '1.5rem',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '1100px',
                    maxHeight: '90vh',
                    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.2)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* === Header === */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.5rem 2rem',
                    borderBottom: '1px solid #f1f5f9',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: '#fff',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <ClockIconSvg />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                                ประวัติความเคลื่อนไหวสต็อก
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
                                {part.name}
                                {part.part_number && (
                                    <span style={{
                                        marginLeft: '8px',
                                        background: 'rgba(255,255,255,0.2)',
                                        padding: '2px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                    }}>
                                        #{part.part_number}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '8px',
                            cursor: 'pointer',
                            color: '#fff',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                    >
                        <XMarkIcon style={{ width: '22px', height: '22px' }} />
                    </button>
                </div>

                {/* === Filters === */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 2rem',
                    borderBottom: '1px solid #f1f5f9',
                    background: '#fafbfc',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>แสดงผล:</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {filterButtons.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilterType(key)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        border: filterType === key ? '1px solid #c7d2fe' : '1px solid transparent',
                                        background: filterType === key ? '#fff' : 'transparent',
                                        color: filterType === key ? '#4f46e5' : '#6b7280',
                                        fontWeight: filterType === key ? 600 : 500,
                                        fontSize: '0.8125rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: filterType === key ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (filterType !== key) {
                                            e.currentTarget.style.background = '#f1f5f9';
                                            e.currentTarget.style.color = '#1f2937';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (filterType !== key) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#6b7280';
                                        }
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontWeight: 500 }}>
                        พบ {filteredLogs.length} รายการ
                    </span>
                </div>

                {/* === Body Content === */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', background: '#fff' }}>
                    {loading ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '250px',
                            gap: '16px',
                        }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                border: '3px solid #e5e7eb',
                                borderTop: '3px solid #4f46e5',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                            }} />
                            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', margin: 0 }}>
                                กำลังโหลดประวัติ...
                            </p>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : error ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '250px',
                            gap: '12px',
                            background: '#fef2f2',
                            borderRadius: '16px',
                            border: '1px solid #fecaca',
                            padding: '2rem',
                        }}>
                            <XMarkIcon style={{ width: '32px', height: '32px', color: '#dc2626' }} />
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#991b1b', margin: 0 }}>{error}</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '250px',
                            gap: '16px',
                            background: '#f9fafb',
                            borderRadius: '16px',
                            border: '1px dashed #d1d5db',
                            padding: '2rem',
                        }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                background: '#f1f5f9',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <DocumentTextIcon style={{ width: '28px', height: '28px', color: '#9ca3af' }} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#1f2937' }}>
                                    ไม่พบประวัติการทำรายการ
                                </h3>
                                <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
                                    ยังไม่มีการเคลื่อนไหวของสต็อกสำหรับอะไหล่ชิ้นนี้ หรือไม่พบข้อมูลตามตัวกรอง
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            width: '100%',
                            overflowX: 'auto',
                            borderRadius: '14px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '0.8125rem',
                                color: '#4b5563',
                            }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                                        {['วันที่-เวลา', 'ประเภท', 'สถานที่', 'ยอดก่อนหน้า', 'จำนวน', 'ยอดคงเหลือ', 'ผู้ทำรายการ', 'อ้างอิง/หมายเหตุ'].map((header, idx) => (
                                            <th key={idx} style={{
                                                padding: '14px 16px',
                                                fontWeight: 600,
                                                fontSize: '0.75rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em',
                                                color: '#6b7280',
                                                whiteSpace: 'nowrap',
                                                textAlign: [3, 4, 5].includes(idx) ? 'right' : 'left',
                                            }}>
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log, idx) => {
                                        const typeStyle = getTransactionStyle(log.type);
                                        const TypeIcon = typeStyle.Icon;
                                        const qtyColor = log.type === 'IN' ? '#059669' : log.type === 'OUT' ? '#dc2626' : '#4f46e5';
                                        const qtySign = log.type === 'IN' ? '+' : log.type === 'OUT' ? '-' : '';

                                        return (
                                            <tr key={log.id} style={{
                                                borderBottom: '1px solid #f1f5f9',
                                                background: idx % 2 === 0 ? '#fff' : '#fafbfc',
                                                transition: 'background 0.15s',
                                            }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f4ff'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafbfc'; }}
                                            >
                                                {/* Date */}
                                                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <CalendarIcon style={{ width: '14px', height: '14px', color: '#9ca3af', flexShrink: 0 }} />
                                                        <span style={{ fontSize: '0.8125rem' }}>
                                                            {new Date(log.createdAt).toLocaleDateString('th-TH', {
                                                                day: '2-digit', month: 'short', year: 'numeric',
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Type */}
                                                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '4px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        background: typeStyle.bg,
                                                        color: typeStyle.color,
                                                        border: `1px solid ${typeStyle.border}`,
                                                    }}>
                                                        <TypeIcon style={{ width: '14px', height: '14px' }} />
                                                        {typeStyle.label}
                                                    </span>
                                                </td>

                                                {/* Location */}
                                                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <MapPinIcon style={{ width: '14px', height: '14px', color: '#9ca3af', flexShrink: 0 }} />
                                                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1f2937' }}>
                                                                {getLocationName(log.location_id)}
                                                            </span>
                                                        </div>
                                                        {log.type === 'TRANSFER' && log.to_location_id && (
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                marginLeft: '6px',
                                                                paddingLeft: '14px',
                                                                borderLeft: '2px solid #e5e7eb',
                                                            }}>
                                                                <ArrowsRightLeftIcon style={{ width: '12px', height: '12px', color: '#9ca3af' }} />
                                                                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                                    ไปที่: <span style={{ fontWeight: 600, color: '#374151' }}>{getLocationName(log.to_location_id)}</span>
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Previous Balance */}
                                                <td style={{
                                                    padding: '12px 16px',
                                                    whiteSpace: 'nowrap',
                                                    textAlign: 'right',
                                                    fontVariantNumeric: 'tabular-nums',
                                                    color: '#6b7280',
                                                }}>
                                                    {log.previous_balance.toLocaleString()}
                                                </td>

                                                {/* Quantity */}
                                                <td style={{
                                                    padding: '12px 16px',
                                                    whiteSpace: 'nowrap',
                                                    textAlign: 'right',
                                                    fontVariantNumeric: 'tabular-nums',
                                                    fontWeight: 700,
                                                    color: qtyColor,
                                                    fontSize: '0.875rem',
                                                }}>
                                                    {qtySign}{log.quantity.toLocaleString()}
                                                </td>

                                                {/* New Balance */}
                                                <td style={{
                                                    padding: '12px 16px',
                                                    whiteSpace: 'nowrap',
                                                    textAlign: 'right',
                                                    fontVariantNumeric: 'tabular-nums',
                                                    fontWeight: 700,
                                                    color: '#1f2937',
                                                    fontSize: '0.875rem',
                                                }}>
                                                    {log.new_balance.toLocaleString()}
                                                </td>

                                                {/* User */}
                                                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{
                                                            width: '26px',
                                                            height: '26px',
                                                            background: '#f1f5f9',
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}>
                                                            <UserIcon style={{ width: '13px', height: '13px', color: '#6b7280' }} />
                                                        </div>
                                                        <span style={{ fontWeight: 600, color: '#374151', fontSize: '0.8125rem' }}>
                                                            {log.user?.name || 'SYSTEM'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Ref/Notes */}
                                                <td style={{ padding: '12px 16px', maxWidth: '220px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        {log.ref_document && (
                                                            <span style={{
                                                                display: 'inline-flex',
                                                                width: 'fit-content',
                                                                padding: '2px 8px',
                                                                borderRadius: '6px',
                                                                border: '1px solid #e5e7eb',
                                                                background: '#f8fafc',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                color: '#374151',
                                                            }}>
                                                                {log.ref_document}
                                                            </span>
                                                        )}
                                                        {log.notes && (
                                                            <span style={{
                                                                fontSize: '0.75rem',
                                                                color: '#6b7280',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                maxWidth: '200px',
                                                            }} title={log.notes}>
                                                                {log.notes}
                                                            </span>
                                                        )}
                                                        {!log.ref_document && !log.notes && (
                                                            <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>—</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* === Footer === */}
                <div style={{
                    padding: '1rem 2rem',
                    borderTop: '1px solid #f1f5f9',
                    background: '#fafbfc',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    flexShrink: 0,
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 24px',
                            border: '1px solid #d1d5db',
                            borderRadius: '10px',
                            background: '#fff',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: '#374151',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

/* Simple clock icon since heroicons doesn't have a matching one for the header */
function ClockIconSvg() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
