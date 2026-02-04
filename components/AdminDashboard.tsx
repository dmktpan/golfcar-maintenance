'use client';

import React from 'react';
import { View, User, Job } from '@/lib/data';
import { GearsIcon, UserPlusIcon, ChecklistIcon, ClipboardIcon, UserShieldIcon, SerialHistoryIcon, HistoryIcon, ToolsIcon } from './icons';
import styles from './AdminDashboard.module.css';

interface AdminDashboardCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    buttonText: string;
    onClick: () => void;
}

const AdminDashboardCard = ({ icon, title, description, buttonText, onClick, className }: AdminDashboardCardProps & { className?: string }) => {
    return (
        <div className={`${styles.adminDashboardCard} ${className || ''}`}>
            <div className={styles.cardIcon}>{icon}</div>
            <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{title}</h3>
                <p className={styles.cardDescription}>{description}</p>
            </div>
            <button className={styles.cardButton} onClick={onClick}>
                {buttonText}
            </button>
        </div>
    );
};

interface AdminDashboardProps {
    setView: (view: View) => void;
    user: User;
    jobs: Job[];
}

const AdminDashboard = ({ setView, user, jobs }: AdminDashboardProps) => {
    // คำนวณจำนวนงานที่รอตรวจสอบ
    const pendingJobsCount = jobs.filter(job => job.status === 'pending').length;

    // Role for default permissions
    const role = user.role;

    // Default permissions by role (ใช้เมื่อยังไม่ได้ตั้งค่า permissions ให้ user)
    const getDefaultPermissions = (): string[] => {
        switch (role) {
            case 'admin':
                return [
                    'pending_jobs:view', 'pending_jobs:approve', 'central_job:create', 'multi_assign:manage',
                    'history:view', 'history:edit', 'golf_course:view', 'golf_course:edit',
                    'users:view', 'users:edit', 'system:manage', 'serial_history:view', 'stock:view', 'stock:edit'
                ];
            case 'supervisor':
                return [
                    'pending_jobs:view', 'pending_jobs:approve', 'central_job:create', 'multi_assign:manage',
                    'history:view', 'history:edit', 'golf_course:view', 'golf_course:edit',
                    'users:view', 'users:edit', 'serial_history:view', 'stock:view'
                ];
            case 'manager':
                return [
                    'pending_jobs:view', 'pending_jobs:approve', 'central_job:create', 'multi_assign:manage',
                    'history:view', 'golf_course:view', 'golf_course:edit',
                    'users:view', 'users:edit', 'serial_history:view', 'stock:view'
                ];
            case 'central':
                return [
                    'pending_jobs:view', 'central_job:create', 'history:view',
                    'golf_course:view', 'serial_history:view', 'stock:view'
                ];
            case 'stock':
                return [
                    'golf_course:view', 'golf_course:edit', 'serial_history:view', 'stock:view', 'stock:edit'
                ];
            case 'clerk':
                return [
                    'history:view', 'golf_course:view', 'stock:view'
                ];
            case 'staff':
                return [
                    'stock:view'
                ];
            default:
                return [];
        }
    };

    // ใช้ permissions จาก user ถ้ามี หรือใช้ default ตาม role
    const effectivePermissions = (user.permissions && user.permissions.length > 0)
        ? user.permissions
        : getDefaultPermissions();

    // Permission check function
    const hasPermission = (permissionId: string): boolean => {
        return effectivePermissions.includes(permissionId);
    };

    // View Permission checks (แสดง/ซ่อน card)
    const canViewPendingJobs = hasPermission('pending_jobs:view');
    const canCreateCentralJob = hasPermission('central_job:create');
    const canMultiAssign = hasPermission('multi_assign:manage');
    const canViewHistory = hasPermission('history:view');
    const canViewGolfCourse = hasPermission('golf_course:view');
    const canViewUsers = hasPermission('users:view');
    const canManageSystem = hasPermission('system:manage');
    const canViewSerialHistory = hasPermission('serial_history:view');
    const canViewStock = hasPermission('stock:view');

    return (
        <div className={styles.adminDashboard}>
            <h2 className={styles.adminDashboardTitle}>ระบบจัดการสำหรับผู้ดูแล</h2>
            <div className={styles.adminDashboardGrid}>
                {/* 1. งานที่รอตรวจสอบ - ใช้งานบ่อยที่สุด */}
                {canViewPendingJobs && (
                    <AdminDashboardCard
                        icon={
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <ChecklistIcon />
                                {pendingJobsCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '-8px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}>
                                        {pendingJobsCount > 99 ? '99+' : pendingJobsCount}
                                    </span>
                                )}
                            </div>
                        }
                        title={`งานที่รอตรวจสอบ${pendingJobsCount > 0 ? ` (${pendingJobsCount})` : ''}`}
                        description="ตรวจสอบและอนุมัติงานซ่อมบำรุง"
                        buttonText="ดูงานที่รอ"
                        onClick={() => setView('supervisor_pending_jobs')}
                    />
                )}

                {/* 2. สร้างงานซ่อม - ส่วนกลาง */}
                {canCreateCentralJob && (
                    <AdminDashboardCard
                        icon={<ToolsIcon />}
                        title="สร้างงานซ่อม - ส่วนกลาง"
                        description="สร้างงานซ่อมบำรุงสำหรับรถในสนามต่างๆ"
                        buttonText="สร้างงาน"
                        onClick={() => setView('central_create_job')}
                        className={styles.greenGradientCard}
                    />
                )}

                {/* 3. มอบหมายงานหลายคน */}
                {canMultiAssign && (
                    <AdminDashboardCard
                        icon={<ClipboardIcon />}
                        title="มอบหมายงานหลายคน"
                        description="มอบหมายงานให้พนักงานหลายคนพร้อมกัน"
                        buttonText="มอบหมายงาน"
                        onClick={() => setView('multi_assign')}
                    />
                )}

                {/* 4. ประวัติซ่อมบำรุง - ย้ายมาจาก Header */}
                {canViewHistory && (
                    <AdminDashboardCard
                        icon={<HistoryIcon />}
                        title="ประวัติซ่อมบำรุง"
                        description="ดูประวัติการซ่อมบำรุงทั้งหมดของระบบ"
                        buttonText="ดูประวัติ"
                        onClick={() => setView('history')}
                    />
                )}

                {/* 5. จัดการสนามและซีเรียล */}
                {canViewGolfCourse && (
                    <AdminDashboardCard
                        icon={<GearsIcon />}
                        title="จัดการสนามและซีเรียล"
                        description="จัดการข้อมูลสนามและซีเรียลรถกอล์ฟ"
                        buttonText="จัดการข้อมูล"
                        onClick={() => setView('golf_course_management')}
                    />
                )}

                {/* 6. จัดการผู้ใช้งาน */}
                {canViewUsers && (
                    <AdminDashboardCard
                        icon={<UserPlusIcon />}
                        title="จัดการผู้ใช้งาน"
                        description="เพิ่ม แก้ไข และจัดการสิทธิ์ผู้ใช้งาน"
                        buttonText="จัดการผู้ใช้"
                        onClick={() => setView('manage_users')}
                    />
                )}

                {/* 7. จัดการระบบ */}
                {canManageSystem && (
                    <AdminDashboardCard
                        icon={<UserShieldIcon />}
                        title="จัดการระบบ"
                        description="ตั้งค่าระบบและจัดการสิทธิ์ขั้นสูง"
                        buttonText="จัดการระบบ"
                        onClick={() => setView('admin_management')}
                    />
                )}

                {/* 8. ประวัติซีเรียล */}
                {canViewSerialHistory && (
                    <AdminDashboardCard
                        icon={<SerialHistoryIcon />}
                        title="ประวัติซีเรียล"
                        description="ดูประวัติการใช้งานและซ่อมบำรุงของรถแต่ละคัน"
                        buttonText="ดูประวัติ"
                        onClick={() => setView('serial_history')}
                    />
                )}

                {/* 9. ระบบจัดการสต็อก */}
                {canViewStock && (
                    <AdminDashboardCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>}
                        title="ระบบจัดการสต็อก"
                        description="จัดการอะไหล่และวัสดุสิ้นเปลือง"
                        buttonText="จัดการสต็อก"
                        onClick={() => setView('stock_management')}
                    />
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;