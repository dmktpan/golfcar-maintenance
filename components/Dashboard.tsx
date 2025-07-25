
'use client';

import React, { useState } from 'react';
import { Job, JobStatus, User, View, Vehicle, GolfCourse } from '@/lib/data';
import JobCard from './JobCard';
import styles from './Dashboard.module.css';

interface DashboardProps {
    user: User;
    jobs: Job[];
    vehicles: Vehicle[];
    golfCourses: GolfCourse[];
    users: User[];
    setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
    setView: (view: View) => void;
    onFillJobForm?: (job: Job) => void;
    addPartsUsageLog?: (jobId: number, partsNotes?: string) => void;
}

const Dashboard = ({ user, jobs, vehicles, golfCourses, users, setJobs, setView, onFillJobForm, addPartsUsageLog }: DashboardProps) => {
    const [activeTab, setActiveTab] = useState<'assigned' | 'history'>('assigned');
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'assigned' | 'in_progress' | 'completed'>('all');
    
    const onUpdateStatus = (jobId: number, status: JobStatus) => {
        const updatedJob = jobs.find(job => job.id === jobId);
        if (updatedJob) {
            const newJob = { ...updatedJob, status };
            setJobs(jobs.map(job => job.id === jobId ? newJob : job));
            
            // เพิ่ม Log การใช้อะไหล่เมื่อสถานะเปลี่ยนเป็น approved
            if (status === 'approved' && addPartsUsageLog) {
                addPartsUsageLog(jobId, newJob.partsNotes);
            }
        }
    }

    // กรองงานตามบทบาทของผู้ใช้
    const getUserJobs = () => {
        if (user.role === 'supervisor' || user.role === 'admin') {
            return jobs;
        } else {
            return jobs.filter(job => 
                job.user_id === user.id && 
                job.status !== 'approved'
            );
        }
    };

    // กรองงานตามแท็บและฟิลเตอร์
    const getFilteredJobs = () => {
        const userJobs = getUserJobs();
        
        if (activeTab === 'history') {
            return jobs.filter(job => 
                job.user_id === user.id && job.status === 'approved'
            ).sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        }

        const filteredJobs = filter === 'all' 
            ? userJobs 
            : userJobs.filter(job => job.status === filter);

        return filteredJobs.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    };

    const filteredJobs = getFilteredJobs();

    // นับจำนวนงานตามสถานะ
    const getJobCounts = () => {
        const userJobs = getUserJobs();
        return {
            all: userJobs.length,
            pending: userJobs.filter(job => job.status === 'pending').length,
            assigned: userJobs.filter(job => job.status === 'assigned').length,
            in_progress: userJobs.filter(job => job.status === 'in_progress').length,
            completed: userJobs.filter(job => job.status === 'completed').length,
            approved: jobs.filter(job => job.user_id === user.id && job.status === 'approved').length,
            rejected: userJobs.filter(job => job.status === 'rejected').length,
        };
    };

    const jobCounts = getJobCounts();

    return (
        <div className={styles.dashboard}>
            {/* Quick Actions */}
            <div className={styles.quickActions}>
                {user.role === 'staff' && (
                    <button 
                        className={styles.createJobButton} 
                        onClick={() => setView('create_job')}
                    >
                        <span className="btn-icon">+</span> สร้างงานใหม่
                    </button>
                )}
                {(user.role === 'supervisor' || user.role === 'admin') && (
                    <button 
                        className={styles.adminButton} 
                        onClick={() => setView('admin_dashboard')}
                    >
                        <span className="btn-icon">⚙️</span> แดชบอร์ดผู้ดูแล
                    </button>
                )}
            </div>

            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div className={styles.headerContent}>
                    <h1 className={styles.pageTitle}>แดชบอร์ดพนักงาน</h1>
                    <p className={styles.pageSubtitle}>สวัสดี, {user.name}</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className={styles.tabNavigation}>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'assigned' ? styles.active : ''}`}
                    onClick={() => setActiveTab('assigned')}
                >
                    <span className="tab-icon">📋</span>
                    งานปัจจุบัน
                    {jobCounts.all > 0 && (
                        <span className={styles.tabBadge}>{jobCounts.all}</span>
                    )}
                </button>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'history' ? styles.active : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <span className="tab-icon">📚</span>
                    ประวัตการซ่อม
                    {jobCounts.approved > 0 && (
                        <span className={styles.tabBadge}>{jobCounts.approved}</span>
                    )}
                </button>
            </div>
            
            {/* Filter Controls */}
            {activeTab === 'assigned' && (
                <div className={styles.filterControls}>
                    <div className={styles.filterButtons}>
                        <button 
                            className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            ทั้งหมด ({jobCounts.all})
                        </button>
                        <button 
                            className={`${styles.filterButton} ${filter === 'pending' ? styles.active : ''}`}
                            onClick={() => setFilter('pending')}
                        >
                            รอตรวจสอบ ({jobCounts.pending})
                        </button>
                        <button 
                            className={`${styles.filterButton} ${filter === 'assigned' ? styles.active : ''}`}
                            onClick={() => setFilter('assigned')}
                        >
                            ได้รับมอบหมาย ({jobCounts.assigned})
                        </button>
                        <button 
                            className={`${styles.filterButton} ${filter === 'in_progress' ? styles.active : ''}`}
                            onClick={() => setFilter('in_progress')}
                        >
                            กำลังดำเนินการ ({jobCounts.in_progress})
                        </button>
                        <button 
                            className={`${styles.filterButton} ${filter === 'completed' ? styles.active : ''}`}
                            onClick={() => setFilter('completed')}
                        >
                            เสร็จสิ้น ({jobCounts.completed})
                        </button>
                        <button 
                            className={`${styles.filterButton} ${filter === 'rejected' ? styles.active : ''}`}
                            onClick={() => setFilter('rejected')}
                        >
                            ไม่อนุมัติ ({jobCounts.rejected})
                        </button>
                    </div>
                </div>
            )}

            {/* Job List */}
            {filteredJobs.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        {activeTab === 'assigned' ? '📋' : '📚'}
                    </div>
                    <h3>
                        {activeTab === 'assigned' 
                            ? 'ไม่มีงานในขณะนี้' 
                            : 'ยังไม่มีประวัตการซ่อม'
                        }
                    </h3>
                    <p>
                        {activeTab === 'assigned' 
                            ? filter !== 'all' 
                                ? 'ไม่มีงานในสถานะที่เลือก' 
                                : 'งานที่ได้รับมอบหมายจะแสดงที่นี่'
                            : 'งานที่ได้รับการอนุมัติจะแสดงที่นี่'
                        }
                    </p>
                </div>
            ) : (
                <div className={styles.jobList}>
                    {filteredJobs.map(job => (
                        <JobCard 
                            key={job.id} 
                            job={job} 
                            user={user}
                            vehicles={vehicles}
                            golfCourses={golfCourses}
                            users={users}
                            onUpdateStatus={onUpdateStatus}
                            onFillJobForm={onFillJobForm}
                            isHistory={activeTab === 'history'}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Dashboard;
