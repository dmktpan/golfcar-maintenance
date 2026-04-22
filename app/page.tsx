
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
import AgreementManagementScreen from '@/components/AgreementManagementScreen';

import EmployeeHistoryScreen from '@/components/EmployeeHistoryScreen';
import ProfileScreen from '@/components/ProfileScreen';
import AnalyticsDashboardScreen from '@/components/AnalyticsDashboardScreen';

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
  const [partRequestMode, setPartRequestMode] = useState<'repair' | 'spare'>('repair');
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

      if (result.success && result.data) {
        const updatedJobFromServer = result.data as Job;
        console.log('✅ Job status updated successfully in database', {
          jobId: updatedJobFromServer.id,
          oldStatus: currentJob.status,
          requestedStatus: status,
          finalStatusFromServer: updatedJobFromServer.status,
          timestamp: new Date().toISOString()
        });

        // อัปเดต jobs state อีกครั้งด้วยข้อมูลจริงจาก Server (ป้องกันกรณี Server แอบเปลี่ยนสถานะ เช่น PART_REQUEST)
        setJobs(prevJobs =>
          prevJobs.map(job =>
            job.id === updatedJobFromServer.id ? updatedJobFromServer : job
          )
        );
      } else if (!response.ok || !result.success) {

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

        // อัปเดต user state ของตัวเองถ้ามีการเปลี่ยนสิทธิ์ของตัวเอง
        if (user && user.id === userId) {
          const updatedUser = { ...user, permissions };
          setUser(updatedUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          }
          console.log('👤 Current user state updated with new permissions');
        }

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
    const progressPercent = Math.floor(loadingProgress);
    const circumference = 2 * Math.PI * 54;
    const progressOffset = circumference * (1 - loadingProgress / 100);

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #06122A 0%, #210A4D 50%, #031E43 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          overflow: 'hidden',
          fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        }}
      >
        {/* === Animated Background Layers === */}
        {/* Radial ambient glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(6,182,212,0.08) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 80% at 30% 70%, rgba(99,102,241,0.06) 0%, transparent 60%)',
        }} />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div key={`particle-${i}`} style={{
            position: 'absolute',
            width: `${2 + (i % 3) * 2}px`,
            height: `${2 + (i % 3) * 2}px`,
            borderRadius: '50%',
            background: i % 2 === 0
              ? 'rgba(6,182,212,0.4)'
              : 'rgba(99,102,241,0.35)',
            left: `${5 + (i * 4.7) % 90}%`,
            top: `${5 + (i * 7.3) % 90}%`,
            animation: `floatParticle ${4 + (i % 4) * 2}s ease-in-out infinite`,
            animationDelay: `${(i * 0.3) % 3}s`,
            boxShadow: i % 2 === 0
              ? '0 0 6px rgba(6,182,212,0.6)'
              : '0 0 6px rgba(99,102,241,0.5)',
          }} />
        ))}

        {/* Grid overlay for depth */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />

        {/* === Main Content Card (Glassmorphism) === */}
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '48px 56px 42px',
          borderRadius: '24px',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          minWidth: '380px',
          maxWidth: '440px',
        }}>

          {/* === Orbital Rings + Golf Cart Icon === */}
          <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '32px' }}>
            {/* Outer orbit ring */}
            <div style={{
              position: 'absolute', inset: '-12px',
              border: '1px solid rgba(6,182,212,0.12)',
              borderRadius: '50%',
              animation: 'orbitSpin 12s linear infinite',
            }}>
              <div style={{
                position: 'absolute', top: '-3px', left: '50%', transform: 'translateX(-50%)',
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#06b6d4',
                boxShadow: '0 0 10px rgba(6,182,212,0.8), 0 0 20px rgba(6,182,212,0.4)',
              }} />
            </div>
            {/* Middle orbit ring */}
            <div style={{
              position: 'absolute', inset: '4px',
              border: '1px solid rgba(99,102,241,0.1)',
              borderRadius: '50%',
              animation: 'orbitSpin 8s linear infinite reverse',
            }}>
              <div style={{
                position: 'absolute', bottom: '-3px', left: '50%', transform: 'translateX(-50%)',
                width: '5px', height: '5px', borderRadius: '50%',
                background: '#6366f1',
                boxShadow: '0 0 10px rgba(99,102,241,0.8)',
              }} />
            </div>

            {/* Circular progress ring (SVG) */}
            <svg
              viewBox="0 0 120 120"
              style={{
                position: 'absolute', inset: '8px',
                transform: 'rotate(-90deg)',
                filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.3))',
              }}
            >
              <defs>
                <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="54" stroke="rgba(255,255,255,0.04)" strokeWidth="3" fill="none" />
              <circle
                cx="60" cy="60" r="54"
                stroke="url(#progressGrad)"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>

            {/* Center icon container */}
            <div style={{
              position: 'absolute', inset: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
            }}>
              {/* Golf cart icon */}
              <svg
                width="56" height="56" viewBox="0 0 100 100"
                style={{
                  animation: 'floatIcon 3s ease-in-out infinite',
                  filter: 'drop-shadow(0 0 16px rgba(6,182,212,0.5))',
                }}
              >
                <defs>
                  <linearGradient id="cartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#67e8f9" />
                    <stop offset="100%" stopColor="#a5b4fc" />
                  </linearGradient>
                </defs>
                <rect x="20" y="40" width="50" height="25" rx="4" fill="url(#cartGrad)" opacity="0.95" />
                <rect x="15" y="25" width="60" height="20" rx="6" fill="url(#cartGrad)" opacity="0.85" />
                <circle cx="30" cy="70" r="8" fill="url(#cartGrad)" opacity="0.9" />
                <circle cx="60" cy="70" r="8" fill="url(#cartGrad)" opacity="0.9" />
                <circle cx="30" cy="70" r="4" fill="#0e1a3a" />
                <circle cx="60" cy="70" r="4" fill="#0e1a3a" />
                <rect x="26" y="46" width="13" height="13" rx="2.5" fill="rgba(6,18,42,0.7)" />
                <rect x="51" y="46" width="13" height="13" rx="2.5" fill="rgba(6,18,42,0.7)" />
              </svg>
            </div>
          </div>

          {/* === App Name / Brand === */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h1 style={{
              fontSize: '18px', fontWeight: 600, letterSpacing: '0.12em',
              background: 'linear-gradient(135deg, #e0f2fe, #c7d2fe)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              margin: 0,
            }}>
              GOLF CART MAINTENANCE
            </h1>
          </div>

          {/* === Loading Status Text === */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <p style={{
              fontSize: '13px', color: 'rgba(148,163,184,0.7)',
              letterSpacing: '0.2em', fontWeight: 400, margin: 0,
              display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
            }}>
              <span>กำลังเตรียมระบบ</span>
              <span style={{ display: 'flex', gap: '3px' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: '4px', height: '4px', borderRadius: '50%',
                    background: '#06b6d4',
                    animation: 'dotPulse 1.4s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`,
                    opacity: 0.6,
                  }} />
                ))}
              </span>
            </p>
          </div>

          {/* === Percentage Display === */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{
              fontSize: '52px', fontWeight: 700, letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #06b6d4 0%, #818cf8 50%, #6366f1 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              lineHeight: 1,
              textShadow: 'none',
            }}>
              {progressPercent}
              <span style={{ fontSize: '28px', fontWeight: 500, opacity: 0.8 }}>%</span>
            </span>
          </div>

          {/* === Horizontal Progress Bar === */}
          <div style={{ width: '100%', marginBottom: '16px' }}>
            {/* Track */}
            <div style={{
              position: 'relative', height: '6px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              {/* Fill */}
              <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                width: `${loadingProgress}%`,
                borderRadius: '8px',
                background: 'linear-gradient(90deg, #06b6d4, #818cf8, #6366f1)',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 16px rgba(6,182,212,0.5), 0 0 32px rgba(99,102,241,0.3)',
              }} />
              {/* Shimmer animation */}
              <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                width: `${loadingProgress}%`,
                borderRadius: '8px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s ease-in-out infinite',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>

            {/* Step indicators */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginTop: '10px',
              padding: '0 2px',
            }}>
              {['เชื่อมต่อ', 'โหลดข้อมูล', 'เตรียมหน้าจอ', 'เสร็จสิ้น'].map((label, i) => {
                const stepThreshold = [0, 25, 60, 95];
                const isActive = loadingProgress >= stepThreshold[i];
                return (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: isActive
                        ? 'linear-gradient(135deg, #06b6d4, #6366f1)'
                        : 'rgba(255,255,255,0.08)',
                      border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      boxShadow: isActive ? '0 0 8px rgba(6,182,212,0.5)' : 'none',
                      transition: 'all 0.4s ease',
                    }} />
                    <span style={{
                      fontSize: '10px',
                      color: isActive ? 'rgba(6,182,212,0.8)' : 'rgba(148,163,184,0.35)',
                      fontWeight: isActive ? 500 : 400,
                      transition: 'all 0.4s ease',
                    }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Display */}
          {loadingError && (
            <div style={{
              marginTop: '20px', padding: '20px 24px',
              background: 'rgba(239,68,68,0.08)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '16px', width: '100%',
              boxShadow: '0 8px 24px rgba(239,68,68,0.1)',
            }}>
              <p style={{ color: '#fca5a5', fontSize: '14px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                {loadingError}
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  width: '100%', padding: '10px 24px',
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                โหลดใหม่
              </button>
            </div>
          )}
        </div>

        {/* === CSS Keyframes === */}
        <style>{`
          @keyframes floatParticle {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
            25% { transform: translateY(-20px) translateX(8px); opacity: 0.7; }
            50% { transform: translateY(-10px) translateX(-5px); opacity: 0.5; }
            75% { transform: translateY(-25px) translateX(12px); opacity: 0.6; }
          }
          @keyframes orbitSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes floatIcon {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          @keyframes dotPulse {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
            40% { transform: scale(1.2); opacity: 1; }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    );
  }



  // แสดง login screen ถ้ายังไม่ได้ล็อกอิน
  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} setView={handleSetView} parts={parts} jobs={jobs} />
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
            onOpenPartRequest={(mode: 'repair' | 'spare') => {
              console.log('🔓 Opening Part Request Modal - mode:', mode);
              setPartRequestMode(mode);
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
        {view === 'analytics_dashboard' && (
          <AnalyticsDashboardScreen
            golfCourses={golfCourses}
            setView={handleSetView}
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
        {view === 'agreements_management' && (
          <AgreementManagementScreen
            golfCourses={golfCourses}
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
            jobs={jobs}
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
            onFillJobForm={handleFillJobForm}
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
        vehicles={vehicles}
        requestMode={partRequestMode}
      />
    </div>
  );
}

