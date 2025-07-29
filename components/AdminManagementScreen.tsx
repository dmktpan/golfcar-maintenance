'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole, GolfCourse, View } from '@/lib/data';

interface AdminManagementScreenProps {
    setView: (view: View) => void;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    updateUserPermissions: (userId: number, permissions: string[]) => void;
    getUserPermissions: (userId: number) => string[];
    golfCourses: GolfCourse[];
}

interface Permission {
    id: string;
    name: string;
    description: string;
    roles: UserRole[];
}

const MOCK_PERMISSIONS: Permission[] = [
    { id: 'manage_users', name: 'จัดการผู้ใช้', description: 'สามารถเพิ่ม แก้ไข และลบผู้ใช้ในระบบ', roles: ['admin'] },
    { id: 'manage_admins', name: 'จัดการผู้ดูแล', description: 'สามารถเพิ่ม แก้ไข และลบผู้ดูแลระบบ', roles: ['admin'] },
    { id: 'approve_jobs', name: 'อนุมัติงาน', description: 'สามารถอนุมัติหรือปฏิเสธงานที่ส่งเข้ามา', roles: ['admin', 'supervisor'] },
    { id: 'manage_parts', name: 'จัดการอะไหล่', description: 'สามารถเพิ่ม แก้ไข และลบข้อมูลอะไหล่', roles: ['admin', 'supervisor'] },
    { id: 'view_reports', name: 'ดูรายงาน', description: 'สามารถดูรายงานต่างๆ ในระบบ', roles: ['admin', 'supervisor'] },
    { id: 'manage_golf_courses', name: 'จัดการสนามกอล์ฟ', description: 'สามารถเพิ่ม แก้ไข และลบข้อมูลสนามกอล์ฟ', roles: ['admin'] },
    { id: 'manage_vehicles', name: 'จัดการรถกอล์ฟ', description: 'สามารถเพิ่ม แก้ไข และลบข้อมูลรถกอล์ฟ', roles: ['admin', 'supervisor'] },
];

const AdminManagementScreen = ({ setView, users, setUsers, updateUserPermissions, getUserPermissions, golfCourses }: AdminManagementScreenProps) => {
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [currentUserPermissions, setCurrentUserPermissions] = useState<string[]>([]);
    const [editMode, setEditMode] = useState(false);

    // กรองผู้ใช้ที่มีสิทธิ์ระดับ supervisor หรือ admin เท่านั้น
    useEffect(() => {
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
    }, [users, searchTerm, selectedRole]);

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        // ดึงสิทธิ์ของผู้ใช้จาก props
        const permissions = getUserPermissions(user.id);
        
        // ถ้าไม่มีสิทธิ์ที่บันทึกไว้ ให้กำหนดสิทธิ์เริ่มต้นตามบทบาท
        if (permissions.length === 0) {
            const defaultPermissions = MOCK_PERMISSIONS
                .filter(permission => permission.roles.includes(user.role))
                .map(permission => permission.id);
            setCurrentUserPermissions(defaultPermissions);
        } else {
            setCurrentUserPermissions(permissions);
        }
        
        setEditMode(true);
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
            const permissions = MOCK_PERMISSIONS
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

    const handleSavePermissions = () => {
        if (!selectedUser) return;
        
        // บันทึกสิทธิ์ของผู้ใช้
        updateUserPermissions(selectedUser.id, currentUserPermissions);
        
        alert(`บันทึกสิทธิ์สำหรับ ${selectedUser.name} เรียบร้อยแล้ว`);
        setEditMode(false);
        setSelectedUser(null);
        setCurrentUserPermissions([]);
    };

    const getGolfCourseName = (id: string) => {
        const course = golfCourses.find(c => c.id === id);
        return course ? course.name : 'ไม่ระบุ';
    };

    return (
        <div className="card">
            <div className="page-header">
                <h2>จัดการผู้ดูแลและระบบสิทธิ์</h2>
                <button className="btn-outline" onClick={() => setView('admin_dashboard')}>กลับไปหน้าหลัก</button>
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

            <div style={{overflowX: 'auto'}}>
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

            {editMode && selectedUser && (
                <div className="card" style={{ marginTop: '2rem' }}>
                    <h3>จัดการสิทธิ์สำหรับ: {selectedUser.name}</h3>
                    <p>ตำแหน่ง: {selectedUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'หัวหน้างาน'}</p>
                    
                    <div style={{ marginTop: '1rem' }}>
                        <h4>สิทธิ์การใช้งาน:</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                            {MOCK_PERMISSIONS.map(permission => (
                                <div key={permission.id} className="checkbox-group">
                                    <input 
                                        type="checkbox" 
                                        id={`permission-${permission.id}`} 
                                        checked={currentUserPermissions.includes(permission.id)}
                                        onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                        disabled={!permission.roles.includes(selectedUser.role)}
                                    />
                                    <label htmlFor={`permission-${permission.id}`}>
                                        <strong>{permission.name}</strong>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{permission.description}</div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="form-actions">
                        <button className="btn-primary" onClick={handleSavePermissions}>บันทึกสิทธิ์</button>
                        <button 
                            className="btn-secondary" 
                            onClick={() => {
                                setEditMode(false);
                                setSelectedUser(null);
                                setCurrentUserPermissions([]);
                            }}
                        >
                            ยกเลิก
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagementScreen;