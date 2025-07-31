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
  partsUsageLog?: any[]; // เพิ่ม props สำหรับ PartsUsageLog
  onUpdateStatus: (jobId: string, status: JobStatus) => void;
  onFillJobForm?: (job: Job) => void;
}

function ViewAssignedJobsScreen({ 
  currentUser, 
  jobs, 
  golfCourses, 
  users, 
  vehicles,
  partsUsageLog = [],
  onUpdateStatus,
  onFillJobForm 
}: ViewAssignedJobsScreenProps) {
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

    // Filter jobs based on selected filters
    useEffect(() => {
        let filtered = jobs.filter(job => 
            job.status === 'assigned' || 
            job.status === 'in_progress' || 
            job.status === 'completed'
        );

        if (selectedCourseId) {
            // รองรับทั้ง string และ number id
            filtered = filtered.filter(job => 
                String(job.golf_course_id) === String(selectedCourseId)
            );
        }

        if (selectedEmployeeId) {
            // รองรับทั้ง string และ number id
            filtered = filtered.filter(job => 
                String(job.assigned_to) === String(selectedEmployeeId)
            );
        }

        setFilteredJobs(filtered);
    }, [jobs, selectedCourseId, selectedEmployeeId]);

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
                        onChange={(e) => setSelectedCourseId(e.target.value || null)}
                        style={{ 
                            padding: '8px 12px', 
                            borderRadius: '4px', 
                            border: '1px solid #ddd',
                            minWidth: '150px'
                        }}
                    >
                        <option value="">ทุกสนาม</option>
                        {golfCourses.map(course => (
                            <option key={course.id} value={String(course.id)}>
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
                        onChange={(e) => setSelectedEmployeeId(e.target.value || null)}
                        style={{ 
                            padding: '8px 12px', 
                            borderRadius: '4px', 
                            border: '1px solid #ddd',
                            minWidth: '150px'
                        }}
                    >
                        <option value="">ทุกคน</option>
                        {users.filter(user => user.role === 'staff').map(user => (
                            <option key={user.id} value={String(user.id)}>
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
                            partsUsageLog={partsUsageLog}
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