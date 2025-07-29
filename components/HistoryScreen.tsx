'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Job, Vehicle, Part, View, PARTS_BY_SYSTEM_DISPLAY } from '@/lib/data';
import StatusBadge from './StatusBadge';

interface HistoryScreenProps {
    setView: (view: View) => void;
    vehicles: Vehicle[];
    parts: Part[];
    jobs: Job[]; // เพิ่ม props สำหรับรับข้อมูลงานจากระบบ
}

const HistoryScreen = ({ setView, vehicles, parts, jobs }: HistoryScreenProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVehicle, setFilterVehicle] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    
    // ใช้ข้อมูลงานจากระบบแทนข้อมูล mock
    // กรองเฉพาะงานที่เสร็จสิ้นแล้วหรืออนุมัติแล้วเพื่อแสดงในประวัติ
    const historyJobs = jobs.filter(job => 
        job.status === 'completed' || 
        job.status === 'approved' || 
        job.status === 'rejected'
    );

    // Sort jobs by date (newest first)
    const sortedJobs = [...historyJobs].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Apply filters
    const filteredJobs = sortedJobs.filter(job => {
        // Search term filter (search in vehicle number, username, or remarks)
        const searchMatch = searchTerm === '' || 
            job.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (job.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
        
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

    // ปรับปรุงฟังก์ชัน getPartName ให้ใช้ part_name ที่บันทึกไว้เป็นหลัก
    const getPartName = (part: { part_id: string; part_name?: string }) => {
        // ใช้ part_name ที่บันทึกไว้เป็นหลัก
        if (part.part_name) {
            return part.part_name;
        }
        
        // หากไม่มี part_name ให้ค้นหาจาก PARTS_BY_SYSTEM_DISPLAY
        for (const system of Object.values(PARTS_BY_SYSTEM_DISPLAY)) {
            const partInfo = system.find(p => p.id === parseInt(part.part_id));
            if (partInfo) {
                return partInfo.name;
            }
        }
        
        // สุดท้ายค้นหาจาก parts prop
        const partFromProps = parts.find(p => p.id === part.part_id);
        if (partFromProps) {
            return partFromProps.name;
        }
        
        return 'ไม่ระบุ';
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

    // ฟังก์ชันแปลงชื่อระบบให้เป็นภาษาไทย
    const getSystemDisplayName = (system: string) => {
        const systemNames: Record<string, string> = {
            'brake': 'ระบบเบรก/เพื่อห้าม',
            'steering': 'ระบบพวงมาลัย', 
            'motor': 'ระบบมอเตอร์/เพื่อขับ',
            'electric': 'ระบบไฟฟ้า',
            'general': 'ทั่วไป',
            'suspension': 'ช่วงล่างและพวงมาลัย'
        };
        return systemNames[system] || system;
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
                            <option value="completed">เสร็จสิ้น</option>
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
                    <div className="no-data">
                        <p>ไม่พบข้อมูลประวัติการซ่อมบำรุงที่ตรงกับเงื่อนไขการค้นหา</p>
                        <p className="text-muted">ประวัติจะแสดงเมื่องานได้รับการอนุมัติหรือเสร็จสิ้นแล้ว</p>
                    </div>
                ) : (
                    filteredJobs.map(job => (
                        <div key={job.id} className="history-card">
                            <div className="history-card-header">
                                <div>
                                    <h3>รถเบอร์: {job.vehicle_number}</h3>
                                    <p className="vehicle-serial">Serial: {vehicles.find(v => v.id === job.vehicle_id)?.serial_number || '-'}</p>
                                    <p className="battery-serial">ซีเรียลแบต: {job.battery_serial || vehicles.find(v => v.id === job.vehicle_id)?.battery_serial || '-'}</p>
                                    <p className="history-date">{formatDate(job.created_at)}</p>
                                    {job.updated_at && job.updated_at !== job.created_at && (
                                        <p className="history-updated">อัปเดต: {formatDate(job.updated_at)}</p>
                                    )}
                                </div>
                                <StatusBadge status={job.status} />
                            </div>
                            
                            <div className="history-card-body">
                                <div className="history-details">
                                    <p><strong>ประเภท:</strong> {job.type}</p>
                                    <p><strong>ผู้ดำเนินการ:</strong> {job.userName}</p>
                                    {job.system && <p><strong>ระบบที่ซ่อม:</strong> {getSystemDisplayName(job.system)}</p>}
                                    {job.subTasks && job.subTasks.length > 0 && (
                                        <p><strong>งานย่อย:</strong> {job.subTasks.join(', ')}</p>
                                    )}
                                    {job.partsNotes && <p><strong>บันทึกอะไหล่:</strong> {job.partsNotes}</p>}
                                    {job.remarks && <p><strong>หมายเหตุ:</strong> {job.remarks}</p>}
                                    {job.assigned_by_name && (
                                        <p><strong>มอบหมายโดย:</strong> {job.assigned_by_name}</p>
                                    )}
                                    {job.images && job.images.length > 0 && (
                                        <div className="history-images">
                                            <p><strong>รูปภาพ:</strong></p>
                                            <div className="image-gallery">
                                                {job.images.map((image, index) => (
                                                    <div key={index} className="image-item">
                                                        <Image 
                                                            src={image} 
                                                            alt={`รูปภาพงาน ${index + 1}`}
                                                            className="job-image"
                                                            width={200}
                                                            height={150}
                                                            onClick={() => window.open(image, '_blank')}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {job.parts && job.parts.length > 0 && (
                                    <div className="history-parts">
                                        <h4>อะไหล่ที่ใช้:</h4>
                                        <ul>
                                            {job.parts.map((part, index) => (
                                                <li key={`${job.id}-${part.part_id}-${index}`}>
                                                    {getPartName(part)} (จำนวน {part.quantity_used})
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