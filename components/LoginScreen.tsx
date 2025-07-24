
'use client';

import React, { useState } from 'react';
import { GolfCartIcon } from './icons';

interface LoginScreenProps {
  onLogin: (staffCode: string, password: string) => void;
  error: string;
}

const LoginScreen = ({ onLogin, error }: LoginScreenProps) => {
  const [staffCode, setStaffCode] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onLogin(staffCode, password);
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <div className="header-title" style={{ justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
          <GolfCartIcon />
          <h1>GolfCart Maintenance</h1>
        </div>
        <p style={{marginBottom: '1.5rem', color: 'var(--text-color)'}}>ระบบบันทึกและตรวจสอบงานซ่อม</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="staffCode">รหัสพนักงาน</label>
            <input
              type="text"
              id="staffCode"
              value={staffCode}
              onChange={(e) => setStaffCode(e.target.value)}
              placeholder="เช่น staff123 หรือ admin000"
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
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>เข้าสู่ระบบ</button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
