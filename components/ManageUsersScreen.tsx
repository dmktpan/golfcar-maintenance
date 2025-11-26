'use client';

import React, { useState } from 'react';
import { User, UserRole, GolfCourse, View } from '@/lib/data';
import EditUserModal from './EditUserModal';
import styles from './ManageUsersScreen.module.css';

interface ManageUsersScreenProps {
    setView: (view: View) => void;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    golfCourses: GolfCourse[];
    user: User;
}

const ManageUsersScreen = ({ setView, users, setUsers, golfCourses, user }: ManageUsersScreenProps) => {
    const isAdmin = user.role === 'admin';
    const isSupervisor = user.role === 'supervisor';

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

    const handleDeleteUser = async (userId: number) => {
        if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) {
            try {
                const response = await fetch(`/api/users/${userId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    setUsers(users.filter(user => user.id !== userId));
                    alert('ลบผู้ใช้สำเร็จ');
                } else {
                    const error = await response.json();
                    alert(`เกิดข้อผิดพลาด: ${error.message}`);
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('เกิดข้อผิดพลาดในการลบข้อมูล');
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

    // Filter users based on search term
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="card">
            <div className="page-header">
                <h2>จัดการผู้ใช้งานระบบ</h2>
                <button className="btn-outline" onClick={() => setView('admin_dashboard')}>กลับไปหน้าหลัก</button>
            </div>

            {/* Add User Section */}
            <div className="section-card">
                <h3 className="section-title">เพิ่มผู้ใช้ใหม่</h3>
                <form onSubmit={handleAddUser} className="form-grid">
                    <div className="form-group">
                        <label htmlFor="code">รหัสพนักงาน</label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            value={newUser.code}
                            onChange={handleInputChange}
                            required
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
                        >
                            <option value="staff">พนักงานทั่วไป</option>
                            <option value="supervisor">หัวหน้างาน</option>
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
                        >
                            <option value="">เลือกสนามกอล์ฟ</option>
                            {golfCourses.map(course => (
                                <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* แสดงช่อง password สำหรับ Admin, หัวหน้า และส่วนกลาง */}
                    {(newUser.role === 'admin' || newUser.role === 'supervisor' || newUser.role === 'central') && (
                        <div className="form-group">
                            <label htmlFor="password">
                                รหัสผ่าน
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={newUser.password || ''}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="ใส่รหัสผ่าน"
                                    style={{ paddingRight: '50px', flex: 1 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        color: '#666',
                                        padding: '5px',
                                        zIndex: 1
                                    }}
                                    title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* แสดงการเลือกสนามที่ดูแลเฉพาะหัวหน้า */}
                    {newUser.role === 'supervisor' && (
                        <div className="form-group full-width">
                            <label>สนามกอล์ฟที่รับผิดชอบ:</label>
                            <div className="select-all-buttons" style={{ marginBottom: '1rem' }}>
                                <button
                                    type="button"
                                    className="btn-secondary btn-sm"
                                    onClick={handleSelectAllCourses}
                                >
                                    ✅ เลือกทั้งหมด
                                </button>
                                <button
                                    type="button"
                                    className="btn-outline btn-sm"
                                    onClick={handleDeselectAllCourses}
                                >
                                    ❌ ยกเลิกทั้งหมด
                                </button>
                            </div>
                            <div className="checkbox-group">
                                {golfCourses.map(course => (
                                    <label key={course.id} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={newUser.managed_golf_courses.includes(course.id)}
                                            onChange={(e) => handleManagedCoursesChange(course.id, e.target.checked)}
                                        />
                                        {course.name}
                                    </label>
                                ))}
                            </div>
                            <small className="form-hint">
                                หัวหน้าสามารถเลือก &quot;ทั้งหมด&quot; เพื่อดูแลทุกสนาม หรือเลือกเฉพาะสนามที่รับผิดชอบ<br />
                                <strong>หมายเหตุ:</strong> หัวหน้าที่เลือกทั้งหมดจะสามารถดูประวัติ (History) ของทุกสนามได้
                            </small>
                        </div>
                    )}

                    {newUser.role === 'central' && (
                        <div className="form-group full-width">
                            <div className="info-box">
                                <strong>หมายเหตุ:</strong> ส่วนกลางจะสามารถเข้าถึงข้อมูลทุกสนามกอล์ฟและสร้างงานสำหรับทุกสนามได้
                            </div>
                        </div>
                    )}

                    {newUser.role === 'admin' && (
                        <div className="form-group full-width">
                            <div className="info-box">
                                <strong>หมายเหตุ:</strong> ผู้ดูแลระบบจะสามารถเข้าถึงข้อมูลทุกสนามกอล์ฟโดยอัตโนมัติ
                            </div>
                        </div>
                    )}

                    <div className="form-actions">
                        <button type="submit" className="btn-primary">
                            เพิ่มผู้ใช้
                        </button>
                    </div>
                </form>
            </div>

            {/* Users List Section */}
            <div className="section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="section-title" style={{ margin: 0 }}>รายชื่อผู้ใช้ทั้งหมด</h3>
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
                                            }`}>
                                            {user.role === 'staff' && 'พนักงานทั่วไป'}
                                            {user.role === 'supervisor' && 'หัวหน้างาน'}
                                            {user.role === 'central' && 'ส่วนกลาง'}
                                            {user.role === 'admin' && 'ผู้ดูแลระบบ'}
                                        </span>
                                    </td>
                                    <td>{getGolfCourseName(user.golf_course_id)}</td>
                                    <td>
                                        <div className={styles.managedCourses} title={getManagedCoursesText(user)}>
                                            {getManagedCoursesText(user)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            {/* Supervisor ไม่สามารถแก้ไขหรือลบ Admin ได้ */}
                                            {(isAdmin || user.role !== 'admin') && (
                                                <>
                                                    <button
                                                        className={styles.editButton}
                                                        onClick={() => handleEditUser(user)}
                                                    >
                                                        แก้ไข
                                                    </button>
                                                    <button
                                                        className={styles.deleteButton}
                                                        onClick={() => handleDeleteUser(user.id)}
                                                    >
                                                        ลบ
                                                    </button>
                                                </>
                                            )}
                                            {isSupervisor && user.role === 'admin' && (
                                                <span className="text-muted" style={{ fontSize: '0.85rem' }}>ไม่มีสิทธิ์</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className={styles.noData}>
                                    ไม่พบข้อมูลผู้ใช้ที่ค้นหา
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
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

export default ManageUsersScreen;