
'use client';

import React, { useState, useEffect } from 'react';
import { User, Job, Part, GolfCourse, Vehicle, MOCK_USERS, MOCK_JOBS, MOCK_PARTS, MOCK_GOLF_COURSES, MOCK_VEHICLES, PartsUsageLog, MOCK_PARTS_USAGE_LOG, SerialHistoryEntry, MOCK_SERIAL_HISTORY, View } from '@/lib/data';
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
  // ใช้ localStorage สำหรับเก็บข้อมูลผู้ใช้ที่ล็อกอินล่าสุุด
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

  // เพิ่ม state สำหรับ Serial History
  const [serialHistory, setSerialHistory] = useState<SerialHistoryEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const savedSerialHistory = localStorage.getItem('serialHistory');
      return savedSerialHistory ? JSON.parse(savedSerialHistory) : MOCK_SERIAL_HISTORY;
    }
    return MOCK_SERIAL_HISTORY;
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

  // เพิ่ม useEffect สำหรับบันทึก Serial History
  useEffect(() => {
    localStorage.setItem('serialHistory', JSON.stringify(serialHistory));
  }, [serialHistory]);

  // ฟังก์ชันสำหรับบันทึก Serial History Entry
  const addSerialHistoryEntry = (entry: Omit<SerialHistoryEntry, 'id'>): SerialHistoryEntry => {
    const newEntry: SerialHistoryEntry = {
      ...entry,
      id: Date.now() // ใช้ timestamp เป็น ID
    };
    setSerialHistory(prev => [newEntry, ...prev]);
    return newEntry;
  };

  // ฟังก์ชันสำหรับบันทึก Serial History เมื่อสร้างงาน
  const logJobCreation = (job: Job) => {
    const vehicle = vehicles.find(v => v.id === job.vehicle_id);
    const golfCourse = golfCourses.find(gc => gc.id === job.golf_course_id);
    
    if (vehicle) {
      addSerialHistoryEntry({
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
        battery_serial: job.battery_serial // เก็บซีเรียลแบตที่พนักงานกรอก
      });
    }
  };

  // ฟังก์ชันสำหรับบันทึก Serial History เมื่ออัปเดตงาน
  const logJobUpdate = (updatedJob: Job, previousJob?: Job) => {
    const vehicle = vehicles.find(v => v.id === updatedJob.vehicle_id);
    const golfCourse = golfCourses.find(gc => gc.id === updatedJob.golf_course_id);
    
    if (vehicle) {
      let actionType: SerialHistoryEntry['action_type'] = 'maintenance';
      let details = '';
      let status: SerialHistoryEntry['status'] = 'pending';

      // กำหนด action type และ details ตามการเปลี่ยนแปลง
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
            status = 'pending'; // ใช้ pending แทน rejected เพราะ SerialHistoryEntry ไม่มี rejected
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

      addSerialHistoryEntry({
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
        battery_serial: updatedJob.battery_serial // เก็บซีเรียลแบตที่พนักงานกรอก
      });
    }
  };

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
    
    // ไม่เพิ่ม Log การใช้อะไหล่เมื่อสร้างงานใหม่ เพราะยังไม่ได้อนุมัติ
    // addPartsUsageLog(newJob.id, newJob.partsNotes);
    
    // เพิ่ม Serial History Entry สำหรับการสร้างงาน
    logJobCreation(newJob);
    
    // Deduct stock
    if (newJob.parts && newJob.parts.length > 0) {
        newJob.parts.forEach(p => {
            setParts(currentParts => currentParts.map(part => {
                if (part.id === p.part_id) {
                    // ใช้ stock_quantity ถ้า stock_qty ไม่มี
                    const currentStock = part.stock_qty !== undefined ? part.stock_qty : part.stock_quantity;
                    // ตรวจสอบว่า currentStock มีค่าหรือไม่
                    if (currentStock !== undefined) {
                        return {...part, stock_qty: currentStock - p.quantity_used};
                    }
                    return part; // ไม่เปลี่ยนแปลงถ้า currentStock ไม่มีค่า
                }
                return part;
            }))
        })
    }

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
    // หา job เดิมเพื่อเปรียบเทียบ
    const previousJob = jobs.find(job => job.id === updatedJob.id);
    
    // เพิ่ม Log การใช้อะไหล่เฉพาะเมื่องานได้รับการอนุมัติแล้ว
    if (updatedJob.status === 'approved') {
      addPartsUsageLog(updatedJob.id, updatedJob.partsNotes);
    }
    
    // เพิ่ม Serial History Entry สำหรับการอัปเดตงาน
    logJobUpdate(updatedJob, previousJob);
    
    setJobs(prev => prev.map(job => job.id === updatedJob.id ? updatedJob : job));
    setSelectedJobForForm(null);
  };

  // ฟังก์ชันสำหรับเพิ่ม Log การใช้อะไหล่
  const addPartsUsageLog = (jobId: number, partsNotes?: string, jobData?: Job) => {
    console.log('🔧 addPartsUsageLog called with:', { jobId, partsNotes, jobData });
    
    // ใช้ jobData ที่ส่งมาหรือค้นหาจาก jobs state
    const job = jobData || jobs.find(j => j.id === jobId);
    if (!job) {
      console.log('❌ Job not found for ID:', jobId);
      return;
    }
  
    console.log('📋 Job found:', job);
    console.log('📊 Job status:', job.status);
  
    // ตรวจสอบว่างานได้รับการอนุมัติแล้วหรือไม่
    if (job.status !== 'approved') {
      console.log('⚠️ Job not approved, status:', job.status);
      return;
    }
  
    const vehicle = vehicles.find(v => v.id === job.vehicle_id);
    const golfCourse = golfCourses.find(gc => gc.id === job.golf_course_id);
  
    console.log('🚗 Vehicle found:', vehicle);
    console.log('🏌️ Golf course found:', golfCourse);
    console.log('🔩 Job parts:', job.parts);
  
    // บันทึกข้อมูลอะไหล่จาก job.parts (อะไหล่ที่เลือกจริงๆ)
    if (job.parts && job.parts.length > 0) {
      console.log('✅ Processing job parts, count:', job.parts.length);
      job.parts.forEach((part, index) => {
        const newLog: PartsUsageLog = {
          id: Date.now() + index, // ใช้ timestamp + index เป็น ID เพื่อไม่ให้ซ้ำ
          jobId: jobId,
          partName: part.part_name || `อะไหล่ ID: ${part.part_id}`,
          partId: `PART-${part.part_id}`,
          quantity: part.quantity_used,
          usedDate: new Date().toISOString().split('T')[0],
          userName: job.userName,
          vehicleNumber: job.vehicle_number,
          serialNumber: vehicle?.serial_number || 'ไม่ระบุ',
          golfCourseName: golfCourse?.name || 'ไม่ระบุ',
          jobType: job.type,
          system: job.system || 'ไม่ระบุ'
        };
  
        console.log('📝 Creating new log:', newLog);
        setPartsUsageLog(prev => {
          const updated = [newLog, ...prev];
          console.log('📊 Updated partsUsageLog, total count:', updated.length);
          return updated;
        });
      });
    } else {
      console.log('⚠️ No parts found in job');
    }
  
    // บันทึกข้อมูลจาก partsNotes (ถ้ามี) สำหรับข้อมูลเพิ่มเติม
    if (partsNotes && partsNotes.trim()) {
      const newLog: PartsUsageLog = {
        id: Date.now() + 1000, // เพิ่ม offset เพื่อไม่ให้ซ้ำกับ parts
        jobId: jobId,
        partName: partsNotes,
        partId: `NOTES-${Date.now()}`,
        quantity: 1,
        usedDate: new Date().toISOString().split('T')[0],
        userName: job.userName,
        vehicleNumber: job.vehicle_number,
        serialNumber: vehicle?.serial_number || 'ไม่ระบุ',
        golfCourseName: golfCourse?.name || 'ไม่ระบุ',
        jobType: job.type,
        system: job.system || 'ไม่ระบุ'
      };
  
      setPartsUsageLog(prev => [newLog, ...prev]);
    }
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
            addPartsUsageLog={addPartsUsageLog}
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
          />
        )}
        {view === 'supervisor_pending_jobs' && (
          <SupervisorPendingJobsScreen 
            user={user}
            jobs={jobs}
            setJobs={setJobs}
            setView={handleSetView}
            addPartsUsageLog={addPartsUsageLog}
          />
        )}
      </main>
    </div>
  );
}

