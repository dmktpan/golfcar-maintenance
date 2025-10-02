'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Part } from '@/lib/data';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

interface StockManagementScreenProps {
  parts: Part[];
  onPartsUpdate: () => void;
}

interface PartFormData {
  name: string;
  part_number: string;
  category: string;
  unit: string;
  stock_qty: number;
  min_qty: number;
  max_qty: number;
}

const StockManagementScreen: React.FC<StockManagementScreenProps> = ({ parts, onPartsUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockLevelFilter, setStockLevelFilter] = useState<'all' | 'low' | 'normal' | 'high'>('all');
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTabbedModal, setShowTabbedModal] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manual'
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [duplicatePartNumbers, setDuplicatePartNumbers] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<PartFormData>({
    name: '',
    part_number: '',
    category: '',
    unit: '',
    stock_qty: 0,
    min_qty: 0,
    max_qty: 0
  });

  // คำนวณสถิติ
  const statistics = useMemo(() => {
    const totalParts = parts.length;
    const totalStock = parts.reduce((sum, part) => sum + part.stock_qty, 0);
    const lowStockParts = parts.filter(part => 
      part.stock_qty <= part.min_qty
    ).length;
    const highStockParts = parts.filter(part => 
      part.stock_qty >= part.max_qty
    ).length;
    const categories = Array.from(new Set(parts.map(part => part.category).filter(Boolean))).length;
    
    return {
      totalParts,
      totalStock,
      lowStockParts,
      highStockParts,
      categories
    };
  }, [parts]);

  // กรองข้อมูล
  const filteredParts = useMemo(() => {
    return parts.filter(part => {
      const matchesSearch = !searchTerm || 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (part.part_number && part.part_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (part.category && part.category.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = !categoryFilter || part.category === categoryFilter;
      
      const matchesStockLevel = stockLevelFilter === 'all' || 
        (stockLevelFilter === 'low' && part.stock_qty <= part.min_qty) ||
        (stockLevelFilter === 'high' && part.stock_qty >= part.max_qty) ||
        (stockLevelFilter === 'normal' && 
          part.stock_qty > part.min_qty && part.stock_qty < part.max_qty
        );
      
      return matchesSearch && matchesCategory && matchesStockLevel;
    });
  }, [parts, searchTerm, categoryFilter, stockLevelFilter]);

  // ดึงรายการ categories ที่ไม่ซ้ำ
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(parts.map(part => part.category).filter(Boolean))).sort();
  }, [parts]);

  // ฟังก์ชันสำหรับ reset form
  const resetForm = () => {
    setFormData({
      name: '',
      part_number: '',
      category: '',
      unit: '',
      stock_qty: 0,
      min_qty: 0,
      max_qty: 0
    });
    setDuplicatePartNumbers([]);
  };

  // ฟังก์ชันตรวจสอบรหัสอะไหล่ซ้ำ
  const checkDuplicatePartNumber = (partNumber: string, excludeId?: string) => {
    if (!partNumber.trim()) return false;
    return parts.some(part => 
      part.part_number === partNumber.trim() && 
      part.id !== excludeId
    );
  };

  // ฟังก์ชันสำหรับอัพโหลดไฟล์ Excel
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('กรุณาเลือกไฟล์');
      return;
    }

    setLoading(true);
    try {
      const data = await uploadFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const partsToAdd: PartFormData[] = [];
      const duplicates: string[] = [];

      jsonData.forEach((row: any, index) => {
        const partData = {
          name: row['ชื่ออะไหล่'] || row['name'] || '',
          part_number: row['รหัสอะไหล่'] || row['part_number'] || '',
          category: row['หมวดหมู่'] || row['category'] || '',
          unit: row['หน่วย'] || row['unit'] || '',
          stock_qty: parseInt(row['จำนวนคงเหลือ'] || row['stock_qty']) || 0,
          min_qty: parseInt(row['จำนวนขั้นต่ำ'] || row['min_qty']) || 0,
          max_qty: parseInt(row['จำนวนสูงสุด'] || row['max_qty']) || 0
        };

        if (partData.name && partData.unit) {
          if (partData.part_number && checkDuplicatePartNumber(partData.part_number)) {
            duplicates.push(`แถว ${index + 2}: ${partData.part_number}`);
          } else {
            partsToAdd.push(partData);
          }
        }
      });

      if (duplicates.length > 0) {
        setDuplicatePartNumbers(duplicates);
        alert(`พบรหัสอะไหล่ซ้ำ:\n${duplicates.join('\n')}\n\nกรุณาแก้ไขไฟล์และอัพโหลดใหม่`);
        setLoading(false);
        return;
      }

      // อัพโหลดข้อมูลทั้งหมด
      for (const partData of partsToAdd) {
        const response = await fetch('/api/parts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(partData),
        });
        
        const result = await response.json();
        if (!result.success) {
          console.error('Error adding part:', result.message);
        }
      }

      setShowUploadModal(false);
      setUploadFile(null);
      onPartsUpdate();
      alert(`อัพโหลดสำเร็จ! เพิ่มอะไหล่ ${partsToAdd.length} รายการ`);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('เกิดข้อผิดพลาดในการอัพโหลดไฟล์');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับ export template
  const exportTemplate = () => {
    const templateData = [{
      'ชื่ออะไหล่': 'ตัวอย่าง: แบตเตอรี่',
      'รหัสอะไหล่': 'BAT001',
      'หมวดหมู่': 'ไฟฟ้า',
      'หน่วย': 'ชิ้น',
      'จำนวนคงเหลือ': 10,
      'จำนวนขั้นต่ำ': 5,
      'จำนวนสูงสุด': 50
    }];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template-parts-import.xlsx');
  };

  // ฟังก์ชันสำหรับเพิ่มอะไหล่ใหม่
  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ตรวจสอบว่ามีรหัสอะไหล่หรือไม่
    if (!formData.part_number || formData.part_number.trim() === '') {
      alert('กรุณากรอกรหัสอะไหล่');
      return;
    }
    
    // ตรวจสอบรหัสอะไหล่ซ้ำ
    if (checkDuplicatePartNumber(formData.part_number)) {
      alert(`รหัสอะไหล่ "${formData.part_number}" มีอยู่แล้วในระบบ กรุณาใช้รหัสอื่น`);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/parts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowAddModal(false);
        setShowTabbedModal(false);
        resetForm();
        onPartsUpdate();
        alert('เพิ่มอะไหล่สำเร็จ!');
      } else {
        alert(data.message || 'เกิดข้อผิดพลาดในการเพิ่มอะไหล่');
      }
    } catch (error) {
      console.error('Error adding part:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มอะไหล่');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับแก้ไขอะไหล่
  const handleEditPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPart) return;
    
    // ตรวจสอบว่ามีรหัสอะไหล่หรือไม่
    if (!formData.part_number || formData.part_number.trim() === '') {
      alert('กรุณากรอกรหัสอะไหล่');
      return;
    }
    
    // ตรวจสอบรหัสอะไหล่ซ้ำ (ยกเว้นตัวเอง)
    if (checkDuplicatePartNumber(formData.part_number, editingPart.id)) {
      alert(`รหัสอะไหล่ "${formData.part_number}" มีอยู่แล้วในระบบ กรุณาใช้รหัสอื่น`);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/parts/${editingPart.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowEditModal(false);
        setEditingPart(null);
        resetForm();
        onPartsUpdate();
        alert('แก้ไขอะไหล่สำเร็จ!');
      } else {
        alert(data.message || 'เกิดข้อผิดพลาดในการแก้ไขอะไหล่');
      }
    } catch (error) {
      console.error('Error updating part:', error);
      alert('เกิดข้อผิดพลาดในการแก้ไขอะไหล่');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับลบอะไหล่
  const handleDeletePart = async (partId: string, partName: string) => {
    if (!confirm(`คุณต้องการลบอะไหล่ "${partName}" หรือไม่?`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/parts/${partId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        onPartsUpdate();
        alert('ลบอะไหล่สำเร็จ!');
      } else {
        alert(data.message || 'เกิดข้อผิดพลาดในการลบอะไหล่');
      }
    } catch (error) {
      console.error('Error deleting part:', error);
      alert('เกิดข้อผิดพลาดในการลบอะไหล่');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับเปิด modal แก้ไข
  const openEditModal = (part: Part) => {
    setEditingPart(part);
    setFormData({
      name: part.name,
      part_number: part.part_number || '',
      category: part.category || '',
      unit: part.unit,
      stock_qty: part.stock_qty,
      min_qty: part.min_qty,
      max_qty: part.max_qty
    });
    setShowEditModal(true);
  };

  // ฟังก์ชันสำหรับ export ข้อมูล
  const exportToExcel = () => {
    const exportData = filteredParts.map(part => ({
      'ชื่ออะไหล่': part.name,
      'รหัสอะไหล่': part.part_number || '-',
      'หมวดหมู่': part.category || '-',
      'หน่วย': part.unit,
      'จำนวนคงเหลือ': part.stock_qty,
      'จำนวนขั้นต่ำ': part.min_qty,
      'จำนวนสูงสุด': part.max_qty,
      'สถานะ Stock': 
        part.stock_qty <= part.min_qty ? 'ต่ำ' :
        part.stock_qty >= part.max_qty ? 'สูง' : 'ปกติ',
      'วันที่สร้าง': part.createdAt ? new Date(part.createdAt).toLocaleDateString('th-TH') : '-',
      'วันที่อัปเดต': part.updatedAt ? new Date(part.updatedAt).toLocaleDateString('th-TH') : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Parts');
    XLSX.writeFile(wb, `stock-parts-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ฟังก์ชันสำหรับกำหนดสี stock level
  const getStockLevelColor = (part: Part) => {
    if (part.stock_qty <= part.min_qty) {
      return 'text-red-600 bg-red-50';
    }
    if (part.stock_qty >= part.max_qty) {
      return 'text-orange-600 bg-orange-50';
    }
    return 'text-green-600 bg-green-50';
  };

  const getStockLevelText = (part: Part) => {
    if (part.stock_qty <= part.min_qty) {
      return 'ต่ำ';
    }
    if (part.stock_qty >= part.max_qty) {
      return 'สูง';
    }
    return 'ปกติ';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Enhanced Header */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
        borderRadius: '24px',
        padding: '3rem 2rem',
        marginBottom: '3rem',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 25px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }}></div>
        
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50px',
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: '600',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
          }}>
            <span style={{ fontSize: '1.5rem' }}>📦</span>
            ระบบจัดการ Stock อะไหล่
          </div>
          
          <p style={{
            fontSize: '1.25rem',
            color: '#64748b',
            margin: '0',
            fontWeight: '500',
            lineHeight: '1.6'
          }}>ระบบจัดการสต็อกอะไหล่ พร้อมการแจ้งเตือนและรายงาน</p>
          
          {/* Quick Stats in Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginTop: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <span style={{ fontSize: '1.2rem' }}>📊</span>
              <span style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '600' }}>Stock รวม: {statistics.totalStock.toLocaleString()}</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <span style={{ fontSize: '1.2rem' }}>📦</span>
              <span style={{ fontSize: '0.875rem', color: '#047857', fontWeight: '600' }}>อะไหล่: {statistics.totalParts} รายการ</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(245, 101, 101, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(245, 101, 101, 0.2)'
            }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <span style={{ fontSize: '0.875rem', color: '#dc2626', fontWeight: '600' }}>Stock ต่ำ: {statistics.lowStockParts} รายการ</span>
            </div>
          </div>
        </div>
      </div>



      {/* Enhanced Controls */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '24px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.06), 0 4px 15px rgba(0, 0, 0, 0.03)',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {/* Search and Filters Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            alignItems: 'end'
          }}>
            {/* Enhanced Search */}
            <div style={{ position: 'relative' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>🔍 ค้นหาอะไหล่</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}>
                  <MagnifyingGlassIcon style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
                </div>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, รหัส, หมวดหมู่..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '3rem',
                    paddingRight: '1rem',
                    paddingTop: '0.875rem',
                    paddingBottom: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
            
            {/* Enhanced Category Filter */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>🏷️ หมวดหมู่</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  background: '#ffffff',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="">ทุกหมวดหมู่</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            {/* Enhanced Stock Level Filter */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>📊 ระดับ Stock</label>
              <select
                value={stockLevelFilter}
                onChange={(e) => setStockLevelFilter(e.target.value as 'all' | 'low' | 'normal' | 'high')}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  background: '#ffffff',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="all">ทุกระดับ Stock</option>
                <option value="low">⚠️ Stock ต่ำ</option>
                <option value="normal">✅ Stock ปกติ</option>
                <option value="high">📈 Stock สูง</option>
              </select>
            </div>
          </div>
          
          {/* Action Buttons Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              แสดง {filteredParts.length} รายการจากทั้งหมด {parts.length} รายการ
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={exportToExcel}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.5rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.2)';
                }}
              >
                <DocumentArrowDownIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                Export Excel
              </button>
              
              <button
                onClick={() => {
                  console.log('Add Parts button clicked!');
                  console.log('Current showAddMethodModal state:', showAddMethodModal);
                  setShowAddMethodModal(true);
                  console.log('Setting showAddMethodModal to true');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.2)';
                }}
              >
                <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                เพิ่มอะไหล่
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Parts Table */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}>
          {/* Table Header */}
          <div style={{
            background: '#f9fafb',
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#374151',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              รายการอะไหล่ทั้งหมด
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                background: '#f3f4f6',
                color: '#6b7280',
                padding: '4px 12px',
                borderRadius: '12px',
                marginLeft: '8px'
              }}>
                {filteredParts.length} รายการ
              </span>
            </h3>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{
                  background: '#f9fafb'
                }}>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    minWidth: '140px'
                  }}>
                    รหัสอะไหล่
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    minWidth: '200px'
                  }}>
                    ชื่ออะไหล่
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    minWidth: '120px'
                  }}>
                    หมวดหมู่
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    minWidth: '80px'
                  }}>
                    หน่วย
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    minWidth: '140px'
                  }}>
                    จำนวนคงเหลือ
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    minWidth: '100px'
                  }}>
                    MIN/MAX
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    minWidth: '100px'
                  }}>
                    สถานะ
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    minWidth: '140px'
                  }}>
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part, index) => (
                  <tr key={part.id} style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#f9fafb';
                  }}>
                    {/* รหัสอะไหล่ */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{
                        background: '#f3f4f6',
                        color: '#374151',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        display: 'inline-block',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        border: '1px solid #e5e7eb'
                      }}>
                        {part.part_number || 'ไม่มีรหัส'}
                      </div>
                    </td>
                    {/* ชื่ออะไหล่ */}
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '0.875rem',
                      color: '#374151',
                      fontWeight: '500'
                    }}>
                      {part.name}
                    </td>
                    {/* หมวดหมู่ */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        background: '#f3f4f6',
                        color: '#6b7280',
                        border: '1px solid #e5e7eb'
                      }}>
                        {part.category || 'ไม่ระบุ'}
                      </span>
                    </td>
                    {/* หน่วย */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#6b7280',
                        textAlign: 'center'
                      }}>
                        {part.unit}
                      </div>
                    </td>
                    {/* จำนวนคงเหลือ */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#374151',
                        textAlign: 'center'
                      }}>
                        {part.stock_qty.toLocaleString()}
                      </div>
                    </td>
                    {/* Min/Max */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        textAlign: 'center',
                        fontWeight: '500'
                      }}>
                        {part.min_qty.toLocaleString()} - {part.max_qty.toLocaleString()}
                      </div>
                    </td>
                    {/* สถานะ */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        minWidth: '80px',
                        justifyContent: 'center',
                        backgroundColor: part.stock_qty <= part.min_qty ? '#fef2f2' : 
                                       part.stock_qty >= part.max_qty ? '#fff7ed' : '#f0fdf4',
                        color: part.stock_qty <= part.min_qty ? '#dc2626' : 
                               part.stock_qty >= part.max_qty ? '#ea580c' : '#16a34a',
                        border: `1px solid ${part.stock_qty <= part.min_qty ? '#fecaca' : 
                                             part.stock_qty >= part.max_qty ? '#fed7aa' : '#bbf7d0'}`
                      }}>
                        {part.stock_qty <= part.min_qty && <span style={{ marginRight: '4px' }}>⚠️</span>}
                        {part.stock_qty > part.min_qty && part.stock_qty < part.max_qty && <span style={{ marginRight: '4px' }}>✅</span>}
                        {part.stock_qty >= part.max_qty && <span style={{ marginRight: '4px' }}>📈</span>}
                        {getStockLevelText(part)}
                      </div>
                    </td>
                    {/* การจัดการ */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openEditModal(part)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2563eb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#3b82f6';
                          }}
                        >
                          <PencilIcon style={{ width: '16px', height: '16px' }} />
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeletePart(part.id, part.name)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 12px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ef4444';
                          }}
                        >
                          <TrashIcon style={{ width: '16px', height: '16px' }} />
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredParts.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '1rem',
                opacity: 0.5
              }}>📦</div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '0.5rem'
              }}>ไม่พบข้อมูลอะไหล่</h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#9ca3af',
                margin: 0
              }}>ลองเปลี่ยนคำค้นหาหรือตัวกรองเพื่อดูผลลัพธ์ที่แตกต่าง</p>
            </div>
          )}

        {/* Tabbed Modal for Add Parts */}
        {showTabbedModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowTabbedModal(false);
                resetForm();
              }
            }}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                padding: '24px',
                color: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>➕</span>
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>เพิ่มอะไหล่</h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>เลือกวิธีการที่ต้องการ</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowTabbedModal(false);
                      resetForm();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '1.5rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb'
              }}>
                <button
                  onClick={() => setActiveTab('upload')}
                  style={{
                    flex: 1,
                    padding: '16px 24px',
                    border: 'none',
                    background: activeTab === 'upload' ? 'white' : 'transparent',
                    color: activeTab === 'upload' ? '#3b82f6' : '#6b7280',
                    fontWeight: activeTab === 'upload' ? '600' : '500',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'upload' ? '2px solid #3b82f6' : '2px solid transparent',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>📊</span>
                  อัปโหลดไฟล์ Excel
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  style={{
                    flex: 1,
                    padding: '16px 24px',
                    border: 'none',
                    background: activeTab === 'manual' ? 'white' : 'transparent',
                    color: activeTab === 'manual' ? '#3b82f6' : '#6b7280',
                    fontWeight: activeTab === 'manual' ? '600' : '500',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'manual' ? '2px solid #3b82f6' : '2px solid transparent',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>📝</span>
                  เพิ่มทีละชิ้น
                </button>
              </div>

              {/* Tab Content */}
              <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '32px'
              }}>
                {activeTab === 'upload' ? (
                  /* Upload Tab Content */
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>อัปโหลดไฟล์ Excel</h3>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>เพิ่มอะไหล่หลายรายการพร้อมกัน</p>
                    </div>
                    
                    <div style={{ marginBottom: '24px' }}>
                      <button
                         onClick={exportTemplate}
                         style={{
                           width: '100%',
                           padding: '12px 24px',
                           background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                           color: 'white',
                           border: 'none',
                           borderRadius: '12px',
                           cursor: 'pointer',
                           fontWeight: '500',
                           transition: 'all 0.2s',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           gap: '8px'
                         }}
                         onMouseOver={(e) => {
                           e.currentTarget.style.transform = 'translateY(-2px)';
                           e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
                         }}
                         onMouseOut={(e) => {
                           e.currentTarget.style.transform = 'translateY(0)';
                           e.currentTarget.style.boxShadow = 'none';
                         }}
                       >
                         <span style={{ fontSize: '1.2rem' }}>📥</span>
                         ดาวน์โหลดแม่แบบ Excel
                       </button>
                    </div>

                    <div style={{
                      border: '2px dashed #d1d5db',
                      borderRadius: '12px',
                      padding: '32px',
                      textAlign: 'center',
                      background: '#f9fafb',
                      marginBottom: '24px'
                    }}>
                      <input
                         type="file"
                         accept=".xlsx,.xls"
                         onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                         style={{ display: 'none' }}
                         id="excel-upload"
                       />
                      <label
                        htmlFor="excel-upload"
                        style={{
                          cursor: 'pointer',
                          display: 'block'
                        }}
                      >
                        <div style={{
                          width: '64px',
                          height: '64px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px auto'
                        }}>
                          <span style={{ fontSize: '2rem', color: 'white' }}>📁</span>
                        </div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>เลือกไฟล์ Excel</p>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>คลิกเพื่อเลือกไฟล์ .xlsx หรือ .xls</p>
                      </label>
                    </div>

                    {uploadFile && (
                       <div style={{
                         background: '#f0f9ff',
                         border: '1px solid #bae6fd',
                         borderRadius: '12px',
                         padding: '16px',
                         marginBottom: '24px'
                       }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <span style={{ fontSize: '1.5rem' }}>📄</span>
                           <div style={{ flex: 1 }}>
                             <p style={{ margin: '0 0 4px 0', fontWeight: '500', color: '#1f2937' }}>ไฟล์ที่เลือก:</p>
                             <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>{uploadFile.name}</p>
                           </div>
                         </div>
                       </div>
                     )}

                    {duplicatePartNumbers.length > 0 && (
                      <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px'
                      }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#dc2626', fontSize: '1rem', fontWeight: '600' }}>⚠️ รหัสอะไหล่ซ้ำ</h4>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: '#7f1d1d' }}>รหัสอะไหล่เหล่านี้มีอยู่ในระบบแล้ว:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {duplicatePartNumbers.map((partNumber, index) => (
                            <span key={index} style={{
                              background: '#dc2626',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              {partNumber}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                       onClick={handleFileUpload}
                       disabled={!uploadFile || loading}
                       style={{
                         width: '100%',
                         padding: '16px 24px',
                         background: !uploadFile || loading ? '#d1d5db' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                         color: 'white',
                         border: 'none',
                         borderRadius: '12px',
                         cursor: !uploadFile || loading ? 'not-allowed' : 'pointer',
                         fontWeight: '600',
                         fontSize: '1rem',
                         transition: 'all 0.2s',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         gap: '8px'
                       }}
                      >
                       {loading ? (
                         <>
                           <div style={{
                             width: '20px',
                             height: '20px',
                             border: '2px solid rgba(255, 255, 255, 0.3)',
                             borderTop: '2px solid white',
                             borderRadius: '50%',
                             animation: 'spin 1s linear infinite'
                           }}></div>
                           กำลังอัปโหลด...
                         </>
                       ) : (
                         <>
                           <span style={{ fontSize: '1.2rem' }}>⬆️</span>
                           อัปโหลด
                         </>
                       )}
                     </button>
                  </div>
                ) : (
                  /* Manual Add Tab Content */
                  <form onSubmit={handleAddPart}>
                    <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>เพิ่มอะไหล่ใหม่</h3>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>กรอกข้อมูลอะไหล่ด้วยตนเอง</p>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>ชื่ออะไหล่ *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            transition: 'all 0.2s',
                            outline: 'none'
                          }}
                          placeholder="กรอกชื่ออะไหล่"
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>รหัสอะไหล่ *</label>
                        <input
                          type="text"
                          required
                          value={formData.part_number}
                          onChange={(e) => setFormData({...formData, part_number: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            transition: 'all 0.2s',
                            outline: 'none'
                          }}
                          placeholder="กรอกรหัสอะไหล่"
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>หมวดหมู่</label>
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            transition: 'all 0.2s',
                            outline: 'none'
                          }}
                          placeholder="กรอกหมวดหมู่ (ไม่บังคับ)"
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>หน่วย *</label>
                        <input
                          type="text"
                          required
                          value={formData.unit}
                          onChange={(e) => setFormData({...formData, unit: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            transition: 'all 0.2s',
                            outline: 'none'
                          }}
                          placeholder="เช่น ชิ้น, กิโลกรัม, ลิตร"
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Stock *</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={formData.stock_qty}
                            onChange={(e) => setFormData({...formData, stock_qty: parseInt(e.target.value) || 0})}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '2px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '1rem',
                              transition: 'all 0.2s',
                              outline: 'none'
                            }}
                            placeholder="0"
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#3b82f6';
                              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#d1d5db';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Min *</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={formData.min_qty}
                            onChange={(e) => setFormData({...formData, min_qty: parseInt(e.target.value) || 0})}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '2px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '1rem',
                              transition: 'all 0.2s',
                              outline: 'none'
                            }}
                            placeholder="0"
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#3b82f6';
                              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#d1d5db';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Max *</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={formData.max_qty}
                            onChange={(e) => setFormData({...formData, max_qty: parseInt(e.target.value) || 0})}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '2px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '1rem',
                              transition: 'all 0.2s',
                              outline: 'none'
                            }}
                            placeholder="0"
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#3b82f6';
                              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#d1d5db';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '12px',
                      marginTop: '32px',
                      paddingTop: '24px',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTabbedModal(false);
                          resetForm();
                        }}
                        style={{
                          padding: '12px 24px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#374151',
                          cursor: 'pointer',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#e5e7eb';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = '#f3f4f6';
                        }}
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          padding: '12px 24px',
                          background: loading ? '#d1d5db' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {loading ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid rgba(255, 255, 255, 0.3)',
                              borderTop: '2px solid white',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }}></div>
                            กำลังบันทึก...
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '1rem' }}>💾</span>
                            บันทึก
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Parts Method Selection Modal */}
        {showAddMethodModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddMethodModal(false);
              }
            }}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                maxWidth: '500px',
                width: '100%',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                padding: '24px',
                color: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>➕</span>
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>เพิ่มอะไหล่</h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>เลือกวิธีการที่ต้องการ</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddMethodModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '1.5rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* Body */}
              <div style={{ padding: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Excel Upload Option */}
                  <div 
                    style={{
                      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                      border: '2px solid #a7f3d0',
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      console.log('Excel upload option clicked');
                      setShowAddMethodModal(false);
                      setActiveTab('upload');
                      setShowTabbedModal(true);
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: '2rem', color: 'white' }}>📊</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>อัปโหลดไฟล์ Excel</h3>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>เพิ่มอะไหล่หลายรายการพร้อมกัน<br/>รวดเร็วและสะดวก</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Manual Add Option */}
                  <div 
                    style={{
                      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                      border: '2px solid #93c5fd',
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      console.log('Manual add option clicked');
                      setShowAddMethodModal(false);
                      setActiveTab('manual');
                      setShowTabbedModal(true);
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: '2rem', color: 'white' }}>📝</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>เพิ่มทีละชิ้น</h3>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>กรอกข้อมูลอะไหล่ด้วยตนเอง<br/>ควบคุมรายละเอียดได้ดี</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div style={{ borderTop: '1px solid #e5e7eb', padding: '24px', textAlign: 'center' }}>
                <button
                  onClick={() => setShowAddMethodModal(false)}
                  style={{
                    padding: '12px 32px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#374151',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#e5e7eb';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <DocumentArrowUpIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">อัปโหลดไฟล์ Excel</h2>
                </div>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setDuplicatePartNumbers([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Export Template Button */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">ดาวน์โหลดแม่แบบ Excel</h3>
                        <p className="text-sm text-blue-700 mt-1">ดาวน์โหลดไฟล์แม่แบบเพื่อกรอกข้อมูลอะไหล่</p>
                      </div>
                      <button
                        onClick={exportTemplate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5" />
                        ดาวน์โหลด
                      </button>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">เลือกไฟล์ Excel</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-200">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง</p>
                        <p className="text-sm text-gray-500 mt-1">รองรับไฟล์ .xlsx และ .xls เท่านั้น</p>
                      </label>
                    </div>
                    {uploadFile && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <span className="font-medium">ไฟล์ที่เลือก:</span> {uploadFile.name}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Duplicate Warning */}
                  {duplicatePartNumbers.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-800">พบรหัสอะไหล่ซ้ำ</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            รหัสอะไหล่ต่อไปนี้มีอยู่ในระบบแล้ว: {duplicatePartNumbers.join(', ')}
                          </p>
                          <p className="text-sm text-yellow-700 mt-1">
                            กรุณาตรวจสอบและแก้ไขไฟล์ก่อนอัปโหลดอีกครั้ง
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadFile(null);
                      setDuplicatePartNumbers([]);
                    }}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleFileUpload}
                    disabled={!uploadFile || loading || duplicatePartNumbers.length > 0}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        กำลังอัปโหลด...
                      </div>
                    ) : (
                      'อัปโหลด'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <PlusIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">เพิ่มอะไหล่ใหม่</h2>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleAddPart} className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่ออะไหล่ *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="กรอกชื่ออะไหล่"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">รหัสอะไหล่ *</label>
                    <input
                      type="text"
                      required
                      value={formData.part_number}
                      onChange={(e) => setFormData({...formData, part_number: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="กรอกรหัสอะไหล่"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">หมวดหมู่</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="กรอกหมวดหมู่ (ไม่บังคับ)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">หน่วย *</label>
                    <input
                      type="text"
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="เช่น ชิ้น, กิโลกรัม, ลิตร"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Stock *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.stock_qty}
                        onChange={(e) => setFormData({...formData, stock_qty: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Min *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.min_qty}
                        onChange={(e) => setFormData({...formData, min_qty: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Max *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.max_qty}
                        onChange={(e) => setFormData({...formData, max_qty: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        กำลังบันทึก...
                      </div>
                    ) : (
                      'บันทึก'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal - Tabbed Style */}
        {showEditModal && editingPart && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowEditModal(false);
                setEditingPart(null);
                resetForm();
              }
            }}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                padding: '24px',
                color: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>✏️</span>
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>แก้ไขอะไหล่</h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>{editingPart.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPart(null);
                      resetForm();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '1.5rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Single Tab Header */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb'
              }}>
                <div
                  style={{
                    flex: 1,
                    padding: '16px 24px',
                    background: 'white',
                    color: '#f59e0b',
                    fontWeight: '600',
                    borderBottom: '2px solid #f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>📝</span>
                  แก้ไขข้อมูลอะไหล่
                </div>
              </div>

              {/* Tab Content */}
              <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '32px'
              }}>
                <form onSubmit={handleEditPart}>
                  <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>แก้ไขข้อมูลอะไหล่</h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>ปรับปรุงข้อมูลอะไหล่ที่เลือก</p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>ชื่ออะไหล่ *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        placeholder="กรอกชื่ออะไหล่"
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#f59e0b';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>รหัสอะไหล่ *</label>
                      <input
                        type="text"
                        required
                        value={formData.part_number}
                        onChange={(e) => setFormData({...formData, part_number: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        placeholder="กรอกรหัสอะไหล่"
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#f59e0b';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>หมวดหมู่</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        placeholder="กรอกหมวดหมู่ (ไม่บังคับ)"
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#f59e0b';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>หน่วย *</label>
                      <input
                        type="text"
                        required
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        placeholder="เช่น ชิ้น, กิโลกรัม, ลิตร"
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#f59e0b';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Stock *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.stock_qty}
                          onChange={(e) => setFormData({...formData, stock_qty: parseInt(e.target.value) || 0})}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            transition: 'all 0.2s',
                            outline: 'none'
                          }}
                          placeholder="0"
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#f59e0b';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Min *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.min_qty}
                          onChange={(e) => setFormData({...formData, min_qty: parseInt(e.target.value) || 0})}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            transition: 'all 0.2s',
                            outline: 'none'
                          }}
                          placeholder="0"
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#f59e0b';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Max *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.max_qty}
                          onChange={(e) => setFormData({...formData, max_qty: parseInt(e.target.value) || 0})}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            transition: 'all 0.2s',
                            outline: 'none'
                          }}
                          placeholder="0"
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#f59e0b';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    marginTop: '32px',
                    paddingTop: '24px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingPart(null);
                        resetForm();
                      }}
                      style={{
                        padding: '12px 24px',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#374151',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#e5e7eb';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                      }}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        padding: '12px 24px',
                        background: loading ? '#d1d5db' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {loading ? (
                        <>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: '1rem' }}>💾</span>
                          บันทึก
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default StockManagementScreen;