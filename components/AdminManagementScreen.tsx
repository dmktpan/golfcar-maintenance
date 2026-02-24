'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole, GolfCourse, View } from '@/lib/data';

interface AdminManagementScreenProps {
    setView: (view: View) => void;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    updateUserPermissions: (userId: number, permissions: string[]) => Promise<boolean>;
    getUserPermissions: (userId: number) => string[];
    golfCourses: GolfCourse[];
    user: User;
}

interface Permission {
    id: string;
    name: string;
    description: string;
    roles: UserRole[];
    category: 'view' | 'action'; // view = ดูได้, action = แก้ไข/ดำเนินการได้
    relatedTo?: string; // เชื่อมโยงกับ permission อื่น (เช่น approve เชื่อมกับ view)
}

// สิทธิ์ดู (View Permissions)
const VIEW_PERMISSIONS: Permission[] = [
    { id: 'pending_jobs:view', name: 'ดูงานที่รอตรวจสอบ', description: 'ดูรายการงานที่รอการอนุมัติ', roles: ['admin', 'supervisor', 'manager', 'central'], category: 'view' },
    { id: 'history:view', name: 'ดูประวัติซ่อมบำรุง', description: 'ดูประวัติการซ่อมบำรุงทั้งหมด', roles: ['admin', 'supervisor', 'manager', 'clerk', 'central'], category: 'view' },
    { id: 'golf_course:view', name: 'ดูข้อมูลสนามและซีเรียล', description: 'ดูข้อมูลสนามและรถกอล์ฟ', roles: ['admin', 'supervisor', 'manager', 'stock', 'clerk', 'central'], category: 'view' },
    { id: 'users:view', name: 'ดูรายชื่อผู้ใช้งาน', description: 'ดูรายชื่อผู้ใช้ในระบบ', roles: ['admin', 'supervisor', 'manager'], category: 'view' },
    { id: 'serial_history:view', name: 'ดูประวัติซีเรียล', description: 'ดูประวัติการใช้งานรถแต่ละคัน', roles: ['admin', 'supervisor', 'manager', 'stock', 'central'], category: 'view' },
    { id: 'stock:view', name: 'ดูระบบสต็อก', description: 'ดูรายการอะไหล่และวัสดุสิ้นเปลือง', roles: ['admin', 'supervisor', 'manager', 'stock', 'clerk', 'staff', 'central'], category: 'view' },
];

// สิทธิ์แก้ไข/ดำเนินการ (Action Permissions)
const ACTION_PERMISSIONS: Permission[] = [
    { id: 'pending_jobs:approve', name: 'อนุมัติ/ปฏิเสธงาน', description: 'สามารถอนุมัติหรือปฏิเสธงานที่รอตรวจสอบ', roles: ['admin', 'supervisor', 'manager'], category: 'action', relatedTo: 'pending_jobs:view' },
    { id: 'central_job:create', name: 'สร้างงานซ่อม-ส่วนกลาง', description: 'สร้างงานซ่อมสำหรับทุกสนาม', roles: ['admin', 'supervisor', 'manager', 'central'], category: 'action' },
    { id: 'multi_assign:manage', name: 'มอบหมายงานหลายคน', description: 'มอบหมายงานให้หลายคนพร้อมกัน', roles: ['admin', 'supervisor', 'manager'], category: 'action' },
    { id: 'history:edit', name: 'แก้ไขประวัติซ่อมบำรุง', description: 'แก้ไขข้อมูลประวัติการซ่อมบำรุง', roles: ['admin', 'supervisor'], category: 'action', relatedTo: 'history:view' },
    { id: 'golf_course:edit', name: 'แก้ไขข้อมูลสนามและซีเรียล', description: 'เพิ่ม แก้ไข ลบข้อมูลสนามและรถกอล์ฟ', roles: ['admin', 'supervisor', 'manager', 'stock'], category: 'action', relatedTo: 'golf_course:view' },
    { id: 'users:edit', name: 'แก้ไขผู้ใช้งาน', description: 'เพิ่ม แก้ไข และลบผู้ใช้งาน', roles: ['admin', 'supervisor', 'manager'], category: 'action', relatedTo: 'users:view' },
    { id: 'system:manage', name: 'จัดการระบบ', description: 'ตั้งค่าระบบและจัดการสิทธิ์ขั้นสูง', roles: ['admin'], category: 'action' },
    { id: 'part_request:approve', name: 'อนุมัติใบเบิกอะไหล่', description: 'สามารถอนุมัติหรือปฏิเสธใบเบิกอะไหล่ (MWR)', roles: ['admin', 'supervisor', 'stock'], category: 'action', relatedTo: 'stock:view' },
    { id: 'stock:edit', name: 'แก้ไขระบบสต็อก', description: 'เพิ่ม แก้ไข ลบอะไหล่และวัสดุสิ้นเปลือง', roles: ['admin', 'stock'], category: 'action', relatedTo: 'stock:view' },
];

