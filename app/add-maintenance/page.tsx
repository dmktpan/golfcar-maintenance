'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';
import styles from './page.module.css';

const AddMaintenancePage: React.FC = () => {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImagesUploaded = (imagePaths: string[]) => {
    setImages(prev => [...prev, ...imagePaths]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      const maintenanceData = {
        description,
        date,
        cost: parseFloat(cost),
        notes,
        images,
        // Mock data - ในการใช้งานจริงควรได้มาจาก user session หรือ form
        vehicle_id: 1,
        vehicle_number: 'GC001',
        golf_course_id: 1,
        user_id: 1,
        userName: 'ช่างบำรุงรักษา'
      };

      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maintenanceData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('✅ บันทึกข้อมูลการบำรุงรักษาสำเร็จ!');
        // Reset form
        setDescription('');
        setDate('');
        setCost('');
        setNotes('');
        setImages([]);
      } else {
        setMessage(`❌ เกิดข้อผิดพลาด: ${data.error || data.message || 'ไม่สามารถบันทึกข้อมูลได้'}`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`❌ เกิดข้อผิดพลาดในการเชื่อมต่อ: ${error.message}`);
      } else {
        setMessage('❌ เกิดข้อผิดพลาดที่ไม่คาดคิด');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>📝 เพิ่มข้อมูลการบำรุงรักษา</h1>
        <p className={styles.subtitle}>บันทึกรายละเอียดการบำรุงรักษารถกอล์ฟ</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>รายละเอียดการบำรุงรักษา *</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.input}
            placeholder="เช่น เปลี่ยนน้ำมันเครื่อง, ตรวจสอบเบรค"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>วันที่ทำการบำรุงรักษา *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>ค่าใช้จ่าย (บาท) *</label>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className={styles.input}
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>หมายเหตุเพิ่มเติม</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={styles.textarea}
            placeholder="รายละเอียดเพิ่มเติม, ปัญหาที่พบ, ข้อแนะนำ..."
            rows={4}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>รูปภาพประกอบ</label>
          <ImageUpload
            onImagesUploaded={handleImagesUploaded}
            maxFiles={5}
            maxSizeKB={500}
          />
          
          {images.length > 0 && (
            <div className={styles.uploadedImages}>
              <h4>รูปภาพที่อัปโหลดแล้ว ({images.length})</h4>
              <div className={styles.imageGrid}>
                {images.map((imagePath, index) => (
                  <div key={index} className={styles.imageItem}>
                    <Image
                      src={imagePath}
                      alt={`Uploaded ${index + 1}`}
                      className={styles.uploadedImage}
                      width={150}
                      height={150}
                      style={{ objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className={styles.removeImageButton}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? '🔄 กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
        </button>
      </form>

      {message && (
        <div className={`${styles.message} ${message.includes('✅') ? styles.success : styles.error}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AddMaintenancePage;
