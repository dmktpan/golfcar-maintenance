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
    user: User;
    jobs: Job[];
}

const AdminDashboard = ({ setView, user, jobs }: AdminDashboardProps) => {
    // คำนวณจำนวนงานที่รอตรวจสอบ
    const pendingJobsCount = jobs.filter(job => job.status === 'pending').length;
    const isAdmin = user.role === 'admin';
    const isSupervisor = user.role === 'supervisor';
    return (
        <div className={styles.adminDashboard}>
            <h2 className={styles.adminDashboardTitle}>ระบบจัดการสำหรับผู้ดูแล</h2>
            <div className={styles.adminDashboardGrid}>
                {/* 1. งานที่รอตรวจสอบ - ใช้งานบ่อยที่สุด */}
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
                
                {/* 2. สร้างงานซ่อม - ส่วนกลาง */}
                {(isAdmin || isSupervisor) && (
                    <AdminDashboardCard 
                        icon={<ToolsIcon />} 
                        title="สร้างงานซ่อม - ส่วนกลาง"
                        description="สร้างงานซ่อมบำรุงสำหรับรถในสนามต่างๆ"
                        buttonText="สร้างงาน"
                        onClick={() => setView('central_create_job')}
                    />
                )}
                
                {/* 3. มอบหมายงานหลายคน */}
                <AdminDashboardCard 
                    icon={<ClipboardIcon />} 
                    title="มอบหมายงานหลายคน"
                    description="มอบหมายงานให้พนักงานหลายคนพร้อมกัน"
                    buttonText="มอบหมายงาน"
                    onClick={() => setView('multi_assign')}
                />
                
                {/* 4. ประวัติซ่อมบำรุง - ย้ายมาจาก Header */}
                <AdminDashboardCard 
                    icon={<HistoryIcon />} 
                    title="ประวัติซ่อมบำรุง"
                    description="ดูประวัติการซ่อมบำรุงทั้งหมดของระบบ"
                    buttonText="ดูประวัติ"
                    onClick={() => setView('history')}
                />
                
                {/* 5. จัดการสนามและซีเรียล */}
                <AdminDashboardCard 
                    icon={<GearsIcon />} 
                    title="จัดการสนามและซีเรียล"
                    description="จัดการข้อมูลสนามและซีเรียลรถกอล์ฟ"
                    buttonText="จัดการข้อมูล"
                    onClick={() => setView('golf_course_management')}
                />
                
                {/* 6. จัดการผู้ใช้งาน */}
                {(isAdmin || isSupervisor) && (
                    <AdminDashboardCard 
                        icon={<UserPlusIcon />} 
                        title="จัดการผู้ใช้งาน"
                        description="เพิ่ม แก้ไข และจัดการสิทธิ์ผู้ใช้งาน"
                        buttonText="จัดการผู้ใช้"
                        onClick={() => setView('manage_users')}
                    />
                )}
                
                {/* 7. จัดการระบบ */}
                {isAdmin && (
                    <AdminDashboardCard 
                        icon={<UserShieldIcon />} 
                        title="จัดการระบบ"
                        description="ตั้งค่าระบบและจัดการสิทธิ์ขั้นสูง"
                        buttonText="จัดการระบบ"
                        onClick={() => setView('admin_management')}
                    />
                )}
                
                {/* 8. ประวัติซีเรียล */}
                <AdminDashboardCard 
                    icon={<SerialHistoryIcon />} 
                    title="ประวัติซีเรียล"
                    description="ดูประวัติการใช้งานและซ่อมบำรุงของรถแต่ละคัน"
                    buttonText="ดูประวัติ"
                    onClick={() => setView('serial_history')}
                />
            </div>
        </div>
    );
}

export default AdminDashboard;