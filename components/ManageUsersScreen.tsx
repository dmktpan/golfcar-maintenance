'use client';

import React, { useState } from 'react';
import { User, UserRole, GolfCourse, View } from '@/lib/data';
import EditUserModal from './EditUserModal';

interface ManageUsersScreenProps {
    setView: (view: View) => void;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    golfCourses: GolfCourse[];
    user: User;
}

const ManageUsersScreen = ({ setView, users, setUsers, golfCourses, user }: ManageUsersScreenProps) => {
    const isAdmin = user.role === 'admin';

    // State definitions moved to top
    const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('staff');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

    const [newUser, setNewUser] = useState<{
        code: string;
        username: string;
        name: string;
        role: UserRole;
        golf_course_id: string;
        managed_golf_courses: string[];
        password?: string;
    }>({
        code: '',
        username: '',
        name: '',
        role: 'staff',
        golf_course_id: '',
        managed_golf_courses: [],
        password: ''
    });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // ตรวจสอบสิทธิ์ admin หรือ supervisor
    if (user.role !== 'admin' && user.role !== 'supervisor') {
        return (
            <div className="card">
                <div className="page-header">
                    <h2>ไม่มีสิทธิ์เข้าถึง</h2>
                    <button className="btn-outline" onClick={() => setView('admin_dashboard')}>กลับไปหน้าหลัก</button>
                </div>
                <div className="no-access-message">
                    <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะผู้ดูแลระบบและหัวหน้างานเท่านั้นที่สามารถจัดการผู้ใช้ได้</p>
                </div>
            </div>
        );
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewUser(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleManagedCoursesChange = (courseId: string, checked: boolean) => {
        setNewUser(prev => ({
            ...prev,
            managed_golf_courses: checked
                ? [...prev.managed_golf_courses, courseId]
                : prev.managed_golf_courses.filter(id => id !== courseId)
        }));
    };

    const handleSelectAllCourses = () => {
        setNewUser(prev => ({
            ...prev,
            managed_golf_courses: golfCourses.map(course => course.id)
        }));
    };

    const handleDeselectAllCourses = () => {
        setNewUser(prev => ({
            ...prev,
            managed_golf_courses: []
        }));
    };

    const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // ตั้งค่า managed_golf_courses ตามบทบาท
        let finalManagedCourses = newUser.managed_golf_courses;
        if (newUser.role === 'admin') {
            finalManagedCourses = golfCourses.map(c => c.id); // Admin ดูแลทุกสนาม
        } else if (newUser.role === 'staff') {
            finalManagedCourses = []; // Staff ไม่ดูแลสนามใด
        }

        // หาชื่อสนามกอล์ฟ
        const selectedGolfCourse = golfCourses.find(c => c.id === newUser.golf_course_id);
        const golf_course_name = selectedGolfCourse ? selectedGolfCourse.name : '';

        const userData = {
            code: newUser.code,
            username: newUser.username,
            name: newUser.name,
            role: newUser.role,
            golf_course_id: newUser.golf_course_id,
            golf_course_name: golf_course_name,
            managed_golf_courses: finalManagedCourses.length > 0 ? finalManagedCourses : undefined,
            ...(newUser.password && newUser.password.trim() !== '' && { password: newUser.password })
        };

        try {
            // Add new user
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                const result = await response.json();
                setUsers([...users, result.data]);
                alert('เพิ่มผู้ใช้สำเร็จ');
            } else {
                const error = await response.json();
                alert(`เกิดข้อผิดพลาด: ${error.message}`);
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }

        // Reset form
        setNewUser({
            code: '',
            username: '',
            name: '',
            role: 'staff',
            golf_course_id: '',
            managed_golf_courses: [],
            password: ''
        });
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (userData: any) => {
        if (!editingUser) return;

        try {
            const response = await fetch(`/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                const result = await response.json();
                setUsers(users.map(user =>
                    user.id === editingUser.id ? result.data : user
                ));
                alert('อัปเดตข้อมูลผู้ใช้สำเร็จ');
            } else {
                const error = await response.json();
                alert(`เกิดข้อผิดพลาด: ${error.message}`);
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
            throw error;
        }
    };



    // ระงับการใช้งานผู้ใช้
    const handleDisableUser = async (targetUser: User) => {
        const confirmMessage = targetUser.is_active === false
            ? `คุณต้องการเปิดใช้งานบัญชี "${targetUser.name}" อีกครั้งหรือไม่?`
            : `คุณต้องการระงับการใช้งานบัญชี "${targetUser.name}" หรือไม่?\n\n(พนักงานจะไม่สามารถเข้าสู่ระบบได้ แต่ข้อมูลงานจะยังคงอยู่)`;

        if (window.confirm(confirmMessage)) {
            try {
                const newStatus = targetUser.is_active === false ? true : false;
                const response = await fetch(`/api/users/${targetUser.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ is_active: newStatus })
                });

                if (response.ok) {
                    const result = await response.json();
                    setUsers(users.map(u =>
                        u.id === targetUser.id ? { ...u, is_active: newStatus, disabled_at: result.data.disabled_at } : u
                    ));
                    alert(result.message);
                } else {
                    const error = await response.json();
                    alert(`เกิดข้อผิดพลาด: ${error.message}`);
                }
            } catch (error) {
                console.error('Error updating user status:', error);
                alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
            }
        }
    };

    const getGolfCourseName = (id: string) => {
        const course = golfCourses.find(c => c.id === id);
        return course ? course.name : 'ไม่ระบุ';
    };

    const getManagedCoursesText = (user: User) => {
        if (!user.managed_golf_courses || user.managed_golf_courses.length === 0) {
            return '-';
        }

        if (user.managed_golf_courses.length === golfCourses.length) {
            return 'ทั้งหมด';
        }

        return user.managed_golf_courses
            .map((id: string) => getGolfCourseName(id))
            .join(', ');
    };



    // Filter users based on search term, role, and active status
    const filteredUsers = users.filter(u =>
        (u.is_active !== false) &&
        (selectedRole === 'all' || u.role === selectedRole) &&
        (
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Count users by role
    const countByRole = (role: UserRole | 'all') => {
        if (role === 'all') return users.filter(u => u.is_active !== false).length;
        return users.filter(u => u.is_active !== false && u.role === role).length;
    };

    return (
        <div className="manage-users-screen">
            <div className="page-header">
                <div>
                    <h1 className="page-title">จัดการผู้ใช้งานระบบ</h1>
                    <p className="page-subtitle">จัดการข้อมูลพนักงาน, สิทธิ์การเข้าถึง และบทบาทหน้าที่</p>
                </div>
                <div className="header-actions">
                    {isAdmin && (
                        <button
                            className="history-button"
                            onClick={() => setView('employee_history' as View)}
                        >
                            📋 ประวัติพนักงาน
                        </button>
                    )}
                    <button className="back-button" onClick={() => setView('admin_dashboard')}>
                        กลับไปหน้าหลัก
                    </button>
                </div>
            </div>

            {/* Role Tabs */}
            <div className="role-tabs-container">
                <div className="role-tabs">
                    {[
                        { id: 'all', label: 'ทั้งหมด', icon: '👥' },
                        { id: 'staff', label: 'พนักงาน', icon: '👷' },
                        { id: 'supervisor', label: 'หัวหน้างาน', icon: '👔' },
                        { id: 'manager', label: 'ผู้จัดการ', icon: '💼' },
                        { id: 'stock', label: 'สต๊อก', icon: '📦' },
                        { id: 'clerk', label: 'ธุรการ', icon: '📋' },
                        { id: 'central', label: 'ส่วนกลาง', icon: '🏢' },
                        { id: 'admin', label: 'ผู้ดูแลระบบ', icon: '🛡️' }
                    ].map((tab) => {
                        if (tab.id === 'central' && !isAdmin) return null; // Only admin sees central tab if needed, or consistent with roles
                        return (
                            <button
                                key={tab.id}
                                className={`role-tab ${selectedRole === tab.id ? 'active' : ''}`}
                                onClick={() => setSelectedRole(tab.id as UserRole | 'all')}
                            >
                                <span className="tab-icon">{tab.icon}</span>
                                <span className="tab-label">{tab.label}</span>
                                <span className="tab-count">{countByRole(tab.id as UserRole | 'all')}</span>
                            </button>
                        );
                    })}
                </div>
                <button
                    className="add-user-button"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    + เพิ่มผู้ใช้ใหม่
                </button>
            </div>

            {/* Search and Table Section */}
            <div className="content-card">
                <div className="card-header">
                    <h3>รายชื่อผู้ใช้ ({roleLabel(selectedRole)})</h3>

                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, รหัส..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                            onClick={() => setViewMode('card')}
                            title="มุมมองการ์ด"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 4H8V8H4V4Z" />
                                <path d="M10 4H14V8H10V4Z" />
                                <path d="M16 4H20V8H16V4Z" />
                                <path d="M4 10H8V14H4V10Z" />
                                <path d="M10 10H14V14H10V10Z" />
                                <path d="M16 10H20V14H16V10Z" />
                                <path d="M4 16H8V20H4V16Z" />
                                <path d="M10 16H14V20H10V16Z" />
                                <path d="M16 16H20V20H16V16Z" />
                            </svg>
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => setViewMode('table')}
                            title="มุมมองตาราง"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="5" width="18" height="14" rx="2" />
                            </svg>
                        </button>
                    </div>
                </div>

                {viewMode === 'table' ? (
                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>รหัสพนักงาน</th>
                                    <th>ชื่อ-นามสกุล</th>
                                    <th>ตำแหน่ง</th>
                                    <th>สนามกอล์ฟหลัก</th>
                                    <th>สนามที่รับผิดชอบ</th>
                                    <th>การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td>
                                                <span className="user-code-badge">{user.code}</span>
                                            </td>
                                            <td>
                                                <div className="user-info">
                                                    <div className="user-name">{user.name}</div>
                                                    <div className="user-username">@{user.username}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`role-badge ${user.role}`}>
                                                    {roleLabel(user.role)}
                                                </span>
                                            </td>
                                            <td>{getGolfCourseName(user.golf_course_id)}</td>
                                            <td>
                                                <div className="managed-courses" title={getManagedCoursesText(user)}>
                                                    {getManagedCoursesText(user)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {(isAdmin || user.role !== 'admin') && (
                                                        <>
                                                            <button
                                                                className="action-btn edit"
                                                                onClick={() => handleEditUser(user)}
                                                                title="แก้ไข"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                className="action-btn delete"
                                                                onClick={() => handleDisableUser(user)}
                                                                title="ลบ/ระงับ"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="no-data">
                                            <div className="no-data-content">
                                                <span>🚫</span>
                                                <p>ไม่พบข้อมูลผู้ใช้ในหมวดหมู่นี้</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="user-card-grid">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <div className="user-card" key={user.id}>
                                    <div className="user-card-header">
                                        <div className="user-card-info">
                                            <span className="user-code-badge">{user.code}</span>
                                            <span className={`role-badge ${user.role}`}>{roleLabel(user.role)}</span>
                                        </div>
                                        <div className="action-buttons">
                                            {(isAdmin || user.role !== 'admin') && (
                                                <>
                                                    <button className="action-btn edit" onClick={() => handleEditUser(user)} title="แก้ไข">
                                                        ✏️
                                                    </button>
                                                    <button className="action-btn delete" onClick={() => handleDisableUser(user)} title={user.is_active === false ? "เปิดใช้งาน" : "ระงับการใช้งาน"}>
                                                        {user.is_active === false ? "✅" : "🚫"}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="user-card-body">
                                        <h4 className="card-user-name">{user.name}</h4>
                                        <p className="card-user-username">@{user.username}</p>

                                        <div className="card-details">
                                            <div className="detail-item">
                                                <span className="detail-label">สนามหลัก:</span>
                                                <span className="detail-value">{getGolfCourseName(user.golf_course_id)}</span>
                                            </div>
                                            {(user.role === 'supervisor' || user.role === 'admin') && (
                                                <div className="detail-item">
                                                    <span className="detail-label">ดูแล:</span>
                                                    <span className="detail-value">{getManagedCoursesText(user)}</span>
                                                </div>
                                            )}
                                            {user.is_active === false && (
                                                <div className="detail-item status-inactive">
                                                    <span className="detail-label">สถานะ:</span>
                                                    <span className="detail-value">ระงับการใช้งาน</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-data full-width-col">
                                <div className="no-data-content">
                                    <span>🔍</span>
                                    <p>ไม่พบข้อมูลผู้ใช้งานตามเงื่อนไขที่ค้นหา</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content large-modal">
                        <div className="modal-header">
                            <h2>เพิ่มผู้ใช้งานใหม่</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="close-modal-btn">×</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={(e) => {
                                handleAddUser(e);
                                setIsAddModalOpen(false);
                            }} className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="code">รหัสพนักงาน</label>
                                    <input
                                        type="text"
                                        id="code"
                                        name="code"
                                        value={newUser.code}
                                        onChange={handleInputChange}
                                        required
                                        className="modern-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="username">ชื่อผู้ใช้ (Username)</label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={newUser.username}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="ใช้สำหรับเข้าสู่ระบบ"
                                        className="modern-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="name">ชื่อ-นามสกุล</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={newUser.name}
                                        onChange={handleInputChange}
                                        required
                                        className="modern-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="role">ตำแหน่ง</label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={newUser.role}
                                        onChange={handleInputChange}
                                        required
                                        className="modern-select"
                                    >
                                        <option value="staff">พนักงานทั่วไป</option>
                                        <option value="supervisor">หัวหน้างาน</option>
                                        <option value="manager">ผู้จัดการ</option>
                                        <option value="stock">สต๊อก</option>
                                        <option value="clerk">ธุรการ</option>
                                        {isAdmin && <option value="central">ส่วนกลาง</option>}
                                        {isAdmin && <option value="admin">ผู้ดูแลระบบ</option>}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="golf_course_id">สนามกอล์ฟหลัก</label>
                                    <select
                                        id="golf_course_id"
                                        name="golf_course_id"
                                        value={newUser.golf_course_id}
                                        onChange={handleInputChange}
                                        required
                                        className="modern-select"
                                    >
                                        <option value="">เลือกสนามกอล์ฟ</option>
                                        {golfCourses.map(course => (
                                            <option key={course.id} value={course.id}>{course.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Password Field */}
                                {(newUser.role === 'admin' || newUser.role === 'supervisor' || newUser.role === 'central') && (
                                    <div className="form-group">
                                        <label htmlFor="password">รหัสผ่าน</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                name="password"
                                                value={newUser.password || ''}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="ใส่รหัสผ่าน"
                                                className="modern-input"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="toggle-password-btn"
                                            >
                                                {showPassword ? "🙈" : "👁️"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Managed Courses for Supervisor */}
                                {newUser.role === 'supervisor' && (
                                    <div className="form-group full-width">
                                        <label>สนามกอล์ฟที่รับผิดชอบ</label>
                                        <div className="select-all-buttons">
                                            <button type="button" className="btn-text" onClick={handleSelectAllCourses}>เลือกทั้งหมด</button>
                                            <button type="button" className="btn-text danger" onClick={handleDeselectAllCourses}>ยกเลิกทั้งหมด</button>
                                        </div>
                                        <div className="checkbox-grid">
                                            {golfCourses.map(course => (
                                                <label key={course.id} className="checkbox-item">
                                                    <input
                                                        type="checkbox"
                                                        checked={newUser.managed_golf_courses.includes(course.id)}
                                                        onChange={(e) => handleManagedCoursesChange(course.id, e.target.checked)}
                                                    />
                                                    <span>{course.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(newUser.role === 'central' || newUser.role === 'admin') && (
                                    <div className="form-group full-width">
                                        <div className="info-box-modern">
                                            ℹ️ <strong>Note:</strong> {newUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ส่วนกลาง'} จะเข้าถึงทุกสนามโดยอัตโนมัติ
                                        </div>
                                    </div>
                                )}

                                <div className="modal-footer">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-cancel">ยกเลิก</button>
                                    <button type="submit" className="btn-submit">บันทึก</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                user={editingUser}
                golfCourses={golfCourses}
                onSave={handleSaveUser}
                currentUserRole={user.role}
            />
        </div>
    );
};

const roleLabel = (role: string | 'all') => {
    switch (role) {
        case 'admin': return 'ผู้ดูแลระบบ';
        case 'supervisor': return 'หัวหน้างาน';
        case 'staff': return 'พนักงานทั่วไป';
        case 'central': return 'ส่วนกลาง';
        case 'manager': return 'ผู้จัดการ';
        case 'stock': return 'สต๊อก';
        case 'clerk': return 'ธุรการ';
        case 'all': return 'ทั้งหมด';
        default: return role;
    }
}

export default ManageUsersScreen;