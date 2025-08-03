'use client';

import React, { useState } from 'react';
import { User, UserRole, GolfCourse, View } from '@/lib/data';

interface ManageUsersScreenProps {
    setView: (view: View) => void;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    golfCourses: GolfCourse[];
    user: User;
}

const ManageUsersScreen = ({ setView, users, setUsers, golfCourses, user }: ManageUsersScreenProps) => {
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
    const [editMode, setEditMode] = useState(false);
    const [editUserId, setEditUserId] = useState<number | null>(null);

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
            if (editMode && editUserId !== null) {
                // Update existing user
                const response = await fetch(`/api/users/${editUserId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                });

                if (response.ok) {
                    const result = await response.json();
                    setUsers(users.map(user => 
                        user.id === editUserId ? result.data : user
                    ));
                    alert('อัปเดตข้อมูลผู้ใช้สำเร็จ');
                } else {
                    const error = await response.json();
                    alert(`เกิดข้อผิดพลาด: ${error.message}`);
                }
                setEditMode(false);
                setEditUserId(null);
            } else {
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
        setNewUser({
            code: user.code,
            username: user.username || user.code, // ใช้ code เป็น username หากไม่มี
            name: user.name,
            role: user.role,
            golf_course_id: user.golf_course_id,
            managed_golf_courses: user.managed_golf_courses || [],
            password: '' // ไม่แสดง password เดิม
        });
        setEditMode(true);
        setEditUserId(user.id);
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

    return (
        <div className="card">
            <div className="page-header">
                <h2>จัดการผู้ใช้งานระบบ</h2>
                <button className="btn-outline" onClick={() => setView('admin_dashboard')}>กลับไปหน้าหลัก</button>
            </div>

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
                            รหัสผ่าน {editMode ? '(เว้นว่างหากไม่ต้องการเปลี่ยน)' : ''}
                        </label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            value={newUser.password || ''} 
                            onChange={handleInputChange} 
                            required={!editMode} // required เฉพาะเมื่อเพิ่มใหม่
                            placeholder={editMode ? 'เว้นว่างหากไม่ต้องการเปลี่ยน' : 'ใส่รหัสผ่าน'}
                        />
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
                            หัวหน้าสามารถเลือก &quot;ทั้งหมด&quot; เพื่อดูแลทุกสนาม หรือเลือกเฉพาะสนามที่รับผิดชอบ<br/>
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
                        {editMode ? 'อัพเดทข้อมูล' : 'เพิ่มผู้ใช้'}
                    </button>
                    {editMode && (
                        <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={() => {
                                setEditMode(false);
                                setEditUserId(null);
                                setNewUser({
                                    code: '',
                                    username: '',
                                    name: '',
                                    role: 'staff',
                                    golf_course_id: '',
                                    managed_golf_courses: [],
                                    password: ''
                                });
                            }}
                        >
                            ยกเลิก
                        </button>
                    )}
                </div>
            </form>

            <h3 className="section-title">รายชื่อผู้ใช้ทั้งหมด</h3>
            <div style={{overflowX: 'auto'}}>
                <table className="parts-table">
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
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.code}</td>
                                <td>{user.name}</td>
                                <td>
                                    {user.role === 'staff' && 'พนักงานทั่วไป'}
                                    {user.role === 'supervisor' && 'หัวหน้างาน'}
                                    {user.role === 'central' && 'ส่วนกลาง'}
                                    {user.role === 'admin' && 'ผู้ดูแลระบบ'}
                                </td>
                                <td>{getGolfCourseName(user.golf_course_id)}</td>
                                <td>{getManagedCoursesText(user)}</td>
                                <td>
                                    {/* Supervisor ไม่สามารถแก้ไขหรือลบ Admin ได้ */}
                                    {(isAdmin || user.role !== 'admin') && (
                                        <>
                                            <button 
                                                className="btn-secondary btn-sm" 
                                                onClick={() => handleEditUser(user)}
                                            >
                                                แก้ไข
                                            </button>
                                            <button 
                                                className="btn-danger btn-sm" 
                                                onClick={() => handleDeleteUser(user.id)}
                                            >
                                                ลบ
                                            </button>
                                        </>
                                    )}
                                    {isSupervisor && user.role === 'admin' && (
                                        <span className="text-muted">ไม่มีสิทธิ์</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageUsersScreen;