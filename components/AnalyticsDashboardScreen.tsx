'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Job, Vehicle, GolfCourse, PartsUsageLog, View, Part } from '@/lib/data';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar
} from 'recharts';
import { format, subMonths, isSameMonth, addMonths, isWithinInterval, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import {
  ArrowLeft, BarChart3, AlertTriangle, Package,
  Target, TrendingUp, GripVertical, ChevronDown, ChevronUp,
  Zap, Car, Wrench, Shield, ChevronLeft, ChevronRight,
  Layers, PieChart as PieChartIcon, LayoutGrid, Eye, EyeOff, Check, Filter,
  X, CalendarDays, Hash, Activity, ArrowRight, MousePointer2, Compass,
  Calendar, RefreshCw
} from 'lucide-react';
import { jobsApi, vehiclesApi, partsApi } from '@/lib/api';

// === Types ===
interface AnalyticsDashboardScreenProps {
  jobs?: Job[];
  vehicles?: Vehicle[];
  golfCourses: GolfCourse[];
  partsUsageLog?: PartsUsageLog[];
  parts?: Part[];
  setView: (view: View) => void;
}

const SYMPTOM_MAP: Record<string, string> = {
  'wont_start': 'สตาร์ทไม่ติด / วิ่งไม่ได้',
  'strange_noise': 'มีเสียงดังผิดปกติ',
  'performance_drop': 'ไม่มีกำลัง / แบตหมดเร็ว',
  'control_issue': 'บังคับเลี้ยวไม่ได้ / เบรกไม่อยู่',
  'physical_damage': 'แตกหัก / เสียรูปจากภายนอก',
  'other': 'อื่นๆ'
};

const ACTION_MAP: Record<string, string> = {
  'replace': 'เปลี่ยนชิ้นส่วน',
  'adjust': 'ปรับตั้ง/คาลิเบรต',
  'clean': 'ทำความสะอาด',
  'tighten': 'ขันแน่น',
  'software': 'รีเซ็ตระบบ'
};

// === Loading Skeleton ===
const AnalyticsLoadingSkeleton = ({ setView }: { setView: (view: View) => void }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('กำลังเตรียมข้อมูล...');

  useEffect(() => {
    const steps = [
      { at: 15, text: 'กำลังโหลดข้อมูลงานซ่อมบำรุง...' },
      { at: 35, text: 'กำลังโหลดข้อมูลยานพาหนะ...' },
      { at: 55, text: 'กำลังโหลดรายการอะไหล่...' },
      { at: 75, text: 'กำลังโหลดประวัติการใช้อะไหล่...' },
      { at: 90, text: 'กำลังประมวลผลข้อมูล...' },
    ];

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + 2, 95);
        const step = steps.find(s => next >= s.at && prev < s.at);
        if (step) setStatusText(step.text);
        return next;
      });
    }, 80);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* === Sticky Header (real) === */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('admin_dashboard')}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all duration-200 active:scale-[0.98] text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
              aria-label="Back to Admin Dashboard"
            >
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tighter text-zinc-900 dark:text-zinc-50">
                ภาพรวมและการวิเคราะห์
              </h1>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Analytics & Workload Overview
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* === Loading Content === */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress indicator */}
        <div className="flex flex-col items-center justify-center mb-12 mt-8">
          <div className="relative w-20 h-20 mb-6">
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-full border-[3px] border-zinc-200 dark:border-zinc-800" />
            <div
              className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-500 animate-spin"
              style={{ animationDuration: '1.2s' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 size={24} strokeWidth={1.5} className="text-indigo-500 animate-pulse" />
            </div>
          </div>
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            {statusText}
          </p>
          {/* Progress bar */}
          <div className="w-64 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 font-medium">{progress}%</p>
        </div>

        {/* Skeleton Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 p-5 shadow-sm">
              <div className="h-1 rounded-t-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-3" />
              <div className="flex items-start justify-between mb-3">
                <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-4 w-36 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-[320px] bg-zinc-50 dark:bg-zinc-800/30 rounded-lg animate-pulse" />
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-4 w-28 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-[240px] bg-zinc-50 dark:bg-zinc-800/30 rounded-full mx-auto w-[240px] animate-pulse" />
          </div>
        </div>

        {/* Skeleton Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
                  <div className="h-5 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// === Error State ===
const AnalyticsErrorState = ({ error, onRetry, setView }: { error: string; onRetry: () => void; setView: (view: View) => void }) => (
  <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
    <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('admin_dashboard')}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all duration-200 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
            aria-label="Back to Admin Dashboard"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <h1 className="text-lg font-semibold tracking-tighter text-zinc-900 dark:text-zinc-50">
            ภาพรวมและการวิเคราะห์
          </h1>
        </div>
      </div>
    </div>
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-4">
        <AlertTriangle size={28} strokeWidth={1.5} className="text-rose-500" />
      </div>
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">ไม่สามารถโหลดข้อมูลได้</h3>
      <p className="text-xs text-zinc-400 mb-6 max-w-xs text-center">{error}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm shadow-indigo-500/20"
      >
        <RefreshCw size={16} strokeWidth={1.5} />
        ลองใหม่อีกครั้ง
      </button>
    </div>
  </div>
);

// === Constants ===
const CHART_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

const SYSTEM_NAME_MAP: Record<string, string> = {
  'brake': 'ระบบเบรก/เพื่อห้าม',
  'steering': 'ระบบบังคับเลี้ยว',
  'motor': 'ระบบมอเตอร์/เพื่อขับ',
  'electric': 'ระบบไฟฟ้า',
  'general': 'ทั่วไป',
  'suspension': 'ช่วงล่างและพวงมาลัย',
  'job': 'งานทั่วไป',
  'Test System': 'ทดสอบระบบ',
  'other': 'อื่นๆ'
};

// === Custom Tooltip ===
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-zinc-500 dark:text-zinc-400">{entry.name}:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// === Animated Counter ===
const AnimatedNumber = ({ value, duration = 600 }: { value: number; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    prevRef.current = value;
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
};

// === Progress Bar ===
const ProgressBar = ({ value, max, color, label }: { value: number; max: number; color: string; label: string }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{value}</span>
      </div>
      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

// === Main Component ===
const AnalyticsDashboardScreen: React.FC<AnalyticsDashboardScreenProps> = ({
  jobs: propJobs, vehicles: propVehicles, golfCourses, partsUsageLog: propPartsUsageLog, parts: propParts, setView
}) => {
  // === Lazy Loading State ===
  const [localJobs, setLocalJobs] = useState<Job[]>(propJobs || []);
  const [localVehicles, setLocalVehicles] = useState<Vehicle[]>(propVehicles || []);
  const [localParts, setLocalParts] = useState<Part[]>(propParts || []);
  const [localPartsUsageLog, setLocalPartsUsageLog] = useState<PartsUsageLog[]>(propPartsUsageLog || []);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Determine if we need to self-fetch (props not provided or empty)
  const needsSelfFetch = !propJobs || propJobs.length === 0;

  // Use prop data if available, otherwise use locally fetched data
  const jobs = needsSelfFetch ? localJobs : propJobs!;
  const vehicles = needsSelfFetch ? localVehicles : propVehicles!;
  const parts = needsSelfFetch ? localParts : propParts!;
  const partsUsageLog = needsSelfFetch ? localPartsUsageLog : propPartsUsageLog!;

  // === Self-fetch data when component mounts ===
  const fetchAnalyticsData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsDataLoading(true);
      }
      setDataError(null);

      console.log('📊 [Analytics] กำลังโหลดข้อมูลแดชบอร์ด...');

      const [jobsResult, vehiclesResult, partsResult, usageResult] = await Promise.allSettled([
        jobsApi.getAll(),
        vehiclesApi.getAll(),
        partsApi.getAll(),
        fetch('/api/reports/usage').then(r => r.json()),
      ]);

      // Jobs
      if (jobsResult.status === 'fulfilled' && jobsResult.value.success) {
        setLocalJobs(jobsResult.value.data as Job[]);
        console.log('✅ [Analytics] Jobs:', (jobsResult.value.data as Job[]).length);
      } else {
        throw new Error('ไม่สามารถโหลดข้อมูลงานซ่อมได้');
      }

      // Vehicles
      if (vehiclesResult.status === 'fulfilled' && vehiclesResult.value.success) {
        setLocalVehicles(vehiclesResult.value.data as Vehicle[]);
        console.log('✅ [Analytics] Vehicles:', (vehiclesResult.value.data as Vehicle[]).length);
      } else {
        console.warn('⚠️ [Analytics] Vehicles load failed, using fallback');
      }

      // Parts
      if (partsResult.status === 'fulfilled' && partsResult.value.success) {
        setLocalParts(partsResult.value.data as Part[]);
        console.log('✅ [Analytics] Parts:', (partsResult.value.data as Part[]).length);
      } else {
        console.warn('⚠️ [Analytics] Parts load failed, using fallback');
      }

      // Usage logs
      if (usageResult.status === 'fulfilled' && usageResult.value.success) {
        setLocalPartsUsageLog(usageResult.value.data as PartsUsageLog[]);
        console.log('✅ [Analytics] Usage logs:', (usageResult.value.data as PartsUsageLog[]).length);
      } else {
        console.warn('⚠️ [Analytics] Usage logs load failed, using fallback');
      }

      console.log('✨ [Analytics] โหลดข้อมูลเสร็จสิ้น');
    } catch (error: any) {
      console.error('❌ [Analytics] Error:', error);
      setDataError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsDataLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (needsSelfFetch) {
      fetchAnalyticsData();
    } else {
      setIsDataLoading(false);
    }
  }, [needsSelfFetch, fetchAnalyticsData]);

  // === UI State (must come before any early returns — React hooks rule) ===
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<'month' | 'year' | 'custom' | 'all'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'bar' | 'area' | 'radar'>('bar');
  const [showInactiveCourses, setShowInactiveCourses] = useState<boolean>(false);
  const [donutChartType, setDonutChartType] = useState<'PM' | 'BM' | 'Recondition'>('PM');
  const [bmBreakdownType, setBmBreakdownType] = useState<'system' | 'cause' | 'symptom' | 'action'>('cause');
  const [selectedRadarCourses, setSelectedRadarCourses] = useState<string[]>([]);
  const [isRadarDropdownOpen, setIsRadarDropdownOpen] = useState<boolean>(false);
  const [historyModalCourseId, setHistoryModalCourseId] = useState<string | null>(null);
  const [historyModalTab, setHistoryModalTab] = useState<'parts' | 'jobs'>('parts');

  // PM Health Rings State
  const [healthCourseId, setHealthCourseId] = useState<string>('all');
  const [compareHealthCourseId, setCompareHealthCourseId] = useState<string | null>(null);
  const [isHealthCompareMode, setIsHealthCompareMode] = useState<boolean>(false);

  // Drag & Drop state
  const [cardOrder, setCardOrder] = useState<string[]>([
    'metrics', 'charts', 'health', 'courses', 'lemon'
  ]);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOverCard, setDragOverCard] = useState<string | null>(null);
  const [expandedLemonCars, setExpandedLemonCars] = useState<string[]>([]);
  const [lemonGrouping, setLemonGrouping] = useState<'none' | 'course'>('none');

  // === Drag & Drop Handlers ===
  const handleDragStart = useCallback((cardId: string) => {
    setDraggedCard(cardId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, cardId: string) => {
    e.preventDefault();
    if (draggedCard && draggedCard !== cardId) {
      setDragOverCard(cardId);
    }
  }, [draggedCard]);

  const handleDrop = useCallback((targetCardId: string) => {
    if (!draggedCard || draggedCard === targetCardId) return;
    setCardOrder(prev => {
      const newOrder = [...prev];
      const dragIdx = newOrder.indexOf(draggedCard);
      const targetIdx = newOrder.indexOf(targetCardId);
      newOrder.splice(dragIdx, 1);
      newOrder.splice(targetIdx, 0, draggedCard);
      return newOrder;
    });
    setDraggedCard(null);
    setDragOverCard(null);
  }, [draggedCard]);

  const handleDragEnd = useCallback(() => {
    setDraggedCard(null);
    setDragOverCard(null);
  }, []);

  // === Data Logic (Preserved) ===
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (dateRange === 'all') return true;
      if (!job.created_at && !job.createdAt) return true;
      const jobDate = new Date(job.createdAt || job.created_at);
      if (dateRange === 'month') return isSameMonth(jobDate, selectedDate);
      if (dateRange === 'year') return jobDate.getFullYear() === selectedDate.getFullYear();
      if (dateRange === 'custom') {
        const start = startOfDay(new Date(customStartDate));
        const end = endOfDay(new Date(customEndDate));
        return isWithinInterval(jobDate, { start, end });
      }
      return true;
    });
  }, [jobs, selectedDate, dateRange, customStartDate, customEndDate]);

  const filteredLogs = useMemo(() => {
    return partsUsageLog.filter(log => {
      if (dateRange === 'all') return true;
      if (!log.usedDate && !log.createdAt) return true;
      const logDate = new Date(log.usedDate || log.createdAt as any);
      if (dateRange === 'month') return isSameMonth(logDate, selectedDate);
      if (dateRange === 'year') return logDate.getFullYear() === selectedDate.getFullYear();
      if (dateRange === 'custom') {
        const start = startOfDay(new Date(customStartDate));
        const end = endOfDay(new Date(customEndDate));
        return isWithinInterval(logDate, { start, end });
      }
      return true;
    });
  }, [partsUsageLog, selectedDate, dateRange, customStartDate, customEndDate]);

  const totalVehicles = vehicles.length;
  const totalJobs = filteredJobs.length;
  const pmJobs = filteredJobs.filter(j => j.type === 'PM').length;
  const breakdownJobs = filteredJobs.filter(j => j.type === 'BM').length;

  const lemonCars = useMemo(() => {
    // Key is serial_number (or vehicle_id if serial is missing)
    const bmCountsByVehicle: Record<string, { count: number; vehicle: Vehicle | undefined; jobs: Job[], datesSeen: Set<string> }> = {};

    filteredJobs.forEach(job => {
      if (job.type === 'BM' && job.vehicle_id) {
        const vehicle = vehicles.find(v => v.id === job.vehicle_id);
        if (!vehicle) return;

        // Group by serial_number, fallback to vehicle_id
        const key = vehicle.serial_number || job.vehicle_id;

        if (!bmCountsByVehicle[key]) {
          bmCountsByVehicle[key] = {
            count: 0,
            vehicle: vehicle,
            jobs: [],
            datesSeen: new Set()
          };
        }

        const dateStr = job.createdAt || (job as any).created_at;
        const jobDate = dateStr ? format(new Date(dateStr), 'yyyy-MM-dd') : `unknown-${job.id}`;

        // Only count 1 BM per vehicle per day to prevent double counting
        if (jobDate.startsWith('unknown') || !bmCountsByVehicle[key].datesSeen.has(jobDate)) {
          bmCountsByVehicle[key].datesSeen.add(jobDate);
          bmCountsByVehicle[key].count++;
          bmCountsByVehicle[key].jobs.push(job);
        }
      }
    });

    return Object.values(bmCountsByVehicle)
      .filter(entry => entry.count >= 2)
      .sort((a, b) => b.count - a.count);
  }, [filteredJobs, vehicles]);

  const groupedLemonCars = useMemo(() => {
    const groups: Record<string, typeof lemonCars> = {};
    lemonCars.forEach(car => {
      const courseName = car.vehicle?.golf_course_name || 'ไม่ทราบสนาม';
      if (!groups[courseName]) groups[courseName] = [];
      groups[courseName].push(car);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [lemonCars]);

  const workingGolfCourses = useMemo(() => {
    return golfCourses.filter(c => showInactiveCourses || c.isActive !== false);
  }, [golfCourses, showInactiveCourses]);

  const courseStats = useMemo(() => {
    return workingGolfCourses.map(course => {
      const courseJobs = filteredJobs.filter(j => j.golf_course_id === course.id);
      const courseLogs = filteredLogs.filter(l =>
        workingGolfCourses.find(gc => gc.name === l.golfCourseName)?.id === course.id
      );
      const pm = courseJobs.filter(j => j.type === 'PM');
      const bm = courseJobs.filter(j => j.type === 'BM');
      const recon = courseJobs.filter(j => j.type === 'Recondition');

      const systemsCount = pm.reduce((acc, job) => {
        const sys = job.system || 'other';
        acc[sys] = (acc[sys] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const bmCauseCount = bm.reduce((acc, job) => {
        const cause = job.bmCause || 'other';
        acc[cause] = (acc[cause] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const partUsageCounts = courseLogs.reduce((acc, log) => {
        acc[log.partId] = (acc[log.partId] || 0) + log.quantityUsed;
        return acc;
      }, {} as Record<string, number>);

      const topParts = Object.entries(partUsageCounts)
        .map(([id, qty]) => ({ id, qty, details: parts.find(p => p.id === id) }))
        .filter(p => p.details)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      const allLogs = [...courseLogs].sort((a, b) => {
        const da = a.usedDate ? new Date(a.usedDate).getTime() : 0;
        const db = b.usedDate ? new Date(b.usedDate).getTime() : 0;
        return db - da; // Descending
      });

      return {
        course,
        totalVehicles: vehicles.filter(v => v.golf_course_id === course.id).length,
        pmCount: pm.length,
        bmCount: bm.length,
        reconditionCount: recon.length,
        totalJobs: courseJobs.length,
        pmBreakdown: systemsCount,
        bmBreakdown: bmCauseCount,
        topParts,
        allLogs,
        allJobs: [...courseJobs].sort((a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime())
      };
    }).sort((a, b) => b.totalJobs - a.totalJobs);
  }, [workingGolfCourses, filteredJobs, filteredLogs, vehicles, parts]);

  // Derived state for Modal
  const historyModalStat = useMemo(() => {
    return courseStats.find(s => s.course.id === historyModalCourseId) || null;
  }, [courseStats, historyModalCourseId]);

  // Chart data
  const chartData = courseStats.map(stat => ({
    name: stat.course.name.length > 12 ? stat.course.name.substring(0, 12) + '...' : stat.course.name,
    fullName: stat.course.name,
    PM: stat.pmCount,
    BM: stat.bmCount,
    ปรับสภาพ: stat.reconditionCount
  }));

  const systemPieData = useMemo(() => {
    const totals = filteredJobs.filter(j => j.type === donutChartType).reduce((acc, job) => {
      if (donutChartType === 'BM') {
        if (bmBreakdownType === 'cause') {
          const cause = job.bmCause || 'other';
          const causeMap: Record<string, string> = {
            'breakdown': 'เสีย',
            'accident': 'อุบัติเหตุ',
            'wear': 'สึกหรอ',
            'other': 'อื่นๆ'
          };
          const safeName = causeMap[cause] || cause;
          acc[safeName] = (acc[safeName] || 0) + 1;
        } else if (bmBreakdownType === 'symptom') {
          const symptom = job.bmSymptom || 'other';
          const safeName = SYMPTOM_MAP[symptom] || (symptom === 'other' ? 'ไม่ได้ระบุ/อื่นๆ' : symptom);
          acc[safeName] = (acc[safeName] || 0) + 1;
        } else if (bmBreakdownType === 'action') {
          if (job.repairActions && job.repairActions.length > 0) {
            job.repairActions.forEach(action => {
              const safeName = ACTION_MAP[action] || action;
              acc[safeName] = (acc[safeName] || 0) + 1;
            });
          } else {
             acc['ไม่ได้ระบุ'] = (acc['ไม่ได้ระบุ'] || 0) + 1;
          }
        } else {
          // system
          if (job.systems && job.systems.length > 0) {
            job.systems.forEach(sys => {
              const safeName = SYSTEM_NAME_MAP[sys] || sys;
              acc[safeName] = (acc[safeName] || 0) + 1;
            });
          } else {
             const sys = job.system || 'other';
             const safeName = SYSTEM_NAME_MAP[sys] || sys;
             acc[safeName] = (acc[safeName] || 0) + 1;
          }
        }
      } else {
        const sys = job.system || 'other';
        const safeName = SYSTEM_NAME_MAP[sys] || sys;
        acc[safeName] = (acc[safeName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredJobs, donutChartType, bmBreakdownType]);

  // Radar chart data per course
  const radarCourses = useMemo(() => {
    if (selectedRadarCourses.length > 0) {
      return courseStats.filter(s => selectedRadarCourses.includes(s.course.id));
    }
    return courseStats.slice(0, 4);
  }, [courseStats, selectedRadarCourses]);

  const radarData = useMemo(() => {
    // Collect unique systems from top 4 courses
    const dynamicSystems = new Set<string>();

    // Always include core 4 systems so the radar is at least a balanced diamond
    const coreSystems = ['brake', 'steering', 'motor', 'electric'];
    coreSystems.forEach(s => dynamicSystems.add(s));

    radarCourses.forEach(stat => {
      Object.keys(stat.pmBreakdown).forEach(sys => {
        if (sys !== 'other' && sys !== '') dynamicSystems.add(sys);
      });
    });

    const systems = Array.from(dynamicSystems);

    return systems.map(sys => {
      const entry: any = { system: SYSTEM_NAME_MAP[sys] || sys };
      radarCourses.forEach(stat => {
        entry[stat.course.name] = stat.pmBreakdown[sys] || 0;
      });
      return entry;
    });
  }, [radarCourses]);

  // Trend data — dynamically adapts based on filter selection
  const trendData = useMemo(() => {
    // Determine reference months based on active filter
    let months: Date[] = [];

    if (dateRange === 'custom') {
      // Generate monthly buckets spanning the custom range
      const start = startOfMonth(new Date(customStartDate));
      const end = endOfMonth(new Date(customEndDate));
      let cursor = start;
      while (cursor <= end) {
        months.push(cursor);
        cursor = addMonths(cursor, 1);
      }
      // Cap at 24 months to prevent oversized charts
      if (months.length > 24) months = months.slice(months.length - 24);
    } else if (dateRange === 'year') {
      // Show all 12 months of the selected year
      for (let m = 0; m < 12; m++) {
        months.push(new Date(selectedDate.getFullYear(), m, 1));
      }
    } else {
      // Default: last 6 months from today
      for (let i = 5; i >= 0; i--) months.push(subMonths(new Date(), i));
    }

    return months.map(month => {
      // Use the already-filtered jobs so the trend matches the global filter
      const monthJobs = filteredJobs.filter(job => {
        if (!job.created_at && !job.createdAt) return false;
        return isSameMonth(new Date(job.createdAt || job.created_at), month);
      });
      return {
        month: format(month, 'MMM yy'),
        PM: monthJobs.filter(j => j.type === 'PM').length,
        BM: monthJobs.filter(j => j.type === 'BM').length,
        ปรับสภาพ: monthJobs.filter(j => j.type === 'Recondition').length,
      };
    });
  }, [filteredJobs, dateRange, selectedDate, customStartDate, customEndDate]);

  // === Health Ring Logic ===
  const calculateHealthData = useCallback((courseId: string) => {
    const isAll = courseId === 'all';

    let courseVehicles;
    let courseName;

    if (isAll) {
      courseVehicles = vehicles;
      courseName = 'ภาพรวมทุกสนาม';
    } else {
      const targetCourse = golfCourses.find(c => c.id === courseId);
      if (!targetCourse) return null;
      courseVehicles = vehicles.filter(v => v.golf_course_id === courseId);
      courseName = targetCourse.name;
    }

    const totalVehicles = courseVehicles.length;
    if (totalVehicles === 0) return null;

    // Define window based on global filters
    let startDate: Date;
    let endDate: Date;

    if (dateRange === 'month') {
      // For health, we look back 12 months from the selected month to get a "Health Score"
      endDate = endOfMonth(selectedDate);
      startDate = subMonths(endDate, 12);
    } else if (dateRange === 'year') {
      // For year, we look at the entire year
      startDate = startOfYear(selectedDate);
      endDate = endOfYear(selectedDate);
    } else if (dateRange === 'custom') {
      // Use exact custom range
      startDate = startOfDay(new Date(customStartDate));
      endDate = endOfDay(new Date(customEndDate));
    } else {
      // All time - default to 12 months lookback from today
      endDate = new Date();
      startDate = subMonths(endDate, 12);
    }

    const periodJobs = jobs.filter(j => {
      if (!isAll && j.golf_course_id !== courseId) return false;
      if (j.type !== 'PM') return false;
      const jobDate = new Date(j.createdAt || j.created_at);
      return jobDate >= startDate && jobDate <= endDate;
    });

    // Count unique vehicles per system
    const systemCounts: Record<string, Set<string>> = {
      brake: new Set(),
      steering: new Set(),
      suspension: new Set(),
      motor_electric: new Set(),
    };

    periodJobs.forEach(j => {
      const sys = j.system || 'other';
      if (sys === 'brake') systemCounts.brake.add(j.vehicle_id || '');
      else if (sys === 'steering') systemCounts.steering.add(j.vehicle_id || '');
      else if (sys === 'suspension') systemCounts.suspension.add(j.vehicle_id || '');
      else if (sys === 'motor' || sys === 'electric') systemCounts.motor_electric.add(j.vehicle_id || '');
    });

    const getScore = (count: number) => (count / totalVehicles) * 25;

    const data = [
      { name: 'Brake', value: getScore(systemCounts.brake.size), rawCount: systemCounts.brake.size, full: 25, fill: '#6366f1', icon: Shield },
      { name: 'Steering', value: getScore(systemCounts.steering.size), rawCount: systemCounts.steering.size, full: 25, fill: '#10b981', icon: Compass },
      { name: 'Suspension', value: getScore(systemCounts.suspension.size), rawCount: systemCounts.suspension.size, full: 25, fill: '#f59e0b', icon: Wrench },
      { name: 'Motor/Electric', value: getScore(systemCounts.motor_electric.size), rawCount: systemCounts.motor_electric.size, full: 25, fill: '#ef4444', icon: Zap },
    ];

    const totalHealth = data.reduce((sum, item) => sum + item.value, 0);

    return { data, totalHealth, courseName, totalVehicles, period: { start: startDate, end: endDate } };
  }, [jobs, vehicles, golfCourses, dateRange, selectedDate, customStartDate, customEndDate]);

  // Handle default healthCourseId
  useEffect(() => {
    if (!healthCourseId) {
      setHealthCourseId('all');
    }
  }, [healthCourseId]);

  // === Early Returns (after all hooks) ===
  if (isDataLoading) {
    return <AnalyticsLoadingSkeleton setView={setView} />;
  }

  if (dataError && jobs.length === 0) {
    return <AnalyticsErrorState error={dataError} onRetry={() => fetchAnalyticsData()} setView={setView} />;
  }

  // === Section Renderers ===

  const renderMetrics = () => (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {[
        { label: 'รถทั้งหมด', value: totalVehicles, icon: Car, gradient: 'from-zinc-500 to-zinc-600', bgLight: 'bg-zinc-50', bgDark: 'dark:bg-zinc-800/50' },
        { label: 'งานทั้งหมด', value: totalJobs, icon: Layers, gradient: 'from-indigo-500 to-indigo-600', bgLight: 'bg-indigo-50', bgDark: 'dark:bg-indigo-900/20' },
        { label: 'บำรุงรักษา PM', value: pmJobs, icon: Shield, gradient: 'from-emerald-500 to-emerald-600', bgLight: 'bg-emerald-50', bgDark: 'dark:bg-emerald-900/20' },
        { label: 'ซ่อมด่วน BM', value: breakdownJobs, icon: Zap, gradient: 'from-rose-500 to-rose-600', bgLight: 'bg-rose-50', bgDark: 'dark:bg-rose-900/20' },
        { label: 'Lemon Cars', value: lemonCars.length, icon: AlertTriangle, gradient: 'from-amber-500 to-amber-600', bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-900/20' },
      ].map((metric, i) => (
        <div
          key={i}
          className={cn(
            "group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 p-5 shadow-sm",
            "hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300"
          )}
        >
          {/* Accent bar */}
          <div className={cn("absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r", metric.gradient)} />
          <div className="flex items-start justify-between mb-3 pt-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-tight">{metric.label}</span>
            <div className={cn("p-1.5 rounded-lg", metric.bgLight, metric.bgDark)}>
              <metric.icon size={16} strokeWidth={1.5} className="text-zinc-500 dark:text-zinc-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50">
            <AnimatedNumber value={metric.value} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* === Main Chart === */}
      <div className="relative lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
        {/* Chart Header with Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 pb-0 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Target size={18} strokeWidth={1.5} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">เปรียบเทียบภาระงานสนาม</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Workload Distribution</p>
            </div>
          </div>
          {/* Chart type switcher */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/60 rounded-lg p-0.5">
            {([
              { key: 'bar', icon: BarChart3, label: 'แท่ง' },
              { key: 'area', icon: TrendingUp, label: 'แนวโน้ม' },
              { key: 'radar', icon: PieChartIcon, label: 'เรดาร์' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveChartTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                  activeChartTab === tab.key
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                <tab.icon size={14} strokeWidth={1.5} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Body */}
        <div className="p-5 h-[360px]">
          {activeChartTab === 'bar' && (
            chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="pmGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="bmGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#e11d48" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="reconGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={12}
                  />
                  <YAxis
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
                  />
                  <Bar dataKey="PM" name="บำรุงรักษา (PM)" fill="url(#pmGrad)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="BM" name="ซ่อมด่วน (BM)" fill="url(#bmGrad)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="ปรับสภาพ" fill="url(#reconGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState />
            )
          )}

          {activeChartTab === 'area' && (
            trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <defs>
                    <linearGradient id="areaGradPM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="areaGradBM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" strokeOpacity={0.5} />
                  <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickMargin={12} />
                  <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} tickMargin={8} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
                  <Area type="monotone" dataKey="PM" name="บำรุงรักษา" stroke="#10b981" strokeWidth={2.5} fill="url(#areaGradPM)" dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  <Area type="monotone" dataKey="BM" name="ซ่อมด่วน" stroke="#f43f5e" strokeWidth={2.5} fill="url(#areaGradBM)" dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState />
            )
          )}

          {activeChartTab === 'radar' && (
            <div className="relative w-full h-full pb-4">
              <div className="absolute top-0 right-0 z-20 flex flex-col items-end">
                <button
                  onClick={() => setIsRadarDropdownOpen(!isRadarDropdownOpen)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium shadow-sm transition-all duration-200",
                    isRadarDropdownOpen || selectedRadarCourses.length > 0
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50"
                      : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  )}
                >
                  <Filter size={14} />
                  เปรียบเทียบสนาม ({selectedRadarCourses.length > 0 ? selectedRadarCourses.length : Math.min(4, courseStats.length)})
                </button>

                {isRadarDropdownOpen && (
                  <div className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl rounded-xl overflow-hidden py-1 z-30 animate-in fade-in slide-in-from-top-2 origin-top-right">
                    <div className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Check size={14} className="text-indigo-500" />
                        เลือกสนามที่ต้องการเปรียบเทียบ
                      </span>
                      {selectedRadarCourses.length > 0 && (
                        <button
                          onClick={() => setSelectedRadarCourses([])}
                          className="text-[10px] text-zinc-500 hover:text-indigo-600 transition-colors"
                        >
                          ล้างค่า
                        </button>
                      )}
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                      {courseStats.map(stat => {
                        const isSelected = selectedRadarCourses.length > 0
                          ? selectedRadarCourses.includes(stat.course.id)
                          : courseStats.slice(0, 4).some(s => s.course.id === stat.course.id);

                        return (
                          <label key={stat.course.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 rounded-lg cursor-pointer transition-colors group">
                            <div className={cn(
                              "w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors",
                              isSelected ? "bg-indigo-600 border-indigo-600 shadow-sm" : "border-zinc-300 dark:border-zinc-600 group-hover:border-indigo-400"
                            )}>
                              {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
                            </div>
                            <span className={cn(
                              "text-xs truncate transition-colors",
                              isSelected ? "text-zinc-900 dark:text-zinc-50 font-medium" : "text-zinc-600 dark:text-zinc-300"
                            )}>
                              {stat.course.name}
                            </span>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isSelected}
                              onChange={(e) => {
                                setSelectedRadarCourses(prev => {
                                  const current = prev.length > 0 ? prev : courseStats.slice(0, 4).map(s => s.course.id);
                                  if (e.target.checked) return [...current, stat.course.id];
                                  return current.filter(id => id !== stat.course.id);
                                });
                              }}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e4e4e7" strokeOpacity={0.6} />
                    <PolarAngleAxis dataKey="system" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                    {radarCourses.map((stat, idx) => (
                      <Radar
                        key={stat.course.id}
                        name={stat.course.name}
                        dataKey={stat.course.name}
                        stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                        fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    ))}
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState />
              )}
            </div>
          )}
        </div>
      </div>

      {/* === PM Systems Donut === */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 pb-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl shrink-0 border border-emerald-100/50 dark:border-emerald-800/30">
              <PieChartIcon size={18} strokeWidth={1.5} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 whitespace-nowrap uppercase">สัดส่วนระบบงาน</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium whitespace-nowrap">System Breakdown</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {donutChartType === 'BM' && (
              <select
                value={bmBreakdownType}
                onChange={(e) => setBmBreakdownType(e.target.value as any)}
                className="w-full sm:w-auto appearance-none text-xs font-semibold border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg pl-3 pr-8 py-1.5 text-emerald-700 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 shadow-sm transition-all cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20stroke%3D%22%23059669%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[right_8px_center] bg-no-repeat"
              >
                <option value="cause">ดูตาม สาเหตุ (Cause)</option>
                <option value="system">ดูตาม ระบบ (System)</option>
                <option value="symptom">ดูตาม อาการ (Symptom)</option>
                <option value="action">ดูตาม วิธีแก้ (Action)</option>
              </select>
            )}
            <select
              value={donutChartType}
              onChange={(e) => setDonutChartType(e.target.value as any)}
              className="w-full sm:w-auto appearance-none text-xs font-semibold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg pl-3 pr-8 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm transition-all cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[right_8px_center] bg-no-repeat"
            >
              <option value="PM">PM (บำรุงรักษา)</option>
              <option value="BM">BM (ซ่อมด่วน)</option>
              <option value="Recondition">RC (ปรับสภาพ)</option>
            </select>
          </div>
        </div>
        <div className="flex-1 px-5 py-3 min-h-[240px]">
          {systemPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {CHART_COLORS.map((color, i) => (
                    <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={systemPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {systemPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#pieGrad${index % CHART_COLORS.length})`} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
              ไม่มีข้อมูล PM
            </div>
          )}
        </div>
        {/* Legend */}
        <div className="px-5 pb-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
          <div className="grid grid-cols-2 gap-2">
            {systemPieData.map((entry, idx) => {
              const total = systemPieData.reduce((s, e) => s + e.value, 0);
              const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
              return (
                <div key={idx} className="flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 shadow-[0_1px_2px_rgb(0,0,0,0.02)] hover:shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 transition-all">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-zinc-900" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate tracking-tight">{entry.name}</span>
                  <span className="ml-auto text-xs font-bold text-zinc-900 dark:text-zinc-50">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <LayoutGrid size={18} strokeWidth={1.5} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">เจาะลึกรายสนาม</h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Course-Level Breakdown</p>
          </div>
        </div>
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{courseStats.filter(s => s.totalVehicles > 0 || s.totalJobs > 0).length} สนาม</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courseStats.map((stat) => {
          if (stat.totalVehicles === 0 && stat.totalJobs === 0) return null;
          const isExpanded = expandedCourse === stat.course.id;

          return (
            <div
              key={stat.course.id}
              className={cn(
                "bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm overflow-hidden transition-all duration-300",
                isExpanded && "md:col-span-2 ring-1 ring-indigo-500/20"
              )}
            >
              {/* Course Header */}
              <button
                onClick={() => setExpandedCourse(isExpanded ? null : stat.course.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors duration-200"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {stat.course.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">{stat.course.name}</h3>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      {stat.totalVehicles} คัน · {stat.totalJobs} งาน
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Mini stat badges */}
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                      PM {stat.pmCount}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
                      BM {stat.bmCount}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                      RC {stat.reconditionCount}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={18} strokeWidth={1.5} className="text-zinc-400" />
                  ) : (
                    <ChevronDown size={18} strokeWidth={1.5} className="text-zinc-400" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-300">
                  {/* === Summary stat row === */}
                  <div className="grid grid-cols-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col items-center py-4 border-r border-zinc-100 dark:border-zinc-800">
                      <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">PM</span>
                      <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stat.pmCount}</span>
                    </div>
                    <div className="flex flex-col items-center py-4 border-r border-zinc-100 dark:border-zinc-800">
                      <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">BM</span>
                      <span className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{stat.bmCount}</span>
                    </div>
                    <div className="flex flex-col items-center py-4">
                      <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">RC</span>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{stat.reconditionCount}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-6">
                      {/* === PM Breakdown Card === */}
                      <div className="bg-zinc-50/80 dark:bg-zinc-800/30 rounded-xl p-4 border border-zinc-200/40 dark:border-zinc-700/40 space-y-3">
                        <h4 className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                            <Wrench size={12} strokeWidth={2} className="text-emerald-600 dark:text-emerald-400" />
                          </div>
                          รายละเอียดงาน PM
                        </h4>
                        <div className="space-y-2.5">
                          {Object.entries(stat.pmBreakdown)
                            .sort((a, b) => b[1] - a[1])
                            .filter(([, count]) => count > 0)
                            .map(([sys, count], index) => {
                              const color = CHART_COLORS[index % CHART_COLORS.length];
                              return (
                                <ProgressBar
                                  key={sys}
                                  label={SYSTEM_NAME_MAP[sys] || sys}
                                  value={count}
                                  max={stat.pmCount || 1}
                                  color={color}
                                />
                              );
                            })
                          }
                          {Object.keys(stat.pmBreakdown).length === 0 && (
                            <div className="text-xs text-zinc-400 py-4 text-center">ไม่มีข้อมูล PM ในช่วงเวลานี้</div>
                          )}
                        </div>
                      </div>

                      {/* === BM Breakdown Card === */}
                      <div className="bg-zinc-50/80 dark:bg-zinc-800/30 rounded-xl p-4 border border-zinc-200/40 dark:border-zinc-700/40 space-y-3">
                        <h4 className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                          <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-md">
                            <Zap size={12} strokeWidth={2} className="text-rose-600 dark:text-rose-400" />
                          </div>
                          สาเหตุงานซ่อมด่วน (BM)
                        </h4>
                        <div className="space-y-2.5">
                          {Object.entries(stat.bmBreakdown || {})
                            .sort((a, b) => b[1] - a[1])
                            .filter(([, count]) => count > 0)
                            .map(([cause, count], index) => {
                              const color = CHART_COLORS[(index + 3) % CHART_COLORS.length];
                              const causeMap: Record<string, string> = {
                                'breakdown': 'เสีย',
                                'accident': 'อุบัติเหตุ',
                                'wear': 'สึกหรอ',
                                'other': 'อื่นๆ'
                              };
                              return (
                                <ProgressBar
                                  key={cause}
                                  label={causeMap[cause] || cause}
                                  value={count}
                                  max={stat.bmCount || 1}
                                  color={color}
                                />
                              );
                            })
                          }
                          {(!stat.bmBreakdown || Object.keys(stat.bmBreakdown).length === 0) && (
                            <div className="text-xs text-zinc-400 py-4 text-center">ไม่มีข้อมูล BM ในช่วงเวลานี้</div>
                          )}
                        </div>
                      </div>

                      {/* === Stock Recommendations Card === */}
                      <div className="bg-zinc-50/80 dark:bg-zinc-800/30 rounded-xl p-4 border border-zinc-200/40 dark:border-zinc-700/40 space-y-3">
                        <h4 className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
                            <Package size={12} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          อะไหล่ที่ใช้มากที่สุด
                        </h4>
                        {stat.topParts.length > 0 ? (
                          <div className="space-y-2">
                            {stat.topParts.map((part, idx) => (
                              <div key={part.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700/50 group hover:shadow-sm transition-all duration-200">
                                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                                  {idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate block">{part.details?.name}</span>
                                  <span className="text-[10px] text-zinc-400 font-mono">#{part.details?.part_number || '-'}</span>
                                </div>
                                <div className="text-right whitespace-nowrap">
                                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{part.qty}</span>
                                  <span className="text-[10px] text-zinc-500 ml-1">{part.details?.unit}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-zinc-400 py-8">
                            <Package size={24} className="mb-2 opacity-30" strokeWidth={1.5} />
                            <span className="text-xs font-medium">ไม่มีข้อมูลอะไหล่</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* === View Full History CTA === */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {stat.allLogs.length > 0 && (
                        <button
                          onClick={() => { setHistoryModalTab('parts'); setHistoryModalCourseId(stat.course.id); }}
                          className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/20"
                        >
                          <Package size={14} />
                          ประวัติเบิกอะไหล่ ({stat.allLogs.length})
                        </button>
                      )}
                      {stat.allJobs.length > 0 && (
                        <button
                          onClick={() => { setHistoryModalTab('jobs'); setHistoryModalCourseId(stat.course.id); }}
                          className="w-full py-2.5 px-4 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Wrench size={14} />
                          ประวัติงานซ่อม ({stat.allJobs.length})
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderLemonCars = () => {
    const totalLemonCars = lemonCars.length;
    const coursesWithLemons = groupedLemonCars.length;

    const renderVehicleCard = (entry: any, idx: number) => {
      const vehicleKey = entry.vehicle?.serial_number || entry.vehicle?.id || `idx-${idx}`;
      const isExpanded = expandedLemonCars.includes(vehicleKey);
      const isSevere = entry.count >= 4;

      return (
        <div key={idx} className="transition-all duration-300">
          {/* Header/Toggle Button */}
          <button
            onClick={() => {
              setExpandedLemonCars(prev =>
                prev.includes(vehicleKey)
                  ? prev.filter(k => k !== vehicleKey)
                  : [...prev, vehicleKey]
              );
            }}
            className="w-full text-left p-5 flex items-start justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform duration-300 group-hover:scale-110",
                isSevere ? "bg-gradient-to-br from-rose-500 to-red-600" : "bg-gradient-to-br from-amber-500 to-orange-600"
              )}>
                <Car size={18} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm flex items-center gap-2">
                  {entry.vehicle?.vehicle_number || 'ไม่ทราบเบอร์'}
                  {isExpanded ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
                </h4>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {entry.vehicle?.golf_course_name} · SN: {entry.vehicle?.serial_number || '-'}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={cn(
                "text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm",
                isSevere
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40"
              )}>
                ซ่อม {entry.count} ครั้ง
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">
                {isExpanded ? 'คลิกเพื่อย่อ' : 'คลิกเพื่อดูรายละเอียด'}
              </span>
            </div>
          </button>

          {/* Collapsible Details */}
          {isExpanded && (
            <div className="px-5 pb-5 ml-[52px] space-y-2 animate-in slide-in-from-top-2 duration-200">
              <div className="h-px bg-zinc-100 dark:bg-zinc-800 mb-3" />
              {entry.jobs.map((j: Job) => (
                <div key={j.id} className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 rounded-lg border border-zinc-100 dark:border-zinc-700/50 hover:border-rose-200/50 dark:hover:border-rose-900/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isSevere ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                    )} />
                    <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                      {(j.system ? (SYSTEM_NAME_MAP[j.system] || j.system) : j.remarks) || 'ไม่ได้ระบุ'}
                    </span>
                  </div>
                  <span className="font-mono text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-100 dark:border-zinc-800">
                    {j.createdAt ? format(new Date(j.createdAt), 'dd/MM/yy') : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg shrink-0">
              <AlertTriangle size={18} strokeWidth={1.5} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">🍋 Lemon Car Tracker</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">พบ {totalLemonCars} คัน</span>
                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">จาก {coursesWithLemons} สนาม</span>
              </div>
            </div>
          </div>

          {/* Grouping Toggle */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl gap-1 shrink-0">
            <button
              onClick={() => setLemonGrouping('none')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all",
                lemonGrouping === 'none'
                  ? "bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <TrendingUp size={12} />
              จัดอันดับ
            </button>
            <button
              onClick={() => setLemonGrouping('course')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all",
                lemonGrouping === 'course'
                  ? "bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <LayoutGrid size={12} />
              แยกตามสนาม
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm overflow-hidden">
          {totalLemonCars > 0 ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {lemonGrouping === 'none' ? (
                // Flat List (Ranked)
                lemonCars.map((entry, idx) => renderVehicleCard(entry, idx))
              ) : (
                // Grouped by Course
                groupedLemonCars.map(([courseName, cars], gIdx) => (
                  <div key={gIdx} className="bg-zinc-50/30 dark:bg-zinc-800/10">
                    <div className="px-5 py-3 bg-zinc-100/50 dark:bg-zinc-800/40 flex items-center justify-between border-y first:border-t-0 border-zinc-200/50 dark:border-zinc-700/50">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-tight">{courseName}</span>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400">{cars.length} คัน</span>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {cars.map((car, cIdx) => renderVehicleCard(car, cIdx))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
                <Shield size={28} strokeWidth={1.5} className="text-emerald-500" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">ไม่พบ Lemon Car</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-[220px]">คุณภาพรถอยู่ในเกณฑ์ดีเยี่ยม ไม่มีรถที่ซ่อมซ้ำในช่วงเวลาที่เลือก</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // === Section Map ===
  const sectionMap: Record<string, { render: () => React.ReactNode; title: string }> = {
    metrics: { render: renderMetrics, title: 'ตัวเลขสรุป' },
    charts: { render: renderCharts, title: 'กราฟเปรียบเทียบ' },
    courses: { render: renderCourses, title: 'รายละเอียดสนาม' },
    lemon: { render: renderLemonCars, title: 'Lemon Car Tracker' },
    health: { render: () => renderHealthSection(), title: 'PM Health Rings' },
  };

  const renderHealthSection = () => {
    const health1 = calculateHealthData(healthCourseId);
    const health2 = isHealthCompareMode && compareHealthCourseId ? calculateHealthData(compareHealthCourseId) : null;

    return (
      <div className="space-y-4">
        {/* === Header & Controls === */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30">
              <Activity size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 uppercase">PM Health Rings</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">ความสมบูรณ์ของการทำ PM รายระบบ (1 ปี)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Comparison Toggle */}
            <button
              onClick={() => setIsHealthCompareMode(!isHealthCompareMode)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-300",
                isHealthCompareMode
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50"
              )}
            >
              <LayoutGrid size={14} />
              {isHealthCompareMode ? 'โหมดเดี่ยว' : 'เปรียบเทียบ 2 สนาม'}
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl">
              <Calendar size={12} className="text-zinc-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                {health1?.period && `${format(health1.period.start, 'MMM yyyy')} - ${format(health1.period.end, 'MMM yyyy')}`}
              </span>
            </div>
          </div>
        </div>

        {/* === Grid Layout === */}
        <div className={cn(
          "grid gap-4",
          isHealthCompareMode ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        )}>
          {/* Card 1 */}
          <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-sm overflow-hidden relative group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col gap-1">
                  <select
                    value={healthCourseId}
                    onChange={(e) => setHealthCourseId(e.target.value)}
                    className="bg-transparent text-sm font-bold text-zinc-900 dark:text-zinc-50 focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="dark:bg-zinc-900">✨ ภาพรวมทุกสนาม (All Courses)</option>
                    {workingGolfCourses.map(c => (
                      <option key={c.id} value={c.id} className="dark:bg-zinc-900">{c.name}</option>
                    ))}
                  </select>
                  {health1 && (
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">
                      จำนวนรถทั้งหมด: {health1.totalVehicles} คัน
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/30">
                  <Check size={12} strokeWidth={3} />
                  Active
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                {health1 ? (
                  <>
                    <div className="relative w-64 h-64 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="30%"
                          outerRadius="100%"
                          barSize={12}
                          data={health1.data}
                          startAngle={90}
                          endAngle={450}
                        >
                          <RadialBar
                            background={{ fill: 'rgba(0,0,0,0.05)' }}
                            dataKey="value"
                            cornerRadius={30}
                            animationDuration={1500}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
                          {health1.totalHealth.toFixed(1)}%
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">PM Health</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4 w-full">
                      {health1.data.map((item, idx) => (
                        <div key={idx} className="space-y-1.5 group/item">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounding-md bg-zinc-50 dark:bg-zinc-800" style={{ color: item.fill }}>
                                <item.icon size={12} strokeWidth={2.5} />
                              </div>
                              <span className="font-semibold text-zinc-600 dark:text-zinc-400">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-zinc-400">({item.rawCount}/{health1.totalVehicles} คัน)</span>
                              <span className="font-bold text-zinc-900 dark:text-zinc-50">{((item.value / item.full) * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${(item.value / item.full) * 100}%`,
                                backgroundColor: item.fill,
                                boxShadow: `0 0 10px ${item.fill}40`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center text-zinc-400 text-xs font-medium italic">
                    ไม่มีข้อมูลสำหรับสนามนี้
                  </div>
                )}
              </div>
            </div>
            {/* Background Accent */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full" />
          </div>

          {/* Card 2 (Comparison) */}
          {isHealthCompareMode && (
            <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-sm overflow-hidden relative animate-in slide-in-from-right-4 duration-500">
              <div className="relative z-10">
                <div className="flex flex-col gap-1">
                  <select
                    value={compareHealthCourseId || ''}
                    onChange={(e) => setCompareHealthCourseId(e.target.value)}
                    className={cn(
                      "bg-transparent text-sm font-bold focus:outline-none cursor-pointer",
                      !compareHealthCourseId ? "text-zinc-400 italic" : "text-zinc-900 dark:text-zinc-50"
                    )}
                  >
                    <option value="" disabled className="dark:bg-zinc-900">เลือกสนามเพื่อเปรียบเทียบ...</option>
                    <option value="all" className="dark:bg-zinc-900" disabled={healthCourseId === 'all'}>✨ ภาพรวมทุกสนาม (All Courses)</option>
                    {workingGolfCourses.map(c => (
                      <option key={c.id} value={c.id} className="dark:bg-zinc-900" disabled={c.id === healthCourseId}>{c.name}</option>
                    ))}
                  </select>
                  {health2 && (
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">
                      จำนวนรถทั้งหมด: {health2.totalVehicles} คัน
                    </span>
                  )}
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                  {health2 ? (
                    <>
                      <div className="relative w-64 h-64 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="30%"
                            outerRadius="100%"
                            barSize={12}
                            data={health2.data}
                            startAngle={90}
                            endAngle={450}
                          >
                            <RadialBar
                              background={{ fill: 'rgba(0,0,0,0.05)' }}
                              dataKey="value"
                              cornerRadius={30}
                              animationDuration={1500}
                            />
                          </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
                            {health2.totalHealth.toFixed(1)}%
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">PM Health</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4 w-full">
                        {health2.data.map((item, idx) => (
                          <div key={idx} className="space-y-1.5 group/item">
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded-md bg-zinc-50 dark:bg-zinc-800" style={{ color: item.fill }}>
                                  <item.icon size={12} strokeWidth={2.5} />
                                </div>
                                <span className="font-semibold text-zinc-600 dark:text-zinc-400">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-zinc-400">({item.rawCount}/{health2.totalVehicles} คัน)</span>
                                <span className="font-bold text-zinc-900 dark:text-zinc-50">{((item.value / item.full) * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{
                                  width: `${(item.value / item.full) * 100}%`,
                                  backgroundColor: item.fill,
                                  boxShadow: `0 0 10px ${item.fill}40`
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-zinc-400 gap-3 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl w-full">
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                        <MousePointer2 size={24} className="opacity-50" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest opacity-50">เลือกสนามเพื่อเปรียบเทียบ</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-violet-500/5 blur-[100px] rounded-full" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* === Sticky Header === */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Left: Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('admin_dashboard')}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all duration-200 active:scale-[0.98] text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                aria-label="Back to Admin Dashboard"
              >
                <ArrowLeft size={20} strokeWidth={1.5} />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold tracking-tighter text-zinc-900 dark:text-zinc-50">
                  ภาพรวมและการวิเคราะห์
                </h1>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Analytics & Workload Overview
                </p>
              </div>
              {/* Refresh Data Button */}
              <button
                onClick={() => fetchAnalyticsData(true)}
                disabled={isRefreshing}
                className={cn(
                  "p-2 rounded-lg border transition-all duration-200 active:scale-[0.98]",
                  isRefreshing
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50 text-indigo-500 cursor-not-allowed"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                )}
                title="รีเฟรชข้อมูล"
                aria-label="Refresh analytics data"
              >
                <RefreshCw size={16} strokeWidth={1.5} className={cn(isRefreshing && "animate-spin")} />
              </button>
            </div>

            {/* Right: Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Toggle Inactive Courses */}
              <button
                onClick={() => setShowInactiveCourses(prev => !prev)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border",
                  showInactiveCourses
                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"
                    : "bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
                title={showInactiveCourses ? "ซ่อนสนามที่หมดสัญญา" : "แสดงสนามที่หมดสัญญาด้วย"}
              >
                {showInactiveCourses ? <Eye size={14} strokeWidth={1.5} /> : <EyeOff size={14} strokeWidth={1.5} />}
                <span className="hidden sm:inline">หมดสัญญา</span>
              </button>

              {/* Date Range Tabs */}
              <div className="flex bg-zinc-100 dark:bg-zinc-800/60 rounded-lg p-0.5">
                {(['month', 'year', 'custom', 'all'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                      dateRange === range
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    )}
                  >
                    {range === 'custom' && <Calendar size={12} strokeWidth={1.5} />}
                    {range === 'month' ? 'เดือน' : range === 'year' ? 'ปี' : range === 'custom' ? 'กำหนดเอง' : 'ทั้งหมด'}
                  </button>
                ))}
              </div>

              {/* Date Navigator (month/year) */}
              {(dateRange === 'month' || dateRange === 'year') && (
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/60 rounded-lg p-0.5">
                  <button
                    onClick={() => setSelectedDate(subMonths(selectedDate, dateRange === 'year' ? 12 : 1))}
                    className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-all duration-200 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                    aria-label="Previous period"
                  >
                    <ChevronLeft size={16} strokeWidth={1.5} />
                  </button>
                  <div className="px-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 min-w-[80px] text-center whitespace-nowrap select-none">
                    {dateRange === 'month'
                      ? format(selectedDate, 'MMM yyyy')
                      : format(selectedDate, 'yyyy')
                    }
                  </div>
                  <button
                    onClick={() => setSelectedDate(addMonths(selectedDate, dateRange === 'year' ? 12 : 1))}
                    className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-all duration-200 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                    aria-label="Next period"
                  >
                    <ChevronRight size={16} strokeWidth={1.5} />
                  </button>
                </div>
              )}

              {/* Custom Date Range Picker */}
              {dateRange === 'custom' && (
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 shadow-sm animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} strokeWidth={1.5} className="text-indigo-500 shrink-0" />
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      max={customEndDate}
                      className="bg-transparent text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-0 border-none p-0 w-[110px] cursor-pointer"
                    />
                  </div>
                  <ArrowRight size={12} strokeWidth={2} className="text-zinc-300 dark:text-zinc-600 shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      min={customStartDate}
                      className="bg-transparent text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-0 border-none p-0 w-[110px] cursor-pointer"
                    />
                  </div>
                  {/* Active filter indicator */}
                  <span className="shrink-0 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800/40">
                    {(() => {
                      const start = new Date(customStartDate);
                      const end = new Date(customEndDate);
                      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                      return diffDays >= 0 ? `${diffDays + 1} วัน` : 'ไม่ถูกต้อง';
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === Main Content === */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Drag hint */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          <GripVertical size={14} strokeWidth={1.5} />
          <span>ลากเพื่อจัดเรียงลำดับหัวข้อ (Drag to reorder sections)</span>
        </div>

        {/* Render sections in drag order */}
        {cardOrder.map(cardId => {
          const section = sectionMap[cardId];
          if (!section) return null;

          return (
            <div
              key={cardId}
              draggable
              onDragStart={() => handleDragStart(cardId)}
              onDragOver={(e) => handleDragOver(e, cardId)}
              onDrop={() => handleDrop(cardId)}
              onDragEnd={handleDragEnd}
              className={cn(
                "relative transition-all duration-300",
                draggedCard === cardId && "opacity-50 scale-[0.98]",
                dragOverCard === cardId && "ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950 rounded-2xl"
              )}
            >
              {/* Drag Handle */}
              <div className="absolute -left-1 top-4 z-10 cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                style={{ opacity: draggedCard ? 1 : undefined }}
              >
                <GripVertical size={16} strokeWidth={1.5} className="text-zinc-400 dark:text-zinc-500" />
              </div>

              {section.render()}
            </div>
          );
        })}
      </div>
      {/* === Parts Usage History Modal === */}
      {historyModalStat && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setHistoryModalCourseId(null); }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="relative px-6 pt-6 pb-5 shrink-0">
              <button
                onClick={() => setHistoryModalCourseId(null)}
                className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-all duration-200"
                aria-label="Close modal"
              >
                <X size={16} strokeWidth={2} />
              </button>
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-xl shadow-sm", historyModalTab === 'parts' ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/20" : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20")}>
                  {historyModalTab === 'parts' ? <Package size={20} strokeWidth={1.5} className="text-white" /> : <Wrench size={20} strokeWidth={1.5} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {historyModalTab === 'parts' ? 'ประวัติการเบิกอะไหล่' : 'รายละเอียดงานซ่อม'}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {historyModalStat.course.name}
                  </p>
                </div>
              </div>

              {/* Tabs Toggle */}
              <div className="flex bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl mt-4 w-fit">
                <button
                  onClick={() => setHistoryModalTab('parts')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all",
                    historyModalTab === 'parts'
                      ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  <Package size={14} /> อะไหล่
                </button>
                <button
                  onClick={() => setHistoryModalTab('jobs')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all",
                    historyModalTab === 'jobs'
                      ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  <Wrench size={14} /> งานซ่อม
                </button>
              </div>

              {/* Summary chips */}
              {historyModalTab === 'parts' && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {(() => {
                    const totalQty = historyModalStat.allLogs.reduce((s, l) => s + l.quantityUsed, 0);
                    const uniqueParts = new Set(historyModalStat.allLogs.map(l => l.partId)).size;
                    const uniqueVehicles = new Set(historyModalStat.allLogs.map(l => l.vehicleNumber).filter(Boolean)).size;
                    return (
                      <>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40">
                          <Hash size={11} /> {historyModalStat.allLogs.length} รายการ
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40">
                          <Package size={11} /> {uniqueParts} ชนิดอะไหล่
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/40">
                          <Car size={11} /> {uniqueVehicles} คัน
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-800/40">
                          รวม {totalQty} ชิ้น
                        </span>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-100 dark:border-zinc-800" />

            {/* Body */}
            <div className="p-4 overflow-y-auto flex-1 bg-zinc-50/50 dark:bg-zinc-950/30">
              {historyModalTab === 'parts' ? (
                <div className="space-y-2">
                  {historyModalStat.allLogs.map((log, logIdx) => {
                    const partName = log.partName || parts.find(p => p.id === log.partId)?.name || 'ไม่ทราบชื่ออะไหล่';
                    const jobColor = log.jobType === 'PM'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50'
                      : log.jobType === 'BM'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/50'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50';
                    return (
                      <div key={log.id || logIdx} className="flex items-center gap-3 p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-[0_1px_2px_rgb(0,0,0,0.02)] hover:shadow-sm transition-all duration-200 group">
                        {/* Left: part info */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                              {partName}
                            </h3>
                            <span className={cn("shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border", jobColor)}>
                              {log.jobType}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span className="inline-flex items-center gap-1">
                              <Car size={11} className="text-zinc-400" />
                              เบอร์ {log.vehicleNumber || '-'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays size={11} className="text-zinc-400" />
                              {log.usedDate
                                ? format(new Date(log.usedDate), 'dd/MM/yy HH:mm')
                                : 'ไม่ระบุวันที่'}
                            </span>
                            {log.usedBy && (
                              <span className="text-zinc-400">
                                โดย {log.usedBy}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Right: qty */}
                        <div className="shrink-0 flex flex-col items-end">
                          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 leading-none">{log.quantityUsed}</span>
                          <span className="text-[10px] font-medium text-zinc-400 mt-0.5">ชิ้น</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {historyModalStat.allJobs.map((job) => {
                    const jobColor = job.type === 'PM'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50'
                      : job.type === 'BM'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/50'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50';
                    const isBM = job.type === 'BM';
                    const causeMap: Record<string, string> = { 'breakdown': 'เสีย', 'accident': 'อุบัติเหตุ', 'wear': 'สึกหรอ', 'other': 'อื่นๆ' };
                    const bmCauseText = job.bmCause ? causeMap[job.bmCause] || job.bmCause : '';
                    
                    return (
                      <div key={job.id} className="flex items-start gap-3 p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-[0_1px_2px_rgb(0,0,0,0.02)] transition-all duration-200">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={cn("shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border", jobColor)}>
                              {job.type}
                            </span>
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate flex items-center gap-1.5">
                              {isBM && bmCauseText && <span className="text-rose-600 dark:text-rose-400">[{bmCauseText}]</span>}
                              {job.system ? (SYSTEM_NAME_MAP[job.system] || job.system) : 'งานทั่วไป'}
                            </h3>
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-300">
                            {job.remarks || 'ไม่มีรายละเอียด'}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span className="inline-flex items-center gap-1">
                              <Car size={11} className="text-zinc-400" />
                              เบอร์ {job.vehicle_number || '-'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays size={11} className="text-zinc-400" />
                              {(job.createdAt || (job as any).created_at)
                                ? format(new Date(job.createdAt || (job as any).created_at), 'dd/MM/yy')
                                : '-'}
                            </span>
                            {job.userName && (
                              <span className="text-zinc-400">โดย {job.userName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// === Empty State for Charts ===
const EmptyChartState = () => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
      <BarChart3 size={24} strokeWidth={1.5} className="text-zinc-400" />
    </div>
    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
    <p className="text-xs text-zinc-400 mt-1">ลองเปลี่ยนช่วงเวลาหรือเลือก &quot;ทั้งหมด&quot;</p>
  </div>
);

export default AnalyticsDashboardScreen;
