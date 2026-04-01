import React, { useState, useEffect, useMemo } from 'react';
import { Agreement, GolfCourse } from '@/lib/data';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  AlertCircle,
  FileText,
  Calendar,
  Building2,
  Car,
  History
} from 'lucide-react';

interface Props {
  golfCourses: GolfCourse[];
}

export default function AgreementManagementScreen({ golfCourses }: Props) {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    agreement_number: '',
    golf_course_id: '',
    startDate: '',
    endDate: ''
  });

  // History State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const groupedLogs = useMemo(() => {
    if (!historyLogs) return [];
    
    const groups: Record<string, any> = {};

    historyLogs.forEach(log => {
      let oldAgreement = '-';
      let newAgreement = '-';
      let extraDetail = '';

      const match = log.details.match(/จาก:\s*(.+?)\s*เป็น:\s*(.+?)(?:\s*\((.+)\))?$/);
      if (match) {
        oldAgreement = match[1];
        newAgreement = match[2];
        if (match[3]) extraDetail = match[3];
      } else {
        extraDetail = log.details;
      }

      // Group by exact time and user to consolidate bulk actions
      const timeKey = new Date(log.action_date).getTime();
      const groupKey = `${timeKey}_${log.performed_by?.id || 'sys'}_${oldAgreement}_${newAgreement}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          action_date: log.action_date,
          performed_by: log.performed_by,
          oldAgreement,
          newAgreement,
          extraDetail,
          vehicles: []
        };
      }
      groups[groupKey].vehicles.push({
        vehicle_number: log.vehicle_number,
        serial_number: log.serial_number
      });
    });

    return Object.values(groups).sort((a, b) => new Date(b.action_date).getTime() - new Date(a.action_date).getTime());
  }, [historyLogs]);

  const fetchAgreements = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/agreements');
      if (res.ok) {
        const data = await res.json();
        setAgreements(data);
      }
    } catch (error) {
      console.error('Failed to fetch agreements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchHistoryLogs = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch('/api/agreements/history');
      if (res.ok) {
        const data = await res.json();
        setHistoryLogs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const openHistoryModal = () => {
    setIsHistoryModalOpen(true);
    fetchHistoryLogs();
  };

  // Compute status
  const getStatus = (endDateString: string) => {
    const end = new Date(endDateString);
    const today = new Date();
    
    // Set time to end of day for accurate comparison
    end.setHours(23, 59, 59, 999);
    today.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'หมดสัญญา', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50', type: 'expired' };
    if (diffDays <= 30) return { label: 'กำลังจะหมดสัญญา', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50', type: 'expiring', daysLeft: diffDays };
    return { label: 'อยู่ในสัญญา', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50', type: 'active' };
  };

  const filteredAgreements = useMemo(() => {
    return agreements.filter(a => {
      const matchNumber = a.agreement_number.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCourse = a.golfCourse?.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchNumber || matchCourse;
    });
  }, [agreements, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/agreements/${editingId}` : '/api/agreements';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        fetchAgreements();
        setFormData({ agreement_number: '', golf_course_id: '', startDate: '', endDate: '' });
        setEditingId(null);
      } else {
        alert(data.error || data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('คุณต้องการลบสัญญานี้ใช่หรือไม่?')) return;
    
    try {
      const res = await fetch(`/api/agreements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAgreements();
      } else {
        const data = await res.json();
        alert(data.error || 'ไม่สามารถลบสัญญาได้');
      }
    } catch (error) {
      console.error('Delete error', error);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const openForm = (agreement?: Agreement) => {
    if (agreement) {
      setEditingId(agreement.id);
      setFormData({
        agreement_number: agreement.agreement_number,
        golf_course_id: agreement.golf_course_id,
        startDate: new Date(agreement.startDate).toISOString().split('T')[0],
        endDate: new Date(agreement.endDate).toISOString().split('T')[0],
      });
    } else {
      setEditingId(null);
      setFormData({ agreement_number: '', golf_course_id: '', startDate: '', endDate: '' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 sm:p-8 lg:p-12 space-y-6 sm:space-y-8 bg-slate-50/50 min-h-screen font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-800 flex items-center gap-3">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
            ระบบจัดการสัญญาเช่า
          </h1>
          <p className="text-slate-500 mt-2">
            จัดการและติดตามสัญญาเช่ารถของแต่ละสนาม พร้อมระบบแจ้งเตือนสัญญาใกล้หมดอายุ
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => openHistoryModal()}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] flex items-center gap-2 flex-1 sm:flex-none justify-center shadow-sm"
          >
            <History size={16} strokeWidth={2} className="text-slate-500" />
            ดูประวัติ
          </button>
          <button
            onClick={() => openForm()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] flex items-center gap-2 flex-1 sm:flex-none justify-center shadow-sm"
          >
            <Plus size={16} strokeWidth={2} />
            เพิ่มสัญญาใหม่
          </button>
        </div>
      </div>

      {/* Warning Cards for Expiring Agreements */}
      {agreements.filter(a => getStatus(a.endDate).type === 'expiring').length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/50 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">แจ้งเตือนสัญญาใกล้หมดอายุ</h3>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              พบ {agreements.filter(a => getStatus(a.endDate).type === 'expiring').length} สัญญาที่กำลังจะหมดอายุในอีก 30 วัน
            </p>
          </div>
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} strokeWidth={1.5} />
            <input
              type="text"
              placeholder="ค้นหาเลขที่สัญญา หรือ ชื่อสนาม..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 placeholder:text-slate-400 text-slate-700"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-sm">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-medium">เลขที่สัญญา</th>
                    <th className="px-6 py-3.5 text-left font-medium">สนาม (รหัส)</th>
                    <th className="px-6 py-3.5 text-left font-medium">จำนวนรถ</th>
                    <th className="px-6 py-3.5 text-left font-medium border-l border-r border-slate-200">วันที่เริ่ม - สิ้นสุด</th>
                    <th className="px-6 py-3.5 text-center font-medium">สถานะ</th>
                    <th className="px-6 py-3.5 text-right font-medium">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : filteredAgreements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        ไม่พบข้อมูลสัญญาเช่า
                      </td>
                    </tr>
              ) : (
                filteredAgreements.map((agreement) => {
                  const status = getStatus(agreement.endDate);
                  const sDate = new Date(agreement.startDate).toLocaleDateString();
                  const eDate = new Date(agreement.endDate).toLocaleDateString();
                  
                  return (
                    <tr key={agreement.id} className="hover:bg-slate-50/80 transition-colors duration-200 group">
                      <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                        <FileText size={16} strokeWidth={1.5} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        {agreement.agreement_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} strokeWidth={1.5} className="text-slate-400" />
                          <span className="text-slate-700">{agreement.golfCourse?.name || '-'}</span>
                          {agreement.golfCourse?.code && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                              {agreement.golfCourse.code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Car size={16} strokeWidth={1.5} />
                          <span className="font-medium text-slate-800">{agreement._count?.vehicles || 0}</span> คัน
                        </div>
                      </td>
                      <td className="px-6 py-4 border-l border-slate-100 border-r">
                         <div className="flex flex-col gap-1.5">
                           <div className="flex items-center gap-2 text-xs text-slate-500">
                             <Calendar size={14} strokeWidth={1.5} className="text-slate-400" />
                             <span className="w-8">เริ่ม:</span>
                             <span className="font-medium text-slate-700">{sDate}</span>
                           </div>
                           <div className="flex items-center gap-2 text-xs text-slate-500">
                             <Calendar size={14} strokeWidth={1.5} className="text-slate-400" />
                             <span className="w-8">จบ:</span>
                             <span className="font-medium text-slate-700">{eDate}</span>
                           </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex min-w-[120px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium border ${status.color}`}>
                          {status.label} {status.daysLeft ? `(อีก ${status.daysLeft} วัน)` : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => openForm(agreement)}
                            className="p-2 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 active:scale-95"
                            title="แก้ไข"
                          >
                            <Edit2 size={16} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => handleDelete(agreement.id)}
                            className="p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 active:scale-95"
                            title="ลบ"
                          >
                            <Trash2 size={16} strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-lg overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 transform transition-all">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h2 className="text-xl font-semibold tracking-tighter text-zinc-900 dark:text-zinc-50">
                {editingId ? 'แก้ไขสัญญาเช่า' : 'เพิ่มสัญญาเช่าใหม่'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">สนามกอล์ฟ <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.golf_course_id}
                  onChange={e => setFormData(prev => ({ ...prev, golf_course_id: e.target.value }))}
                  className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 transition-all duration-200"
                >
                  <option value="">-- เลือกสนามกอล์ฟ --</option>
                  {golfCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} {course.code ? `(${course.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">เลขที่สัญญา <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  placeholder="Ex. RENT-2024-001"
                  value={formData.agreement_number}
                  onChange={e => setFormData(prev => ({ ...prev, agreement_number: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 placeholder:text-slate-300 text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">วันที่เริ่มต้น <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 text-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">วันที่สิ้นสุด <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 text-slate-700"
                  />
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/80 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm"
                >
                  {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มสัญญา'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full max-w-4xl overflow-hidden border border-slate-200 transform transition-all max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <h2 className="text-xl font-semibold tracking-tight text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                ประวัติการเปลี่ยนสัญญา
              </h2>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 p-2 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-0 flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-sm sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">วันเวลา</th>
                    <th className="px-6 py-3.5 font-medium">ผู้ดำเนินการ</th>
                    <th className="px-6 py-3.5 font-medium">เลขสัญญาเก่า</th>
                    <th className="px-6 py-3.5 font-medium">เลขสัญญาใหม่</th>
                    <th className="px-6 py-3.5 font-medium">รถกอล์ฟที่เปลี่ยน</th>
                    <th className="px-6 py-3.5 font-medium">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isLoadingHistory ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        กำลังโหลดข้อมูลประวัติ...
                      </td>
                    </tr>
                  ) : groupedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        ไม่พบข้อมูลประวัติการเปลี่ยนสัญญา
                      </td>
                    </tr>
                  ) : (
                    groupedLogs.map((log: any) => (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-slate-600 align-top">
                            {new Date(log.action_date).toLocaleString('th-TH')}
                          </td>
                          <td className="px-6 py-4 text-slate-800 font-medium align-top">
                            {log.performed_by?.name || log.performed_by?.username || '-'}
                          </td>
                          <td className="px-6 py-4 text-slate-600 align-top">
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">{log.oldAgreement}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-800 font-medium align-top">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 font-semibold">{log.newAgreement}</span>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <button
                              onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1.5 transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md border border-indigo-200 shadow-sm active:scale-95"
                            >
                              <Car size={15} />
                              {log.vehicles.length} คัน
                            </button>
                          </td>
                          <td className="px-6 py-4 text-slate-500 whitespace-normal min-w-[200px] align-top text-xs">
                            {log.extraDetail}
                          </td>
                        </tr>
                        {expandedLogId === log.id && (
                          <tr className="bg-slate-50/30">
                            <td colSpan={6} className="p-0 border-b border-indigo-100/50">
                              <div className="bg-slate-50 p-4 border-t border-slate-200">
                                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                  <Car size={16} className="text-indigo-500" /> รายชื่อรถที่เปลี่ยนสัญญา ({log.vehicles.length} คัน)
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                  {log.vehicles.map((v: any, idx: number) => (
                                    <div key={idx} className="bg-white border text-center border-slate-200 rounded-lg p-2 flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                      <span className="font-bold text-slate-800 text-sm">{v.vehicle_number}</span>
                                      <span className="text-slate-500" style={{ fontSize: '11px', fontFamily: 'monospace' }}>SN: {v.serial_number}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
