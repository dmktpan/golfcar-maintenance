
'use client';

import React, { useState } from 'react';
import { GolfCartIcon } from './icons';

interface LoginScreenProps {
  onLogin: (staffCode: string, password?: string, loginType?: 'staff' | 'admin') => void;
  error: string;
}

const LoginScreen = ({ onLogin, error }: LoginScreenProps) => {
  const [loginType, setLoginType] = useState<'staff' | 'admin'>('staff');
  const [staffCode, setStaffCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loginType === 'staff') {
      onLogin(staffCode, undefined, 'staff');
    } else {
      onLogin(username, password, 'admin');
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <div className="header-title" style={{ justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
          <GolfCartIcon />
          <h1>GolfCart Maintenance</h1>
        </div>
        <p style={{marginBottom: '1.5rem', color: 'var(--text-color)'}}>ระบบบันทึกและตรวจสอบงานซ่อม</p>
        
        {/* Login Type Selector */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="loginType"
                value="staff"
                checked={loginType === 'staff'}
                onChange={(e) => setLoginType(e.target.value as 'staff' | 'admin')}
                style={{ marginRight: '0.5rem' }}
              />
              พนักงาน
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="loginType"
                value="admin"
                checked={loginType === 'admin'}
                onChange={(e) => setLoginType(e.target.value as 'staff' | 'admin')}
                style={{ marginRight: '0.5rem' }}
              />
              ผู้ดูแลระบบ/หัวหน้างาน
            </label>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          {loginType === 'staff' ? (
            // Staff Login - รหัสพนักงานเท่านั้น
            <div className="form-group">
              <label htmlFor="staffCode">รหัสพนักงาน</label>
              <input
                type="text"
                id="staffCode"
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value)}
                placeholder="รหัสพนักงาน"
                required
              />
            </div>
          ) : (
            // Admin/Supervisor Login - username และ password
            <>
              <div className="form-group">
                <label htmlFor="username">ชื่อผู้ใช้</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ชื่อผู้ใช้"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">รหัสผ่าน</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่าน"
                  required
                />
              </div>
            </>
          )}
          
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
