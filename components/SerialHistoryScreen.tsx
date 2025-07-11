'use client';

import React, { useState } from 'react';
import { Job, Vehicle, MOCK_JOBS } from '@/lib/data';
import { View } from '@/app/page';
import StatusBadge from './StatusBadge';

// สร้างข้อมูลจำลองสำหรับประวัติซีเรียล
interface SerialHistoryEntry {
  id: number;
  serial_number: string;
  vehicle_number: string;
  action_type: 'registration' | 'transfer' | 'maintenance' | 'decommission';
  action_date: string;
  details: string;
  performed_by: string;
  golf_course_id: number;
  golf_course_name: string;
  is_active: boolean;
  related_job_id?: number;
}

// ข้อมูลจำลองสำหรับประวัติซีเรียล
const MOCK_SERIAL_HISTORY: SerialHistoryEntry[] = [
  {
    id: 1,
    serial_number: 'KT-20220601',
    vehicle_number: 'A01',
    action_type: 'registration',
    action_date: new Date(2022, 5, 1).toISOString(),
    details: 'ลงทะเบียนรถใหม่เข้าระบบ',
    performed_by: 'administrator',
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true,
    related_job_id: undefined
  },
  {
    id: 2,
    serial_number: 'KT-20220601',
    vehicle_number: 'A01',
    action_type: 'maintenance',
    action_date: new Date(Date.now() - 86400000).toISOString(),
    details: 'ซ่อมบำรุงระบบแบตเตอรี่ เปลี่ยนแบตเตอรี่ใหม่ 1 ลูก',
    performed_by: 'tape1408',
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true,
    related_job_id: 1
  },
  {
    id: 3,
    serial_number: 'GC-SN-002',
    vehicle_number: 'A02',
    action_type: 'registration',
    action_date: new Date(2022, 3, 15).toISOString(),
    details: 'ลงทะเบียนรถใหม่เข้าระบบ',
    performed_by: 'administrator',
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true,
    related_job_id: undefined
  },
  {
    id: 4,
    serial_number: 'GC-SN-002',
    vehicle_number: 'A02',
    action_type: 'maintenance',
    action_date: new Date(Date.now() - 172800000).toISOString(),
    details: 'ตรวจเช็คระยะ 500 ชั่วโมง',
    performed_by: 'tape1408',
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true,
    related_job_id: 2
  },
  {
    id: 5,
    serial_number: 'GC-SN-003',
    vehicle_number: 'B05',
    action_type: 'registration',
    action_date: new Date(2022, 2, 10).toISOString(),
    details: 'ลงทะเบียนรถใหม่เข้าระบบ',
    performed_by: 'administrator',
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true,
    related_job_id: undefined
  },
  {
    id: 6,
    serial_number: 'GC-SN-004',
    vehicle_number: 'C03',
    action_type: 'registration',
    action_date: new Date(2021, 11, 5).toISOString(),
    details: 'ลงทะเบียนรถใหม่เข้าระบบ',
    performed_by: 'administrator',
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: false,
    related_job_id: undefined
  },
  {
    id: 7,
    serial_number: 'GC-SN-004',
    vehicle_number: 'C03',
    action_type: 'decommission',
    action_date: new Date(2023, 6, 15).toISOString(),
    details: 'ปลดระวางรถออกจากระบบเนื่องจากสภาพทรุดโทรม',
    performed_by: 'สมศรี หัวหน้า',
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: false,
    related_job_id: undefined
  },
  {
    id: 8,
    serial_number: 'GC-SN-005',
    vehicle_number: 'D07',
    action_type: 'registration',
    action_date: new Date(2022, 1, 20).toISOString(),
    details: 'ลงทะเบียนรถใหม่เข้าระบบ',
    performed_by: 'administrator',
    golf_course_id: 2,
    golf_course_name: 'กรีนวัลเลย์',
    is_active: true,
    related_job_id: undefined
  },
  {
    id: 9,
    serial_number: 'GC-SN-005',
    vehicle_number: 'D07',
    action_type: 'transfer',
    action_date: new Date(2023, 3, 10).toISOString(),
    details: 'โอนย้ายรถจากสนาม กรีนวัลเลย์ ไปยัง วอเตอร์แลนด์',
    performed_by: 'administrator',
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true,
    related_job_id: undefined
  }
];

interface SerialHistoryScreenProps {
  setView: (view: View) => void;
  vehicles: Vehicle[];
}

