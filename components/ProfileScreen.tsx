'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Notification } from '@/lib/data';
import { CheckIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ProfileScreenProps {
    user: User;
    // onLogout: () => void; // Removed as it is no longer used
    // setView: (view: any) => void; // Removed as it is no longer used
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch(`/api/notifications?userId=${user.id}`);
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    }, [user.id]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isRead: true })
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => !n.isRead);
        try {
            await Promise.all(unread.map(n =>
                fetch(`/api/notifications/${n.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isRead: true })
                })
            ));
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    const roleLabel: Record<string, string> = {
        admin: 'ผู้ดูแลระบบ',
        supervisor: 'หัวหน้างาน',
        staff: 'พนักงาน',
        technician: 'ช่างเทคนิค',
        central: 'ส่วนกลาง',
        manager: 'ผู้จัดการ',
        stock: 'คลังอะไหล่',
        clerk: 'เจ้าหน้าที่',
        viewer: 'ผู้ดูข้อมูล',
    };

    return (
        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
            {/* Profile Card */}
            <div style={{
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                // overflow: 'hidden', // Removed to allow dropdown to overflow
                marginBottom: '24px',
                position: 'relative' // Ensure stacking context
            }}>
                {/* Profile Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '40px 32px',
                    color: 'white',
                    position: 'relative',
                    borderRadius: '20px 20px 0 0' // Rounded top corners only
                }}>


                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        {/* Avatar */}
                        <div style={{
                            width: '90px',
                            height: '90px',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '36px',
                            fontWeight: 700,
                            backdropFilter: 'blur(5px)',
                            border: '3px solid rgba(255,255,255,0.3)'
                        }}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        {/* Info */}
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>{user.name}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                                <span style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    padding: '4px 14px',
                                    borderRadius: '20px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    backdropFilter: 'blur(5px)'
                                }}>
                                    {roleLabel[user.role] || user.role}
                                </span>
                                <span style={{ opacity: 0.9, fontSize: '14px' }}>{user.golf_course_name}</span>
                            </div>
                            {user.code && (
                                <p style={{ opacity: 0.7, fontSize: '13px', marginTop: '6px' }}>รหัสพนักงาน: {user.code}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bell Notification Section */}
                <div style={{
                    padding: '24px 32px',
                    background: 'white',
                    borderRadius: '0 0 20px 20px' // Rounded bottom corners
                }}>
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        {/* Bell Button */}
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 24px',
                                background: showDropdown ? '#EEF2FF' : '#F8FAFC',
                                border: showDropdown ? '2px solid #818CF8' : '2px solid #E2E8F0',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                width: '100%',
                                transition: 'all 0.2s',
                                position: 'relative',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: '#1E293B'
                            }}
                        >
                            {/* Bell SVG Icon */}
                            <div style={{ position: 'relative' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={showDropdown ? '#6366F1' : '#64748B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                                {/* Red Badge */}
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-6px',
                                        right: '-8px',
                                        background: '#EF4444',
                                        color: 'white',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        minWidth: '20px',
                                        height: '20px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0 5px',
                                        border: '2px solid white',
                                        boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
                                        animation: 'pulse 2s infinite'
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </div>

                            <span>การแจ้งเตือน</span>

                            {unreadCount > 0 && (
                                <span style={{
                                    background: '#FEE2E2',
                                    color: '#DC2626',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    padding: '2px 10px',
                                    borderRadius: '12px'
                                }}>
                                    {unreadCount} ใหม่
                                </span>
                            )}

                            {/* Arrow */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#94A3B8"
                                strokeWidth="2"
                                width="18"
                                height="18"
                                style={{
                                    marginLeft: 'auto',
                                    transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)',
                                    transition: 'transform 0.2s'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        {/* Dropdown Notification List */}
                        {showDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 8px)',
                                left: 0,
                                right: 0,
                                background: 'white',
                                borderRadius: '16px',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                                zIndex: 100,
                                maxHeight: '420px',
                                overflowY: 'auto',
                                animation: 'slideDown 0.2s ease-out'
                            }}>
                                {/* Dropdown Header */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px 20px 12px',
                                    borderBottom: '1px solid #F1F5F9',
                                    position: 'sticky',
                                    top: 0,
                                    background: 'white',
                                    borderRadius: '16px 16px 0 0',
                                    zIndex: 1
                                }}>
                                    <span style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B' }}>
                                        การแจ้งเตือนทั้งหมด ({notifications.length})
                                    </span>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            style={{
                                                background: '#EEF2FF',
                                                color: '#6366F1',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            อ่านทั้งหมด
                                        </button>
                                    )}
                                </div>

                                {/* Notification Items */}
                                {notifications.length === 0 ? (
                                    <div style={{
                                        padding: '40px 20px',
                                        textAlign: 'center',
                                        color: '#94A3B8'
                                    }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" width="48" height="48" style={{ margin: '0 auto 12px' }}>
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                        </svg>
                                        <p style={{ fontSize: '14px' }}>ไม่มีการแจ้งเตือน</p>
                                    </div>
                                ) : (
                                    notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            style={{
                                                padding: '14px 20px',
                                                borderBottom: '1px solid #F8FAFC',
                                                background: notification.isRead ? 'white' : '#F0F4FF',
                                                transition: 'background 0.2s',
                                                cursor: 'default'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                {/* Unread dot */}
                                                <div style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: notification.isRead ? '#E2E8F0' : '#6366F1',
                                                    marginTop: '7px',
                                                    flexShrink: 0
                                                }} />

                                                {/* Content */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <h4 style={{
                                                        fontWeight: notification.isRead ? 500 : 700,
                                                        fontSize: '14px',
                                                        color: notification.isRead ? '#64748B' : '#1E293B',
                                                        margin: '0 0 4px 0'
                                                    }}>
                                                        {notification.title}
                                                    </h4>
                                                    <p style={{
                                                        fontSize: '13px',
                                                        color: '#64748B',
                                                        margin: '0 0 6px 0',
                                                        lineHeight: 1.5
                                                    }}>
                                                        {notification.message}
                                                    </p>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        color: '#94A3B8'
                                                    }}>
                                                        {new Date(notification.createdAt).toLocaleString('th-TH')}
                                                    </span>
                                                </div>

                                                {/* Actions */}
                                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            title="อ่านแล้ว"
                                                            style={{
                                                                padding: '6px',
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                borderRadius: '6px',
                                                                color: '#6366F1',
                                                                transition: 'all 0.15s'
                                                            }}
                                                        >
                                                            <CheckIcon style={{ width: '16px', height: '16px' }} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteNotification(notification.id)}
                                                        title="ลบ"
                                                        style={{
                                                            padding: '6px',
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            borderRadius: '6px',
                                                            color: '#94A3B8',
                                                            transition: 'all 0.15s'
                                                        }}
                                                    >
                                                        <TrashIcon style={{ width: '16px', height: '16px' }} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CSS Animation */}
            <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
};

export default ProfileScreen;
