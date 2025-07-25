
'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, Part, GolfCourse, Vehicle, PartsUsageLog, SerialHistoryEntry, View, JobStatus } from '@/lib/data';
import { golfCoursesApi, usersApi, vehiclesApi, partsApi, jobsApi, partsUsageLogsApi, serialHistoryApi, authApi } from '@/lib/api';
import LoginScreen from '@/components/LoginScreen';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import CreateJobScreen from '@/components/CreateJobScreen';
import PartsManagementScreen from '@/components/PartsManagementScreen';
import AdminDashboard from '@/components/AdminDashboard';
import WelcomeBanner from '@/components/WelcomeBanner';
import ManageUsersScreen from '@/components/ManageUsersScreen';
import HistoryScreen from '@/components/HistoryScreen';
import MultiAssignScreen from '@/components/MultiAssignScreen';
import SerialHistoryScreen from '@/components/SerialHistoryScreen';
import AdminManagementScreen from '@/components/AdminManagementScreen';
import GolfCourseManagementScreen from '@/components/GolfCourseManagementScreen';
import AssignedJobFormScreen from '@/components/AssignedJobFormScreen';
import ViewAssignedJobsScreen from '@/components/ViewAssignedJobsScreen';
import SupervisorPendingJobsScreen from '@/components/SupervisorPendingJobsScreen';

// เพิ่มอินเตอร์เฟซสำหรับสิทธิ์ของผู้ใช้
export interface UserPermission {
  userId: number;
  permissions: string[];
}

