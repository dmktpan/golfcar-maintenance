'use client';

import React, { useState, useEffect } from 'react';
import { Job, JobStatus, GolfCourse, User, Vehicle } from '@/lib/data';
import JobCard from './JobCard';

interface ViewAssignedJobsScreenProps {
  currentUser: User;
  jobs: Job[]; // เพิ่ม props
  golfCourses: GolfCourse[];
  users: User[];
  vehicles: Vehicle[];
  onUpdateStatus: (jobId: number, status: JobStatus) => void;
  onFillJobForm?: (job: Job) => void;
}

function ViewAssignedJobsScreen({ 
  currentUser, 
  jobs, 
  golfCourses, 
  users, 
  vehicles,
  onUpdateStatus,
  onFillJobForm 
}: ViewAssignedJobsScreenProps) {
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

    // Filter jobs based on selected filters
    useEffect(() => {
        let filtered = jobs.filter(job => 
            job.status === 'assigned' || 
            job.status === 'in_progress' || 
            job.status === 'completed'
        );

        if (selectedCourseId) {
            filtered = filtered.filter(job => job.golf_course_id === selectedCourseId);
        }

        if (selectedEmployeeId) {
            filtered = filtered.filter(job => job.assigned_to === selectedEmployeeId);
        }

        setFilteredJobs(filtered);
    }, [jobs, selectedCourseId, selectedEmployeeId]);

    // ฟังก์ชันหาข้อมูลรถ
    const getVehicleInfo = (vehicleId: number) => {
        return vehicles.find(v => v.id === vehicleId);
    };

    // ฟังก์ชันหาชื่อสนาม
    const getGolfCourseName = (golfCourseId: number) => {
        return golfCourses.find(gc => gc.id === golfCourseId)?.name || 'ไม่ระบุ';
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>งานที่ได้รับมอบหมาย</h2>
            </div>

            {/* Filter Controls */}
            <div style={{ 
                display: 'flex', 
                gap: '15px', 
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
            }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        กรองตามสนาม:
                    </label>
                    <select 
                        value={selectedCourseId || ''} 
                        onChange={(e) => setSelectedCourseId(e.target.value ? parseInt(e.target.value) : null)}
                        style={{ 
                            padding: '8px 12px', 
                            borderRadius: '4px', 
                            border: '1px solid #ddd',
                            minWidth: '150px'
                        }}
                    >
                        <option value="">ทุกสนาม</option>
                        {golfCourses.map(course => (
                            <option key={course.id} value={course.id}>
                                {course.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        กรองตามพนักงาน:
                    </label>
                    <select 
                        value={selectedEmployeeId || ''} 
                        onChange={(e) => setSelectedEmployeeId(e.target.value ? parseInt(e.target.value) : null)}
                        style={{ 
                            padding: '8px 12px', 
                            borderRadius: '4px', 
                            border: '1px solid #ddd',
                            minWidth: '150px'
                        }}
                    >
                        <option value="">ทุกคน</option>
                        {users.filter(user => user.role === 'staff').map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Jobs List */}
            <div style={{ display: 'grid', gap: '15px' }}>
                {filteredJobs.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '40px', 
                        color: '#666',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px'
                    }}>
                        ไม่มีงานที่ได้รับมอบหมาย
                    </div>
                ) : (
                    filteredJobs.map(job => (
                        <JobCard 
                            key={job.id} 
                            job={job} 
                            user={currentUser}
                            golfCourses={golfCourses}
                            users={users}
                            vehicles={vehicles}
                            onUpdateStatus={onUpdateStatus}
                            onFillJobForm={onFillJobForm}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default ViewAssignedJobsScreen;