const SerialHistoryScreen = ({ setView, vehicles }: SerialHistoryScreenProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSerial, setFilterSerial] = useState('');
  const [filterActionType, setFilterActionType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  
  // Sort history entries by date (newest first)
  const sortedEntries = [...MOCK_SERIAL_HISTORY].sort((a, b) => 
    new Date(b.action_date).getTime() - new Date(a.action_date).getTime()
  );

  // Apply filters
  const filteredEntries = sortedEntries.filter(entry => {
    // Search term filter (search in serial number, vehicle number, or details)
    const searchMatch = searchTerm === '' || 
      entry.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.performed_by.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Serial filter
    const serialMatch = filterSerial === '' || entry.serial_number === filterSerial;
    
    // Action type filter
    const actionTypeMatch = filterActionType === '' || entry.action_type === filterActionType;
    
    // Date range filter
    const entryDate = new Date(entry.action_date);
    const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
    const toDate = filterDateTo ? new Date(filterDateTo) : null;
    
    const dateMatch = 
      (!fromDate || entryDate >= fromDate) && 
      (!toDate || entryDate <= toDate);
    
    // Active status filter
    const activeMatch = showInactive || entry.is_active;
    
    return searchMatch && serialMatch && actionTypeMatch && dateMatch && activeMatch;
  });

  // Get unique serial numbers for filter dropdown
  const uniqueSerials = Array.from(new Set(MOCK_SERIAL_HISTORY.map(entry => entry.serial_number)));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionTypeLabel = (actionType: string) => {
    switch(actionType) {
      case 'registration': return 'ลงทะเบียน';
      case 'transfer': return 'โอนย้าย';
      case 'maintenance': return 'ซ่อมบำรุง';
      case 'decommission': return 'ปลดระวาง';
      default: return actionType;
    }
  };

  const getActionTypeClass = (actionType: string) => {
    switch(actionType) {
      case 'registration': return 'action-registration';
      case 'transfer': return 'action-transfer';
      case 'maintenance': return 'action-maintenance';
      case 'decommission': return 'action-decommission';
      default: return '';
    }
  };

  return (
    <div className="card">
      <div className="page-header">
        <h2>ประวัติซีเรียล (Serial History Log)</h2>
        <button className="btn-outline" onClick={() => setView('admin_dashboard')}>กลับไปหน้าหลัก</button>
      </div>

      <div className="filter-section">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="ค้นหาตามซีเรียล, เบอร์รถ, รายละเอียด, ผู้ดำเนินการ" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label>ซีเรียล:</label>
            <select value={filterSerial} onChange={(e) => setFilterSerial(e.target.value)}>
              <option value="">ทั้งหมด</option>
              {uniqueSerials.map(serial => (
                <option key={serial} value={serial}>{serial}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>ประเภทการดำเนินการ:</label>
            <select value={filterActionType} onChange={(e) => setFilterActionType(e.target.value)}>
              <option value="">ทั้งหมด</option>
              <option value="registration">ลงทะเบียน</option>
              <option value="transfer">โอนย้าย</option>
              <option value="maintenance">ซ่อมบำรุง</option>
              <option value="decommission">ปลดระวาง</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>ตั้งแต่วันที่:</label>
            <input 
              type="date" 
              value={filterDateFrom} 
              onChange={(e) => setFilterDateFrom(e.target.value)} 
            />
          </div>
          
          <div className="filter-group">
            <label>ถึงวันที่:</label>
            <input 
              type="date" 
              value={filterDateTo} 
              onChange={(e) => setFilterDateTo(e.target.value)} 
            />
          </div>

          <div className="filter-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={showInactive} 
                onChange={(e) => setShowInactive(e.target.checked)} 
              />
              แสดงรถที่ปลดระวางแล้ว
            </label>
          </div>
        </div>
      </div>

      <div className="serial-history-list">
        {filteredEntries.length === 0 ? (
          <p className="no-data">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</p>
        ) : (
          filteredEntries.map(entry => (
            <div key={entry.id} className={`serial-history-card ${!entry.is_active ? 'inactive-serial' : ''}`}>
              <div className="serial-history-card-header">
                <div>
                  <h3>ซีเรียล: {entry.serial_number}</h3>
                  <p className="serial-vehicle-number">รถเบอร์: {entry.vehicle_number}</p>
                  <p className="history-date">{formatDate(entry.action_date)}</p>
                </div>
                <div className={`action-type-badge ${getActionTypeClass(entry.action_type)}`}>
                  {getActionTypeLabel(entry.action_type)}
                </div>
              </div>
              
              <div className="serial-history-card-body">
                <div className="serial-history-details">
                  <p><strong>รายละเอียด:</strong> {entry.details}</p>
                  <p><strong>ผู้ดำเนินการ:</strong> {entry.performed_by}</p>
                  <p><strong>สนาม:</strong> {entry.golf_course_name}</p>
                  {entry.related_job_id && (
                    <p><strong>รหัสงาน:</strong> {entry.related_job_id}</p>
                  )}
                  <p className="serial-status">
                    <strong>สถานะ:</strong> 
                    <span className={entry.is_active ? 'active-status' : 'inactive-status'}>
                      {entry.is_active ? 'ใช้งานอยู่' : 'ปลดระวางแล้ว'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="serial-history-card-footer">
                <button className="btn-secondary btn-sm">พิมพ์รายงาน</button>
                {entry.related_job_id && (
                  <button className="btn-outline btn-sm">ดูรายละเอียดงาน</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="serial-history-note">
        <p><strong>หมายเหตุ:</strong> ข้อมูลประวัติซีเรียลทั้งหมดจะถูกเก็บไว้ถาวรและไม่สามารถลบได้ เพื่อการติดตามประวัติการใช้งานของรถแต่ละคัน</p>
      </div>
    </div>
  );
};

export default SerialHistoryScreen;