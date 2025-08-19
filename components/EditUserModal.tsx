'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole, GolfCourse } from '@/lib/data';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    golfCourses: GolfCourse[];
    onSave: (userData: any) => Promise<void>;
    currentUserRole: string;
}

const EditUserModal = ({ isOpen, onClose, user, golfCourses, onSave, currentUserRole }: EditUserModalProps) => {
    const [formData, setFormData] = useState<{
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

    const [isLoading, setIsLoading] = useState(false);
    const isAdmin = currentUserRole === 'admin';

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                code: user.code,
                username: user.username || user.code,
                name: user.name,
                role: user.role,
                golf_course_id: user.golf_course_id,
                managed_golf_courses: user.managed_golf_courses || [],
                password: ''
            });
        }
    }, [user, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleManagedCoursesChange = (courseId: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            managed_golf_courses: checked 
                ? [...prev.managed_golf_courses, courseId]
                : prev.managed_golf_courses.filter(id => id !== courseId)
        }));
    };

    const handleSelectAllCourses = () => {
        setFormData(prev => ({
            ...prev,
            managed_golf_courses: golfCourses.map(course => course.id)
        }));
    };

    const handleDeselectAllCourses = () => {
        setFormData(prev => ({
            ...prev,
            managed_golf_courses: []
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // ตั้งค่า managed_golf_courses ตามบทบาท
            let finalManagedCourses = formData.managed_golf_courses;
            if (formData.role === 'admin') {
                finalManagedCourses = golfCourses.map(c => c.id);
            } else if (formData.role === 'staff') {
                finalManagedCourses = [];
            }

            // หาชื่อสนามกอล์ฟ
            const selectedGolfCourse = golfCourses.find(c => c.id === formData.golf_course_id);
            const golf_course_name = selectedGolfCourse ? selectedGolfCourse.name : '';

            const userData = {
                code: formData.code,
                username: formData.username,
                name: formData.name,
                role: formData.role,
                golf_course_id: formData.golf_course_id,
                golf_course_name: golf_course_name,
                managed_golf_courses: finalManagedCourses.length > 0 ? finalManagedCourses : undefined,
                ...(formData.password && formData.password.trim() !== '' && { password: formData.password })
            };

            await onSave(userData);
            onClose();
        } catch (error) {
            console.error('Error updating user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>แก้ไขข้อมูลผู้ใช้</h3>
                    <button 
                        type="button" 
                        className="modal-close-btn"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="edit-code">รหัสพนักงาน</label>
                            <input 
                                type="text" 
                                id="edit-code" 
                                name="code" 
                                value={formData.code} 
                                onChange={handleInputChange} 
                                required 
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="edit-username">ชื่อผู้ใช้ (Username)</label>
                            <input 
                                type="text" 
                                id="edit-username" 
                                name="username" 
                                value={formData.username} 
                                onChange={handleInputChange} 
                                required 
                                disabled={isLoading}
                                placeholder="ใช้สำหรับเข้าสู่ระบบ"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="edit-name">ชื่อ-นามสกุล</label>
                            <input 
                                type="text" 
                                id="edit-name" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleInputChange} 
                                required 
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="edit-role">ตำแหน่ง</label>
                            <select 
                                id="edit-role" 
                                name="role" 
                                value={formData.role} 
                                onChange={handleInputChange} 
                                required
                                disabled={isLoading}
                            >
                                <option value="staff">พนักงานทั่วไป</option>
                                <option value="supervisor">หัวหน้างาน</option>
                                {isAdmin && <option value="central">ส่วนกลาง</option>}
                                {isAdmin && <option value="admin">ผู้ดูแลระบบ</option>}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="edit-golf_course_id">สนามกอล์ฟหลัก</label>
                            <select 
                                id="edit-golf_course_id" 
                                name="golf_course_id" 
                                value={formData.golf_course_id} 
                                onChange={handleInputChange} 
                                required
                                disabled={isLoading}
                            >
                                <option value="">เลือกสนามกอล์ฟ</option>
                                {golfCourses.map(course => (
                                    <option key={course.id} value={course.id}>{course.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* แสดงช่อง password สำหรับ Admin, หัวหน้า และส่วนกลาง */}
                        {(formData.role === 'admin' || formData.role === 'supervisor' || formData.role === 'central') && (
                            <div className="form-group">
                                <label htmlFor="edit-password">
                                    รหัสผ่าน (เว้นว่างหากไม่ต้องการเปลี่ยน)
                                </label>
                                <input 
                                    type="password" 
                                    id="edit-password" 
                                    name="password" 
                                    value={formData.password || ''} 
                                    onChange={handleInputChange} 
                                    disabled={isLoading}
                                    placeholder="เว้นว่างหากไม่ต้องการเปลี่ยน"
                                />
                            </div>
                        )}
                    </div>

                    {/* แสดงการเลือกสนามที่ดูแลเฉพาะหัวหน้า */}
                    {formData.role === 'supervisor' && (
                        <div className="form-group full-width">
                            <label>สนามกอล์ฟที่รับผิดชอบ:</label>
                            <div className="select-all-buttons" style={{ marginBottom: '1rem' }}>
                                <button 
                                    type="button" 
                                    className="btn-secondary btn-sm"
                                    onClick={handleSelectAllCourses}
                                    disabled={isLoading}
                                >
                                    ✅ เลือกทั้งหมด
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-outline btn-sm"
                                    onClick={handleDeselectAllCourses}
                                    disabled={isLoading}
                                >
                                    ❌ ยกเลิกทั้งหมด
                                </button>
                            </div>
                            <div className="checkbox-group">
                                {golfCourses.map(course => (
                                    <label key={course.id} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.managed_golf_courses.includes(course.id)}
                                            onChange={(e) => handleManagedCoursesChange(course.id, e.target.checked)}
                                            disabled={isLoading}
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

                    {formData.role === 'central' && (
                        <div className="form-group full-width">
                            <div className="info-box">
                                <strong>หมายเหตุ:</strong> ส่วนกลางจะสามารถเข้าถึงข้อมูลทุกสนามกอล์ฟและสร้างงานสำหรับทุกสนามได้
                            </div>
                        </div>
                    )}

                    {formData.role === 'admin' && (
                        <div className="form-group full-width">
                            <div className="info-box">
                                <strong>หมายเหตุ:</strong> ผู้ดูแลระบบจะสามารถเข้าถึงข้อมูลทุกสนามกอล์ฟโดยอัตโนมัติ
                            </div>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            ยกเลิก
                        </button>
                        <button 
                            type="submit" 
                            className="btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? 'กำลังอัปเดต...' : 'อัปเดตข้อมูล'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;