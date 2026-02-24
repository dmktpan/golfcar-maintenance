
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Job, JobStatus, User, View, Vehicle, GolfCourse } from '@/lib/data';
import JobCard from './JobCard';
import styles from './Dashboard.module.css';

interface DashboardProps {
    user: User;
    jobs: Job[];
    vehicles: Vehicle[];
    golfCourses: GolfCourse[];
    users: User[];
    partsUsageLog?: any[];
    parts?: any[]; // เพิ่ม props สำหรับ Parts
    setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
    setView: (view: View) => void;
    onFillJobForm?: (job: Job) => void;
    addPartsUsageLog?: (jobId: string, partsNotes?: string) => void;
    onUpdateStatus?: (jobId: string, status: JobStatus) => void;
    onOpenPartRequest?: () => void;
}

const Dashboard = ({ user, jobs, vehicles, golfCourses, users, partsUsageLog = [], parts = [], setJobs, setView, onFillJobForm, addPartsUsageLog, onUpdateStatus, onOpenPartRequest }: DashboardProps) => {
    const [activeTab, setActiveTab] = useState<'assigned' | 'history' | 'parts_stock'>('assigned');
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'assigned' | 'in_progress' | 'completed'>('assigned');

    // ใช้ useMemo เพื่อลด re-calculation
    const filteredJobs = useMemo(() => {
        const getUserJobs = () => {
            if (user.role === 'supervisor' || user.role === 'admin') {
                return jobs;
            } else {
                return jobs.filter(job =>
                    job.user_id === user.id.toString() &&
                    job.status !== 'approved'
                );
            }
        };

        const userJobs = getUserJobs();

        if (activeTab === 'history') {
            return jobs.filter(job =>
                job.user_id === user.id.toString() && job.status === 'approved'
            ).sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        }

        // Parts Stock tab doesn't use the main job list
        if (activeTab === 'parts_stock') {
            return [];
        }

        const filtered = filter === 'all'
            ? userJobs
            : userJobs.filter(job => job.status === filter);

        return filtered.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }, [jobs, user, activeTab, filter]);

    // ใช้ useMemo สำหรับ job counts
    const jobCounts = useMemo(() => {
        const userJobs = user.role === 'supervisor' || user.role === 'admin'
            ? jobs
            : jobs.filter(job => job.user_id === user.id.toString() && job.status !== 'approved');

        return {
            all: userJobs.length,
            pending: userJobs.filter(job => job.status === 'pending').length,
            assigned: userJobs.filter(job => job.status === 'assigned').length,
            in_progress: userJobs.filter(job => job.status === 'in_progress').length,
            completed: userJobs.filter(job => job.status === 'completed').length,
            approved: jobs.filter(job => job.user_id === user.id.toString() && job.status === 'approved').length,
            rejected: userJobs.filter(job => job.status === 'rejected').length,
        };
    }, [jobs, user]);

    // ใช้ useCallback สำหรับ handleUpdateStatus
    const handleUpdateStatus = useCallback((jobId: string, status: JobStatus) => {
        if (onUpdateStatus) {
            onUpdateStatus(jobId, status);
        } else {
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
    }, [onUpdateStatus, jobs, setJobs, addPartsUsageLog]);

    // Filter MWR Requests for Parts Stock Tab
    const myMWRRequests = useMemo(() => {
        if (activeTab !== 'parts_stock') return [];
        return jobs.filter(job =>
            job.user_id === user.id.toString() &&
            job.type === 'PART_REQUEST'
        ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [jobs, user, activeTab]);

    // Filter Site Stock for Parts Stock Tab
    const siteStock = useMemo(() => {
        if (activeTab !== 'parts_stock' || !user.golf_course_id) return [];

        return parts.map(part => {
            // Find inventory for this site
            const inventory = part.inventory ? part.inventory.find((inv: any) =>
                inv.golf_course_id.toString() === user.golf_course_id?.toString()
            ) : null;

            return {
                ...part,
                siteStock: inventory ? inventory.quantity : 0
            };
        }).filter(part => part.siteStock > 0);
    }, [parts, user, activeTab]);

    // Debug: ตรวจสอบ user role
    console.log('🔍 Dashboard Debug - User data:', {
        name: user.name,
        role: user.role,
        id: user.id,
        fullUserObject: user
    });
    console.log('🔍 Dashboard Debug - Role check:', {
        isStaff: user.role === 'staff',
        isSupervisor: user.role === 'supervisor',
        isAdmin: user.role === 'admin',
        shouldShowStockButton: (user.role === 'supervisor' || user.role === 'admin')
    });

    return (
        <div className={styles.dashboard}>
            {/* Quick Actions */}
            <div className={styles.quickActions}>
                {user.role === 'staff' && (
                    <>
                        <button
                            className={styles.createJobButton}
                            onClick={() => setView('create_job')}
                            style={{ marginBottom: '1rem', background: '#0bab00ff' }}
                        >
                            <span className="btn-icon">+</span> สร้างงานใหม่
                        </button>
                        <button
                            className={styles.createJobButton}
                            onClick={() => {
                                console.log('📦 Request Parts button clicked');
                                if (onOpenPartRequest) onOpenPartRequest();
                            }}
                            style={{ marginBottom: '1rem', background: '#98b8ffff' }}
                        >
                            <span className="btn-icon">📦</span>เบิกอะไหล่
                        </button>
                    </>
                )}
                {(user.role === 'supervisor' || user.role === 'admin') && (
                    <>
                        <button
                            className={styles.adminButton}
                            onClick={() => setView('admin_dashboard')}
                        >
                            <span className="btn-icon">⚙️</span> แดชบอร์ดผู้ดูแล
                        </button>
                    </>
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
                <button
                    className={`${styles.tabButton} ${activeTab === 'parts_stock' ? styles.active : ''}`}
                    onClick={() => setActiveTab('parts_stock')}
                >
                    <span className="tab-icon">📦</span>
                    อะไหล่ & สต็อก
                </button>
            </div>

            {/* Filter Controls (Only for Assigned Tab) */}
            {activeTab === 'assigned' && (
                <div className={styles.filterControls}>
                    <div className={styles.filterButtons}>
                        <button
                            className={`${styles.filterButton} ${filter === 'assigned' ? styles.active : ''}`}
                            onClick={() => setFilter('assigned')}
                        >
                            ได้รับมอบหมาย ({jobCounts.assigned})
                        </button>
                        <button
                            className={`${styles.filterButton} ${filter === 'pending' ? styles.active : ''}`}
                            onClick={() => setFilter('pending')}
                        >
                            รอตรวจสอบ ({jobCounts.pending})
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

            {/* Content Area */}
            {activeTab === 'parts_stock' ? (
                <div className={styles.partsStockContainer} style={{ padding: '1rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

                    {/* Section 1: My MWR Requests */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                            📋 ประวัติการเบิกอะไหล่ (My Requests)
                        </h3>
                        {myMWRRequests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', background: '#f8fafc', borderRadius: '0.5rem' }}>
                                ยังไม่มีรายการเบิกอะไหล่
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.875rem' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>MWR Code</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>วันที่</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>สนามปลายทาง</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>ความเร่งด่วน</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>รายการ</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>สถานะ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myMWRRequests.map(job => (
                                            <tr key={job.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#2563eb' }}>
                                                    {job.mwr_code || 'N/A'}
                                                </td>
                                                <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>
                                                    {new Date(job.created_at).toLocaleDateString('th-TH')}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {golfCourses.find(gc => gc.id === job.golf_course_id)?.name || '-'}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    {job.remarks?.includes('เร่งด่วนมาก') ? '🚨 มาก' :
                                                        job.remarks?.includes('เร่งด่วน') ? '⚠️ ด่วน' : 'ปกติ'}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    {job.parts?.length || 0} รายการ
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '1rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold',
                                                        background: job.status === 'approved' ? '#dcfce7' : job.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                                                        color: job.status === 'approved' ? '#166534' : job.status === 'rejected' ? '#991b1b' : '#854d0e'
                                                    }}>
                                                        {job.status === 'approved' ? 'อนุมัติแล้ว' : job.status === 'rejected' ? 'ไม่อนุมัติ' : 'รอตรวจสอบ'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Site Stock */}
                    <div>
                        <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                            🏭 สต็อกอะไหล่ประจำสนาม ({golfCourses.find(gc => gc.id.toString() === user.golf_course_id?.toString())?.name || 'ไม่ระบุ'})
                        </h3>
                        {siteStock.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', background: '#f8fafc', borderRadius: '0.5rem' }}>
                                ไม่พบข้อมูลสต็อกในสนามนี้ หรือ สต็อกเป็นศูนย์
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                {siteStock.map((part: any) => (
                                    <div key={part.id} style={{
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e2e8f0',
                                        background: part.siteStock < 5 ? '#fff1f2' : 'white',
                                        position: 'relative'
                                    }}>
                                        <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '0.25rem' }}>{part.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>#{part.part_number || '-'}</div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                            <span style={{ fontSize: '0.875rem', color: '#475569' }}>คงเหลือ:</span>
                                            <span style={{
                                                fontSize: '1.25rem',
                                                fontWeight: 'bold',
                                                color: part.siteStock < 5 ? '#dc2626' : '#059669'
                                            }}>
                                                {part.siteStock} {part.unit}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Job List (Assigned & History) */
                filteredJobs.length === 0 ? (
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
                                partsUsageLog={partsUsageLog}
                                onUpdateStatus={handleUpdateStatus}
                                onFillJobForm={onFillJobForm}
                                isHistory={activeTab === 'history'}
                            />
                        ))}
                    </div>
                )
            )}
        </div>
    );
}

export default Dashboard;
