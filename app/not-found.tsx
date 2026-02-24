import Link from 'next/link';

export default function NotFound() {
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
                <h2 style={{ color: '#3b82f6', marginBottom: '1rem', fontSize: '3rem' }}>404</h2>
                <h3 style={{ color: '#1e293b', marginBottom: '1rem' }}>ไม่พบหน้าที่ค้นหา</h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                    หน้าที่คุณกำลังค้นหาอาจถูกลบหรือย้ายไปที่อื่นแล้ว
                </p>
                <Link
                    href="/"
                    style={{
                        display: 'inline-block',
                        background: '#3b82f6',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        fontSize: '1rem'
                    }}
                >
                    กลับหน้าหลัก
                </Link>
            </div>
        </div>
    );
}
