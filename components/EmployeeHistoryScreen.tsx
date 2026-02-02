'use client';

import React, { useState } from 'react';
import { User, GolfCourse, View } from '@/lib/data';
import styles from './ManageUsersScreen.module.css';

interface EmployeeHistoryScreenProps {
    setView: (view: View) => void;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    golfCourses: GolfCourse[];
}

const EmployeeHistoryScreen = ({ setView, users, setUsers, golfCourses }: EmployeeHistoryScreenProps) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter only disabled users
    const disabledUsers = users.filter(user =>
        user.is_active === false && (
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const getGolfCourseName = (id: string) => {
        const course = golfCourses.find(c => c.id === id);
        return course ? course.name : 'ไม่ระบุ';
    };

    // เปิดใช้งานผู้ใช้อีกครั้ง
    const handleReactivateUser = async (targetUser: User) => {
        if (window.confirm(`คุณต้องการเปิดใช้งานบัญชี "${targetUser.name}" อีกครั้งหรือไม่?`)) {
            try {
                const response = await fetch(`/api/users/${targetUser.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ is_active: true })
                });

                if (response.ok) {
                    const result = await response.json();
                    setUsers(users.map(u =>
                        u.id === targetUser.id ? { ...u, is_active: true, disabled_at: undefined } : u
                    ));
                    alert(result.message);
                } else {
                    const error = await response.json();
                    alert(`เกิดข้อผิดพลาด: ${error.message}`);
                }
            } catch (error) {
                console.error('Error reactivating user:', error);
                alert('เกิดข้อผิดพลาดในการเปิดใช้งาน');
            }
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="card">
            <div className="page-header">
                <h2>📋 ประวัติพนักงาน (ถูกระงับ)</h2>
                <button className="btn-outline" onClick={() => setView('manage_users')}>กลับไปจัดการผู้ใช้</button>
            </div>

            <div className="section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                        รายชื่อพนักงานที่ถูกระงับการใช้งาน - ข้อมูลงานยังคงอยู่ในระบบ
                    </p>
                    <div className="search-box" style={{ width: '300px' }}>
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, รหัส หรือ username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #ddd',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>รหัสพนักงาน</th>
                            <th>ชื่อ-นามสกุล</th>
                            <th>ตำแหน่ง</th>
                            <th>สนามกอล์ฟ</th>
                            <th>วันที่ถูกระงับ</th>
                            <th>การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {disabledUsers.length > 0 ? (
                            disabledUsers.map(user => (
                                <tr key={user.id} style={{ backgroundColor: '#fef2f2' }}>
                                    <td>
                                        <span className={styles.userCode}>{user.code}</span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{user.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{user.username}</div>
                                    </td>
                                    <td>
                                        <span className={`${styles.roleBadge} ${user.role === 'admin' ? styles.roleAdmin :
                                            user.role === 'supervisor' ? styles.roleSupervisor :
                                                user.role === 'central' ? styles.roleCentral :
                                                    styles.roleStaff
                                            }`} style={{ opacity: 0.6 }}>
                                            {user.role === 'staff' && 'พนักงานทั่วไป'}
                                            {user.role === 'supervisor' && 'หัวหน้างาน'}
                                            {user.role === 'central' && 'ส่วนกลาง'}
                                            {user.role === 'admin' && 'ผู้ดูแลระบบ'}
                                        </span>
                                    </td>
                                    <td>{getGolfCourseName(user.golf_course_id)}</td>
                                    <td style={{ color: '#dc2626', fontSize: '0.85rem' }}>
                                        {formatDate(user.disabled_at)}
                                    </td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            <button
                                                className={styles.editButton}
                                                onClick={() => handleReactivateUser(user)}
                                                style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                                            >
                                                เปิดใช้งาน
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className={styles.noData}>
                                    {searchTerm ? 'ไม่พบพนักงานที่ค้นหา' : 'ไม่มีพนักงานที่ถูกระงับการใช้งาน'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {disabledUsers.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '8px', fontSize: '0.9rem' }}>
                    <strong>💡 หมายเหตุ:</strong> พนักงานที่ถูกระงับจะไม่สามารถเข้าสู่ระบบได้ แต่ข้อมูลงานที่เคยทำไว้จะยังคงอยู่ในระบบ
                    สามารถกดปุ่ม &quot;เปิดใช้งาน&quot; เพื่อให้พนักงานสามารถเข้าสู่ระบบได้อีกครั้ง
                </div>
            )}
        </div>
    );
};

export default EmployeeHistoryScreen;
