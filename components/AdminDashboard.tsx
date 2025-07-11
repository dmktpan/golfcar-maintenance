'use client';

import React from 'react';
import { View } from '@/app/page';
import { GearsIcon, UserPlusIcon, ChecklistIcon, ClipboardIcon, UserShieldIcon, SerialHistoryIcon, MultiAssignIcon } from './icons';

interface AdminDashboardCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    buttonText: string;
    onClick: () => void;
}

const AdminDashboardCard = ({ icon, title, description, buttonText, onClick }: AdminDashboardCardProps) => {
    return (
        <div className="admin-card">
            <div className="admin-card-icon">{icon}</div>
            <h3 className="admin-card-title">{title}</h3>
            <p className="admin-card-description">{description}</p>
            <button className="btn-accent" onClick={onClick}>{buttonText}</button>
        </div>
    );
};

interface AdminDashboardProps {
    setView: (view: View) => void;
}

const AdminDashboard = ({ setView }: AdminDashboardProps) => {
    return (
        <div className="admin-dashboard">
            <h2 className="admin-dashboard-title">ระบบจัดการสำหรับผู้ดูแล</h2>
            <div className="admin-dashboard-grid">
                <AdminDashboardCard 
                    icon={<GearsIcon />} 
                    title="จัดการสนามและซีเรียล"
                    description="จัดการข้อมูลสนามและซีเรียลรถกอล์ฟ"
                    buttonText="จัดการข้อมูล"
                    onClick={() => setView('golf_course_management')}
                />
                 <AdminDashboardCard 
                    icon={<UserPlusIcon />} 
                    title="ลงทะเบียนพนักงาน"
                    description="เพิ่มและจัดการข้อมูลพนักงาน"
                    buttonText="จัดการพนักงาน"
                    onClick={() => setView('manage_users')}
                />
                 <AdminDashboardCard 
                    icon={<ChecklistIcon />} 
                    title="จัดการงาน"
                    description="จัดการงานที่มอบหมายทั้งหมด"
                    buttonText="จัดการงาน"
                    onClick={() => setView('dashboard')}
                />
                 <AdminDashboardCard 
                    icon={<ClipboardIcon />} 
                    title="บันทึกการบำรุงรักษา"
                    description="จัดการบันทึกการบำรุงรักษา"
                    buttonText="ดูบันทึก"
                    onClick={() => setView('history')}
                />
                  <AdminDashboardCard 
                    icon={<UserShieldIcon />} 
                    title="จัดการผู้ดูแล"
                    description="จัดการผู้ดูแลและระบบสิทธิ์"
                    buttonText="จัดการผู้ดูแล"
                    onClick={() => setView('admin_management')}
                />
                 <AdminDashboardCard 
                    icon={<SerialHistoryIcon />} 
                    title="ประวัติซีเรียล"
                    description="ดูประวัติหมายเลขซีเรียล"
                    buttonText="ดูประวัติ"
                    onClick={() => setView('serial_history')}
                />
                 <AdminDashboardCard 
                    icon={<MultiAssignIcon />} 
                    title="มอบหมายงานหลายรายการ"
                    description="จัดการงานหลายรายการพร้อมกัน"
                    buttonText="มอบหมายงาน"
                    onClick={() => setView('multi_assign')}
                />
            </div>
        </div>
    );
}

export default AdminDashboard;