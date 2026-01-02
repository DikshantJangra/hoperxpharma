'use client';

import { useState } from 'react';
import { FiHelpCircle } from 'react-icons/fi';
import { useTourStore } from '@/lib/store/tour-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';

export default function TourButton() {
    const router = useRouter();
    const { primaryStore } = useAuthStore();
    const { hasCompletedTour, resetTour, setShouldAutoStart } = useTourStore();
    const [showTooltip, setShowTooltip] = useState(false);

    const isDemo = !!primaryStore?.isDemo;

    if (!isDemo) return null;

    const handleStartTour = () => {
        resetTour();
        setShouldAutoStart(true);
        router.push('/dashboard/overview');
    };

    return (
        <div className="fixed bottom-6 right-6 z-40">
            {showTooltip && (
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap shadow-lg">
                    {hasCompletedTour ? 'Restart Tour' : 'Start Tour'}
                    <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
                </div>
            )}

            <button
                onClick={handleStartTour}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                aria-label="Product Tour"
            >
                <FiHelpCircle size={24} />
                {hasCompletedTour && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </button>
        </div>
    );
}
