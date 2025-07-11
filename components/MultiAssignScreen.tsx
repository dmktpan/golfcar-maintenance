'use client';

import React, { useState } from 'react';
import { MOCK_SYSTEMS, JobType, Job, User, Vehicle, GolfCourse } from '@/lib/data';
import { View } from '@/app/page';

interface MultiAssignScreenProps {
    setView: (view: View) => void;
    user: User;
    jobs: Job[];
    setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
    users: User[];
    vehicles: Vehicle[];
    golfCourses: GolfCourse[];
}

interface AssignmentItem {
    id: number;
    golfCourseId: number;
    vehicleId: number;
    serialNumber: string;
    vehicleNumber: string;
    userId: number;
    jobType: JobType;
    system: string;
    remarks: string;
}

const MultiAssignScreen = ({ setView, user, jobs, setJobs, users, vehicles, golfCourses }: MultiAssignScreenProps) => {
    const [assignments, setAssignments] = useState<AssignmentItem[]>([{
        id: 1,
        golfCourseId: 0,
        vehicleId: 0,
        serialNumber: '',
        vehicleNumber: '',
        userId: 0,
        jobType: 'PM',
        system: '',
        remarks: ''
    }]);
    const [successMessage, setSuccessMessage] = useState('');

    const getFilteredStaffUsers = (golfCourseId: number) => {
        if (golfCourseId === 0) return [];
        return users.filter(user => user.role === 'staff' && user.golf_course_id === golfCourseId);
    };

    const getFilteredVehicles = (golfCourseId: number) => {
        if (golfCourseId === 0) return [];
        return vehicles.filter(vehicle => vehicle.golf_course_id === golfCourseId);
    };

    const handleInputChange = (id: number, field: keyof AssignmentItem, value: any) => {
        setAssignments(prev => prev.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleGolfCourseChange = (id: number, golfCourseId: number) => {
        setAssignments(prev => prev.map(item => 
            item.id === id ? {
                ...item,
                golfCourseId,
                vehicleId: 0,
                serialNumber: '',
                vehicleNumber: '',
                userId: 0
            } : item
        ));
    };

    const handleVehicleChange = (id: number, vehicleId: number) => {
        const selectedVehicle = vehicles.find(v => v.id === vehicleId);
        setAssignments(prev => prev.map(item => 
            item.id === id ? {
                ...item,
                vehicleId,
                serialNumber: selectedVehicle?.serial_number || '',
                vehicleNumber: selectedVehicle?.vehicle_number || ''
            } : item
        ));
    };

    const handleSerialNumberChange = (id: number, serialNumber: string) => {
        const assignment = assignments.find(a => a.id === id);
        if (!assignment) return;
        
        const filteredVehicles = getFilteredVehicles(assignment.golfCourseId);
        const selectedVehicle = filteredVehicles.find(v => v.serial_number === serialNumber);
        
        if (selectedVehicle) {
            setAssignments(prev => prev.map(item => 
                item.id === id ? {
                    ...item,
                    vehicleId: selectedVehicle.id,
                    serialNumber: selectedVehicle.serial_number,
                    vehicleNumber: selectedVehicle.vehicle_number
                } : item
            ));
        } else {
            setAssignments(prev => prev.map(item => 
                item.id === id ? {
                    ...item,
                    serialNumber,
                    vehicleId: 0,
                    vehicleNumber: ''
                } : item
            ));
        }
    };

    const handleVehicleNumberChange = (id: number, vehicleNumber: string) => {
        const assignment = assignments.find(a => a.id === id);
        if (!assignment) return;
        
        const filteredVehicles = getFilteredVehicles(assignment.golfCourseId);
        const selectedVehicle = filteredVehicles.find(v => v.vehicle_number === vehicleNumber);
        
        if (selectedVehicle) {
            setAssignments(prev => prev.map(item => 
                item.id === id ? {
                    ...item,
                    vehicleId: selectedVehicle.id,
                    serialNumber: selectedVehicle.serial_number,
                    vehicleNumber: selectedVehicle.vehicle_number
                } : item
            ));
        } else {
            setAssignments(prev => prev.map(item => 
                item.id === id ? {
                    ...item,
                    vehicleNumber,
                    vehicleId: 0,
                    serialNumber: ''
                } : item
            ));
        }
    };

    const addAssignment = () => {
        const newId = Math.max(...assignments.map(a => a.id)) + 1;
        setAssignments([...assignments, {
            id: newId,
            golfCourseId: 0,
            vehicleId: 0,
            serialNumber: '',
            vehicleNumber: '',
            userId: 0,
            jobType: 'PM',
            system: '',
            remarks: ''
        }]);
    };

    const removeAssignment = (id: number) => {
        if (assignments.length > 1) {
            setAssignments(assignments.filter(item => item.id !== id));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate all assignments
        const isValid = assignments.every(assignment => 
            assignment.golfCourseId !== 0 && 
            assignment.vehicleId !== 0 && 
            assignment.userId !== 0 && 
            (assignment.jobType !== 'PM' || assignment.system !== '')
        );
        
        if (!isValid) {
            alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนในทุกรายการ');
            return;
        }
        
        // Create new jobs from assignments
        const newJobs: Job[] = assignments.map(assignment => {
            const vehicle = vehicles.find(v => 
                (v.serial_number === assignment.serialNumber || v.vehicle_number === assignment.vehicleNumber) &&
                v.golf_course_id === assignment.golfCourseId
            );
            const assignedUser = users.find(u => u.id === assignment.userId);
            
            return {
                id: Date.now() + Math.random(),
                user_id: assignment.userId,
                userName: assignedUser?.name || '',
                vehicle_id: vehicle?.id || 0,
                vehicle_number: vehicle?.vehicle_number || assignment.vehicleNumber,
                type: assignment.jobType,
                status: 'assigned' as const, // เปลี่ยนจาก 'pending' เป็น 'assigned'
                created_at: new Date().toISOString(),
                parts: [],
                system: assignment.system || '',
                subTasks: [],
                partsNotes: '',
                remarks: assignment.remarks,
                assigned_by: user.id, // ID ของหัวหน้างานที่มอบหมาย
                assigned_by_name: user.name, // ชื่อหัวหน้างานที่มอบหมาย
                assigned_to: assignment.userId // เพิ่มการตั้งค่า assigned_to
            };
        });
        
        // Add new jobs to the jobs list
        setJobs(prevJobs => [...prevJobs, ...newJobs]);
        
        // Show success message
        setSuccessMessage(`มอบหมายงานสำเร็จ ${assignments.length} รายการ`);
        
        // Reset form after 3 seconds
        setTimeout(() => {
            setSuccessMessage('');
            setAssignments([{
                id: 1,
                golfCourseId: 0,
                vehicleId: 0,
                serialNumber: '',
                vehicleNumber: '',
                userId: 0,
                jobType: 'PM',
                system: '',
                remarks: ''
            }]);
        }, 3000);
    };

    return (
        <div className="card">
            <div className="page-header">
                <h2>มอบหมายงานหลายรายการ</h2>
                <button className="btn-outline" onClick={() => setView('admin_dashboard')}>กลับไปหน้าหลัก</button>
            </div>
            
            {successMessage && (
                <div className="success-message">
                    {successMessage}
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                {assignments.map((assignment, index) => (
                    <div key={assignment.id} className="assignment-item">
                        <h3>รายการที่ {index + 1}</h3>
                        <div className="form-grid">
                            {/* ขั้นตอนที่ 1: เลือกสนาม */}
                            <div className="form-group">
                                <label htmlFor={`golfCourse-${assignment.id}`}>สนาม *</label>
                                <select 
                                    id={`golfCourse-${assignment.id}`}
                                    value={assignment.golfCourseId}
                                    onChange={(e) => handleGolfCourseChange(assignment.id, parseInt(e.target.value))}
                                    required
                                >
                                    <option value={0}>-- เลือกสนาม --</option>
                                    {golfCourses.map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* ขั้นตอนที่ 2: เลือก Serial หรือ เลขรถ */}
                            <div className="form-group">
                                <label htmlFor={`serialNumber-${assignment.id}`}>หมายเลขซีเรียล *</label>
                                <input 
                                    type="text"
                                    id={`serialNumber-${assignment.id}`}
                                    list={`serialList-${assignment.id}`}
                                    value={assignment.serialNumber}
                                    onChange={(e) => handleSerialNumberChange(assignment.id, e.target.value)}
                                    placeholder={assignment.golfCourseId === 0 ? "เลือกสนามก่อน" : "กรอกหมายเลขซีเรียล"}
                                    disabled={assignment.golfCourseId === 0}
                                    required
                                />
                                <datalist id={`serialList-${assignment.id}`}>
                                    {getFilteredVehicles(assignment.golfCourseId).map(vehicle => (
                                        <option key={vehicle.id} value={vehicle.serial_number} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="form-group">
                                <label htmlFor={`vehicleNumber-${assignment.id}`}>เลขรถ *</label>
                                <input 
                                    type="text"
                                    id={`vehicleNumber-${assignment.id}`}
                                    list={`vehicleList-${assignment.id}`}
                                    value={assignment.vehicleNumber}
                                    onChange={(e) => handleVehicleNumberChange(assignment.id, e.target.value)}
                                    placeholder={assignment.golfCourseId === 0 ? "เลือกสนามก่อน" : "กรอกเลขรถ"}
                                    disabled={assignment.golfCourseId === 0}
                                    required
                                />
                                <datalist id={`vehicleList-${assignment.id}`}>
                                    {getFilteredVehicles(assignment.golfCourseId).map(vehicle => (
                                        <option key={vehicle.id} value={vehicle.vehicle_number} />
                                    ))}
                                </datalist>
                            </div>
                            
                            {/* ขั้นตอนที่ 3: เลือกชื่อพนักงาน */}
                            <div className="form-group">
                                <label htmlFor={`user-${assignment.id}`}>ชื่อพนักงาน *</label>
                                <select 
                                    id={`user-${assignment.id}`}
                                    value={assignment.userId}
                                    onChange={(e) => handleInputChange(assignment.id, 'userId', parseInt(e.target.value))}
                                    disabled={assignment.golfCourseId === 0}
                                    required
                                >
                                    <option value={0}>{assignment.golfCourseId === 0 ? "-- เลือกสนามก่อน --" : "-- เลือกพนักงาน --"}</option>
                                    {getFilteredStaffUsers(assignment.golfCourseId).map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* ขั้นตอนที่ 4: เลือกประเภทงาน */}
                            <div className="form-group">
                                <label htmlFor={`jobType-${assignment.id}`}>ประเภทงาน *</label>
                                <select 
                                    id={`jobType-${assignment.id}`}
                                    value={assignment.jobType}
                                    onChange={(e) => handleInputChange(assignment.id, 'jobType', e.target.value as JobType)}
                                    required
                                >
                                    <option value="PM">Preventive Maintenance (PM)</option>
                                    <option value="BM">Breakdown Maintenance (BM)</option>
                                    <option value="Recondition">Recondition (ซ่อมปรับสภาพ)</option>
                                </select>
                            </div>
                            
                            {/* ขั้นตอนที่ 4.1: เลือกระบบที่ต้องการบำรุงรักษา (เฉพาะ PM) */}
                            {assignment.jobType === 'PM' && (
                                <div className="form-group">
                                    <label htmlFor={`system-${assignment.id}`}>ระบบที่ต้องการบำรุงรักษา *</label>
                                    <select 
                                        id={`system-${assignment.id}`}
                                        value={assignment.system}
                                        onChange={(e) => handleInputChange(assignment.id, 'system', e.target.value)}
                                        required
                                    >
                                        <option value="">-- เลือกระบบ --</option>
                                        {Object.keys(MOCK_SYSTEMS).map(system => (
                                            <option key={system} value={system}>{system}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            
                            {/* ขั้นตอนที่ 5: หมายเหตุ */}
                            <div className="form-group full-width">
                                <label htmlFor={`remarks-${assignment.id}`}>หมายเหตุ</label>
                                <textarea 
                                    id={`remarks-${assignment.id}`}
                                    value={assignment.remarks}
                                    onChange={(e) => handleInputChange(assignment.id, 'remarks', e.target.value)}
                                    placeholder="รายละเอียดเพิ่มเติม"
                                />
                            </div>
                        </div>
                        
                        <div className="assignment-actions">
                            <button 
                                type="button" 
                                className="btn-danger" 
                                onClick={() => removeAssignment(assignment.id)}
                                disabled={assignments.length <= 1}
                            >
                                ลบรายการนี้
                            </button>
                        </div>
                    </div>
                ))}
                
                <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={addAssignment}>
                        เพิ่มรายการ
                    </button>
                    <button type="submit" className="btn-success">
                        มอบหมายงาน
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MultiAssignScreen;