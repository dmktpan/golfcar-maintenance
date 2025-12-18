'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { GolfCartIcon, ProfileIcon, UserShieldIcon } from './icons';
import styles from './LoginScreen.module.css';

interface LoginScreenProps {
  onLogin: (staffCode: string, password?: string, loginType?: 'staff' | 'admin') => void;
  error: string;
  isLoading?: boolean;
}

const LoginScreen = ({ onLogin, error, isLoading = false }: LoginScreenProps) => {
  const [loginType, setLoginType] = useState<'staff' | 'admin'>('staff');
  const [staffCode, setStaffCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple submissions

    if (loginType === 'staff') {
      onLogin(staffCode, undefined, 'staff');
    } else {
      onLogin(username, password, 'admin');
    }
  };

  return (
    <div className={styles.container}>
      {/* Optimized Background Image */}
      <Image
        src="/background/login-bg.jpg"
        alt="Background"
        fill
        priority
        quality={85}
        style={{ objectFit: 'cover', zIndex: 0 }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.loadingSpinner}>
              <div></div><div></div><div></div><div></div><div></div>
            </div>
            <div className={styles.loadingText}>loading...</div>
          </div>
        </div>
      )}

      <div className={styles.glassCard}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <GolfCartIcon />
          </div>
          <h1>GolfCart Maintenance</h1>
          <p>ระบบบันทึกและตรวจสอบงานซ่อม</p>
        </div>

        {/* Login Type Selector */}
        <div className={styles.loginTypeSelector}>
          <label className={`${styles.typeCard} ${loginType === 'staff' ? styles.active : ''}`}>
            <input
              type="radio"
              name="loginType"
              value="staff"
              checked={loginType === 'staff'}
              onChange={(e) => setLoginType(e.target.value as 'staff' | 'admin')}
            />
            <ProfileIcon />
            <span>พนักงาน</span>
          </label>
          <label className={`${styles.typeCard} ${loginType === 'admin' ? styles.active : ''}`}>
            <input
              type="radio"
              name="loginType"
              value="admin"
              checked={loginType === 'admin'}
              onChange={(e) => setLoginType(e.target.value as 'staff' | 'admin')}
            />
            <UserShieldIcon />
            <span>ผู้ดูแลระบบ</span>
          </label>
        </div>

        <form onSubmit={handleLogin}>
          {loginType === 'staff' ? (
            // Staff Login - รหัสพนักงานเท่านั้น
            <div className={styles.formGroup}>
              <label htmlFor="staffCode">รหัสพนักงาน</label>
              <input
                type="text"
                id="staffCode"
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value)}
                placeholder="กรอกรหัสพนักงาน"
                className={styles.input}
                required
              />
            </div>
          ) : (
            // Admin/Supervisor Login - username และ password
            <>
              <div className={styles.formGroup}>
                <label htmlFor="username">ชื่อผู้ใช้</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="password">รหัสผ่าน</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  className={styles.input}
                  required
                />
              </div>
            </>
          )}

          {error && <div className={styles.errorMessage}>{error}</div>}

          <button type="submit" className={styles.submitButton}>
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
