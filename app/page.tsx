
'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, Part, GolfCourse, Vehicle, MOCK_USERS, MOCK_JOBS, MOCK_PARTS, MOCK_GOLF_COURSES, MOCK_VEHICLES } from '@/lib/data';
import { PartsUsageLog } from '@/components/PartsManagementScreen';
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
import AssignedJobFormScreen from '@/components/AssignedJobFormScreen'; // แก้ไขจาก Backup เป็นไฟล์หลัก
import ViewAssignedJobsScreen from '@/components/ViewAssignedJobsScreen';

export type View = 'dashboard' | 'create_job' | 'parts_management' | 'admin_dashboard' | 'history' | 'profile' | 'manage_users' | 'multi_assign' | 'serial_history' | 'admin_management' | 'golf_course_management' | 'assigned_job_form' | 'view_assigned_jobs';

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
      return savedLog ? JSON.parse(savedLog) : [];
    }
    return [];
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

  // เพิ่มฟังก์ชันสำหรับเพิ่ม Log การใช้อะไหล่
  // แก้ไขฟังก์ชัน addPartsUsageLog ให้ถูกต้อง
  const addPartsUsageLog = (jobId: number, partsNotes: string) => {
    if (!partsNotes.trim() || !user) return;
    
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    // แก้ไขการใช้ตัวแปร - เปลี่ยนชื่อเพื่อหลีกเลี่ยง shadowing
    const vehicleData = vehicles.find(v => v.id === job.vehicle_id);
    const golfCourseData = golfCourses.find(gc => gc.id === vehicleData?.golf_course_id);
    
    // ปรับปรุงการ parse partsNotes ให้ดีขึ้น
    const lines = partsNotes.split('\n').filter(line => line.trim());
    const newLogs: PartsUsageLog[] = [];
    
    lines.forEach((line, index) => {
      // รองรับรูปแบบต่างๆ เช่น "ชื่ออะไหล่ x จำนวน" หรือ "ชื่ออะไหล่ จำนวน ชิ้น"
      const patterns = [
        /(.+?)\s*x\s*(\d+)/i,  // "ชื่ออะไหล่ x 2"
        /(.+?)\s*(\d+)\s*(?:ชิ้น|ลูก|เส้น|ชุด)/i,  // "ชื่ออะไหล่ 2 ชิ้น"
        /เปลี่ยน(.+?)\s*(\d+)/i  // "เปลี่ยนชื่ออะไหล่ 2"
      ];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const partName = match[1].trim();
          const quantity = parseInt(match[2]);
          
          if (partName && quantity > 0) {
            const maxLogId = Math.max(...partsUsageLog.map(log => log.id), 0);
            
            newLogs.push({
              id: maxLogId + newLogs.length + 1,
              jobId: jobId,
              partName,
              partId: `PART-${Date.now()}-${index}`,
              quantity,
              usedDate: new Date().toISOString().split('T')[0],
              userName: user.name,
              vehicleNumber: vehicleData?.vehicle_number || 'N/A',
              golfCourseName: golfCourseData?.name || 'N/A',
              jobType: job.type as 'PM' | 'BM' | 'Recondition',
              system: job.system
            });
          }
          break;
        }
      }
    });
    
    if (newLogs.length > 0) {
      setPartsUsageLog(prev => [...newLogs, ...prev]);
    }
  };

  // ฟังก์ชันสำหรับอัปเดตงานที่กรอกฟอร์มแล้ว
  const handleJobUpdate = (updatedJob: Job) => {
    // เพิ่ม Log การใช้อะไหล่ถ้ามีการบันทึก partsNotes
    if (updatedJob.partsNotes && updatedJob.partsNotes.trim()) {
      addPartsUsageLog(updatedJob.id, updatedJob.partsNotes);
    }
    
    setJobs(prev => prev.map(job => job.id === updatedJob.id ? updatedJob : job));
    setSelectedJobForForm(null);
  };

  // เพิ่มฟังก์ชันสำหรับจัดการสิทธิ์ของผู้ใช้
  const handleUpdateUserPermissions = (userId: number, permissions: string[]) => {
    const existingIndex = userPermissions.findIndex(up => up.userId === userId);
    
    if (existingIndex >= 0) {
      // อัพเดทสิทธิ์ที่มีอยู่
      const updatedPermissions = [...userPermissions];
      updatedPermissions[existingIndex] = { userId, permissions };
      setUserPermissions(updatedPermissions);
    } else {
      // เพิ่มสิทธิ์ใหม่
      setUserPermissions([...userPermissions, { userId, permissions }]);
    }
  };

  // เพิ่มฟังก์ชันสำหรับตรวจสอบสิทธิ์ของผู้ใช้
  const getUserPermissions = (userId: number): string[] => {
    const userPerm = userPermissions.find(up => up.userId === userId);
    return userPerm ? userPerm.permissions : [];
  };

  // เพิ่มฟังก์ชันสำหรับการทดสอบใส่ข้อมูล
  const loadTestData = () => {
    // ข้อมูลทดสอบสำหรับผู้ใช้
    const testUsers: User[] = [
      { id: 1, name: 'Admin Test', code: 'admin', role: 'admin', golf_course_id: 1 },
      { id: 2, name: 'Staff Test', code: 'staff', role: 'staff', golf_course_id: 1 },
      { id: 3, name: 'Supervisor Test', code: 'super', role: 'supervisor', golf_course_id: 1 }
    ];
    
    // ข้อมูลทดสอบสำหรับงาน
    const testJobs: Job[] = [
      {
        id: 1,
        user_id: 1,
        userName: 'Admin Test',
        vehicle_id: 1,
        vehicle_number: '1',
        golf_course_id: 1, // เพิ่ม golf_course_id
        type: 'PM',
        system: 'brake',
        status: 'pending',
        created_at: new Date().toISOString(),
        parts: [],
        subTasks: [],
        partsNotes: '',
        remarks: 'ทดสอบงาน PM'
      }
    ];
    
    setUsers(testUsers);
    setJobs(testJobs);
    alert('ข้อมูลทดสอบถูกโหลดแล้ว');
  };

  // เพิ่มฟังก์ชันสำหรับรีเซ็ตข้อมูลทั้งหมด
  const resetAllData = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดหรือไม่?')) {
      setJobs(MOCK_JOBS);
      setParts(MOCK_PARTS);
      setUsers(MOCK_USERS);
      setGolfCourses(MOCK_GOLF_COURSES);
      setVehicles(MOCK_VEHICLES);
      setUserPermissions([]);
      setPartsUsageLog([]);
      alert('ข้อมูลทั้งหมดถูกรีเซ็ตแล้ว');
    }
  };

  if (!user) {
    return (
      <div className="app">
        <LoginScreen onLogin={handleLogin} error={loginError} />
      </div>
    );
  }

  return (
    <div className="app">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        setView={handleSetView}
      />
      
      {showWelcome && (
        <WelcomeBanner 
          user={user} 
          onDismiss={() => setShowWelcome(false)} 
        />
      )}
      
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
            golfCourses={golfCourses}
            vehicles={vehicles}
            jobs={jobs} // เพิ่ม jobs prop
            onJobCreate={handleCreateJob}
            setView={handleSetView}
          />
        )}
        
        {view === 'parts_management' && (
          <PartsManagementScreen 
            parts={parts} 
            setParts={setParts}
            partsUsageLog={partsUsageLog}
            setView={handleSetView}
          />
        )}
        
        {view === 'admin_dashboard' && (
          <AdminDashboard 
            setView={handleSetView}
          />
        )}
        
        {view === 'history' && (
          <HistoryScreen 
            vehicles={vehicles}
            parts={parts}
            setView={handleSetView}
          />
        )}
        
        {view === 'manage_users' && (
          <ManageUsersScreen 
            users={users}
            setUsers={setUsers}
            golfCourses={golfCourses}
            setView={handleSetView}
          />
        )}
        
        {view === 'multi_assign' && (
          <MultiAssignScreen 
            user={user}
            jobs={jobs}
            setJobs={setJobs}
            users={users}
            golfCourses={golfCourses}
            vehicles={vehicles}
            setView={handleSetView}
          />
        )}
        
        {view === 'serial_history' && (
          <SerialHistoryScreen 
            vehicles={vehicles}
            setView={handleSetView}
          />
        )}
        
        {view === 'admin_management' && (
          <AdminManagementScreen 
            users={users}
            setUsers={setUsers}
            userPermissions={userPermissions}
            updateUserPermissions={handleUpdateUserPermissions}
            getUserPermissions={getUserPermissions}
            golfCourses={golfCourses}
            setView={handleSetView}
          />
        )}
        
        {view === 'golf_course_management' && (
          <GolfCourseManagementScreen 
            golfCourses={golfCourses}
            setGolfCourses={setGolfCourses}
            vehicles={vehicles}
            setVehicles={setVehicles}
            onBack={() => handleSetView('admin_dashboard')}
          />
        )}
        
        {view === 'assigned_job_form' && selectedJobForForm && (
          <AssignedJobFormScreen 
            user={user}
            job={selectedJobForForm}
            onJobUpdate={handleJobUpdate}
            vehicles={vehicles}
            golfCourses={golfCourses}
            setView={handleSetView}
          />
        )}
        
        {view === 'view_assigned_jobs' && (
          <ViewAssignedJobsScreen 
            currentUser={user}
          />
        )}
      </main>
    </div>
  );
}
