'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            background: '#f8fafc'
        }}>
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '1rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'center',
                maxWidth: '400px'
            }}>
                <h2 style={{ color: '#e11d48', marginBottom: '1rem' }}>เกิดข้อผิดพลาด</h2>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                    {error.message || 'เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้ง'}
                </p>
                <button
                    onClick={reset}
                    style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    ลองใหม่อีกครั้ง
                </button>
            </div>
        </div>
    );
}
