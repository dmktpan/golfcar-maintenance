'use client';

import React from 'react';
import { User, View } from '@/lib/data';
import { AdminDashboardIcon, GolfCartIcon, HistoryIcon, LogoutIcon, PendingJobsIcon, ProfileIcon } from './icons';
import styles from './Header.module.css';

interface HeaderProps {
    user: User;
    onLogout: () => void;
    setView: (view: View) => void;
}

const Header = ({ user, onLogout, setView }: HeaderProps) => {
    const isAdminOrSuper = user.role === 'admin' || user.role === 'supervisor';
    const isCentral = user.role === 'central';

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
                onClick={() => setView(isAdminOrSuper || isCentral ? 'admin_dashboard' : 'dashboard')} 
                style={{ cursor: 'pointer' }}
            >
                <GolfCartIcon />
                <span>GolfCart Maintenance</span>
            </div>
            <div className={styles.userInfo}>
                {isCentral ? (
                    <nav className={styles.headerNav}>
                        <a href="#" onClick={(e) => handleNavClick(e, 'profile')} title="โปรไฟล์">
                            <ProfileIcon /> <span>โปรไฟล์</span>
                        </a>
                        <a href="#" onClick={(e) => handleNavClick(e, 'central_create_job')} title="สร้างงานส่วนกลาง">
                            <AdminDashboardIcon /> <span>สร้างงานส่วนกลาง</span>
                        </a>
                        <a href="#" onClick={(e) => handleNavClick(e, 'history')} title="ประวัติการซ่อมบำรุง">
                            <HistoryIcon /> <span>ประวัติซ่อมบำรุง</span>
                        </a>
                        <a href="#" onClick={handleLogoutClick} title="ออกจากระบบ">
                            <LogoutIcon /> <span>ออกจากระบบ ({user.name})</span>
                        </a>
                    </nav>
                ) : isAdminOrSuper ? (
                    <nav className={styles.headerNav}>
                        <a href="#" onClick={(e) => handleNavClick(e, 'profile')} title="โปรไฟล์">
                            <ProfileIcon /> <span>โปรไฟล์</span>
                        </a>
                        <a href="#" onClick={(e) => handleNavClick(e, 'admin_dashboard')} title="แดชบอร์ดผู้ดูแล">
                            <AdminDashboardIcon /> <span>แดชบอร์ดผู้ดูแล</span>
                        </a>
                        <a href="#" onClick={(e) => handleNavClick(e, 'supervisor_pending_jobs')} title="งานที่รอตรวจสอบ">
                            <PendingJobsIcon /> <span>งานที่รอตรวจสอบ</span>
                        </a>
                        <a href="#" onClick={(e) => handleNavClick(e, 'history')} title="ประวัตการซ่อมบำรุง">
                            <HistoryIcon /> <span>ประวัติซ่อมบำรุง</span>
                        </a>
                        <a href="#" onClick={handleLogoutClick} title="ออกจากระบบ">
                            <LogoutIcon /> <span>ออกจากระบบ ({user.name})</span>
                        </a>
                    </nav>
                ) : (
                    <>
                        <span>สวัสดี, <strong>{user.name}</strong></span>
                        <button onClick={onLogout} className={styles.logoutButton}>
                            ออกจากระบบ
                        </button>
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;