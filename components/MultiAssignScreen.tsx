'use client';

import React, { useState } from 'react';
import { MOCK_SYSTEMS, JobType, JobStatus, Job, User, Vehicle, GolfCourse, View } from '@/lib/data';
import { jobsApi } from '@/lib/api';
//import { View } from '@/app/page';

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
    golfCourseId: string | number;
    vehicleId: string | number;
    serialNumber: string;
    vehicleNumber: string;
    userId: string | number;
    jobType: JobType;
    system: string;
    remarks: string;
}

const MultiAssignScreen = ({ setView, user, setJobs, users, vehicles, golfCourses }: MultiAssignScreenProps) => {
    const [assignments, setAssignments] = useState<AssignmentItem[]>([{
        id: 1,
        golfCourseId: '',
        vehicleId: '',
        serialNumber: '',
        vehicleNumber: '',
        userId: '',
        jobType: 'PM',
        system: '',
        remarks: ''
    }]);
    const [successMessage, setSuccessMessage] = useState('');

    const getFilteredStaffUsers = (golfCourseId: string | number) => {
        if (golfCourseId === 0 || golfCourseId === '') return [];
        return users.filter(user => user.role === 'staff' && String(user.golf_course_id) === String(golfCourseId));
    };

    const getFilteredVehicles = (golfCourseId: string | number) => {
        if (golfCourseId === 0 || golfCourseId === '') return [];
        return vehicles.filter(vehicle => String(vehicle.golf_course_id) === String(golfCourseId));
    };

    const handleInputChange = (id: number, field: keyof AssignmentItem, value: any) => {
        setAssignments(prev => prev.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleGolfCourseChange = (id: number, golfCourseId: string | number) => {
        setAssignments(prev => prev.map(item => 
            item.id === id ? {
                ...item,
                golfCourseId,
                vehicleId: '',
                serialNumber: '',
                vehicleNumber: '',
                userId: ''
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
                    vehicleId: String(selectedVehicle.id),
                    serialNumber: selectedVehicle.serial_number,
                    vehicleNumber: selectedVehicle.vehicle_number
                } : item
            ));
        } else {
            setAssignments(prev => prev.map(item => 
                item.id === id ? {
                    ...item,
                    serialNumber,
                    vehicleId: '',
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
                    vehicleId: String(selectedVehicle.id),
                    serialNumber: selectedVehicle.serial_number,
                    vehicleNumber: selectedVehicle.vehicle_number
                } : item
            ));
        } else {
            setAssignments(prev => prev.map(item => 
                item.id === id ? {
                    ...item,
                    vehicleNumber,
                    vehicleId: '',
                    serialNumber: ''
                } : item
            ));
        }
    };

    const addAssignment = () => {
        const newId = Math.max(...assignments.map(a => a.id)) + 1;
        setAssignments([...assignments, {
            id: newId,
            golfCourseId: '',
            vehicleId: '',
            serialNumber: '',
            vehicleNumber: '',
            userId: '',
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate all assignments
        const isValid = assignments.every(assignment => 
            assignment.golfCourseId !== '' && 
            assignment.vehicleId !== '' && 
            assignment.userId !== '' && 
            (assignment.jobType !== 'PM' || assignment.system !== '')
        );
        
        if (!isValid) {
            alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนในทุกรายการ');
            return;
        }
        
        // Create new jobs from assignments using API
        try {
            const jobPromises = assignments.map(async (assignment) => {
                const vehicle = vehicles.find(v => 
                    (v.serial_number === assignment.serialNumber || v.vehicle_number === assignment.vehicleNumber) &&
                    String(v.golf_course_id) === String(assignment.golfCourseId)
                );
                const assignedUser = users.find(u => u.id === assignment.userId);
                
                const newJobData = {
                    user_id: String(assignment.userId),
                    userName: assignedUser?.name || '',
                    vehicle_id: String(vehicle?.id || ''),
                    vehicle_number: vehicle?.vehicle_number || assignment.vehicleNumber,
                    golf_course_id: String(assignment.golfCourseId),
                    type: assignment.jobType,
                    status: 'assigned' as JobStatus,
                    parts: [],
                    system: assignment.system || '',
                    subTasks: [],
                    partsNotes: '',
                    remarks: assignment.remarks,
                    assigned_to: String(assignment.userId)
                };
                
                const result = await jobsApi.create(newJobData);
                if (result.success) {
                    return result.data as Job;
                } else {
                    throw new Error(`Failed to create job: ${result.message}`);
                }
            });
            
            const createdJobs = await Promise.all(jobPromises);
            
            // Add created jobs to the jobs list
            setJobs(prevJobs => [...prevJobs, ...createdJobs]);
            
            // Show success message
            setSuccessMessage(`มอบหมายงานสำเร็จ ${assignments.length} รายการ`);
            
            // Reset form after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
                setAssignments([{
                    id: 1,
                    golfCourseId: '',
                    vehicleId: '',
                    serialNumber: '',
                    vehicleNumber: '',
                    userId: '',
                    jobType: 'PM',
                    system: '',
                    remarks: ''
                }]);
            }, 3000);
        } catch (error) {
            console.error('Error creating jobs:', error);
            alert(`เกิดข้อผิดพลาดในการสร้างงาน: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return (
        <div className="card">
            <div className="page-header">
                <h2>มอบหมายงานหลายรายการ</h2>
                <div className="header-actions">
                    <button 
                        className="btn-outline" 
                        onClick={() => setView('view_assigned_jobs')}
                        style={{ marginRight: '10px' }}
                    >
                        ดูงานที่มอบหมาย
                    </button>
                    <button className="btn-outline" onClick={() => setView('admin_dashboard')}>
                        กลับไปหน้าหลัก
                    </button>
                </div>
            </div>
            
            {successMessage && (
                <div className="success-message">
                    {successMessage}
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                {assignments.map((assignment, index) => (
                    <div key={assignment.id} className="assignment-item">
                        <div className="assignment-header">
                            <h3>รายการที่ {index + 1}</h3>
                            {assignments.length > 1 && (
                                <button 
                                    type="button" 
                                    className="btn-danger btn-sm" 
                                    onClick={() => removeAssignment(assignment.id)}
                                    title="ลบรายการนี้"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <div className="form-grid">
                            {/* ขั้นตอนที่ 1: เลือกสนาม */}
                            <div className="form-group">
                                <label htmlFor={`golfCourse-${assignment.id}`}>สนาม *</label>
                                <select 
                                    id={`golfCourse-${assignment.id}`}
                                    value={assignment.golfCourseId}
                                    onChange={(e) => handleGolfCourseChange(assignment.id, e.target.value || '')}
                                    required
                                >
                                    <option value="">-- เลือกสนาม --</option>
                                    {golfCourses.map(course => (
                                        <option key={course.id} value={String(course.id)}>
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
                                    placeholder={assignment.golfCourseId === '' ? "เลือกสนามก่อน" : "กรอกหมายเลขซีเรียล"}
                                    disabled={assignment.golfCourseId === ''}
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
                                    placeholder={assignment.golfCourseId === '' ? "เลือกสนามก่อน" : "กรอกเลขรถ"}
                                    disabled={assignment.golfCourseId === ''}
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
                                    onChange={(e) => handleInputChange(assignment.id, 'userId', e.target.value)}
                                    disabled={assignment.golfCourseId === ''}
                                    required
                                >
                                    <option value="">{assignment.golfCourseId === '' ? "-- เลือกสนามก่อน --" : "-- เลือกพนักงาน --"}</option>
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
                                        {MOCK_SYSTEMS.map(system => (
                                            <option key={system.id} value={system.id}>{system.name}</option>
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
                    </div>
                ))}
                
                <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={addAssignment}>
                        + เพิ่มรายการ
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