// รวมทั้งหมด
const ALL_PERMISSIONS: Permission[] = [...VIEW_PERMISSIONS, ...ACTION_PERMISSIONS];

const AdminManagementScreen = ({ setView, users, setUsers, updateUserPermissions, getUserPermissions, golfCourses, user }: AdminManagementScreenProps) => {
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [currentUserPermissions, setCurrentUserPermissions] = useState<string[]>([]);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showOnlineUsersModal, setShowOnlineUsersModal] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

    const fetchOnlineUsers = async () => {
        try {
            const res = await fetch('/api/users/online');
            const data = await res.json();
            if (data.users) {
                setOnlineUsers(data.users);
                setShowOnlineUsersModal(true);
            }
        } catch (error) {
            console.error('Failed to fetch online users:', error);
            alert('ไม่สามารถดึงข้อมูลผู้ใช้งานออนไลน์ได้');
        }
    };

    // กรองผู้ใช้ที่มีสิทธิ์ระดับ supervisor หรือ admin เท่านั้น
    useEffect(() => {
        if (user.role !== 'admin') return; // ถ้าไม่ใช่ admin ไม่ต้องทำอะไร

        const admins = users.filter(user =>
            user.role === 'admin' || user.role === 'supervisor'
        );

        let filtered = admins;

        // กรองตามคำค้นหา
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.code.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // กรองตามบทบาท
        if (selectedRole !== 'all') {
            filtered = filtered.filter(user => user.role === selectedRole);
        }

        setFilteredUsers(filtered);
    }, [users, searchTerm, selectedRole, user.role]);

    // ตรวจสอบสิทธิ์ admin
    if (user.role !== 'admin') {
        return (
            <div className="card">
                <div className="page-header">
                    <h2>ไม่มีสิทธิ์เข้าถึง</h2>
                    <button className="btn-outline" onClick={() => setView('admin_dashboard')}>กลับไปหน้าหลัก</button>
                </div>
                <div className="no-access-message">
                    <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถจัดการผู้ใช้และสิทธิ์ได้</p>
                </div>
            </div>
        );
    }

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        // ดึงสิทธิ์ของผู้ใช้จาก user.permissions หรือ getUserPermissions
        const permissions = user.permissions || getUserPermissions(user.id);

        // ถ้าไม่มีสิทธิ์ที่บันทึกไว้ ให้กำหนดสิทธิ์เริ่มต้นตามบทบาท
        if (!permissions || permissions.length === 0) {
            const defaultPermissions = ALL_PERMISSIONS
                .filter(permission => permission.roles.includes(user.role))
                .map(permission => permission.id);
            setCurrentUserPermissions(defaultPermissions);
        } else {
            setCurrentUserPermissions(permissions);
        }

        setShowPermissionModal(true);
    };

    const handleRoleChange = (userId: number, newRole: UserRole) => {
        // อัพเดทบทบาทของผู้ใช้
        const updatedUsers = users.map(user =>
            user.id === userId ? { ...user, role: newRole } : user
        );
        setUsers(updatedUsers);

        // อัพเดทผู้ใช้ที่เลือกอยู่ถ้ามีการเปลี่ยนแปลง
        if (selectedUser && selectedUser.id === userId) {
            setSelectedUser({ ...selectedUser, role: newRole });
            // อัพเดทสิทธิ์ตามบทบาทใหม่
            const permissions = ALL_PERMISSIONS
                .filter(permission => permission.roles.includes(newRole))
                .map(permission => permission.id);
            setCurrentUserPermissions(permissions);
        }
    };

    const handlePermissionChange = (permissionId: string, isChecked: boolean) => {
        if (isChecked) {
            setCurrentUserPermissions([...currentUserPermissions, permissionId]);
        } else {
            setCurrentUserPermissions(currentUserPermissions.filter(id => id !== permissionId));
        }
    };

    const handleSavePermissions = async () => {
        if (!selectedUser) return;

        setIsSaving(true);
        try {
            // บันทึกสิทธิ์ของผู้ใช้ลงฐานข้อมูล
            const success = await updateUserPermissions(selectedUser.id, currentUserPermissions);

            if (success) {
                // อัปเดต users state ด้วย permissions ใหม่
                setUsers(prev => prev.map(u =>
                    u.id === selectedUser.id
                        ? { ...u, permissions: currentUserPermissions }
                        : u
                ));
                alert(`บันทึกสิทธิ์สำหรับ ${selectedUser.name} เรียบร้อยแล้ว`);
                setShowPermissionModal(false);
                setSelectedUser(null);
                setCurrentUserPermissions([]);
            } else {
                alert('เกิดข้อผิดพลาดในการบันทึกสิทธิ์ กรุณาลองใหม่อีกครั้ง');
            }
        } catch (error) {
            console.error('Error saving permissions:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกสิทธิ์');
        } finally {
            setIsSaving(false);
        }
    };

    const getGolfCourseName = (id: string) => {
        const course = golfCourses.find(c => c.id === id);
        return course ? course.name : 'ไม่ระบุ';
    };

    return (
        <div className="card">
            <div className="page-header">
                <h2>จัดการผู้ดูแลและระบบสิทธิ์</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={fetchOnlineUsers}>ตรวจสอบผู้ใช้งานออนไลน์</button>
                    <button className="btn-outline" onClick={() => setView('admin_dashboard')}>กลับไปหน้าหลัก</button>
                </div>
            </div>

            <div className="filter-section">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="ค้นหาตามชื่อหรือรหัสพนักงาน"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-controls">
                    <div className="filter-group">
                        <label>กรองตามบทบาท:</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
                        >
                            <option value="all">ทั้งหมด</option>
                            <option value="admin">ผู้ดูแลระบบ</option>
                            <option value="supervisor">หัวหน้างาน</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="parts-table">
                    <thead>
                        <tr>
                            <th>รหัสพนักงาน</th>
                            <th>ชื่อ-นามสกุล</th>
                            <th>ตำแหน่ง</th>
                            <th>สนามกอล์ฟ</th>
                            <th>การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{user.code}</td>
                                    <td>{user.name}</td>
                                    <td>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                        >
                                            <option value="supervisor">หัวหน้างาน</option>
                                            <option value="admin">ผู้ดูแลระบบ</option>
                                        </select>
                                    </td>
                                    <td>{getGolfCourseName(user.golf_course_id)}</td>
                                    <td>
                                        <button
                                            className="btn-primary btn-sm"
                                            onClick={() => handleSelectUser(user)}
                                        >
                                            จัดการสิทธิ์
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="no-data">ไม่พบข้อมูลผู้ดูแลระบบ</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Permissions Modal */}
            {showPermissionModal && selectedUser && (
                <div
                    className="modal-overlay animate-fadeIn"
                    style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.6)', cursor: 'pointer' }}
                    onClick={() => {
                        if (!isSaving) {
                            setShowPermissionModal(false);
                            setSelectedUser(null);
                            setCurrentUserPermissions([]);
                        }
                    }}
                >
                    <div
                        className="modal-content animate-slideIn"
                        style={{
                            maxWidth: '700px',
                            borderRadius: '24px',
                            padding: '2rem',
                            background: '#ffffff',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            border: '1px solid rgba(0, 0, 0, 0.05)',
                            cursor: 'default'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                                    🔐 จัดการสิทธิ์สำหรับ: {selectedUser.name}
                                </h2>
                                <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                                    ตำแหน่ง: {selectedUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'หัวหน้างาน'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    if (!isSaving) {
                                        setShowPermissionModal(false);
                                        setSelectedUser(null);
                                        setCurrentUserPermissions([]);
                                    }
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: isSaving ? 'not-allowed' : 'pointer',
                                    color: '#64748b',
                                    padding: '0.5rem',
                                    opacity: isSaving ? 0.5 : 1
                                }}
                                disabled={isSaving}
                            >
                                ✕
                            </button>
                        </div>

                        {/* สิทธิ์ดู */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                👁️ สิทธิ์ดู (View)
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                                {VIEW_PERMISSIONS.map(permission => {
                                    const isDisabled = !permission.roles.includes(selectedUser.role);
                                    const isChecked = currentUserPermissions.includes(permission.id);
                                    return (
                                        <div
                                            key={permission.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '0.75rem',
                                                padding: '0.875rem',
                                                background: isDisabled ? '#f8fafc' : isChecked ? '#f0fdf4' : '#ffffff',
                                                borderRadius: '10px',
                                                border: `1px solid ${isDisabled ? '#e2e8f0' : isChecked ? '#22c55e' : '#e2e8f0'}`,
                                                opacity: isDisabled ? 0.6 : 1,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                id={`permission-${permission.id}`}
                                                checked={isChecked}
                                                onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                                disabled={isDisabled || isSaving}
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    marginTop: '2px',
                                                    cursor: isDisabled || isSaving ? 'not-allowed' : 'pointer',
                                                    accentColor: '#22c55e'
                                                }}
                                            />
                                            <label
                                                htmlFor={`permission-${permission.id}`}
                                                style={{ cursor: isDisabled || isSaving ? 'not-allowed' : 'pointer', flex: 1 }}
                                            >
                                                <strong style={{ color: '#1e293b', fontSize: '0.9rem' }}>{permission.name}</strong>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                                                    {permission.description}
                                                </div>
                                                {isDisabled && (
                                                    <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.15rem' }}>
                                                        ❌ ไม่อนุญาตสำหรับตำแหน่งนี้
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* สิทธิ์แก้ไข/ดำเนินการ */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                ✏️ สิทธิ์แก้ไข/ดำเนินการ (Action)
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                                {ACTION_PERMISSIONS.map(permission => {
                                    const isDisabled = !permission.roles.includes(selectedUser.role);
                                    const isChecked = currentUserPermissions.includes(permission.id);
                                    // ถ้ามี relatedTo ต้องมีสิทธิ์ view ก่อน
                                    const needsViewPermission = permission.relatedTo && !currentUserPermissions.includes(permission.relatedTo);
                                    return (
                                        <div
                                            key={permission.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '0.75rem',
                                                padding: '0.875rem',
                                                background: isDisabled || needsViewPermission ? '#f8fafc' : isChecked ? '#fef3c7' : '#ffffff',
                                                borderRadius: '10px',
                                                border: `1px solid ${isDisabled || needsViewPermission ? '#e2e8f0' : isChecked ? '#f59e0b' : '#e2e8f0'}`,
                                                opacity: isDisabled || needsViewPermission ? 0.6 : 1,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                id={`permission-${permission.id}`}
                                                checked={isChecked}
                                                onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                                disabled={isDisabled || isSaving || !!needsViewPermission}
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    marginTop: '2px',
                                                    cursor: isDisabled || isSaving || needsViewPermission ? 'not-allowed' : 'pointer',
                                                    accentColor: '#f59e0b'
                                                }}
                                            />
                                            <label
                                                htmlFor={`permission-${permission.id}`}
                                                style={{ cursor: isDisabled || isSaving || needsViewPermission ? 'not-allowed' : 'pointer', flex: 1 }}
                                            >
                                                <strong style={{ color: '#1e293b', fontSize: '0.9rem' }}>{permission.name}</strong>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                                                    {permission.description}
                                                </div>
                                                {isDisabled && (
                                                    <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.15rem' }}>
                                                        ❌ ไม่อนุญาตสำหรับตำแหน่งนี้
                                                    </div>
                                                )}
                                                {needsViewPermission && !isDisabled && (
                                                    <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '0.15rem' }}>
                                                        ⚠️ ต้องเปิดสิทธิ์ดูก่อน
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                            <button
                                className="btn-primary"
                                onClick={handleSavePermissions}
                                disabled={isSaving}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    opacity: isSaving ? 0.7 : 1,
                                    cursor: isSaving ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isSaving ? (
                                    <>
                                        <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>💾 บันทึกสิทธิ์</>
                                )}
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    setShowPermissionModal(false);
                                    setSelectedUser(null);
                                    setCurrentUserPermissions([]);
                                }}
                                disabled={isSaving}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                    opacity: isSaving ? 0.5 : 1,
                                    cursor: isSaving ? 'not-allowed' : 'pointer'
                                }}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showOnlineUsersModal && (
                <div
                    className="modal-overlay animate-fadeIn"
                    style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.6)', cursor: 'pointer' }}
                    onClick={() => setShowOnlineUsersModal(false)}
                >
                    <div
                        className="modal-content animate-slideIn"
                        style={{
                            maxWidth: '700px',
                            borderRadius: '24px',
                            padding: '2rem',
                            background: '#ffffff',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            border: '1px solid rgba(0, 0, 0, 0.05)',
                            cursor: 'default'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, background: 'linear-gradient(135deg, #1A2533 0%, #2C3E50 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    สถานะผู้ใช้งาน
                                </h2>
                                <p style={{ margin: '0.25rem 0 0 0', opacity: 0.6, fontSize: '0.9rem' }}>
                                    กิจกรรมล่าสุดภายใน 24 ชั่วโมง
                                </p>
                            </div>

                        </div>

                        <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '0.5rem', margin: '0 -1rem' }}>
                            <div style={{ padding: '0 1rem' }}>
                                {onlineUsers.length > 0 ? (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {onlineUsers.map(u => {
                                            const lastActiveDate = new Date(u.lastActive);
                                            const diffMs = Date.now() - lastActiveDate.getTime();
                                            const diffMins = Math.floor(diffMs / (1000 * 60));

                                            let status = 'offline';
                                            let statusColor = '#94a3b8';
                                            let statusText = 'ออฟไลน์';

                                            if (u.isOnline && diffMins < 15) {
                                                status = 'online';
                                                statusColor = '#22c55e';
                                                statusText = 'กำลังออนไลน์';
                                            } else if (u.isOnline && diffMins < 60) {
                                                status = 'away';
                                                statusColor = '#f59e0b';
                                                statusText = 'ไม่อยู่';
                                            }

                                            const getTimeAgo = (mins: number) => {
                                                if (mins < 1) return 'เมื่อสักครู่';
                                                if (mins < 60) return `${mins} นาทีที่แล้ว`;
                                                const hours = Math.floor(mins / 60);
                                                if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
                                                return lastActiveDate.toLocaleDateString('th-TH');
                                            };

                                            return (
                                                <div key={u.id} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '1.25rem',
                                                    background: '#fff',
                                                    borderRadius: '16px',
                                                    border: '1px solid #f1f5f9',
                                                    transition: 'all 0.2s ease',
                                                    cursor: 'default',
                                                    opacity: u.isOnline ? 1 : 0.7 // Slightly fade offline users
                                                }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05)';
                                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                        e.currentTarget.style.borderColor = '#f1f5f9';
                                                    }}>
                                                    <div style={{ position: 'relative', marginRight: '1.25rem' }}>
                                                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: '#475569' }}>
                                                            {u.name.charAt(0)}
                                                        </div>
                                                        <div style={{
                                                            position: 'absolute',
                                                            bottom: '-2px',
                                                            right: '-2px',
                                                            width: '14px',
                                                            height: '14px',
                                                            borderRadius: '50%',
                                                            background: status === 'online' ? '#22c55e' : status === 'away' ? '#f59e0b' : '#94a3b8',
                                                            border: '3px solid #fff',
                                                            boxShadow: status === 'online' ? `0 0 0 2px ${statusColor}40` : 'none',
                                                            animation: status === 'online' ? 'pulse 2s infinite' : 'none'
                                                        }}></div>
                                                    </div>

                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '1rem' }}>{u.name}</span>
                                                            <span style={{ fontSize: '0.8rem', color: '#64748b', background: '#f8fafc', padding: '2px 8px', borderRadius: '6px' }}>@{u.username || u.code}</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                            {u.role === 'admin' ? 'ผู้ดูแลระบบ' : u.role === 'supervisor' ? 'หัวหน้างาน' : 'เจ้าหน้าที่'}
                                                        </div>
                                                    </div>

                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: statusColor }}>
                                                            {statusText}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                                            {status === 'online' ? 'ขณะนี้' : getTimeAgo(diffMins)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.5 }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                        <div style={{ fontWeight: 500 }}>ไม่พบผู้ใช้งานที่มีกิจกรรม</div>
                                        <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>ในรอบ 24 ชั่วโมงที่ผ่านมา</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <button
                                onClick={() => setShowOnlineUsersModal(false)}
                                style={{ width: '100%', padding: '1rem', borderRadius: '16px', background: '#1e293b', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s shadow' }}
                                onMouseOver={(e) => (e.currentTarget.style.background = '#334155')}
                                onMouseOut={(e) => (e.currentTarget.style.background = '#1e293b')}
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>

                        <style dangerouslySetInnerHTML={{
                            __html: `
                            @keyframes pulse {
                                0% { transform: scale(1); opacity: 1; }
                                50% { transform: scale(1.2); opacity: 0.7; }
                                100% { transform: scale(1); opacity: 1; }
                            }
                        `}} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagementScreen;