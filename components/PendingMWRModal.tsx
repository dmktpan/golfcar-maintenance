import React, { useState } from 'react';
import { Job, User } from '@/lib/data';
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface PendingMWRModalProps {
  jobs: Job[];
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PendingMWRModal({ jobs, user, onClose, onSuccess }: PendingMWRModalProps) {
  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  
  // Filter jobs that are strictly stock_pending
  const pendingJobs = jobs.filter(j => j.type === 'PART_REQUEST' && j.status === 'stock_pending');

  const handleDownloadTemplate = async (mwrCode: string | undefined | null) => {
    if (!mwrCode) return;
    try {
      window.open(`/api/stock/export-template?mwr_code=${mwrCode}`, '_blank');
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถดาวน์โหลด Template ได้');
    }
  };

  const handleUploadConfirmation = async (mwrCode: string | undefined | null, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!mwrCode || !event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user?.id?.toString() || '');

    if (!confirm(`คุณต้องการยืนยันการตั้งเบิกและอัพเดทคลังสำหรับเอกสาร ${mwrCode} ใช่หรือไม่?`)) {
        event.target.value = ''; // clear
        return;
    }

    setLoadingCode(mwrCode);
    try {
      const resp = await fetch('/api/jobs/stock-confirm', {
        method: 'POST',
        body: formData
      });
      const data = await resp.json();

      if (data.success) {
        alert('✔️ ตัดบัญชีคลังสินค้าสำเร็จ!');
        onSuccess();
      } else {
        alert(`❌ ผิดพลาด: ${data.message}`);
      }
    } catch (e: any) {
      alert(`❌ ผิดพลาด: ${e.message}`);
    } finally {
      setLoadingCode(null);
      event.target.value = '';
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 9999, padding: '2rem', overflowY: 'auto' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '900px', boxShadow: '0 25px 80px rgba(0,0,0,0.2)', overflow: 'hidden', margin: 'auto' }} onClick={e => e.stopPropagation()}>
        
        <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', padding: '1.5rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>รอตัดบัญชีสต๊อก (MWR Pending)</h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0', fontSize: '0.875rem' }}>รายการเบิกอะไหล่ที่หัวหน้างานอนุมัติแล้ว รอฝั่งสต๊อกยืนยัน</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '12px', padding: '10px', cursor: 'pointer', color: '#fff' }}>
            <XMarkIcon style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        <div style={{ padding: '2rem 2.5rem' }}>
          {pendingJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
              <CheckCircleIcon style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.4 }} />
              <p style={{ fontSize: '1.125rem' }}>ไม่มีรายการเบิกค้างอนุมัติในเวลานี้</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {pendingJobs.map(job => (
                <div key={job.id} style={{ border: '1px solid #e5e7eb', borderRadius: '16px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.125rem', color: '#1f2937' }}>{job.mwr_code || 'N/A'}</h3>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      ผู้ร้องขอ: {job.userName} • สนาม: {job.golf_course_name}
                    </p>
                    <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                      <strong>รายการอะไหล่:</strong>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        {job.parts?.map((p: any) => (
                           <li key={p.id}>{p.part_name} (จำนวน: {p.quantity_used})</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                    <button
                      onClick={() => handleDownloadTemplate(job.mwr_code)}
                      disabled={loadingCode === job.mwr_code}
                      style={{
                        padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem'
                      }}>
                      <DocumentArrowDownIcon style={{ width: '16px', height: '16px' }} />
                      โหลด Template ไปกรอก Bplus
                    </button>

                    <label style={{
                        padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', textAlign: 'center', opacity: loadingCode === job.mwr_code ? 0.5 : 1
                      }}>
                      {loadingCode === job.mwr_code ? '⏳ กำลังประมวลผล...' : (
                        <>
                          <DocumentArrowUpIcon style={{ width: '16px', height: '16px' }} />
                          อัพโหลดเพื่อยืนยันเบิกออก
                        </>
                      )}
                      <input 
                        type="file" 
                        accept=".xlsx, .xls"
                        disabled={loadingCode === job.mwr_code}
                        style={{ display: 'none' }}
                        onChange={(e) => handleUploadConfirmation(job.mwr_code, e)}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
