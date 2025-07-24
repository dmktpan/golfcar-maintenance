'use client';

import React, { useState } from 'react';
import { User, UserRole, GolfCourse, View } from '@/lib/data';

interface ManageUsersScreenProps {
    setView: (view: View) => void;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    golfCourses: GolfCourse[];
}

const ManageUsersScreen = ({ setView, users, setUsers, golfCourses }: ManageUsersScreenProps) => {
    const [newUser, setNewUser] = useState<{
        code: string;
        name: string;
        role: UserRole;
        golf_course_id: number;
        managed_golf_courses: number[];
    }>({  
        code: '',
        name: '',
        role: 'staff',
        golf_course_id: 1,
        managed_golf_courses: []
    });
    const [editMode, setEditMode] = useState(false);
    const [editUserId, setEditUserId] = useState<number | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewUser(prev => ({
            ...prev,
            [name]: name === 'golf_course_id' ? parseInt(value) : value
        }));
    };

    const handleManagedCoursesChange = (courseId: number, checked: boolean) => {
        setNewUser(prev => ({
            ...prev,
            managed_golf_courses: checked 
                ? [...prev.managed_golf_courses, courseId]
                : prev.managed_golf_courses.filter(id => id !== courseId)
        }));
    };

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        
        // ตั้งค่า managed_golf_courses ตามบทบาท
        let finalManagedCourses = newUser.managed_golf_courses;
        if (newUser.role === 'admin') {
            finalManagedCourses = golfCourses.map(c => c.id); // Admin ดูแลทุกสนาม
        } else if (newUser.role === 'staff') {
            finalManagedCourses = []; // Staff ไม่ดูแลสนามใด
        }

        const userData = {
            ...newUser,
            managed_golf_courses: finalManagedCourses.length > 0 ? finalManagedCourses : undefined
        };

        if (editMode && editUserId !== null) {
            // Update existing user
            setUsers(users.map(user => 
                user.id === editUserId ? { ...user, ...userData } : user
            ));
            setEditMode(false);
            setEditUserId(null);
        } else {
            // Add new user
            const newId = Math.max(...users.map(u => u.id), 0) + 1;
            const golfCourseName = getGolfCourseName(userData.golf_course_id);
            setUsers([...users, { 
                id: newId, 
                username: userData.code, // ใช้รหัสพนักงานเป็น username
                golf_course_name: golfCourseName,
                created_at: new Date().toISOString(),
                ...userData 
            }]);
        }
        
        // Reset form
        setNewUser({
            code: '',
            name: '',
            role: 'staff',
            golf_course_id: 1,
            managed_golf_courses: []
        });
    };

    const handleEditUser = (user: User) => {
        setNewUser({
            code: user.code,
            name: user.name,
            role: user.role,
            golf_course_id: user.golf_course_id,
            managed_golf_courses: user.managed_golf_courses || []
        });
        setEditMode(true);
        setEditUserId(user.id);
    };

    const handleDeleteUser = (userId: number) => {
        if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) {
            setUsers(users.filter(user => user.id !== userId));
        }
    };

    const getGolfCourseName = (id: number) => {
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
            .map((id: number) => getGolfCourseName(id))
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
                        <option value="admin">ผู้ดูแลระบบ</option>
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
                        {golfCourses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                    </select>
                </div>

                {/* แสดงการเลือกสนามที่ดูแลเฉพาะหัวหน้า */}
                {newUser.role === 'supervisor' && (
                    <div className="form-group full-width">
                        <label>สนามกอล์ฟที่รับผิดชอบ:</label>
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
                            หัวหน้าสามารถเลือก "ทั้งหมด" เพื่อดูแลทุกสนาม หรือเลือกเฉพาะสนามที่รับผิดชอบ
                        </small>
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
                                    name: '',
                                    role: 'staff',
                                    golf_course_id: 1,
                                    managed_golf_courses: []
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
                                    {user.role === 'admin' && 'ผู้ดูแลระบบ'}
                                </td>
                                <td>{getGolfCourseName(user.golf_course_id)}</td>
                                <td>{getManagedCoursesText(user)}</td>
                                <td>
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