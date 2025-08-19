
'use client';

import { useEffect } from 'react';
import { User } from '@/lib/data';
import styles from './WelcomeBanner.module.css';

interface WelcomeBannerProps {
    user: User;
    onDismiss: () => void;
}

const WelcomeBanner = ({ user, onDismiss }: WelcomeBannerProps) => {
    // Auto dismiss after 1.5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 1500);

        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className={styles.welcomeBanner}>
            <div className={styles.welcomeContent}>
                <span className={styles.welcomeIcon}>👋</span>
                <span className={styles.welcomeText}>ยินดีต้อนรับ, {user.name}!</span>
            </div>
            <button onClick={onDismiss} className={styles.dismissBtn}>
                &times;
            </button>
        </div>
    );
}

export default WelcomeBanner;
