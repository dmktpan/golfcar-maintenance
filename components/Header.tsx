'use client';

import React, { useMemo } from 'react';
import { User, View, Part, Job } from '@/lib/data';
import { AdminDashboardIcon, GolfCartIcon, HistoryIcon, LogoutIcon, PendingJobsIcon, ProfileIcon, StockIcon } from './icons';
import styles from './Header.module.css';

interface HeaderProps {
    user: User;
    onLogout: () => void;
    setView: (view: View) => void;
    parts: Part[];
    jobs?: Job[];
}

const Header = ({ user, onLogout, setView, parts, jobs = [] }: HeaderProps) => {
    // === Permission Logic (Synchronized with AdminDashboard) ===
    const getDefaultPermissions = (role: string): string[] => {
        switch (role) {
            case 'admin':
                return [
                    'pending_jobs:view', 'pending_jobs:approve', 'central_job:create', 'multi_assign:manage',
                    'history:view', 'history:edit', 'golf_course:view', 'golf_course:edit',
                    'users:view', 'users:edit', 'system:manage', 'serial_history:view', 'stock:view', 'stock:edit', 'stock:deduct'
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
                    'golf_course_management', 'serial_history:view', 'stock:view', 'stock:edit', 'stock:deduct'
                ];
            case 'clerk':
                return [
                    'history:view', 'golf_course:view', 'stock:view'
                ];
            case 'staff':
                return [];
            default:
                return [];
        }
    };

    const effectivePermissions = (user.permissions && user.permissions.length > 0)
        ? user.permissions
        : getDefaultPermissions(user.role);

    const hasPermission = (permissionId: string): boolean => {
        return effectivePermissions.includes(permissionId);
    };

    // === Permission Flags ===
    const canViewAdminDashboard = effectivePermissions.some(p => 
        ['pending_jobs', 'history', 'golf_course', 'users', 'system', 'serial_history'].some(area => p.startsWith(area))
    );
    const canViewPendingJobs = hasPermission('pending_jobs:view');
    const canViewStock = hasPermission('stock:view');
    const canViewHistory = hasPermission('history:view');

    // === Notification Logic ===
    const lowStockPartsCount = useMemo(() => {
         return parts.filter(part => part.stock_qty <= (part.min_qty || 0)).length;
     }, [parts]);

    const pendingStockJobsCount = useMemo(() => {
        return jobs.filter(j => j.type === 'PART_REQUEST' && j.status === 'stock_pending').length;
    }, [jobs]);

    const totalStockNotifications = lowStockPartsCount + pendingStockJobsCount;

    // === Event Handlers ===
    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, view: View) => {
        e.preventDefault();
        setView(view);
    };
    
    const handleLogoutClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onLogout();
    }

    return (
        <header className={styles.header}>
            <div 
                className={styles.headerTitle} 
                onClick={() => setView('dashboard')} 
                style={{ cursor: 'pointer' }}
            >
                <GolfCartIcon />
                <span>GolfCart Maintenance</span>
            </div>
            
            <div className={styles.userInfo}>
                <nav className={styles.headerNav}>
                    {/* 1. Profile - Available to everyone */}
                    <a href="#" onClick={(e) => handleNavClick(e, 'profile')} title="โปรไฟล์" className={styles.navLink}>
                        <ProfileIcon /> <span>โปรไฟล์</span>
                    </a>

                    {/* 2. Admin Dashboard - Based on permissions */}
                    {canViewAdminDashboard && (
                        <a href="#" onClick={(e) => handleNavClick(e, 'admin_dashboard')} title="แดชบอร์ดผู้ดูแล" className={styles.navLink}>
                            <AdminDashboardIcon /> <span>แดชบอร์ดผู้ดูแล</span>
                        </a>
                    )}

                    {/* 3. Pending Jobs - Based on permissions */}
                    {canViewPendingJobs && (
                        <a href="#" onClick={(e) => handleNavClick(e, 'supervisor_pending_jobs')} title="งานที่รอตรวจสอบ" className={styles.navLink}>
                            <PendingJobsIcon /> <span>งานที่รอตรวจสอบ</span>
                        </a>
                    )}

                    {/* 4. Stock Management - Based on permissions */}
                    {canViewStock && (
                        <a href="#" onClick={(e) => handleNavClick(e, 'stock_management')} title="จัดการสต็อกอะไหล่" className={styles.navLink}>
                            <StockIcon /> 
                            <span>
                                จัดการสต็อก
                                {totalStockNotifications > 0 && (
                                    <span 
                                        className={styles.notificationBadge}
                                        style={{
                                            backgroundColor: pendingStockJobsCount > 0 ? '#f59e0b' : '#ef4444',
                                        }}
                                        title={pendingStockJobsCount > 0 ? `รอตัดจ่าย: ${pendingStockJobsCount} รายการ` : `อะไหล่เหลือน้อย: ${lowStockPartsCount} รายการ`}
                                    >
                                        {totalStockNotifications}
                                    </span>
                                )}
                            </span>
                        </a>
                    )}

                    {/* 5. Maintenance History - Based on permissions */}
                    {canViewHistory && (
                        <a href="#" onClick={(e) => handleNavClick(e, 'history')} title="ประวัติการซ่อมบำรุง" className={styles.navLink}>
                            <HistoryIcon /> <span>ประวัติซ่อมบำรุง</span>
                        </a>
                    )}

                    {/* 6. Logout */}
                    <a href="#" onClick={handleLogoutClick} title="ออกจากระบบ" className={styles.logoutLink}>
                        <LogoutIcon /> <span>ออกจากระบบ ({user.name})</span>
                    </a>
                </nav>
            </div>
        </header>
    );
};

export default Header;