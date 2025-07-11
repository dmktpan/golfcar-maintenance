
'use client';

import React, { useState } from 'react';
import { Job, JobStatus, User } from '@/lib/data';
import { View } from '@/app/page';
import JobCard from './JobCard';

interface DashboardProps {
    user: User;
    jobs: Job[];
    setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
    setView: (view: View) => void;
    onFillJobForm?: (job: Job) => void;
}

const Dashboard = ({ user, jobs, setJobs, setView, onFillJobForm }: DashboardProps) => {
    const [activeTab, setActiveTab] = useState<'assigned' | 'history'>('assigned');
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    
    const onUpdateStatus = (jobId: number, status: JobStatus) => {
        setJobs(jobs.map(job => job.id === jobId ? {...job, status} : job));
    }

    // กรองงานตามบทบาทของผู้ใช้
    let userJobs;
    if (user.role === 'supervisor' || user.role === 'admin') {
        userJobs = jobs;
    } else {
        // แก้ไข: แสดงงานทั้งหมดของพนักงาน (ทั้งที่สร้างเองและที่ได้รับมอบหมาย)
        userJobs = jobs.filter(job => 
            job.user_id === user.id && 
            job.status !== 'approved'
        );
    }
    
    // กรองงานตามสถานะที่เลือก
    const filteredJobs = filter === 'all' 
        ? userJobs 
        : userJobs.filter(job => job.status === filter);

    // จัดเรียงงานตามวันที่สร้าง (ล่าสุดขึ้นก่อน)
    const sortedJobs = filteredJobs.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // กรองงานประวัติ (เฉพาะงานที่อนุมัติแล้วของพนักงานคนนั้น)
    const historyJobs = jobs.filter(job => 
        job.user_id === user.id && job.status === 'approved'
    ).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
        <div className="dashboard-container">
            {(user.role === 'supervisor' || user.role === 'admin') && (
                <div className="nav-buttons">
                    <button className="btn-secondary" onClick={() => setView('admin_dashboard')}>
                        แดชบอร์ดผู้ดูแล
                    </button>
                    <button className="btn-outline" onClick={() => setView('parts_management')}>จัดการอะไหล่</button>
                </div>
            )}

            <div className="page-header">
                <h2 className="dashboard-title">แดชบอร์ดพนักงาน - {user.name}</h2>
                <div className="dashboard-actions">
                    {user.role === 'staff' && activeTab === 'assigned' && (
                        <button className="btn-primary" onClick={() => setView('create_job')}>
                            <span className="btn-icon">+</span> สร้างงานใหม่
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button 
                    className={`tab-button ${activeTab === 'assigned' ? 'active' : ''}`}
                    onClick={() => setActiveTab('assigned')}
                >
                    <span className="tab-icon">📋</span>
                    งานที่ได้รับมอบหมาย
                </button>
                <button 
                    className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <span className="tab-icon">📚</span>
                    ประวัติการซ่อม
                </button>
            </div>
            
            {/* Tab Content */}
            {activeTab === 'assigned' ? (
                <>
                    <div className="filter-controls">
                        <div className="filter-label">กรองตามสถานะ:</div>
                        <div className="filter-buttons">
                            <button 
                                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                ทั้งหมด
                            </button>
                            <button 
                                className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                                onClick={() => setFilter('pending')}
                            >
                                รอตรวจสอบ
                            </button>
                            <button 
                                className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
                                onClick={() => setFilter('approved')}
                            >
                                อนุมัติแล้ว
                            </button>
                            <button 
                                className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
                                onClick={() => setFilter('rejected')}
                            >
                                ไม่อนุมัติ
                            </button>
                        </div>
                    </div>

                    {sortedJobs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📋</div>
                            <p>ไม่มีงานที่ได้รับมอบหมาย{filter !== 'all' ? 'ในสถานะที่เลือก' : ''}</p>
                            <p className="empty-subtitle">งานที่หัวหน้างานมอบหมายจะแสดงที่นี่</p>
                        </div>
                    ) : (
                        <div className="job-list">
                            {sortedJobs.map(job => (
                                <JobCard 
                                    key={job.id} 
                                    job={job} 
                                    user={user} 
                                    onUpdateStatus={onUpdateStatus}
                                    onFillJobForm={onFillJobForm}
                                />
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="history-header">
                        <h3>ประวัติการซ่อมของ {user.name}</h3>
                        <p className="history-subtitle">งานที่ได้รับการอนุมัติแล้ว</p>
                    </div>

                    {historyJobs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📚</div>
                            <p>ยังไม่มีประวัติการซ่อม</p>
                            <p className="empty-subtitle">งานที่ได้รับการอนุมัติจะแสดงที่นี่</p>
                        </div>
                    ) : (
                        <div className="job-list history-list">
                            {historyJobs.map(job => (
                                <JobCard 
                                    key={job.id} 
                                    job={job} 
                                    user={user} 
                                    onUpdateStatus={onUpdateStatus} 
                                    onFillJobForm={onFillJobForm}
                                    isHistory={true} 
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Dashboard;
