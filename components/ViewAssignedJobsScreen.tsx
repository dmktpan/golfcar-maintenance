'use client';

import React, { useState, useEffect } from 'react';
import { Job, JobStatus, GolfCourse, User, MOCK_GOLF_COURSES, MOCK_USERS, MOCK_JOBS } from '@/lib/data';
import JobCard from './JobCard';

interface ViewAssignedJobsScreenProps {
  currentUser: User;
}

function ViewAssignedJobsScreen({ currentUser }: ViewAssignedJobsScreenProps) {
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);

    // Filter jobs based on selected filters
    useEffect(() => {
        let filteredJobs = MOCK_JOBS.filter(job => 
            job.status === 'assigned' || 
            job.status === 'in_progress' || 
            job.status === 'completed'
        );
        
        if (selectedCourseId) {
            filteredJobs = filteredJobs.filter(job => job.golf_course_id === selectedCourseId);
        }
        
        if (selectedEmployeeId) {
            filteredJobs = filteredJobs.filter(job => job.assigned_to === selectedEmployeeId);
        }
        
        setJobs(filteredJobs);
    }, [selectedCourseId, selectedEmployeeId]);

    const handleUpdateStatus = (jobId: number, status: JobStatus) => {
        setJobs(prevJobs => 
            prevJobs.map(job => 
                job.id === jobId ? { ...job, status } : job
            )
        );
    };

    // Get employees (staff only)
    const employees = MOCK_USERS.filter(user => user.role === 'staff');

    return (
        <div className="container">
            <div className="page-header">
                <h1>ดูงานที่ถูกมอบหมาย</h1>
                <p>จัดการและติดตามงานที่ถูกมอบหมายให้พนักงาน</p>
            </div>
            
            <div className="card">
                <div className="card-header">
                    <h2>ตัวกรองข้อมูล</h2>
                </div>
                <div className="card-body">
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="golf-course">สนามกอล์ฟ:</label>
                            <select 
                                id="golf-course"
                                value={selectedCourseId || ''}
                                onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}
                                className="form-control"
                            >
                                <option value="">ทุกสนาม</option>
                                {MOCK_GOLF_COURSES.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="employee">พนักงาน:</label>
                            <select 
                                id="employee"
                                value={selectedEmployeeId || ''}
                                onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : null)}
                                className="form-control"
                            >
                                <option value="">ทุกคน</option>
                                {employees.map(employee => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>รายการงานที่ถูกมอบหมาย ({jobs.length} งาน)</h2>
                </div>
                <div className="card-body">
                    {jobs.length === 0 ? (
                        <div className="empty-state">
                            <p>ไม่พบงานที่ถูกมอบหมายตามเงื่อนไขที่เลือก</p>
                        </div>
                    ) : (
                        <div className="job-list">
                            {jobs.map(job => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    user={currentUser}
                                    onUpdateStatus={handleUpdateStatus}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ViewAssignedJobsScreen;