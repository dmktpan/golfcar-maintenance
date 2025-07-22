// components/ImageUpload.tsx
'use client';

import React, { useState, useRef, useCallback } from 'react';
import styles from './ImageUpload.module.css';

interface ImageUploadProps {
  images?: string[];
  onImagesChange?: (imagePaths: string[]) => void;
  onImagesUploaded?: (imagePaths: string[]) => void;
  maxFiles?: number;
  maxImages?: number;
  maxSizeKB?: number;
}

interface CompressedFile {
  file: File;
  preview: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  images = [],
  onImagesChange,
  onImagesUploaded, 
  maxFiles = 5,
  maxImages = 5,
  maxSizeKB = 500 
}) => {
  const [selectedFiles, setSelectedFiles] = useState<CompressedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use maxImages if provided, otherwise use maxFiles
  const actualMaxFiles = maxImages || maxFiles;

  // ฟังก์ชันลดขนาดรูปภาพ
  const compressImage = useCallback((file: File, maxSizeKB: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // คำนวณขนาดใหม่ (รักษาอัตราส่วน)
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // วาดรูปภาพลงบน canvas
        ctx?.drawImage(img, 0, 0, width, height);

        // ลดคุณภาพจนกว่าขนาดไฟล์จะเหมาะสม
        let quality = 0.9;
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (blob) {
              const sizeKB = blob.size / 1024;
              if (sizeKB <= maxSizeKB || quality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                quality -= 0.1;
                tryCompress();
              }
            }
          }, 'image/jpeg', quality);
        };

        tryCompress();
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  // ฟังก์ชันจัดการไฟล์ที่เลือก
  const handleFileSelect = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    if (selectedFiles.length + imageFiles.length + images.length > actualMaxFiles) {
      alert(`สามารถเลือกได้สูงสุด ${actualMaxFiles} ไฟล์`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const compressedFiles: CompressedFile[] = [];
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setUploadProgress(((i + 1) / imageFiles.length) * 50); // 50% สำหรับการบีบอัด

        const compressedFile = await compressImage(file, maxSizeKB);
        const preview = URL.createObjectURL(compressedFile);
        
        compressedFiles.push({
          file: compressedFile,
          preview
        });
      }

      setSelectedFiles(prev => [...prev, ...compressedFiles]);
      setUploadProgress(100);
    } catch (error) {
      console.error('Error compressing images:', error);
      alert('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFiles.length, actualMaxFiles, maxSizeKB, compressImage, images.length]);

  // ฟังก์ชันเปิดกล้อง (สำหรับมือถือ)
  const openCamera = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  }, []);

  // ฟังก์ชันเลือกไฟล์จากแกลเลอรี่
  const selectFromGallery = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  }, []);

  // ฟังก์ชันลบรูปภาพที่อัปโหลดแล้ว
  const removeUploadedImage = useCallback((index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange?.(newImages);
  }, [images, onImagesChange]);

  // ฟังก์ชันลบรูปภาพ
  const removeImage = useCallback((index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  // ฟังก์ชันอัปโหลดรูปภาพ
  const uploadImages = useCallback(async () => {
    if (selectedFiles.length === 0) {
      alert('กรุณาเลือกรูปภาพก่อนอัปโหลด');
      return;
    }

    setUploading(true);
    setUploadProgress(50); // เริ่มต้นที่ 50% หลังจากบีบอัดเสร็จ

    try {
      const formData = new FormData();
      selectedFiles.forEach(({ file }) => {
        formData.append('files', file);
      });

      // สร้าง XMLHttpRequest เพื่อติดตาม progress
      const xhr = new XMLHttpRequest();
      
      // ติดตาม progress ของการอัปโหลด
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          // คำนวณ progress จาก 50% ถึง 95%
          const uploadProgress = 50 + (event.loaded / event.total) * 45;
          setUploadProgress(Math.round(uploadProgress));
        }
      });

      // สร้าง Promise เพื่อใช้กับ XMLHttpRequest
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else if (xhr.status === 408) {
            reject(new Error('Upload timeout - server took too long to process'));
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };

        xhr.ontimeout = () => {
          reject(new Error('Upload timeout - request took too long'));
        };
      });

      // ตั้งค่า timeout (30 วินาที) - ให้เวลามากกว่า server timeout เล็กน้อย
      xhr.timeout = 30000;

      // เริ่มการอัปโหลด
      xhr.open('POST', '/api/upload/maintenance');
      xhr.send(formData);

      // รอผลลัพธ์
      const result = await uploadPromise;
      
      // อัปเดต progress เป็น 100%
      setUploadProgress(100);

      if (result.success) {
        const newImages = [...images, ...result.files];
        onImagesUploaded?.(result.files);
        onImagesChange?.(newImages);
        setSelectedFiles([]);
        
        // แสดงผลสำเร็จหลังจาก progress bar เสร็จ
        setTimeout(() => {
          let message = `อัปโหลดสำเร็จ ${result.files.length} ไฟล์`;
          if (result.errors && result.errors.length > 0) {
            message += `\n\nข้อผิดพลาด:\n${result.errors.join('\n')}`;
          }
          alert(message);
        }, 500);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // แสดงข้อความ error ที่ชัดเจนขึ้น
      let errorMessage = 'เกิดข้อผิดพลาดในการอัปโหลด';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'การอัปโหลดใช้เวลานานเกินไป\n\nคำแนะนำ:\n• ลองใช้ไฟล์ขนาดเล็กกว่า (< 5MB)\n• ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต\n• ลองอัปโหลดทีละไฟล์';
        } else if (error.message.includes('Network error')) {
          errorMessage = 'เกิดปัญหาเครือข่าย กรุณาตรวจสอบการเชื่อมต่อและลองใหม่';
        } else if (error.message.includes('status: 408')) {
          errorMessage = 'เซิร์ฟเวอร์ใช้เวลาประมวลผลนานเกินไป\nกรุณาลองใช้ไฟล์ขนาดเล็กกว่าหรือลองใหม่';
        } else if (error.message.includes('status')) {
          errorMessage = 'เซิร์ฟเวอร์ไม่สามารถประมวลผลได้ กรุณาลองใหม่';
        }
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFiles, onImagesUploaded, onImagesChange, images]);

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        style={{ display: 'none' }}
      />

      <div className={styles.buttonGroup}>
        <button
          type="button"
          onClick={openCamera}
          className={styles.cameraButton}
          disabled={uploading}
        >
          📷 ถ่าย/เปิดกล้อง
        </button>
        
        <button
          type="button"
          onClick={selectFromGallery}
          className={styles.galleryButton}
          disabled={uploading}
        >
          🖼️ เลือกจากแกลเลอรี่
        </button>
      </div>

      {uploading && (
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {uploadProgress < 50 ? 'กำลังบีบอัดรูปภาพ...' : 'กำลังอัปโหลด...'}
            {uploadProgress}%
          </span>
        </div>
      )}

      {(images.length > 0 || selectedFiles.length > 0) && (
        <div className={styles.previewContainer}>
          <h4>รูปภาพ ({images.length + selectedFiles.length}/{actualMaxFiles})</h4>
          
          {/* แสดงรูปภาพที่อัปโหลดแล้ว */}
          {images.length > 0 && (
            <div>
              <h5>รูปภาพที่อัปโหลดแล้ว</h5>
              <div className={styles.previewGrid}>
                {images.map((imagePath, index) => (
                  <div key={`uploaded-${index}`} className={styles.previewItem}>
                    <img 
                      src={imagePath} 
                      alt={`Uploaded ${index + 1}`}
                      className={styles.previewImage}
                    />
                    <button
                      type="button"
                      onClick={() => removeUploadedImage(index)}
                      className={styles.removeButton}
                      disabled={uploading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* แสดงรูปภาพที่เลือกใหม่ */}
          {selectedFiles.length > 0 && (
            <div>
              <h5>รูปภาพที่เลือกใหม่</h5>
              <div className={styles.previewGrid}>
                {selectedFiles.map((item, index) => (
                  <div key={`new-${index}`} className={styles.previewItem}>
                    <img 
                      src={item.preview} 
                      alt={`Preview ${index + 1}`}
                      className={styles.previewImage}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className={styles.removeButton}
                      disabled={uploading}
                    >
                      ✕
                    </button>
                    <div className={styles.fileInfo}>
                      {(item.file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={uploadImages}
                className={styles.uploadButton}
                disabled={uploading}
              >
                {uploading ? 'กำลังอัปโหลด...' : `อัปโหลด ${selectedFiles.length} ไฟล์`}
              </button>
            </div>
          )}
        </div>
      )}

      <div className={styles.info}>
        <p>• รองรับไฟล์: JPG, PNG, WebP</p>
        <p>• ขนาดสูงสุด: 500 KB ต่อไฟล์ (ระบบจะบีบอัดให้ไม่เกิน 150 KB อัตโนมัติ)</p>
        <p>• จำนวนสูงสุด: {actualMaxFiles} ไฟล์</p>
      </div>
    </div>
  );
};

export default ImageUpload;