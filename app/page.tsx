
'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, Part, GolfCourse, Vehicle, MOCK_USERS, MOCK_JOBS, MOCK_PARTS, MOCK_GOLF_COURSES, MOCK_VEHICLES, PartsUsageLog, MOCK_PARTS_USAGE_LOG, View } from '@/lib/data';
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
  // ใช้ localStorage สำหรับเก็บข้อมูลผู้ใช้ที่ล็อกอินล่าสุด
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });
  
  const [loginError, setLoginError] = useState('');
  
  // ใช้ localStorage สำหรับเก็บข้อมูลงาน
  const [jobs, setJobs] = useState<Job[]>(() => {
    if (typeof window !== 'undefined') {
      const savedJobs = localStorage.getItem('jobs');
      return savedJobs ? JSON.parse(savedJobs) : MOCK_JOBS;
    }
    return MOCK_JOBS;
  });
  
  // ใช้ localStorage สำหรับเก็บข้อมูลอะไหล่
  const [parts, setParts] = useState<Part[]>(() => {
    if (typeof window !== 'undefined') {
      const savedParts = localStorage.getItem('parts');
      return savedParts ? JSON.parse(savedParts) : MOCK_PARTS;
    }
    return MOCK_PARTS;
  });
  
  // ใช้ localStorage สำหรับเก็บข้อมูลสนามกอล์ฟ
  const [golfCourses, setGolfCourses] = useState<GolfCourse[]>(() => {
    if (typeof window !== 'undefined') {
      const savedGolfCourses = localStorage.getItem('golfCourses');
      return savedGolfCourses ? JSON.parse(savedGolfCourses) : MOCK_GOLF_COURSES;
    }
    return MOCK_GOLF_COURSES;
  });
  
  // ใช้ localStorage สำหรับเก็บข้อมูลรถกอล์ฟ
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    if (typeof window !== 'undefined') {
      const savedVehicles = localStorage.getItem('vehicles');
      return savedVehicles ? JSON.parse(savedVehicles) : MOCK_VEHICLES;
    }
    return MOCK_VEHICLES;
  });
  
  const [view, setView] = useState<View>(() => {
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('currentView');
      return (savedView as View) || 'dashboard';
    }
    return 'dashboard';
  });
  
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedJobForForm, setSelectedJobForForm] = useState<Job | null>(null);
  
  // ใช้ localStorage สำหรับเก็บข้อมูลผู้ใช้ทั้งหมด
  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window !== 'undefined') {
      const savedUsers = localStorage.getItem('users');
      return savedUsers ? JSON.parse(savedUsers) : MOCK_USERS;
    }
    return MOCK_USERS;
  });
  
  // ใช้ localStorage สำหรับเก็บข้อมูลสิทธิ์ของผู้ใช้
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>(() => {
    if (typeof window !== 'undefined') {
      const savedPermissions = localStorage.getItem('userPermissions');
      return savedPermissions ? JSON.parse(savedPermissions) : [];
    }
    return [];
  });

  // เพิ่ม state สำหรับ Log การใช้อะไหล่
  const [partsUsageLog, setPartsUsageLog] = useState<PartsUsageLog[]>(() => {
    if (typeof window !== 'undefined') {
      const savedLog = localStorage.getItem('partsUsageLog');
      return savedLog ? JSON.parse(savedLog) : MOCK_PARTS_USAGE_LOG;
    }
    return MOCK_PARTS_USAGE_LOG;
  });

  // บันทึกข้อมูลลง localStorage เมื่ยนแปลง
  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('parts', JSON.stringify(parts));
  }, [parts]);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('userPermissions', JSON.stringify(userPermissions));
  }, [userPermissions]);

  useEffect(() => {
    localStorage.setItem('golfCourses', JSON.stringify(golfCourses));
  }, [golfCourses]);

  useEffect(() => {
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('currentView', view);
  }, [view]);

  // เพิ่ม useEffect สำหรับบันทึก Parts Usage Log
  useEffect(() => {
    localStorage.setItem('partsUsageLog', JSON.stringify(partsUsageLog));
  }, [partsUsageLog]);

  const handleLogin = (staffCode: string) => {
    const foundUser = users.find((u) => u.code.toLowerCase() === staffCode.toLowerCase());
    if (foundUser) {
      setUser(foundUser);
      setLoginError('');
      if (foundUser.role === 'admin' || foundUser.role === 'supervisor') {
          setView('admin_dashboard');
          setShowWelcome(true);
      } else {
          setView('dashboard');
      }
    } else {
      setLoginError('รหัสพนักงานไม่ถูกต้อง');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setShowWelcome(false);
    // ไม่ต้องลบข้อมูลอื่นๆ ออกจาก localStorage เพื่อให้ข้อมูลยังคงอยู่เมื่อล็อกอินกลับเข้ามา
  };
  
  const handleCreateJob = (newJob: Job) => {
    setJobs(prev => [newJob, ...prev]);
    // Deduct stock
    newJob.parts.forEach(p => {
        setParts(currentParts => currentParts.map(part => 
            part.id === p.part_id ? {...part, stock_qty: part.stock_qty - p.quantity_used} : part
        ))
    })

    const targetView = user?.role === 'staff' ? 'dashboard' : 'admin_dashboard';
    setView(targetView);
  }
  
  const handleSetView = (newView: View) => {
      // Any logic before changing view can go here
      setView(newView);
  }

  // ฟังก์ชันสำหรับเปิดฟอร์มงานที่ได้รับมอบหมาย
  const handleFillJobForm = (job: Job) => {
    setSelectedJobForForm(job);
    setView('assigned_job_form');
  };

  // ฟังก์ชันสำหรับอัปเดตงาน
  const handleJobUpdate = (updatedJob: Job) => {
    // เพิ่ม Log การใช้อะไหล่ถ้ามีการบันทึก partsNotes
    if (updatedJob.partsNotes && updatedJob.partsNotes.trim()) {
      addPartsUsageLog(updatedJob.id, updatedJob.partsNotes);
    }
    
    setJobs(prev => prev.map(job => job.id === updatedJob.id ? updatedJob : job));
    setSelectedJobForForm(null);
  };

  // ฟังก์ชันสำหรับเพิ่ม Log การใช้อะไหล่
  const addPartsUsageLog = (jobId: number, partsNotes: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const vehicle = vehicles.find(v => v.id === job.vehicle_id);
    const golfCourse = golfCourses.find(gc => gc.id === job.golf_course_id);

    const newLog: PartsUsageLog = {
      id: Date.now(), // ใช้ timestamp เป็น ID ชั่วคราว
      jobId: jobId,
      partName: partsNotes,
      partId: `PART-${Date.now()}`,
      quantity: 1, // ค่าเริ่มต้น
      usedDate: new Date().toISOString().split('T')[0],
      userName: job.userName,
      vehicleNumber: job.vehicle_number,
      serialNumber: vehicle?.serial_number || 'ไม่ระบุ',
      golfCourseName: golfCourse?.name || 'ไม่ระบุ',
      jobType: job.type,
      system: job.system
    };

    setPartsUsageLog(prev => [newLog, ...prev]);
  };

  // ฟังก์ชันสำหรับจัดการสิทธิ์ผู้ใช้
  const updateUserPermissions = (userId: number, permissions: string[]) => {
    setUserPermissions(prev => {
      const existing = prev.find(p => p.userId === userId);
      if (existing) {
        return prev.map(p => p.userId === userId ? { ...p, permissions } : p);
      } else {
        return [...prev, { userId, permissions }];
      }
    });
  };

  const getUserPermissions = (userId: number): string[] => {
    const userPerm = userPermissions.find(p => p.userId === userId);
    return userPerm ? userPerm.permissions : [];
  };

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
          />
        )}
        {view === 'supervisor_pending_jobs' && (
          <SupervisorPendingJobsScreen 
            user={user}
            jobs={jobs}
            setJobs={setJobs}
            setView={handleSetView}
          />
        )}
      </main>
    </div>
  );
}
