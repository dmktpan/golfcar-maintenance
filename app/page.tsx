
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, Job, Part, GolfCourse, Vehicle, PartsUsageLog, SerialHistoryEntry, View, JobStatus } from '@/lib/data';
import { golfCoursesApi, vehiclesApi, partsApi, jobsApi, usersApi, localUsersApi, partsUsageLogsApi, serialHistoryApi, localReportsApi } from '@/lib/api';
import LoginScreen from '@/components/LoginScreen';
import CreatePartRequestModal from '@/components/CreatePartRequestModal';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import CreateJobScreen from '@/components/CreateJobScreen';
import CentralCreateJobScreen from '@/components/CentralCreateJobScreen';
import PartsManagementScreen from '@/components/PartsManagementScreen';
import StockManagementScreen from '@/components/StockManagementScreen';
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

import EmployeeHistoryScreen from '@/components/EmployeeHistoryScreen';
import ProfileScreen from '@/components/ProfileScreen';

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
  const [isPartRequestModalOpen, setIsPartRequestModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // โหลดข้อมูลเริ่มต้นจาก API
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setLoadingError('');
        setConnectionStatus('checking');
        setLoadingProgress(0);

        console.log('🚀 เริ่มโหลดข้อมูล...');
        console.log('🌐 API Base URL:', process.env.NODE_ENV === 'production' ? 'http://golfcar.go2kt.com:8080/api' : 'http://golfcar.go2kt.com:8080/api');

        // ทดสอบการเชื่อมต่อก่อน
        setLoadingProgress(10);
        try {
          console.log('🔍 ทดสอบการเชื่อมต่อเซิร์ฟเวอร์...');
          // ใช้ API function แทนการเรียก fetch โดยตรง
          const healthCheck = await localUsersApi.getAll();
          if (healthCheck.success) {
            setConnectionStatus('connected');
            console.log('✅ การเชื่อมต่อเซิร์ฟเวอร์สำเร็จ');
            // เก็บข้อมูล users ที่ได้จากการทดสอบการเชื่อมต่อ
            setUsers(healthCheck.data as User[]);
          } else {
            throw new Error(`Server responded with error: ${healthCheck.message}`);
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
          { name: 'golfCourses', call: golfCoursesApi.getAll() }
        ];

        const optionalApiCalls = [
          { name: 'vehicles', call: vehiclesApi.getAll() },
          { name: 'parts', call: partsApi.getAll() },
          { name: 'jobs', call: jobsApi.getAll() },
          { name: 'partsUsageLog', call: localReportsApi.getUsage() },
          { name: 'serialHistory', call: serialHistoryApi.getAll() }
        ];

        // โหลดข้อมูลสำคัญก่อน
        for (let i = 0; i < criticalApiCalls.length; i++) {
          try {
            console.log(`🔑 กำลังโหลดข้อมูลสำคัญ: ${criticalApiCalls[i].name}`);
            const result = await criticalApiCalls[i].call;

            if (result.success) {
              // Handle different data types for critical API calls
              if (criticalApiCalls[i].name === 'golfCourses') {
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
                  console.log('💼 Jobs sample data:', (result.data as Job[]).slice(0, 3).map(job => ({
                    id: job.id,
                    vehicle_number: job.vehicle_number,
                    status: job.status
                  })));
                  console.log('💼 Jobs total count:', (result.data as Job[]).length);
                  break;
                case 'partsUsageLog':
                  setPartsUsageLog(result.data as PartsUsageLog[]);
                  console.log('🔧 PartsUsageLog sample data:', (result.data as PartsUsageLog[]).slice(0, 3));
                  console.log('🔧 PartsUsageLog total count:', (result.data as PartsUsageLog[]).length);

                  // แสดง jobId ทั้งหมดใน PartsUsageLog
                  const jobIds = Array.from(new Set((result.data as PartsUsageLog[]).map(log => log.jobId)));
                  console.log('🔧 Unique jobIds in PartsUsageLog:', jobIds);
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
        console.log('- Parts Usage Log:', partsUsageLog.length);
        console.log('- Serial History:', serialHistory.length);
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
        parts: parts.length,
        partsUsageLog: partsUsageLog.length,
        serialHistory: serialHistory.length
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

  // ฟังก์ชันสำหรับ Force Refresh ข้อมูลทั้งหมด (with debounce)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const forceRefreshAllData = async () => {
    // ป้องกันการเรียกซ้ำๆ
    if (isRefreshing) {
      console.log('⏳ Already refreshing data, skipping...');
      return;
    }

    try {
      setIsRefreshing(true);
      console.log('🔄 Force refreshing all data...');

      // โหลดข้อมูลทั้งหมดใหม่แบบ parallel
      const [
        jobsResult,
        serialHistoryResult,
        partsUsageLogsResult,
        vehiclesResult,
        usersResult,
        partsResult
      ] = await Promise.allSettled([
        jobsApi.getAll(),
        serialHistoryApi.getAll(),
        partsUsageLogsApi.getAll(),
        vehiclesApi.getAll(),
        localUsersApi.getAll(),
        partsApi.getAll()
      ]);

      // อัพเดต Jobs
      if (jobsResult.status === 'fulfilled' && jobsResult.value.success) {
        setJobs(jobsResult.value.data as Job[]);
        console.log('✅ Jobs data force refreshed:', (jobsResult.value.data as Job[]).length, 'items');
      } else {
        console.error('❌ Failed to refresh jobs data');
      }

      // อัพเดต Serial History
      if (serialHistoryResult.status === 'fulfilled' && serialHistoryResult.value.success) {
        setSerialHistory(serialHistoryResult.value.data as SerialHistoryEntry[]);
        console.log('✅ Serial history data force refreshed:', (serialHistoryResult.value.data as SerialHistoryEntry[]).length, 'items');
      } else {
        console.error('❌ Failed to refresh serial history data');
      }

      // อัพเดต Parts Usage Logs
      if (partsUsageLogsResult.status === 'fulfilled' && partsUsageLogsResult.value.success) {
        setPartsUsageLog(partsUsageLogsResult.value.data as PartsUsageLog[]);
        console.log('✅ Parts usage logs data force refreshed:', (partsUsageLogsResult.value.data as PartsUsageLog[]).length, 'items');
      } else {
        console.error('❌ Failed to refresh parts usage logs data');
      }

      // อัพเดต Vehicles
      if (vehiclesResult.status === 'fulfilled' && vehiclesResult.value.success) {
        setVehicles(vehiclesResult.value.data as Vehicle[]);
        console.log('✅ Vehicles data force refreshed:', (vehiclesResult.value.data as Vehicle[]).length, 'items');
      } else {
        console.error('❌ Failed to refresh vehicles data');
      }

      // อัพเดต Users
      if (usersResult.status === 'fulfilled' && usersResult.value.success) {
        setUsers(usersResult.value.data as User[]);
        console.log('✅ Users data force refreshed:', (usersResult.value.data as User[]).length, 'items');
      } else {
        console.error('❌ Failed to refresh users data');
      }

      // อัพเดต Parts
      if (partsResult.status === 'fulfilled' && partsResult.value.success) {
        setParts(partsResult.value.data as Part[]);
        console.log('✅ Parts data force refreshed:', (partsResult.value.data as Part[]).length, 'items');
      } else {
        console.error('❌ Failed to refresh parts data');
      }

      console.log('✅ Force refresh completed');
    } catch (error) {
      console.error('❌ Error during force refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

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
      setIsLoggingIn(true);
      const response = await fetch('/api/proxy/auth/login', {
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
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (user) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setUser(null);
    setShowWelcome(false);
    localStorage.removeItem('currentUser');
  };

  const handleCreateJob = async (newJob: Job) => {
    try {
      // ตรวจสอบข้อมูลที่จำเป็นก่อนส่ง
      // สำหรับ Part Request (MWR) ไม่จำเป็นต้องมี vehicle_id
      const isPartRequest = newJob.type === 'PART_REQUEST';

      if (!newJob.type || !newJob.status ||
        (!isPartRequest && !newJob.vehicle_id) || // Check vehicle_id only if not Part Request
        (!isPartRequest && !newJob.vehicle_number) ||
        !newJob.golf_course_id ||
        !newJob.user_id || !newJob.userName) {

        console.error('Validation failed:', {
          type: newJob.type,
          status: newJob.status,
          vehicle_id: newJob.vehicle_id,
          vehicle_number: newJob.vehicle_number,
          golf_course_id: newJob.golf_course_id,
          user_id: newJob.user_id,
          userName: newJob.userName
        });

        alert('ข้อมูลไม่ครบถ้วน กรุณาตรวจสอบข้อมูลอีกครั้ง');
        return;
      }

      // สร้างงานใหม่ผ่าน API (ใช้ Local API เพื่อรองรับ MWR logic)
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newJob),
      });

      const result = await response.json();

      if (result.success) {
        const createdJob = result.data as Job;
        setJobs(prev => [createdJob, ...prev]);

        // ไม่ต้องตัดสต็อกที่นี่แล้ว ระบบจะตัดตอนอนุมัติ (Phase 3 Logic)

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
      // ใช้ Local API เพื่อให้ Logic ที่แก้ใขใน route.ts ทำงาน
      const response = await fetch('/api/jobs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedJob),
      });

      const result = await response.json();

      if (result.success) {
        const updated = result.data as Job;

        // เพิ่ม Log การใช้อะไหล่เฉพาะเมื่องานได้รับการอนุมัติแล้ว
        if (updated.status === 'approved') {
          await addPartsUsageLog(updated.id, updated.partsNotes, updated);
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

  const addPartsUsageLog = async (jobId: string, partsNotes?: string, jobData?: Job) => {
    try {
      const job = jobData || jobs.find(j => j.id === jobId);
      if (!job || job.status !== 'approved') {
        return;
      }

      const vehicle = vehicles.find(v => v.id === job.vehicle_id);
      const golfCourse = golfCourses.find(gc => gc.id === job.golf_course_id);

      if (job.parts && job.parts.length > 0) {
        // Get current time (UTC)
        const usedDate = new Date().toISOString();

        for (const part of job.parts) {
          const logData = {
            jobId: jobId, // เก็บเป็น string แทน parseInt
            partName: part.part_name || `อะไหล่ ID: ${part.part_id}`,
            partId: part.part_id, // ไม่ใช้ parseInt กับ ObjectID
            quantityUsed: part.quantity_used,
            vehicleNumber: job.vehicle_number,
            vehicleSerial: vehicle?.serial_number || 'ไม่ระบุ',
            golfCourseName: golfCourse?.name || 'ไม่ระบุ',
            usedBy: job.userName,
            usedDate: usedDate,
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

  // ฟังก์ชันสำหรับสร้าง Serial History Entry เมื่อ Job เสร็จสิ้น
  const createSerialHistoryForJob = async (jobId: string, jobData?: Job) => {
    try {
      const job = jobData || jobs.find(j => j.id === jobId);
      if (!job || job.status !== 'approved') {
        return;
      }

      const vehicle = job.vehicle_id ? vehicles.find(v => v.id.toString() === job.vehicle_id!.toString()) : undefined;
      const golfCourse = golfCourses.find(gc => gc.id.toString() === job.golf_course_id.toString());
      const user = users.find(u => u.id.toString() === job.user_id.toString());

      if (!vehicle || !golfCourse || !user) {
        console.error('Missing required data for serial history:', { vehicle, golfCourse, user });
        return;
      }

      // เตรียมข้อมูลอะไหล่จาก job.parts
      const partsUsed = job.parts && job.parts.length > 0
        ? job.parts.map(part => `${part.part_name} (จำนวน: ${part.quantity_used})`)
        : [];

      // Get current Thailand time
      const now = new Date();
      const thailandTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
      const actionDate = thailandTime.toISOString();

      const serialHistoryData = {
        serial_number: vehicle.serial_number,
        vehicle_id: job.vehicle_id, // ไม่ใช้ parseInt กับ ObjectID
        vehicle_number: job.vehicle_number,
        action_type: 'maintenance',
        action_date: actionDate,
        details: `${job.type} - ${job.system || 'ไม่ระบุระบบ'}: ${job.remarks || 'ไม่มีหมายเหตุ'}`,
        performed_by_id: job.user_id, // ไม่ใช้ parseInt กับ ObjectID
        golf_course_id: job.golf_course_id, // ไม่ใช้ parseInt กับ ObjectID
        golf_course_name: golfCourse.name,
        is_active: true,
        related_job_id: jobId, // ไม่ใช้ parseInt กับ ObjectID
        job_type: job.type,
        status: 'completed',
        change_type: 'status_change',
        parts_used: partsUsed,  // เพิ่มข้อมูลอะไหล่
        system: job.system      // เพิ่มข้อมูลระบบ
      };

      console.log('🔄 Creating serial history entry:', serialHistoryData);

      const result = await serialHistoryApi.create(serialHistoryData);
      if (result.success) {
        setSerialHistory(prev => [result.data as SerialHistoryEntry, ...prev]);
        console.log('✅ Serial history entry created successfully');
      } else {
        console.error('❌ Failed to create serial history entry:', result);
      }
    } catch (error) {
      console.error('Error adding serial history entry:', error);
    }
  };

  // ฟังก์ชันสำหรับอัปเดตสถานะงาน
  const onUpdateStatus = async (jobId: string, status: JobStatus) => {
    try {
      console.log('🔄 onUpdateStatus called:', { jobId, status, timestamp: new Date().toISOString() });

      // หาข้อมูลงานปัจจุบัน
      const currentJob = jobs.find(job => job.id === jobId);
      if (!currentJob) {
        console.error('❌ Job not found in local state:', {
          jobId,
          searchedId: jobId,
          availableJobs: jobs.map(j => ({ id: j.id, status: j.status }))
        });
        alert('ไม่พบงานที่ต้องการอัปเดตในระบบ กรุณาลองรีเฟรชหน้าเว็บ');
        return;
      }

      console.log('📋 Current job before update:', {
        id: currentJob.id,
        currentStatus: currentJob.status,
        newStatus: status,
        vehicleNumber: currentJob.vehicle_number,
        userName: currentJob.userName
      });

      // ตรวจสอบว่าสถานะใหม่ต่างจากสถานะเดิมหรือไม่
      if (currentJob.status === status) {
        console.log('⚠️ Status is already the same, skipping update');
        alert(`งานนี้มีสถานะ "${status}" อยู่แล้ว`);
        return;
      }

      // อัปเดต jobs state โดยตรงเพื่อให้ UI อัปเดตทันที
      setJobs(prevJobs => {
        const updatedJobs = prevJobs.map(job =>
          job.id === jobId
            ? { ...job, status }
            : job
        );

        console.log('🔄 Jobs state updated. Job statuses:', updatedJobs.reduce((acc, job) => {
          acc[job.status] = (acc[job.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>));

        return updatedJobs;
      });

      // เตรียมข้อมูลที่จำเป็นสำหรับ API
      // Get current Thailand time
      const now = new Date();
      const thailandTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
      const updatedAt = thailandTime.toISOString();

      const updateData: any = {
        id: currentJob.id, // เพิ่ม id เพื่อให้ External API รู้ว่าต้องอัปเดตงานไหน
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
        images: currentJob.images,
        parts: currentJob.parts, // เพิ่มข้อมูลอะไหล่
        created_at: currentJob.created_at,
        updated_at: updatedAt // อัปเดต timestamp ด้วยเวลาไทย
      };

      // เพิ่มข้อมูลผู้อนุมัติเมื่อ status เป็น approved หรือ rejected
      if (status === 'approved' || status === 'rejected') {
        updateData.approved_by_id = user?.id || null;
        updateData.approved_by_name = user?.name || null;

        // ถ้าเป็นการ reject ให้ถามเหตุผล
        if (status === 'rejected') {
          const reason = prompt('กรุณาระบุเหตุผลที่ไม่อนุมัติ:', '');
          updateData.rejection_reason = reason || 'ไม่ระบุเหตุผล';
        }
      }

      console.log('📤 Sending API request to update job status...', {
        url: `/api/jobs`, // Use local API for stock logic
        method: 'PUT',
        dataKeys: Object.keys(updateData),
        statusChange: `${currentJob.status} → ${status}`,
        jobId: currentJob.id
      });

      // เรียก API เพื่อบันทึกการเปลี่ยนแปลงลงฐานข้อมูล (ใช้ Local API เพื่อให้ Stock Logic ทำงาน)
      const response = await fetch(`/api/jobs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      console.log('🌐 API response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      let result;
      try {
        result = await response.json();
        console.log('📥 API response data:', result);
      } catch (parseError) {
        console.error('❌ Failed to parse API response:', parseError);
        throw new Error('ไม่สามารถอ่านข้อมูลตอบกลับจากเซิร์ฟเวอร์ได้');
      }

      if (!response.ok || !result.success) {
        const errorMessage = result?.message || result?.details || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ API update failed:', {
          message: errorMessage,
          jobId: currentJob.id,
          attemptedStatus: status,
          originalStatus: currentJob.status,
          responseStatus: response.status,
          result
        });

        // หากการอัปเดตใน API ล้มเหลว ให้กลับสถานะเดิม
        setJobs(prevJobs =>
          prevJobs.map(job =>
            job.id === jobId
              ? { ...job, status: currentJob.status } // กลับสถานะเดิม
              : job
          )
        );

        // แสดงข้อความ error ที่เข้าใจง่าย
        if (response.status === 404) {
          alert('ไม่พบงานที่ต้องการอัปเดตในฐานข้อมูล กรุณาลองรีเฟรชหน้าเว็บ');
        } else if (response.status >= 500 && !result.error && !errorMessage) {
          alert('เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่อีกครั้ง');
        } else {
          // If there's an error from the backend (like StockError), display it!
          alert(`เกิดข้อผิดพลาดในการอัปเดตสถานะงาน: ${result.error || errorMessage || 'ไม่ทราบสาเหตุ'}`);
        }
        return;
      } else {
        console.log('✅ Job status updated successfully in database', {
          jobId: currentJob.id,
          oldStatus: currentJob.status,
          newStatus: status,
          timestamp: new Date().toISOString()
        });

        // เพิ่ม Log การใช้อะไหล่และ Serial History เมื่องานได้รับการอนุมัติ
        if (status === 'approved') {
          console.log('🔧 Adding parts usage log and serial history for approved job...', {
            jobId: currentJob.id,
            partsNotes: currentJob.partsNotes,
            hasParts: currentJob.parts && currentJob.parts.length > 0
          });

          // Parts Usage Log และ Serial History ถูกจัดการโดย API แล้ว
          console.log('✅ Job approved. Stock logic handled by API.');

          // Serial History จะถูกสร้างโดยอัตโนมัติใน API แล้ว ไม่ต้องสร้างซ้ำที่นี่
        }

        // โหลดข้อมูลงานใหม่จากฐานข้อมูลเพื่อให้แน่ใจว่าข้อมูลอัปเดต
        console.log('🔄 Refreshing jobs data from database...');
        try {
          const jobsResult = await jobsApi.getAll();
          if (jobsResult.success) {
            setJobs(jobsResult.data as Job[]);
            console.log('✅ Jobs data refreshed successfully', {
              totalJobs: (jobsResult.data as Job[]).length,
              updatedJob: (jobsResult.data as Job[]).find(j => j.id === currentJob.id)
            });
          }

          // โหลดข้อมูล Serial History และ Parts Usage Logs เฉพาะเมื่อ approve เท่านั้น
          if (status === 'approved') {
            const [serialHistoryResult, partsUsageLogsResult] = await Promise.allSettled([
              serialHistoryApi.getAll(),
              partsUsageLogsApi.getAll()
            ]);

            if (serialHistoryResult.status === 'fulfilled' && serialHistoryResult.value.success) {
              setSerialHistory(serialHistoryResult.value.data as SerialHistoryEntry[]);
              console.log('✅ Serial history data refreshed successfully');
            }

            if (partsUsageLogsResult.status === 'fulfilled' && partsUsageLogsResult.value.success) {
              setPartsUsageLog(partsUsageLogsResult.value.data as PartsUsageLog[]);
              console.log('✅ Parts usage logs data refreshed successfully');
            }
          }
        } catch (refreshError) {
          console.error('❌ Error refreshing data:', refreshError);
        }

        // แสดงข้อความสำเร็จ
        const statusText = status === 'approved' ? 'อนุมัติ' :
          status === 'rejected' ? 'ไม่อนุมัติ' :
            status === 'completed' ? 'เสร็จสิ้น' : status;
        alert(`${statusText}งานเรียบร้อยแล้ว`);
      }
    } catch (error) {
      console.error('💥 Error updating job status:', {
        error,
        jobId,
        status,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // กลับสถานะเดิมในกรณีเกิดข้อผิดพลาด
      const currentJob = jobs.find(job => job.id === jobId);
      if (currentJob) {
        console.log('🔄 Reverting job status to original state:', {
          jobId,
          revertingTo: currentJob.status
        });
        setJobs(prevJobs =>
          prevJobs.map(job =>
            job.id === jobId
              ? { ...job, status: currentJob.status }
              : job
          )
        );
      }

      // แสดงข้อความ error ที่เข้าใจง่าย
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
        alert('การเชื่อมต่อกับเซิร์ฟเวอร์ล้มเหลว กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่');
      } else {
        alert(`เกิดข้อผิดพลาดในการอัปเดตสถานะงาน: ${errorMessage}`);
      }
    }
  };

  // ฟังก์ชันสำหรับลบงาน
  const handleDeleteJob = async (jobId: string) => {
    try {
      console.log('🗑️ handleDeleteJob called:', { jobId, timestamp: new Date().toISOString() });

      // หาข้อมูลงานปัจจุบัน
      const currentJob = jobs.find(job => job.id === jobId);
      if (!currentJob) {
        console.error('❌ Job not found in local state:', {
          jobId,
          searchedId: jobId,
          availableJobs: jobs.map(j => ({ id: j.id, status: j.status }))
        });
        alert('ไม่พบงานที่ต้องการลบในระบบ กรุณาลองรีเฟรชหน้าเว็บ');
        return;
      }

      console.log('📋 Job to delete:', {
        id: currentJob.id,
        status: currentJob.status,
        vehicleNumber: currentJob.vehicle_number,
        userName: currentJob.userName
      });

      console.log('📤 Sending API request to delete job...', {
        url: `/api/jobs/${currentJob.id}`,
        method: 'DELETE',
        jobId: currentJob.id
      });

      // เรียก API เพื่อลบงานจากฐานข้อมูล
      const response = await fetch(`/api/jobs/${currentJob.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🌐 API response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      let result;
      try {
        result = await response.json();
        console.log('📥 API response data:', result);
      } catch (parseError) {
        console.error('❌ Failed to parse API response:', parseError);
        throw new Error('ไม่สามารถอ่านข้อมูลตอบกลับจากเซิร์ฟเวอร์ได้');
      }

      if (!response.ok || !result.success) {
        const errorMessage = result?.message || result?.details || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ API delete failed:', {
          message: errorMessage,
          jobId: currentJob.id,
          responseStatus: response.status,
          result
        });

        // แสดงข้อความ error ที่เข้าใจง่าย
        if (response.status === 404) {
          alert('ไม่พบงานที่ต้องการลบในฐานข้อมูล กรุณาลองรีเฟรชหน้าเว็บ');
        } else if (response.status >= 500) {
          alert('เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่อีกครั้ง');
        } else {
          alert(`เกิดข้อผิดพลาดในการลบงาน: ${errorMessage}`);
        }
        return;
      } else {
        console.log('✅ Job deleted successfully from database', {
          jobId: currentJob.id,
          timestamp: new Date().toISOString()
        });

        // อัปเดต jobs state โดยลบงานที่ถูกลบออกแบบ real-time
        setJobs(prevJobs => {
          const updatedJobs = prevJobs.filter(job => job.id !== jobId);
          console.log('🔄 Jobs state updated after deletion. Remaining jobs:', updatedJobs.length);
          return updatedJobs;
        });

        // แสดงข้อความสำเร็จ
        alert('ลบงานเรียบร้อยแล้ว');
      }
    } catch (error) {
      console.error('💥 Error deleting job:', {
        error,
        jobId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // แสดงข้อความ error ที่เข้าใจง่าย
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
        alert('การเชื่อมต่อกับเซิร์ฟเวอร์ล้มเหลว กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่');
      } else {
        alert(`เกิดข้อผิดพลาดในการลบงาน: ${errorMessage}`);
      }
    }
  };

  // ฟังก์ชันสำหรับจัดการสิทธิ์ผู้ใช้
  const getUserPermissions = (userId: number): string[] => {
    // ดึงจาก users state ที่มี permissions field
    const user = users.find(u => u.id === userId);
    if (user?.permissions && user.permissions.length > 0) {
      return user.permissions;
    }
    // Fallback ไป userPermissions state (สำหรับ backward compatibility)
    const userPermission = userPermissions.find(up => up.userId === userId);
    return userPermission ? userPermission.permissions : [];
  };

  const updateUserPermissions = async (userId: number, permissions: string[]): Promise<boolean> => {
    try {
      console.log('🔐 Saving permissions to database...', { userId, permissions });

      const response = await fetch('/api/users/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, permissions }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Permissions saved successfully');

        // อัปเดต userPermissions state
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

        // อัปเดต users state ด้วย permissions ใหม่
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, permissions } : u
        ));

        return true;
      } else {
        console.error('❌ Failed to save permissions:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving permissions:', error);
      return false;
    }
  };

  // แสดง loading screen ขณะโหลดข้อมูล
  if (loading) {
    return (
      <div
        className="fixed inset-0 w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center z-50 overflow-hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #06122AFF 0%, #210A4DFF 50%, #031E43FF 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="text-center relative z-10 px-8 flex flex-col items-center justify-center">
          {/* Golf Cart Icon */}
          <div className="mb-12 transform hover:scale-110 transition-transform duration-300">
            <div className="relative">
              <svg
                width="120"
                height="120"
                viewBox="0 0 100 100"
                className="mx-auto text-white drop-shadow-2xl"
                fill="currentColor"
              >
                {/* Golf Cart Body */}
                <rect x="20" y="40" width="50" height="25" rx="3" fill="white" />
                {/* Golf Cart Roof */}
                <rect x="15" y="25" width="60" height="20" rx="5" fill="white" />
                {/* Golf Cart Wheels */}
                <circle cx="30" cy="70" r="8" fill="white" />
                <circle cx="60" cy="70" r="8" fill="white" />
                {/* Golf Cart Details */}
                <rect x="25" y="45" width="15" height="15" rx="2" fill="black" />
                <rect x="50" y="45" width="15" height="15" rx="2" fill="black" />
              </svg>
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-cyan-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
            </div>
          </div>

          {/* Loading Text */}
          <div className="mb-10">
            <h2 className="text-gray-300 text-2xl font-light tracking-[0.3em] mb-2">
              LOADING
            </h2>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>

          {/* Percentage */}
          <div className="mb-12">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 text-6xl font-bold tracking-wider">
              {Math.floor(loadingProgress)}%
            </span>
          </div>

          {/* Circular Progress */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            {/* Outer Glow Ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 opacity-20 blur-md"></div>

            {/* Background Circle */}
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
              {/* Gradient Definition - ต้องอยู่ก่อน circle ที่ใช้งาน */}
              <defs>
                <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="rgba(55, 65, 81, 0.3)"
                strokeWidth="2"
                fill="none"
              />

              {/* Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="url(#loadingGradient)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - loadingProgress / 100)}`}
                className="transition-all duration-500 ease-out"
                style={{
                  filter: 'drop-shadow(0 0 12px #06b6d4)',
                  opacity: 1
                }}
              />
            </svg>

            {/* Center Dot */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse"></div>
          </div>

          {/* Error Display */}
          {loadingError && (
            <div className="mt-8 p-6 bg-gradient-to-r from-red-900/30 to-red-800/30 backdrop-blur-sm border border-red-500/30 rounded-xl max-w-md mx-auto shadow-2xl">
              <p className="text-red-300 mb-6 text-lg">{loadingError}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
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
      <Header user={user} onLogout={handleLogout} setView={handleSetView} parts={parts} />
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
            partsUsageLog={partsUsageLog}
            parts={parts}
            onUpdateStatus={onUpdateStatus}
            onOpenPartRequest={() => {
              console.log('🔓 Opening Part Request Modal');
              setIsPartRequestModalOpen(true);
            }}
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

        {view === 'central_create_job' && (user.role === 'central' || user.role === 'admin' || user.role === 'supervisor') && (
          <CentralCreateJobScreen
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
        {/* หน้าจัดการสต็อกอะไหล่ */}
        {view === 'stock_management' && (
          <StockManagementScreen
            parts={parts}
            golfCourses={golfCourses}
            partsUsageLog={partsUsageLog}
            jobs={jobs}
            onPartsUpdate={() => forceRefreshAllData()}
            user={user}
          />
        )}
        {view === 'admin_dashboard' && (
          <AdminDashboard setView={handleSetView} user={user} jobs={jobs} />
        )}
        {view === 'manage_users' && (user.role === 'admin' || user.role === 'supervisor') && (
          <ManageUsersScreen
            users={users}
            setUsers={setUsers}
            setView={handleSetView}
            golfCourses={golfCourses}
            user={user}
          />
        )}
        {view === 'employee_history' && user.role === 'admin' && (
          <EmployeeHistoryScreen
            users={users}
            setUsers={setUsers}
            setView={handleSetView}
            golfCourses={golfCourses}
          />
        )}
        {view === 'history' && (
          <HistoryScreen
            vehicles={vehicles}
            jobs={jobs}
            users={users}
            golfCourses={golfCourses}

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
            jobs={jobs}
            vehicles={vehicles}
            serialHistory={serialHistory}
            golfCourses={golfCourses}
            users={users}
            partsUsageLog={partsUsageLog}
          />
        )}
        {view === 'admin_management' && user.role === 'admin' && (
          <AdminManagementScreen
            setView={handleSetView}
            users={users}
            setUsers={setUsers}
            updateUserPermissions={updateUserPermissions}
            getUserPermissions={getUserPermissions}
            golfCourses={golfCourses}
            user={user}
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
            forceRefreshAllData={forceRefreshAllData}
            user={user}
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
            partsUsageLog={partsUsageLog}
            onUpdateStatus={onUpdateStatus}
            onFillJobForm={handleFillJobForm}
            onDeleteJob={handleDeleteJob}
          />
        )}
        {view === 'supervisor_pending_jobs' && (
          <SupervisorPendingJobsScreen
            key={`supervisor-pending-${jobs.filter(j => j.status === 'pending').length}`}
            user={user}
            jobs={jobs}
            golfCourses={golfCourses}
            users={users}
            vehicles={vehicles}
            onUpdateStatus={onUpdateStatus}
            setView={setView}
          />
        )}

        {view === 'profile' && (
          <ProfileScreen
            user={user}
          />
        )}

      </main>

      <CreatePartRequestModal
        isOpen={isPartRequestModalOpen}
        onClose={() => setIsPartRequestModalOpen(false)}
        user={user}
        onJobCreate={handleCreateJob}
        golfCourses={golfCourses}
      />
    </div>
  );
}

