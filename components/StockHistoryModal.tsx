'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Package,
    ArrowDownRight,
    ArrowUpRight,
    ArrowRightLeft,
    Calendar,
    User as UserIcon,
    FileText,
    MapPin,
    RefreshCcw,
    Loader2
} from 'lucide-react';
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

    useEffect(() => {
        setMounted(true);
    }, []);

    // Filters
    const [filterType, setFilterType] = useState<string>('ALL');

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

    const getTransactionLabel = (type: string) => {
        switch (type) {
            case 'IN': return { label: 'รับเข้า', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', icon: <ArrowDownRight size={16} /> };
            case 'OUT': return { label: 'เบิกออก', color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', icon: <ArrowUpRight size={16} /> };
            case 'TRANSFER': return { label: 'โยกย้าย', color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20', icon: <ArrowRightLeft size={16} /> };
            default: return { label: type, color: 'text-zinc-700 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800', border: 'border-zinc-200 dark:border-zinc-700', icon: <RefreshCcw size={16} /> };
        }
    };

    const filteredLogs = logs.filter((log) => {
        if (filterType !== 'ALL' && log.type !== filterType) return false;
        return true;
    });

    if (!mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-md transition-all sm:p-6"
            onClick={onClose}
        >
            <div
                className="flex w-full max-w-6xl flex-col max-h-[90vh] overflow-hidden rounded-2xl border border-zinc-200/50 bg-white shadow-2xl dark:border-zinc-800/50 dark:bg-zinc-900"
                onClick={(e) => e.stopPropagation()}
            >
                {/* === Header === */}
                <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-100 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                            <Package size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">ประวัติความเคลื่อนไหวสต็อก</h2>
                            <p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">{part.name}</span>
                                {part.part_number && <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">#{part.part_number}</span>}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 active:scale-95 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* === Filters === */}
                <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900/20">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">แสดงผล:</span>
                        <div className="flex gap-1">
                            {['ALL', 'IN', 'OUT', 'TRANSFER'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${filterType === type
                                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-indigo-400 dark:ring-zinc-700'
                                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                                        }`}
                                >
                                    {type === 'ALL' ? 'ทั้งหมด' : getTransactionLabel(type).label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        พบ {filteredLogs.length} รายการ
                    </div>
                </div>

                {/* === Body Content === */}
                <div className="flex-1 overflow-auto bg-white p-6 dark:bg-zinc-950">
                    {loading ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-3 space-y-4 text-zinc-500 dark:text-zinc-400">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                            <p className="text-sm font-medium">กำลังโหลดประวัติ...</p>
                        </div>
                    ) : error ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
                            <div className="text-rose-600 dark:text-rose-400"><X size={32} /></div>
                            <p className="text-sm font-medium text-rose-800 dark:text-rose-300">{error}</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">ไม่พบประวัติการทำรายการ</h3>
                                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">ยังไม่มีการเคลื่อนไหวของสต็อกสำหรับอะไหล่ชิ้นนี้ หรือไม่พบข้อมูลตามตัวกรอง</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto rounded-xl border border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-950 shadow-sm">
                            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                                <thead className="bg-zinc-50/80 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/80 dark:text-zinc-400">
                                    <tr className="border-b border-zinc-200/50 dark:border-zinc-800/50">
                                        <th className="whitespace-nowrap px-6 py-4">วันที่-เวลา</th>
                                        <th className="whitespace-nowrap px-6 py-4">ประเภท</th>
                                        <th className="whitespace-nowrap px-6 py-4">สถานที่</th>
                                        <th className="whitespace-nowrap px-6 py-4 text-right">ยอดก่อนหน้า</th>
                                        <th className="whitespace-nowrap px-6 py-4 text-right">จำนวน</th>
                                        <th className="whitespace-nowrap px-6 py-4 text-right">ยอดคงเหลือ</th>
                                        <th className="whitespace-nowrap px-6 py-4">ผู้ทำรายการ</th>
                                        <th className="whitespace-nowrap px-6 py-4">อ้างอิง/หมายเหตุ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800/50 dark:bg-zinc-950">
                                    {filteredLogs.map((log) => {
                                        const typeStyle = getTransactionLabel(log.type);
                                        const qtyColor = log.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : log.type === 'OUT' ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400';
                                        const qtySign = log.type === 'IN' ? '+' : log.type === 'OUT' ? '-' : '';

                                        return (
                                            <tr key={log.id} className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30">
                                                {/* Date */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-zinc-400" />
                                                        <span>
                                                            {new Date(log.createdAt).toLocaleDateString('th-TH', {
                                                                day: '2-digit', month: 'short', year: 'numeric',
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Type */}
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${typeStyle.bg} ${typeStyle.color} ${typeStyle.border}`}>
                                                        {typeStyle.icon}
                                                        {typeStyle.label}
                                                    </div>
                                                </td>

                                                {/* Location */}
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin size={14} className="flex-shrink-0 text-zinc-400" />
                                                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                                                                {getLocationName(log.location_id)}
                                                            </span>
                                                        </div>
                                                        {log.type === 'TRANSFER' && log.to_location_id && (
                                                            <div className="flex items-center gap-2 ml-1 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800">
                                                                <ArrowRightLeft size={12} className="text-zinc-400" />
                                                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                                    ไปที่: <span className="font-medium text-zinc-700 dark:text-zinc-300">{getLocationName(log.to_location_id)}</span>
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Numbers */}
                                                <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                                                    {log.previous_balance.toLocaleString()}
                                                </td>
                                                <td className={`whitespace-nowrap px-6 py-4 text-right tabular-nums font-bold ${qtyColor}`}>
                                                    {qtySign}{log.quantity.toLocaleString()}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                                                    {log.new_balance.toLocaleString()}
                                                </td>

                                                {/* User */}
                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                                                            <UserIcon size={12} className="text-zinc-500 dark:text-zinc-400" />
                                                        </div>
                                                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{log.user?.name || 'SYSTEM'}</span>
                                                    </div>
                                                </td>

                                                {/* Ref/Notes */}
                                                <td className="whitespace-nowrap px-6 py-4 max-w-[250px] overflow-hidden text-ellipsis">
                                                    <div className="flex flex-col gap-1">
                                                        {log.ref_document && (
                                                            <span className="inline-flex w-fit items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                                                {log.ref_document}
                                                            </span>
                                                        )}
                                                        {log.notes && (
                                                            <span className="text-xs text-zinc-500 truncate dark:text-zinc-400" title={log.notes}>
                                                                {log.notes}
                                                            </span>
                                                        )}
                                                        {!log.ref_document && !log.notes && <span className="text-xs text-zinc-400">-</span>}
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
            </div>
        </div>,
        document.body
    );
}
