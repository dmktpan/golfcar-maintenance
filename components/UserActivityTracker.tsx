"use client";

import { useEffect } from "react";

export default function UserActivityTracker() {
    useEffect(() => {
        const sendHeartbeat = async () => {
            try {
                // Try to get user from localStorage
                const userStr = localStorage.getItem("currentUser");
                if (!userStr) return;

                const user = JSON.parse(userStr);
                console.log('UserActivityTracker found user:', user);
                if (!user || !user.id) {
                    console.warn('UserActivityTracker: No user ID found', user);
                    return;
                }

                await fetch("/api/auth/heartbeat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        code: user.code,
                        username: user.username
                    }),
                });
            } catch (error) {
                console.error("Heartbeat failed", error);
            }
        };

        // Send immediately on mount
        sendHeartbeat();

        // Set interval for every 60 seconds
        const intervalId = setInterval(sendHeartbeat, 60000);

        return () => clearInterval(intervalId);
    }, []);

    return null; // This component doesn't render anything
}
