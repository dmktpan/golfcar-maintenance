
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Job, Part, GolfCourse, Vehicle, PartsUsageLog, SerialHistoryEntry, View, JobStatus } from '@/lib/data';
import { golfCoursesApi, usersApi, vehiclesApi, partsApi, jobsApi, partsUsageLogsApi, serialHistoryApi } from '@/lib/api';
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
  const [loadingError, setLoadingError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // โหลดข้อมูลเริ่มต้นจาก API
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setLoadingError('');
        setConnectionStatus('checking');
        setLoadingProgress(0);
        
        console.log('🚀 เริ่มโหลดข้อมูล...');
        console.log('🌐 API Base URL:', process.env.NODE_ENV === 'production' ? 'http://192.168.1.54:8080/api' : 'http://localhost:8080/api');
        
        // ทดสอบการเชื่อมต่อก่อน
        setLoadingProgress(10);
        try {
          console.log('🔍 ทดสอบการเชื่อมต่อเซิร์ฟเวอร์...');
          const healthCheck = await fetch(`${process.env.NODE_ENV === 'production' ? 'http://192.168.1.54:8080' : 'http://localhost:8080'}/api/users`, {
            method: 'HEAD'
          });
          if (healthCheck.ok) {
            setConnectionStatus('connected');
            console.log('✅ การเชื่อมต่อเซิร์ฟเวอร์สำเร็จ');
          } else {
            throw new Error(`Server responded with status: ${healthCheck.status}`);
          }
        } catch (error) {
          setConnectionStatus('disconnected');
          console.error('❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้:', error);
          // Don't throw error here, let the app continue and try to load data
          console.log('⚠️ จะข้ามการตรวจสอบการเชื่อมต่อและลองโหลดข้อมูลต่อไป');
        }

        setLoadingProgress(20);
        
        // โหลดข้อมูลพื้นฐานทั้งหมดพร้อมกัน
        console.log('📡 กำลังเรียก API ทั้งหมด...');
        
        // เรียง API calls ตามความสำคัญ - เรียกข้อมูลสำคัญก่อน
        const criticalApiCalls = [
          { name: 'users', call: usersApi.getAll() },
          { name: 'golfCourses', call: golfCoursesApi.getAll() }
        ];
        
        const optionalApiCalls = [
          { name: 'vehicles', call: vehiclesApi.getAll() },
          { name: 'parts', call: partsApi.getAll() },
          { name: 'jobs', call: jobsApi.getAll() },
          { name: 'partsUsageLog', call: partsUsageLogsApi.getAll() },
          { name: 'serialHistory', call: serialHistoryApi.getAll() }
        ];

        // โหลดข้อมูลสำคัญก่อน
        for (let i = 0; i < criticalApiCalls.length; i++) {
          try {
            console.log(`🔑 กำลังโหลดข้อมูลสำคัญ: ${criticalApiCalls[i].name}`);
            const result = await criticalApiCalls[i].call;
            
            if (result.success) {
              // Handle different data types for critical API calls
              if (criticalApiCalls[i].name === 'users') {
                setUsers(result.data as User[]);
              } else if (criticalApiCalls[i].name === 'golfCourses') {
                setGolfCourses(result.data as GolfCourse[]);
              }
              console.log(`✅ ข้อมูลสำคัญ ${criticalApiCalls[i].name} โหลดสำเร็จ:`, (result.data as any[]).length, 'รายการ');
            } else {
              throw new Error(`API call failed: ${result.message}`);
            }
            
            setLoadingProgress(20 + ((i + 1) / criticalApiCalls.length) * 30);
          } catch (error) {
            console.error(`❌ ข้อมูลสำคัญ ${criticalApiCalls[i].name} ล้มเหลว:`, error);
            
            // ถ้าข้อมูลสำคัญโหลดไม่ได้ ให้แสดง error
            setLoadingError(`ไม่สามารถโหลดข้อมูลสำคัญ (${criticalApiCalls[i].name}) ได้ กรุณาตรวจสอบการเชื่อมต่อ`);
            setConnectionStatus('disconnected');
            return; // หยุดการโหลดข้อมูลอื่น
          }
        }

        // โหลดข้อมูลเสริมแบบ parallel (ไม่บล็อกถ้าล้มเหลว)
        const optionalPromises = optionalApiCalls.map(async (apiCall) => {
          try {
            console.log(`📊 กำลังโหลด ${apiCall.name}...`);
            const result = await apiCall.call;
            if (result.success) {
              // Handle different data types for optional API calls
              switch (apiCall.name) {
                case 'vehicles':
                  setVehicles(result.data as Vehicle[]);
                  break;
                case 'parts':
                  setParts(result.data as Part[]);
                  break;
                case 'jobs':
                  setJobs(result.data as Job[]);
                  break;
                case 'partsUsageLog':
                  setPartsUsageLog(result.data as PartsUsageLog[]);
                  break;
                case 'serialHistory':
                  setSerialHistory(result.data as SerialHistoryEntry[]);
                  break;
              }
              console.log(`✅ โหลด ${apiCall.name} สำเร็จ:`, (result.data as any[]).length, 'รายการ');
            }
            return { name: apiCall.name, success: true };
          } catch (error) {
            console.warn(`⚠️ ข้อมูลเสริม ${apiCall.name} ล้มเหลว (ข้ามไป):`, error);
            return { name: apiCall.name, success: false, error };
          }
        });

        // รอข้อมูลเสริมทั้งหมด (แต่ไม่บล็อกถ้าบางตัวล้มเหลว)
        const optionalResults = await Promise.allSettled(optionalPromises);
        setLoadingProgress(85);

        // โหลดข้อมูลผู้ใช้ที่ล็อกอินจาก localStorage
        if (typeof window !== 'undefined') {
          const savedUser = localStorage.getItem('currentUser');
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              setUser(parsedUser);
              console.log('👤 โหลดข้อมูลผู้ใช้จาก localStorage:', parsedUser.name);
            } catch (err) {
              console.error('❌ Error parsing saved user:', err);
              localStorage.removeItem('currentUser');
            }
          } else {
            console.log('👤 ไม่พบข้อมูลผู้ใช้ใน localStorage');
          }
          
          const savedView = localStorage.getItem('currentView');
          if (savedView) {
            setView(savedView as View);
            console.log('📱 โหลด view จาก localStorage:', savedView);
          }
        }

        setLoadingProgress(100);
        console.log('✨ การโหลดข้อมูลเริ่มต้นเสร็จสิ้น');
        
        // Debug: แสดงจำนวนข้อมูลที่โหลดได้
        console.log('📊 สรุปข้อมูลที่โหลดได้:');
        console.log('- Users:', users.length);
        console.log('- Golf Courses:', golfCourses.length);
        console.log('- Vehicles:', vehicles.length);
        console.log('- Jobs:', jobs.length);
        console.log('- Parts:', parts.length);
        console.log('- Loading state will be set to false');

      } catch (error) {
        console.error('💥 Error loading initial data:', error);
        setLoadingError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + (error as Error).message);
        setConnectionStatus('disconnected');
      } finally {
        console.log('🏁 เข้าสู่ finally block - กำลังตั้งค่า loading เป็น false');
        setLoading(false);
        console.log('✅ Loading state ถูกตั้งค่าเป็น false แล้ว');
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

  // Debug: Monitor loading state changes
  useEffect(() => {
    console.log('🔄 Loading state changed to:', loading);
    if (!loading) {
      console.log('✅ Loading completed! Current state:');
      console.log('- User:', user ? `${user.name} (${user.role})` : 'null');
      console.log('- Connection Status:', connectionStatus);
      console.log('- Loading Error:', loadingError || 'none');
      console.log('- Data counts:', {
        users: users.length,
        golfCourses: golfCourses.length,
        vehicles: vehicles.length,
        jobs: jobs.length,
        parts: parts.length
      });
    }
  }, [loading]);

  // ระบบ Session Timeout - ออกจากระบบอัตโนมัติหลังจากไม่ได้ใช้งาน 5 นาที
  useEffect(() => {
    if (!user) return; // ไม่ทำงานถ้ายังไม่ได้ล็อกอิน

    let timeoutId: NodeJS.Timeout;
    let lastActivity = Date.now();

    const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 นาที

    const resetTimeout = () => {
      lastActivity = Date.now();
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        // ตรวจสอบว่าผ่านไป 5 นาทีจริงๆ หรือไม่
        if (Date.now() - lastActivity >= SESSION_TIMEOUT) {
          alert('หมดเวลาการใช้งาน กรุณาล็อกอินใหม่');
          handleLogout();
        }
      }, SESSION_TIMEOUT);
    };

    const handleActivity = () => {
      resetTimeout();
    };

    // เริ่มต้น timeout
    resetTimeout();

    // ติดตาม activity ต่างๆ
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // ทำความสะอาดเมื่อ component unmount หรือ user เปลี่ยน
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user]); // dependency เฉพาะ user เพื่อให้ reset เมื่อ login/logout

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
      // ตรวจสอบข้อมูลที่จำเป็นก่อนส่ง
      if (!newJob.type || !newJob.status || !newJob.vehicle_id || 
          !newJob.vehicle_number || !newJob.golf_course_id || 
          !newJob.user_id || !newJob.userName) {
        alert('ข้อมูลไม่ครบถ้วน กรุณาตรวจสอบข้อมูลอีกครั้ง');
        return;
      }

      // สร้างงานใหม่ผ่าน API (Serial History จะถูกบันทึกใน API โดยอัตโนมัติ)
      const result = await jobsApi.create(newJob);
      if (result.success) {
        const createdJob = result.data as Job;
        setJobs(prev => [createdJob, ...prev]);
        
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

        alert('สร้างงานเรียบร้อยแล้ว');
        const targetView = user?.role === 'staff' ? 'dashboard' : 'admin_dashboard';
        setView(targetView);
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.message || 'ไม่สามารถสร้างงานได้'}`);
      }
    } catch (error: any) {
      console.error('Error creating job:', error);
      
      // แสดงข้อความแจ้งเตือนที่เหมาะสม
      let errorMessage = 'เกิดข้อผิดพลาดในการสร้างงาน';
      
      if (error.message && error.message.includes('400')) {
        errorMessage = 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง';
      } else if (error.message && error.message.includes('500')) {
        errorMessage = 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง';
      } else if (error.message && error.message.includes('network')) {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      }
      
      alert(errorMessage);
    }
  };
  
  const handleSetView = useCallback((newView: View) => {
    setView(newView);
  }, []);

  const handleFillJobForm = (job: Job) => {
    setSelectedJobForForm(job);
    setView('assigned_job_form');
  };

  const handleJobUpdate = async (updatedJob: Job) => {
    try {
      // Debug: แสดงข้อมูลที่ส่งไป
      console.log('Sending job update data:', {
        id: updatedJob.id,
        type: updatedJob.type,
        status: updatedJob.status,
        vehicle_id: updatedJob.vehicle_id,
        vehicle_number: updatedJob.vehicle_number,
        golf_course_id: updatedJob.golf_course_id,
        user_id: updatedJob.user_id,
        userName: updatedJob.userName,
        system: updatedJob.system,
        subTasks: updatedJob.subTasks,
        parts: updatedJob.parts,
        partsNotes: updatedJob.partsNotes,
        remarks: updatedJob.remarks,
        battery_serial: updatedJob.battery_serial,
        bmCause: updatedJob.bmCause,
        images: updatedJob.images
      });

      // ตรวจสอบข้อมูลที่จำเป็นก่อนส่ง
      if (!updatedJob.type || !updatedJob.status || !updatedJob.vehicle_id || 
          !updatedJob.vehicle_number || !updatedJob.golf_course_id || 
          !updatedJob.user_id || !updatedJob.userName) {
        alert('ข้อมูลไม่ครบถ้วน กรุณาตรวจสอบข้อมูลอีกครั้ง');
        return;
      }

      // อัปเดตงานผ่าน API (Serial History จะถูกบันทึกใน API โดยอัตโนมัติ)
      const result = await jobsApi.update(updatedJob.id, updatedJob);
      if (result.success) {
        const updated = result.data as Job;
        
        // เพิ่ม Log การใช้อะไหล่เฉพาะเมื่องานได้รับการอนุมัติแล้ว
        if (updated.status === 'approved') {
          await addPartsUsageLog(parseInt(updated.id), updated.partsNotes, updated);
        }
        
        setJobs(prev => prev.map(job => job.id === updated.id ? updated : job));
        setSelectedJobForForm(null);
        alert('บันทึกข้อมูลงานเรียบร้อยแล้ว');
        setView('dashboard');
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.message || 'ไม่สามารถบันทึกข้อมูลได้'}`);
      }
    } catch (error: any) {
      console.error('Error updating job:', error);
      
      // แสดงข้อความแจ้งเตือนที่เหมาะสม
      let errorMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      
      if (error.message && error.message.includes('400')) {
        errorMessage = 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง';
      } else if (error.message && error.message.includes('500')) {
        errorMessage = 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง';
      } else if (error.message && error.message.includes('network')) {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      }
      
      alert(errorMessage);
    }
  };

  const addPartsUsageLog = async (jobId: number, partsNotes?: string, jobData?: Job) => {
    try {
      const job = jobData || jobs.find(j => j.id === jobId.toString());
      if (!job || job.status !== 'approved') {
        return;
      }

      const vehicle = vehicles.find(v => v.id === job.vehicle_id);
      const golfCourse = golfCourses.find(gc => gc.id === job.golf_course_id);

      if (job.parts && job.parts.length > 0) {
        for (const part of job.parts) {
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
  const onUpdateStatus = async (jobId: number, status: JobStatus) => {
    try {
      // หาข้อมูลงานปัจจุบัน
      const currentJob = jobs.find(job => job.id === jobId.toString());
      if (!currentJob) {
        console.error('Job not found:', jobId);
        return;
      }

      // อัปเดต jobs state โดยตรงเพื่อให้ UI อัปเดตทันที
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId.toString() 
            ? { ...job, status } 
            : job
        )
      );

      // เตรียมข้อมูลที่จำเป็นสำหรับ API
      const updateData = {
        status,
        type: currentJob.type,
        vehicle_id: currentJob.vehicle_id,
        vehicle_number: currentJob.vehicle_number,
        golf_course_id: currentJob.golf_course_id,
        user_id: currentJob.user_id,
        userName: currentJob.userName,
        system: currentJob.system,
        subTasks: currentJob.subTasks,
        remarks: currentJob.remarks,
        bmCause: currentJob.bmCause,
        battery_serial: currentJob.battery_serial,
        assigned_to: currentJob.assigned_to,
        partsNotes: currentJob.partsNotes,
        images: currentJob.images
      };

      // เรียก API เพื่อบันทึกการเปลี่ยนแปลงลงฐานข้อมูล
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      
      if (!result.success) {
        // หากการอัปเดตใน API ล้มเหลว ให้กลับสถานะเดิม
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === jobId.toString() 
              ? { ...job, status: currentJob.status } // กลับสถานะเดิม
              : job
          )
        );
        console.error('Failed to update job status:', result.message);
        alert(`เกิดข้อผิดพลาดในการอัปเดตสถานะงาน: ${result.message}`);
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      // กลับสถานะเดิมในกรณีเกิดข้อผิดพลาด
      const currentJob = jobs.find(job => job.id === jobId.toString());
      if (currentJob) {
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === jobId.toString() 
              ? { ...job, status: currentJob.status }
              : job
          )
        );
      }
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          {/* Glowing Ring Spinner */}
          <div className="relative inline-flex items-center justify-center w-32 h-32 mb-8">
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-20 blur-xl animate-pulse"></div>
            {/* Main spinning ring */}
            <div className="relative w-24 h-24 rounded-full border-4 border-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-spin">
              <div className="absolute inset-1 rounded-full bg-slate-900"></div>
            </div>
            {/* Inner glow */}
            <div className="absolute inset-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-30 blur-md animate-pulse"></div>
            {/* Progress percentage in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-lg">{loadingProgress}%</span>
            </div>
          </div>
          
          {/* Loading Text */}
          <h2 className="text-2xl font-light text-white tracking-wider mb-6">
            Loading...
          </h2>

          {/* Progress Bar */}
          <div className="mb-8 max-w-xs mx-auto">
            <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${loadingProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-cyan-300 mt-2 font-medium">
              <span>0%</span>
              <span className="text-white">{loadingProgress}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Loading Steps with Icons */}
          <div className="space-y-3 text-sm max-w-sm mx-auto">
            <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
              loadingProgress >= 10 
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' 
                : 'bg-slate-800/30 text-slate-400'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                loadingProgress >= 10 
                  ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/30' 
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {loadingProgress >= 10 ? '✓' : '1'}
              </div>
              <span className="font-medium">เชื่อมต่อเซิร์ฟเวอร์</span>
            </div>
            
            <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
              loadingProgress >= 50 
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' 
                : 'bg-slate-800/30 text-slate-400'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                loadingProgress >= 50 
                  ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/30' 
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {loadingProgress >= 50 ? '✓' : '2'}
              </div>
              <span className="font-medium">ดึงข้อมูลจาก API</span>
            </div>
            
            <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
              loadingProgress >= 95 
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' 
                : 'bg-slate-800/30 text-slate-400'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                loadingProgress >= 95 
                  ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/30' 
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {loadingProgress >= 95 ? '✓' : '3'}
              </div>
              <span className="font-medium">ประมวลผลข้อมูล</span>
            </div>
          </div>
          
          {/* Error Display - แสดงเฉพาะเมื่อมี error */}
          {loadingError && (
            <div className="mt-8 p-4 bg-red-900/50 border border-red-500/30 rounded-xl backdrop-blur-sm max-w-sm mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-red-300 font-medium">เกิดข้อผิดพลาด</span>
              </div>
              <p className="text-red-200 text-sm mb-4">{loadingError}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                โหลดใหม่
              </button>
            </div>
          )}
        </div>
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
            partsUsageLog={partsUsageLog}
            setView={handleSetView}
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
            golfCourses={golfCourses}
            users={users}
          />
        )}
        {view === 'admin_management' && (
          <AdminManagementScreen 
            setView={handleSetView}
            users={users}
            setUsers={setUsers}
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
            addPartsUsageLog={addPartsUsageLog}
          />
        )}
      </main>
    </div>
  );
}

