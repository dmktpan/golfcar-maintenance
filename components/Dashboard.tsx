
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Job, JobStatus, User, View, Vehicle, GolfCourse } from '@/lib/data';
import JobCard from './JobCard';
import MWRDetailsModal from './MWRDetailsModal';
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
    onOpenPartRequest?: (mode: 'repair' | 'spare') => void;
}

const Dashboard = ({ user, jobs, vehicles, golfCourses, users, partsUsageLog = [], parts = [], setJobs, setView, onFillJobForm, addPartsUsageLog, onUpdateStatus, onOpenPartRequest }: DashboardProps) => {
    const [activeTab, setActiveTab] = useState<'assigned' | 'history' | 'parts_stock'>('assigned');
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'assigned' | 'in_progress' | 'completed'>('assigned');
    const [selectedMWR, setSelectedMWR] = useState<Job | null>(null);
    const [showPartRequestDropdown, setShowPartRequestDropdown] = useState(false);
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
                new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime()
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
            new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime()
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
        ).sort((a, b) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime());
    }, [jobs, user, activeTab]);

    // Filter Site Stock for Parts Stock Tab
    const siteStock = useMemo(() => {
        if (activeTab !== 'parts_stock' || !user.golf_course_id) return [];

        return parts.map(part => {
            // Find inventory for this site
            const inventory = part.inventory ? part.inventory.find((inv: any) =>
                inv.golf_course_id && user.golf_course_id && inv.golf_course_id.toString() === user.golf_course_id.toString()
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
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                                className={styles.createJobButton}
                                onClick={() => setShowPartRequestDropdown(prev => !prev)}
                                onBlur={() => setTimeout(() => setShowPartRequestDropdown(false), 200)}
                                style={{ marginBottom: '1rem', background: '#98b8ffff' }}
                            >
                                <span className="btn-icon">📦</span>เบิกอะไหล่ ▾
                            </button>
                            {showPartRequestDropdown && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, zIndex: 50,
                                    background: 'white', borderRadius: '0.5rem', border: '1px solid #e2e8f0',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)', minWidth: '200px', overflow: 'hidden',
                                    marginTop: '-0.5rem'
                                }}>
                                    <button
                                        onClick={() => {
                                            setShowPartRequestDropdown(false);
                                            if (onOpenPartRequest) onOpenPartRequest('repair');
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                                            padding: '0.875rem 1rem', border: 'none', background: 'white',
                                            cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left',
                                            borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s'
                                        }}
                                        onMouseOver={(e) => (e.currentTarget.style.background = '#eff6ff')}
                                        onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
                                    >
                                        <span style={{ fontSize: '1.25rem' }}>🔧</span>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>เบิกซ่อม</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ระบุเบอร์รถที่ต้องการซ่อม</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowPartRequestDropdown(false);
                                            if (onOpenPartRequest) onOpenPartRequest('spare');
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                                            padding: '0.875rem 1rem', border: 'none', background: 'white',
                                            cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseOver={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                                        onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
                                    >
                                        <span style={{ fontSize: '1.25rem' }}>📦</span>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>สแปร์</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>เบิกสำรองไม่ระบุเบอร์รถ</div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
                {(['supervisor', 'admin', 'manager', 'stock', 'clerk', 'central'].includes(user.role) || (user.permissions && user.permissions.length > 0)) && (
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
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2.5 rounded-lg">
                                <span className="text-xl">📋</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">ประวัติการเบิกอะไหล่</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">รายการเบิกอะไหล่ทั้งหมดของคุณ (My Requests)</p>
                            </div>
                        </div>

                        {myMWRRequests.length === 0 ? (
                            <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm transition-all duration-200 hover:shadow-md">
                                <span className="text-4xl mb-4 block opacity-50">📂</span>
                                <p className="text-zinc-500 dark:text-zinc-400 font-medium">ยังไม่มีรายการเบิกอะไหล่</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200/50 dark:border-zinc-800/50">
                                                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">MWR Code</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">วันที่</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">สนามปลายทาง</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">ความเร่งด่วน</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">รายการ</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">สถานะ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                                            {myMWRRequests.map(job => (
                                                <tr key={job.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition-colors duration-200">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1.5 items-start">
                                                            <button 
                                                                onClick={() => setSelectedMWR(job)}
                                                                className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline decoration-indigo-300 underline-offset-4 transition-all duration-200 text-left"
                                                            >
                                                                {job.mwr_code || job.id.slice(-6).toUpperCase()}
                                                            </button>
                                                            {job.bplus_code ? (
                                                                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 inline-flex items-center gap-1 shadow-sm">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> BPLUS: {job.bplus_code}
                                                                </span>
                                                            ) : (
                                                                (job.status === 'stock_pending' || job.status === 'completed') && (
                                                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic bg-white dark:bg-transparent px-1 border border-transparent">
                                                                        รอระบุเลข BPLUS...
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center text-sm font-medium text-zinc-600 dark:text-zinc-300">
                                                            {new Date(job.createdAt || job.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                                                            {golfCourses.find(gc => gc.id === job.golf_course_id)?.name || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                            job.remarks?.includes('เร่งด่วนมาก') ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                                                            job.remarks?.includes('เร่งด่วน') ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' : 
                                                            'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                                                        }`}>
                                                            {job.remarks?.includes('เร่งด่วนมาก') ? '🚨 ด่วนมาก' :
                                                             job.remarks?.includes('เร่งด่วน') ? '⚠️ ด่วน' : 'ปกติ'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">{job.parts?.length || 0} รายการ</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm ${
                                                            job.status === 'completed' ? 'bg-emerald-500 text-white border border-emerald-600 dark:bg-emerald-600 dark:text-emerald-50 dark:border-emerald-700' : 
                                                            job.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                                                            job.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 
                                                            job.status === 'stock_pending' ? 'bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' :
                                                            'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                                        }`}>
                                                            {job.status === 'completed' ? 'เบิกจ่ายเสร็จสิ้น' : 
                                                             job.status === 'approved' ? 'อนุมัติแล้ว' : 
                                                             job.status === 'rejected' ? 'ไม่อนุมัติ' : 
                                                             job.status === 'stock_pending' ? 'รอฝ่ายสต๊อกตัดจ่าย' :
                                                             'รอตรวจสอบ'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Site Stock */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2.5 rounded-lg">
                                <span className="text-xl">🏭</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">สต็อกอะไหล่ประจำสนาม</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">{golfCourses.find(gc => gc.id.toString() === user.golf_course_id?.toString())?.name || 'ไม่ระบุ'}</p>
                            </div>
                        </div>

                        {siteStock.length === 0 ? (
                            <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm transition-all duration-200">
                                <span className="text-4xl mb-4 block opacity-50">🗄️</span>
                                <p className="text-zinc-500 dark:text-zinc-400 font-medium">ไม่พบข้อมูลสต็อกในสนามนี้ หรือ สต็อกเป็นศูนย์</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {siteStock.map((part: any) => (
                                    <div key={part.id} className={`group p-5 rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                                        part.siteStock < 5 
                                        ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50' 
                                        : 'bg-white border-zinc-200/50 dark:bg-zinc-900 dark:border-zinc-800/50'
                                    }`}>
                                        <div className="font-semibold text-zinc-900 dark:text-zinc-50 mb-1 group-hover:text-indigo-600 transition-colors">{part.name}</div>
                                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 font-mono">#{part.part_number || '-'}</div>

                                        <div className="flex justify-between items-end mt-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">คงเหลือ</span>
                                            <span className={`text-2xl font-bold tracking-tight ${
                                                part.siteStock < 5 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                                            }`}>
                                                {part.siteStock} <span className="text-sm font-medium opacity-70 ml-0.5">{part.unit}</span>
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

            {/* MWR Details Modal */}
            <MWRDetailsModal
                isOpen={!!selectedMWR}
                onClose={() => setSelectedMWR(null)}
                job={selectedMWR}
                golfCourses={golfCourses}
            />
        </div>
    );
}

export default Dashboard;
