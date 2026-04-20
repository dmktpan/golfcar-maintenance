'use client';

import React, { useState, useMemo } from 'react';
import { Job, Part, GolfCourse } from '@/lib/data';
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface MWRTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
  parts: Part[];
  golfCourses: GolfCourse[];
}

export default function MWRTrackingModal({ isOpen, onClose, jobs, parts, golfCourses }: MWRTrackingModalProps) {
  const [expandedMwrId, setExpandedMwrId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // 1. Filter completed PART_REQUEST jobs
  const mwrJobs = useMemo(() => {
    return jobs.filter(j => j.type === 'PART_REQUEST' && j.status === 'completed' && j.bplus_code);
  }, [jobs]);

  // 2. Identify all PM/BM jobs that consumed these MWRs
  const consumingJobs = useMemo(() => {
    return jobs.filter(j => 
        (j.type === 'PM' || j.type === 'BM' || j.type === 'Recondition') &&
        j.partsNotes && j.partsNotes.includes('[ใช้จากใบเบิก:')
    );
  }, [jobs]);

  // 3. Compute stats for each MWR
  const mwrStats = useMemo(() => {
    return mwrJobs.map(mwr => {
      const bplusCode = mwr.bplus_code!;
      const requestedParts = mwr.parts || [];
      const totalRequested = requestedParts.reduce((sum, p) => sum + p.quantity_used, 0);

      // Find jobs that consumed this MWR
      const consumedBy = consumingJobs.filter(cj => cj.partsNotes?.includes(bplusCode));
      
      // Calculate consumed quantities per part
      const consumedQuantitiesMap = new Map<string, number>();
      consumedBy.forEach(job => {
        job.parts?.forEach(jp => {
            const current = consumedQuantitiesMap.get(jp.part_id) || 0;
            consumedQuantitiesMap.set(jp.part_id, current + jp.quantity_used);
        });
      });

      let totalConsumed = 0;
      const partDetails = requestedParts.map(rp => {
        // Find part name
        const dbPart = parts.find(p => p.id.toString() === rp.part_id.toString());
        const consumed = consumedQuantitiesMap.get(rp.part_id) || 0;
        // Cap consumed at requested? Optional, but realistically mechanics shouldn't over-consume
        const actualConsumed = Math.min(consumed, rp.quantity_used);
        totalConsumed += actualConsumed;

        return {
          partId: rp.part_id,
          partName: rp.part_name || dbPart?.name || 'Unknown',
          requested: rp.quantity_used,
          consumed: actualConsumed
        };
      });

      const golfCourse = golfCourses.find(gc => gc.id === mwr.golf_course_id);

      return {
        ...mwr,
        golfCourseName: golfCourse?.name || 'ไม่ระบุสนาม',
        totalRequested,
        totalConsumed,
        partDetails,
        consumedByJobs: consumedBy // for tracking dates
      };
    });
  }, [mwrJobs, consumingJobs, parts, golfCourses]);

  const handleSaveNote = async (jobId: string) => {
    try {
      setIsSavingNote(true);
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteValue })
      });
      if (res.ok) {
        // Technically we should update the local job list state.
        // The parent StockManagementScreen should re-fetch, but typically
        // mutating the passed prop is anti-pattern in React without a callback.
        // We'll update the prop directly for immediate UI feedback.
        const job = jobs.find(j => j.id === jobId);
        if (job) job.notes = noteValue;
        setEditingNoteId(null);
      } else {
        alert('บันทึกหมายเหตุไม่สำเร็จ');
      }
    } catch(err) {
      alert('Error saving note');
    } finally {
      setIsSavingNote(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-200">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            📊 สถานะใช้งานใบเบิก (MWR Tracking)
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors group">
            <XMarkIcon className="w-6 h-6 text-zinc-500 group-hover:text-zinc-800" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-zinc-50">
          {mwrStats.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              ไม่มีข้อมูลใบเบิกที่เสร็จสมบูรณ์
            </div>
          ) : (
            <div className="space-y-4">
              {mwrStats.map((stat) => (
                <div key={stat.id} className="bg-white rounded-xl border border-zinc-200/50 shadow-sm overflow-hidden">
                  {/* Summary Row */}
                  <div 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-zinc-50/80 transition-colors"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 w-full gap-4 items-center" onClick={() => setExpandedMwrId(expandedMwrId === stat.id ? null : stat.id)}>
                      <div>
                        <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">เลขใบเบิก</div>
                        <div className="font-semibold text-indigo-700">{stat.bplus_code || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">ชื่อสนาม</div>
                        <div className="font-medium text-zinc-900">{stat.golfCourseName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">วันที่อนุมัติ/โอน</div>
                        <div className="text-zinc-700 text-sm">{stat.approved_at ? new Date(stat.approved_at).toLocaleDateString('th-TH') : '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">สถานะใช้งาน</div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${stat.totalConsumed >= stat.totalRequested ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                    style={{ width: `${stat.totalRequested > 0 ? (stat.totalConsumed / stat.totalRequested) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <span className="text-sm font-semibold text-zinc-900 whitespace-nowrap">
                                {stat.totalConsumed} / {stat.totalRequested}
                            </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 sm:ml-4 flex items-center justify-between">
                        <button className="p-2 text-zinc-400 hover:text-zinc-700" onClick={() => setExpandedMwrId(expandedMwrId === stat.id ? null : stat.id)}>
                            {expandedMwrId === stat.id ? <ChevronUpIcon className="w-5 h-5"/> : <ChevronDownIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                  </div>

                  {/* Stock Note Section (Always visible slightly or inside expanded? Let's put it at the bottom of the summary row) */}
                  <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex-1 flex items-center gap-2">
                            <span className="text-xs font-medium text-amber-700 uppercase">Note (สต๊อก):</span>
                            {editingNoteId === stat.id ? (
                                <input 
                                    type="text" 
                                    className="flex-1 text-sm border border-amber-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={noteValue}
                                    onChange={e => setNoteValue(e.target.value)}
                                    placeholder="เพิ่มโน้ตช่วยจำ เช่น ตัดจ่าย 12/10/67"
                                    autoFocus
                                />
                            ) : (
                                <span className="text-sm text-zinc-700 flex-1 truncate cursor-pointer hover:underline decoration-dashed decoration-zinc-300" onClick={() => { setEditingNoteId(stat.id); setNoteValue(stat.notes || ''); }}>
                                    {stat.notes || 'คลิกเพื่อเพิ่ม Note...'}
                                </span>
                            )}
                        </div>
                        {editingNoteId === stat.id && (
                            <div className="flex gap-2">
                                <button onClick={() => setEditingNoteId(null)} className="text-xs text-zinc-500 hover:text-zinc-700">ยกเลิก</button>
                                <button onClick={() => handleSaveNote(stat.id)} disabled={isSavingNote} className="text-xs bg-amber-500 text-white px-3 py-1 rounded shadow-sm hover:bg-amber-600">บันทึก</button>
                            </div>
                        )}
                  </div>

                  {/* Expanded Detail */}
                  {expandedMwrId === stat.id && (
                    <div className="p-4 bg-white border-t border-zinc-100">
                      <h4 className="text-sm font-semibold text-zinc-900 mb-3 border-b border-zinc-100 pb-2">รายละเอียดรายการอะไหล่ในใบเบิก</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Parts List */}
                        <div>
                            <div className="overflow-hidden rounded-lg border border-zinc-200">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-zinc-50 text-zinc-600 font-medium">
                                <tr>
                                    <th className="px-4 py-2 border-b border-zinc-200">รายการอะไหล่</th>
                                    <th className="px-4 py-2 border-b border-zinc-200 text-right">เบิกมา</th>
                                    <th className="px-4 py-2 border-b border-zinc-200 text-right">ใช้ไป</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                {stat.partDetails.map((pd, index) => (
                                    <tr key={index} className="hover:bg-zinc-50">
                                        <td className="px-4 py-2 font-medium text-zinc-900">{pd.partName}</td>
                                        <td className="px-4 py-2 text-right text-zinc-600">{pd.requested}</td>
                                        <td className="px-4 py-2 text-right">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${pd.consumed >= pd.requested ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {pd.consumed}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            </div>
                        </div>

                        {/* Used Logs */}
                        <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                            <h5 className="text-sm font-semibold text-zinc-700 mb-2 whitespace-nowrap">ประวัติถูกนำไปใช้ในงาน:</h5>
                            {stat.consumedByJobs.length === 0 ? (
                                <p className="text-xs text-zinc-500 italic">ยังไม่มีประวัติการใช้งาน</p>
                            ) : (
                                <ul className="space-y-2">
                                    {stat.consumedByJobs.map(job => (
                                        <li key={job.id} className="text-xs text-zinc-600 flex justify-between items-start">
                                            <span>
                                                <strong className="text-zinc-800">{new Date(job.createdAt || job.created_at).toLocaleDateString('th-TH')}</strong> - รถคันที่ <span className="font-semibold">{job.vehicle_number}</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
