'use client';

import { useState, useEffect } from 'react';

interface SessionExpiryTimerProps {
    lastCustomerMessageAt?: string;
    onExpiry?: () => void;
}

export default function SessionExpiryTimer({
    lastCustomerMessageAt,
    onExpiry
}: SessionExpiryTimerProps) {
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!lastCustomerMessageAt) {
            setIsExpired(true);
            return;
        }

        const updateTimer = () => {
            const lastMessage = new Date(lastCustomerMessageAt);
            const expiryTime = new Date(lastMessage.getTime() + 24 * 60 * 60 * 1000);
            const now = new Date();
            const msRemaining = expiryTime.getTime() - now.getTime();

            if (msRemaining <= 0) {
                setIsExpired(true);
                setTimeRemaining('Expired');
                if (onExpiry) onExpiry();
                return;
            }

            const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
            const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

            setTimeRemaining(`${hoursRemaining}h ${minutesRemaining}m`);
            setIsExpired(false);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [lastCustomerMessageAt, onExpiry]);

    if (isExpired) return null;

    return (
        <div className="flex items-center gap-2 text-xs font-medium text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Session: {timeRemaining} left
        </div>
    );
}
