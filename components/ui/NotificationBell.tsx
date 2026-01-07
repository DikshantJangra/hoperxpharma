'use client';

import React, { useState } from 'react';
import { FiBell } from 'react-icons/fi';
import { useAlerts } from '@/contexts/AlertContext';
import { NotificationPanel } from './NotificationPanel';

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const { counts } = useAlerts();

    const badgeCount = counts?.unread?.criticalHigh || 0;

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notifications"
            >
                <FiBell className="h-5 w-5" />
                {badgeCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                )}
            </button>

            {isOpen && <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />}
        </>
    );
}
