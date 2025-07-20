'use client';

import React from 'react';
import { View } from '@/lib/data';
import { GearsIcon, UserPlusIcon, ChecklistIcon, ClipboardIcon, UserShieldIcon, SerialHistoryIcon } from './icons';
import styles from './AdminDashboard.module.css';

interface AdminDashboardCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    buttonText: string;
    onClick: () => void;
}

const AdminDashboardCard = ({ icon, title, description, buttonText, onClick }: AdminDashboardCardProps) => {
    return (
        <div className={styles.adminDashboardCard}>
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
}

const AdminDashboard = ({ setView }: AdminDashboardProps) => {
    return (
        <div className={styles.adminDashboard}>
            <h2 className={styles.adminDashboardTitle}>ระบบจัดการสำหรับผู้ดูแล</h2>
            <div className={styles.adminDashboardGrid}>
                <AdminDashboardCard 
                    icon={<GearsIcon />} 
                    title="จัดการสนามและซีเรียล"
                    description="จัดการข้อมูลสนามและซีเรียลรถกอล์ฟ"
                    buttonText="จัดการข้อมูล"
                    onClick={() => setView('golf_course_management')}
                />
                <AdminDashboardCard 
                    icon={<UserPlusIcon />} 
                    title="จัดการผู้ใช้งาน"
                    description="เพิ่ม แก้ไข และจัดการสิทธิ์ผู้ใช้งาน"
                    buttonText="จัดการผู้ใช้"
                    onClick={() => setView('manage_users')}
                />
                <AdminDashboardCard 
                    icon={<ChecklistIcon />} 
                    title="งานที่รอตรวจสอบ"
                    description="ตรวจสอบและอนุมัติงานซ่อมบำรุง"
                    buttonText="ดูงานที่รอ"
                    onClick={() => setView('supervisor_pending_jobs')}
                />
                <AdminDashboardCard 
                    icon={<ClipboardIcon />} 
                    title="มอบหมายงานหลายคน"
                    description="มอบหมายงานให้พนักงานหลายคนพร้อมกัน"
                    buttonText="มอบหมายงาน"
                    onClick={() => setView('multi_assign')}
                />
                <AdminDashboardCard 
                    icon={<UserShieldIcon />} 
                    title="จัดการระบบ"
                    description="ตั้งค่าระบบและจัดการสิทธิ์ขั้นสูง"
                    buttonText="จัดการระบบ"
                    onClick={() => setView('admin_management')}
                />
                <AdminDashboardCard 
                    icon={<SerialHistoryIcon />} 
                    title="ประวัติซีเรียล"
                    description="ดูประวัติการใช้งานและซ่อมบำรุงของรถแต่ละคัน"
                    buttonText="ดูประวัติ"
                    onClick={() => setView('serial_history')}
                />
                <AdminDashboardCard 
                    icon={<GearsIcon />} 
                    title="จัดการอะไหล่"
                    description="ดู Log การใช้อะไหล่และจัดการสต็อกอะไหล่"
                    buttonText="จัดการอะไหล่"
                    onClick={() => setView('parts_management')}
                />
            </div>
        </div>
    );
}

export default AdminDashboard;