export default function HomePage() {
  // State สำหรับข้อมูลต่างๆ
  const [user, setUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [golfCourses, setGolfCourses] = useState<GolfCourse[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [partsUsageLog, setPartsUsageLog] = useState<PartsUsageLog[]>([]);
  const [serialHistory, setSerialHistory] = useState<SerialHistoryEntry[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedJobForForm, setSelectedJobForForm] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูลเริ่มต้นจาก API
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // โหลดข้อมูลพื้นฐานทั้งหมดพร้อมกัน
        const [
          golfCoursesResult,
          usersResult,
          vehiclesResult,
          partsResult,
          jobsResult,
          partsUsageLogResult,
          serialHistoryResult
        ] = await Promise.all([
          golfCoursesApi.getAll(),
          usersApi.getAll(),
          vehiclesApi.getAll(),
          partsApi.getAll(),
          jobsApi.getAll(),
          partsUsageLogsApi.getAll(),
          serialHistoryApi.getAll()
        ]);

        // ตั้งค่าข้อมูลที่โหลดได้
        if (golfCoursesResult.success) setGolfCourses(golfCoursesResult.data as GolfCourse[]);
        if (usersResult.success) setUsers(usersResult.data as User[]);
        if (vehiclesResult.success) setVehicles(vehiclesResult.data as Vehicle[]);
        if (partsResult.success) setParts(partsResult.data as Part[]);
        if (jobsResult.success) setJobs(jobsResult.data as Job[]);
        if (partsUsageLogResult.success) setPartsUsageLog(partsUsageLogResult.data as PartsUsageLog[]);
        if (serialHistoryResult.success) setSerialHistory(serialHistoryResult.data as SerialHistoryEntry[]);

        // โหลดข้อมูลผู้ใช้ที่ล็อกอินจาก localStorage
        if (typeof window !== 'undefined') {
          const savedUser = localStorage.getItem('currentUser');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
          
          const savedView = localStorage.getItem('currentView');
          if (savedView) {
            setView(savedView as View);
          }
        }

      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // บันทึกข้อมูลผู้ใช้และ view ลง localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('currentView', view);
  }, [view]);

  // ฟังก์ชันสำหรับบันทึก Serial History Entry
  const addSerialHistoryEntry = async (entry: Omit<SerialHistoryEntry, 'id'>): Promise<SerialHistoryEntry | null> => {
    try {
      const result = await serialHistoryApi.create(entry);
      if (result.success) {
        const newEntry = result.data as SerialHistoryEntry;
        setSerialHistory(prev => [newEntry, ...prev]);
        return newEntry;
      }
    } catch (error) {
      console.error('Error adding serial history entry:', error);
    }
    return null;
  };

  // ฟังก์ชันสำหรับบันทึก Serial History เมื่อสร้างงาน
  const logJobCreation = async (job: Job) => {
    const vehicle = vehicles.find(v => v.id === job.vehicle_id);
    const golfCourse = golfCourses.find(gc => gc.id === job.golf_course_id);
    
    if (vehicle) {
      await addSerialHistoryEntry({
        serial_number: vehicle.serial_number,
        vehicle_id: job.vehicle_id,
        vehicle_number: job.vehicle_number,
        action_type: 'maintenance',
        action_date: job.created_at || new Date().toISOString().split('T')[0],
        details: `สร้างงาน${job.type} - ${job.remarks || 'ไม่มีรายละเอียด'}`,
        performed_by: job.userName,
        performed_by_id: job.user_id,
        golf_course_id: job.golf_course_id,
        golf_course_name: golfCourse?.name || 'ไม่ระบุ',
        is_active: vehicle.status === 'active',
        status: 'pending',
        job_type: job.type,
        system: job.system,
        battery_serial: job.battery_serial
      });
    }
  };

  // ฟังก์ชันสำหรับบันทึก Serial History เมื่ออัปเดตงาน
  const logJobUpdate = async (updatedJob: Job, previousJob?: Job) => {
    const vehicle = vehicles.find(v => v.id === updatedJob.vehicle_id);
    const golfCourse = golfCourses.find(gc => gc.id === updatedJob.golf_course_id);
    
    if (vehicle) {
      let actionType: SerialHistoryEntry['action_type'] = 'maintenance';
      let details = '';
      let status: SerialHistoryEntry['status'] = 'pending';

      if (previousJob?.status !== updatedJob.status) {
        switch (updatedJob.status) {
          case 'completed':
            actionType = 'maintenance';
            details = `งาน${updatedJob.type}เสร็จสิ้น - ${updatedJob.remarks || 'ไม่มีรายละเอียด'}`;
            status = 'completed';
            break;
          case 'in_progress':
            actionType = 'maintenance';
            details = `เริ่มดำเนินงาน${updatedJob.type} - ${updatedJob.remarks || 'ไม่มีรายละเอียด'}`;
            status = 'in_progress';
            break;
          case 'rejected':
            actionType = 'maintenance';
            details = `งาน${updatedJob.type}ถูกปฏิเสธ - ${updatedJob.remarks || 'ไม่มีรายละเอียด'}`;
            status = 'pending';
            break;
          default:
            actionType = 'maintenance';
            details = `อัปเดตงาน${updatedJob.type} - ${updatedJob.remarks || 'ไม่มีรายละเอียด'}`;
            status = 'pending';
        }
      } else {
        details = `อัปเดตงาน${updatedJob.type} - ${updatedJob.remarks || 'ไม่มีรายละเอียด'}`;
        status = updatedJob.status === 'completed' ? 'completed' : 
                 updatedJob.status === 'in_progress' ? 'in_progress' : 'pending';
      }

      await addSerialHistoryEntry({
        serial_number: vehicle.serial_number,
        vehicle_id: updatedJob.vehicle_id,
        vehicle_number: updatedJob.vehicle_number,
        action_type: actionType,
        action_date: updatedJob.updated_at || new Date().toISOString().split('T')[0],
        details: details,
        performed_by: updatedJob.userName,
        performed_by_id: updatedJob.user_id,
        golf_course_id: updatedJob.golf_course_id,
        golf_course_name: golfCourse?.name || 'ไม่ระบุ',
        is_active: vehicle.status === 'active',
        status: status,
        job_type: updatedJob.type,
        system: updatedJob.system,
        battery_serial: updatedJob.battery_serial
      });
    }
  };

  const handleLogin = async (identifier: string, password?: string, loginType?: 'staff' | 'admin') => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier,
          password,
          loginType
        })
      });
  
      const result = await response.json();
  
      if (result.success) {
        setUser(result.data);
        setLoginError('');
        const targetView = result.data.role === 'staff' ? 'dashboard' : 'admin_dashboard';
        setView(targetView);
        if (result.data.role !== 'staff') {
          setShowWelcome(true);
        }
      } else {
        setLoginError(result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setShowWelcome(false);
    localStorage.removeItem('currentUser');
  };
  
  const handleCreateJob = async (newJob: Job) => {
    try {
      // สร้างงานใหม่ผ่าน API
      const result = await jobsApi.create(newJob);
      if (result.success) {
        const createdJob = result.data as Job;
        setJobs(prev => [createdJob, ...prev]);
        
        // บันทึก Serial History
        await logJobCreation(createdJob);
        
        // อัปเดต stock ของอะไหล่ถ้ามี
        if (createdJob.parts && createdJob.parts.length > 0) {
          for (const part of createdJob.parts) {
            try {
              const currentPart = parts.find(p => p.id === part.part_id);
              if (currentPart) {
                const currentStock = currentPart.stock_qty !== undefined ? currentPart.stock_qty : currentPart.stock_quantity;
                if (currentStock !== undefined) {
                  const updatedPart = { ...currentPart, stock_qty: currentStock - part.quantity_used };
                  await partsApi.update(part.part_id, updatedPart);
                  setParts(prev => prev.map(p => p.id === part.part_id ? updatedPart : p));
                }
              }
            } catch (error) {
              console.error('Error updating part stock:', error);
            }
          }
        }

        const targetView = user?.role === 'staff' ? 'dashboard' : 'admin_dashboard';
        setView(targetView);
      }
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };
  
  const handleSetView = (newView: View) => {
    setView(newView);
  };

  const handleFillJobForm = (job: Job) => {
    setSelectedJobForForm(job);
    setView('assigned_job_form');
  };

  const handleJobUpdate = async (updatedJob: Job) => {
    try {
      const previousJob = jobs.find(job => job.id === updatedJob.id);
      
      // อัปเดตงานผ่าน API
      const result = await jobsApi.update(updatedJob.id, updatedJob);
      if (result.success) {
        const updated = result.data as Job;
        
        // เพิ่ม Log การใช้อะไหล่เฉพาะเมื่องานได้รับการอนุมัติแล้ว
        if (updated.status === 'approved') {
          await addPartsUsageLog(updated.id, updated.partsNotes, updated);
        }
        
        // บันทึก Serial History
        await logJobUpdate(updated, previousJob);
        
        setJobs(prev => prev.map(job => job.id === updated.id ? updated : job));
        setSelectedJobForForm(null);
      }
    } catch (error) {
      console.error('Error updating job:', error);
    }
  };

  const addPartsUsageLog = async (jobId: number, partsNotes?: string, jobData?: Job) => {
    try {
      const job = jobData || jobs.find(j => j.id === jobId);
      if (!job || job.status !== 'approved') {
        return;
      }

      const vehicle = vehicles.find(v => v.id === job.vehicle_id);
      const golfCourse = golfCourses.find(gc => gc.id === job.golf_course_id);

      if (job.parts && job.parts.length > 0) {
        for (const [index, part] of Array.from(job.parts.entries())) {
          const logData = {
            jobId: jobId,
            partName: part.part_name || `อะไหล่ ID: ${part.part_id}`,
            partId: `PART-${part.part_id}`,
            quantityUsed: part.quantity_used,
            vehicleNumber: job.vehicle_number,
            vehicleSerial: vehicle?.serial_number || 'ไม่ระบุ',
            golfCourseName: golfCourse?.name || 'ไม่ระบุ',
            usedBy: job.userName,
            usedDate: new Date().toISOString().split('T')[0],
            notes: partsNotes || job.remarks || 'ไม่มีหมายเหตุ',
            jobType: job.type,
            system: job.system || 'ไม่ระบุ'
          };

          const result = await partsUsageLogsApi.create(logData);
          if (result.success) {
            setPartsUsageLog(prev => [result.data as PartsUsageLog, ...prev]);
          }
        }
      }
    } catch (error) {
      console.error('Error adding parts usage log:', error);
    }
  };

  // ฟังก์ชันสำหรับอัปเดตสถานะงาน
  const onUpdateStatus = (jobId: number, status: JobStatus) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      const updatedJob = { ...job, status };
      handleJobUpdate(updatedJob);
    }
  };

  // ฟังก์ชันสำหรับจัดการสิทธิ์ผู้ใช้
  const getUserPermissions = (userId: number): string[] => {
    const userPermission = userPermissions.find(up => up.userId === userId);
    return userPermission ? userPermission.permissions : [];
  };

  const updateUserPermissions = (userId: number, permissions: string[]) => {
    setUserPermissions(prev => {
      const existingIndex = prev.findIndex(up => up.userId === userId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { userId, permissions };
        return updated;
      } else {
        return [...prev, { userId, permissions }];
      }
    });
  };

  // แสดง loading screen ขณะโหลดข้อมูล
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  // แสดง login screen ถ้ายังไม่ได้ล็อกอิน
  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} setView={handleSetView} />
      {showWelcome && <WelcomeBanner user={user} onDismiss={() => setShowWelcome(false)} />}
      
      <main className="main-content">
        {view === 'dashboard' && (
          <Dashboard 
            user={user} 
            jobs={jobs} 
            setJobs={setJobs} 
            setView={handleSetView}
            onFillJobForm={handleFillJobForm}
            addPartsUsageLog={addPartsUsageLog}
            vehicles={vehicles}
            golfCourses={golfCourses}
            users={users}
          />
        )}
        {view === 'create_job' && (
          <CreateJobScreen 
            user={user} 
            onJobCreate={handleCreateJob} 
            setView={handleSetView}
            vehicles={vehicles}
            golfCourses={golfCourses}
            jobs={jobs}
          />
        )}
        {view === 'parts_management' && (
          <PartsManagementScreen 
            parts={parts} 
            setParts={setParts} 
            setView={handleSetView}
            partsUsageLog={partsUsageLog}
            setPartsUsageLog={setPartsUsageLog}
            addPartsUsageLog={addPartsUsageLog}
            vehicles={vehicles}
            golfCourses={golfCourses}
          />
        )}
        {view === 'admin_dashboard' && (
          <AdminDashboard setView={handleSetView} />
        )}
        {view === 'manage_users' && (
          <ManageUsersScreen 
            users={users} 
            setUsers={setUsers} 
            setView={handleSetView}
            golfCourses={golfCourses}
          />
        )}
        {view === 'history' && (
          <HistoryScreen 
            setView={handleSetView}
            vehicles={vehicles}
            parts={parts}
            jobs={jobs}
          />
        )}
        {view === 'multi_assign' && (
          <MultiAssignScreen 
            setView={handleSetView}
            user={user}
            jobs={jobs}
            setJobs={setJobs}
            users={users}
            vehicles={vehicles}
            golfCourses={golfCourses}
          />
        )}
        {view === 'serial_history' && (
          <SerialHistoryScreen 
            user={user}
            setView={handleSetView}
            jobs={jobs}
            vehicles={vehicles}
            serialHistory={serialHistory}
          />
        )}
        {view === 'admin_management' && (
          <AdminManagementScreen 
            setView={handleSetView}
            users={users}
            setUsers={setUsers}
            userPermissions={userPermissions}
            updateUserPermissions={updateUserPermissions}
            getUserPermissions={getUserPermissions}
            golfCourses={golfCourses}
          />
        )}
        {view === 'golf_course_management' && (
          <GolfCourseManagementScreen 
            onBack={() => setView('admin_dashboard')}
            golfCourses={golfCourses}
            setGolfCourses={setGolfCourses}
            vehicles={vehicles}
            setVehicles={setVehicles}
            serialHistory={serialHistory}
            addSerialHistoryEntry={addSerialHistoryEntry}
          />
        )}
        {view === 'assigned_job_form' && selectedJobForForm && (
          <AssignedJobFormScreen 
            job={selectedJobForForm}
            user={user}
            onJobUpdate={handleJobUpdate}
            setView={handleSetView}
            vehicles={vehicles}
            golfCourses={golfCourses}
          />
        )}
        {view === 'view_assigned_jobs' && (
          <ViewAssignedJobsScreen 
            currentUser={user}
            jobs={jobs}
            golfCourses={golfCourses}
            users={users}
            vehicles={vehicles}
            onUpdateStatus={onUpdateStatus}
          />
        )}
        {view === 'supervisor_pending_jobs' && (
          <SupervisorPendingJobsScreen 
            user={user} 
            jobs={jobs}
            golfCourses={golfCourses}
            users={users}
            vehicles={vehicles}
            onUpdateStatus={onUpdateStatus}
          />
        )}
      </main>
    </div>
  );
}

