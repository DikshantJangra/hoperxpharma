'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { onboardingApi } from '@/lib/api/onboarding';
import { useTourStore } from '@/lib/store/tour-store';

export default function DemoModeBanner({ isDemo }: { isDemo: boolean }) {
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const { setTourActive, skipTour } = useTourStore();

    if (!isDemo) return null;

    const handleReset = async () => {
        setIsLoading(true);
        setShowModal(false);

        // Stop the tour first
        setTourActive(false);
        skipTour();

        try {
            await onboardingApi.resetMode();
            toast.success('Demo store reset successfully');

            // Hard reload to clear all state
            window.location.href = '/onboarding/welcome';
        } catch (error) {
            console.error(error);
            toast.error('Failed to reset demo store');
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 shadow-md z-50">
                <div className="max-w-full flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        <p className="font-semibold text-sm sm:text-base flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            You are viewing <strong className="font-bold mx-1">Demo Data</strong>. Feel free to explore!
                        </p>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        disabled={isLoading}
                        className="whitespace-nowrap px-5 py-2 bg-white text-orange-600 text-sm font-bold rounded-lg hover:bg-orange-50 transition-all shadow-sm disabled:opacity-75 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? 'Resetting...' : (
                            <>
                                Start Real Onboarding
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    Start Real Onboarding?
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    This will <strong className="text-gray-900">permanently delete</strong> all demo data including:
                                </p>
                                <ul className="text-sm text-gray-600 space-y-1 mb-6 ml-4">
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                        Demo inventory, patients, and sales
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                        All demo prescriptions and invoices
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                        Sample transactions and reports
                                    </li>
                                </ul>
                                <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg mb-6">
                                    You'll be redirected to set up your real pharmacy store with actual data.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors shadow-sm"
                                    >
                                        Yes, Start Real Onboarding
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
