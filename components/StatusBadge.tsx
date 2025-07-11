
'use client';

import { JobStatus } from '@/lib/data';

interface StatusBadgeProps {
    status: JobStatus;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
    const statusMap: Record<JobStatus, { text: string; className: string }> = {
        pending: { text: 'รอตรวจสอบ', className: 'pending' },
        approved: { text: 'อนุมัติแล้ว', className: 'approved' },
        rejected: { text: 'ไม่อนุมัติ', className: 'rejected' },
        assigned: { text: 'มอบหมายแล้ว', className: 'assigned' },
    };
    const {text, className} = statusMap[status] || { text: 'Unknown', className: 'rejected' };
    return <span className={`status-badge ${className}`}>{text}</span>;
}

export default StatusBadge;
