'use client';

import React from 'react';
import { User } from '@/lib/data';
import { View } from '@/app/page';
import { AdminDashboardIcon, GolfCartIcon, HistoryIcon, LogoutIcon, PendingJobsIcon, ProfileIcon } from './icons';

interface HeaderProps {
    user: User;
    onLogout: () => void;
    setView: (view: View) => void;
}

const Header = ({ user, onLogout, setView }: HeaderProps) => {
    const isAdminOrSuper = user.role === 'admin' || user.role === 'supervisor';

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, view: View) => {
        e.preventDefault();
        setView(view);
    };
    
    const handleLogoutClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onLogout();
    }

    return (
        <header className="header">
            <div className="header-title" onClick={() => setView(isAdminOrSuper ? 'admin_dashboard' : 'dashboard')} style={{ cursor: 'pointer' }}>
                <GolfCartIcon />
                <span>GolfCart Maintenance</span>
            </div>
            <div className="user-info">
                {isAdminOrSuper ? (
                    <nav className="header-nav">
                        <a href="#" onClick={(e) => handleNavClick(e, 'profile')} title="โปรไฟล์"><ProfileIcon /> โปรไฟล์</a>
                        <a href="#" onClick={(e) => handleNavClick(e, 'admin_dashboard')} title="แดชบอร์ดผู้ดูแล"><AdminDashboardIcon /> แดชบอร์ดผู้ดูแล</a>
                        <a href="#" onClick={(e) => handleNavClick(e, 'dashboard')} title="งานที่รอตรวจสอบ"><PendingJobsIcon /> งานที่รอตรวจสอบ</a>
                        <a href="#" onClick={(e) => handleNavClick(e, 'history')} title="ประวัติการซ่อมบำรุง"><HistoryIcon /> ประวัติซ่อมบำรุง</a>
                        <a href="#" onClick={handleLogoutClick} title="ออกจากระบบ"><LogoutIcon /> ออกจากระบบ ({user.name})</a>
                    </nav>
                ) : (
                    <>
                        <span>สวัสดี, <strong>{user.name}</strong></span>
                        <button onClick={onLogout} className="btn-outline" style={{borderColor: 'white', color: 'white'}}>ออกจากระบบ</button>
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;