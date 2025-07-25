'use client';

import React, { useState, useEffect } from 'react';
import { Job, JobStatus, User, GolfCourse, Vehicle } from '@/lib/data';
import JobCard from './JobCard';
import styles from './SupervisorPendingJobsScreen.module.css';

interface SupervisorPendingJobsScreenProps {
    user: User;
    jobs: Job[]; // เพิ่ม props
    golfCourses: GolfCourse[];
    users: User[];
    vehicles: Vehicle[];
    onUpdateStatus: (jobId: number, status: JobStatus) => void;
    onFillJobForm?: (job: Job) => void;
}

function SupervisorPendingJobsScreen({ 
    user, 
    jobs, 
    golfCourses, 
    users, 
    vehicles,
    onUpdateStatus,
    onFillJobForm 
}: SupervisorPendingJobsScreenProps) {
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

    // Filter jobs based on user permissions and selected course
    useEffect(() => {
        let filtered = jobs.filter(job => job.status === 'pending');

        // Filter by golf course if user is not admin
        if (user.role !== 'admin') {
            if (user.managed_golf_courses && user.managed_golf_courses.length > 0) {
                filtered = filtered.filter(job => 
                    user.managed_golf_courses!.includes(job.golf_course_id)
                );
            } else if (user.golf_course_id) {
                filtered = filtered.filter(job => job.golf_course_id === user.golf_course_id);
            }
        }

        // Apply course filter if selected
        if (selectedCourseId) {
            filtered = filtered.filter(job => job.golf_course_id === selectedCourseId);
        }

        setFilteredJobs(filtered);
    }, [jobs, user, selectedCourseId]);

    // ฟังก์ชันหาข้อมูลรถ
    const getVehicleInfo = (vehicleId: number) => {
        return vehicles.find(v => v.id === vehicleId);
    };

    // ฟังก์ชันหาชื่อสนาม
    const getGolfCourseName = (golfCourseId: number) => {
        return golfCourses.find(gc => gc.id === golfCourseId)?.name || 'ไม่ระบุ';
    };

    // Get available golf courses for filter
    const getAvailableGolfCourses = () => {
        if (user.role === 'admin') {
            return golfCourses;
        } else if (user.managed_golf_courses && user.managed_golf_courses.length > 0) {
            return golfCourses.filter(gc => user.managed_golf_courses!.includes(gc.id));
        } else if (user.golf_course_id) {
            return golfCourses.filter(gc => gc.id === user.golf_course_id);
        }
        return [];
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>งานรออนุมัติ</h2>
                <div className={styles.summary}>
                    <span className={styles.count}>
                        {filteredJobs.length} งาน
                    </span>
                </div>
            </div>

            {/* Filter Controls */}
            <div className={styles.filterSection}>
                <div className={styles.filterGroup}>
                    <label>กรองตามสนาม:</label>
                    <select 
                        value={selectedCourseId || ''} 
                        onChange={(e) => setSelectedCourseId(e.target.value ? parseInt(e.target.value) : null)}
                        className={styles.filterSelect}
                    >
                        <option value="">ทุกสนาม</option>
                        {getAvailableGolfCourses().map(course => (
                            <option key={course.id} value={course.id}>
                                {course.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Jobs List */}
            <div className={styles.jobsList}>
                {filteredJobs.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📋</div>
                        <h3>ไม่มีงานรออนุมัติ</h3>
                        <p>ขณะนี้ไม่มีงานที่รออนุมัติจากคุณ</p>
                    </div>
                ) : (
                    filteredJobs.map(job => (
                        <JobCard 
                            key={job.id} 
                            job={job} 
                            user={user}
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

export default SupervisorPendingJobsScreen;