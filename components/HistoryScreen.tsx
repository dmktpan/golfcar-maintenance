'use client';

import React, { useState } from 'react';
import { Job, Vehicle, Part, MOCK_JOBS, View } from '@/lib/data';
import StatusBadge from './StatusBadge';

interface HistoryScreenProps {
    setView: (view: View) => void;
    vehicles: Vehicle[];
    parts: Part[];
}

const HistoryScreen = ({ setView, vehicles, parts }: HistoryScreenProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVehicle, setFilterVehicle] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    
    // Add more mock jobs for history demonstration
    const extendedJobs: Job[] = [
        ...MOCK_JOBS,
        { 
            id: 3, 
            user_id: 2, 
            userName: 'สมศรี หัวหน้า', 
            vehicle_id: 103, 
            vehicle_number: 'B05', 
            golf_course_id: 1,
            type: 'Recondition', 
            status: 'approved', 
            created_at: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
            parts: [
                { part_id: 2, quantity_used: 4 },
                { part_id: 4, quantity_used: 1 }
            ], 
            system: 'ช่วงล่างและพวงมาลัย (suspension)', 
            subTasks: ['อัดจารบี', 'ตรวจสอบลูกหมาก', 'ตั้งศูนย์ล้อ'], 
            partsNotes: 'เปลี่ยนยางทั้ง 4 เส้น และเปลี่ยนผ้าเบรค', 
            remarks: 'ปรับปรุงสภาพรถประจำปี' 
        },
        { 
            id: 4, 
            user_id: 1, 
            userName: 'tape1408', 
            vehicle_id: 101, 
            vehicle_number: 'A01', 
            golf_course_id: 1,
            type: 'PM', 
            status: 'rejected', 
            created_at: new Date(Date.now() - 1209600000).toISOString(), // 14 days ago
            parts: [], 
            system: 'ทั่วไป (general)', 
            subTasks: ['ทำความสะอาด'], 
            partsNotes: '', 
            remarks: 'ทำความสะอาดประจำเดือน' 
        },
        { 
            id: 5, 
            user_id: 2, 
            userName: 'สมศรี หัวหน้า', 
            vehicle_id: 102, 
            vehicle_number: 'A02', 
            golf_course_id: 1,
            type: 'BM', 
            status: 'approved', 
            created_at: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
            parts: [
                { part_id: 3, quantity_used: 1 }
            ], 
            system: 'ระบบขับเคลื่อน (motor)', 
            subTasks: ['ตรวจเช็กแปรงถ่าน', 'ทำความสะอาดมอเตอร์'], 
            partsNotes: 'เปลี่ยนชุดควบคุมมอเตอร์', 
            remarks: 'มอเตอร์ไม่ทำงาน' 
        }
    ];

    // Sort jobs by date (newest first)
    const sortedJobs = [...extendedJobs].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Apply filters
    const filteredJobs = sortedJobs.filter(job => {
        // Search term filter (search in vehicle number, username, or remarks)
        const searchMatch = searchTerm === '' || 
            job.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.remarks.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Vehicle filter
        const vehicleMatch = filterVehicle === '' || job.vehicle_id.toString() === filterVehicle;
        
        // Status filter
        const statusMatch = filterStatus === '' || job.status === filterStatus;
        
        // Date range filter
        const jobDate = new Date(job.created_at);
        const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
        const toDate = filterDateTo ? new Date(filterDateTo) : null;
        
        const dateMatch = 
            (!fromDate || jobDate >= fromDate) && 
            (!toDate || jobDate <= toDate);
        
        return searchMatch && vehicleMatch && statusMatch && dateMatch;
    });

    const getPartName = (partId: number) => {
        const part = parts.find(p => p.id === partId);
        return part ? part.name : 'ไม่ระบุ';
    };

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

    return (
        <div className="card">
            <div className="page-header">
                <h2>ประวัติการซ่อมบำรุง</h2>
                <button className="btn-outline" onClick={() => setView('admin_dashboard')}>กลับไปหน้าหลัก</button>
            </div>

            <div className="filter-section">
                <div className="search-box">
                    <input 
                        type="text" 
                        placeholder="ค้นหาตามเบอร์รถ, ชื่อพนักงาน, หมายเหตุ" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
                
                <div className="filter-controls">
                    <div className="filter-group">
                        <label>รถ:</label>
                        <select value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)}>
                            <option value="">ทั้งหมด</option>
                            {vehicles.map(vehicle => (
                                <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.vehicle_number} ({vehicle.serial_number})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label>สถานะ:</label>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="">ทั้งหมด</option>
                            <option value="pending">รอตรวจสอบ</option>
                            <option value="approved">อนุมัติแล้ว</option>
                            <option value="rejected">ไม่อนุมัติ</option>
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
                </div>
            </div>

            <div className="history-list">
                {filteredJobs.length === 0 ? (
                    <p className="no-data">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</p>
                ) : (
                    filteredJobs.map(job => (
                        <div key={job.id} className="history-card">
                            <div className="history-card-header">
                                <div>
                                    <h3>รถเบอร์: {job.vehicle_number}</h3>
                                    <p className="history-date">{formatDate(job.created_at)}</p>
                                </div>
                                <StatusBadge status={job.status} />
                            </div>
                            
                            <div className="history-card-body">
                                <div className="history-details">
                                    <p><strong>ประเภท:</strong> {job.type}</p>
                                    <p><strong>ผู้ดำเนินการ:</strong> {job.userName}</p>
                                    <p><strong>ระบบที่ซ่อม:</strong> {job.system}</p>
                                    <p><strong>งานย่อย:</strong> {job.subTasks.join(', ')}</p>
                                    {job.partsNotes && <p><strong>บันทึกอะไหล่:</strong> {job.partsNotes}</p>}
                                    {job.remarks && <p><strong>หมายเหตุ:</strong> {job.remarks}</p>}
                                </div>
                                
                                {job.parts.length > 0 && (
                                    <div className="history-parts">
                                        <h4>อะไหล่ที่ใช้:</h4>
                                        <ul>
                                            {job.parts.map(part => (
                                                <li key={part.part_id}>
                                                    {getPartName(part.part_id)} (จำนวน {part.quantity_used})
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            
                            <div className="history-card-footer">
                                <button className="btn-secondary btn-sm">พิมพ์รายงาน</button>
                                <button className="btn-outline btn-sm">ดูรายละเอียด</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryScreen;