
'use client';

import { User } from '@/lib/data';

interface WelcomeBannerProps {
    user: User;
    onDismiss: () => void;
}

const WelcomeBanner = ({ user, onDismiss }: WelcomeBannerProps) => {
    return (
        <div className="welcome-banner">
            <span>ยินดีต้อนรับ, {user.name}!</span>
            <button onClick={onDismiss} className="dismiss-btn">&times;</button>
        </div>
    );
}

export default WelcomeBanner;
