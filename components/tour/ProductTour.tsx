'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useTourStore } from '@/lib/store/tour-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface TourStep {
    target?: string;
    title: string;
    content: string;
    navigateTo?: string;
}

// FOCUSED tour - only covers elements that actually exist and can be pointed to
const TOUR_STEPS: TourStep[] = [
    // ===== INTRO =====
    {
        title: 'Welcome to HopeRxPharma! 🎉',
        content: 'Your complete pharmacy management system. Let\'s take a quick tour of the main features.',
    },

    // ===== DASHBOARD =====
    {
        target: '[data-tour="sidebar-dashboard"]',
        title: 'Dashboard',
        content: 'Your central command hub. Real-time overview of your pharmacy operations.',
    },
    {
        target: '[data-tour="metrics-cards"]',
        title: 'Live Metrics',
        content: 'Today\'s Revenue, Pending Prescriptions, Ready Pickups, Critical Stock, and Expiring Items. Click any card for details.',
    },
    {
        target: '[data-tour="quick-actions"]',
        title: 'Quick Actions',
        content: 'One-click New Prescription and POS access. Use Shift+? to see all keyboard shortcuts.',
    },

    // ===== INVENTORY =====
    {
        target: '[data-tour="sidebar-inventory-&-supply"]',
        title: 'Inventory & Supply',
        content: 'Complete stock management with batch tracking, expiry alerts, and supplier management.',
        navigateTo: '/inventory/stock',
    },
    {
        target: '[data-tour="inventory-table"]',
        title: 'Stock Table',
        content: 'All medicines with real-time stock levels. Color-coded: Green (OK), Yellow (Low), Red (Critical). Click any row for details.',
    },
    {
        target: '[data-tour="new-sku-button"]',
        title: 'Add Medicine',
        content: 'Register new drugs with batch details, pricing, expiry dates, and supplier info.',
    },

    // ===== POS =====
    {
        target: '[data-tour="sidebar-pos"]',
        title: 'Point of Sale',
        content: 'Fast, keyboard-friendly billing with GST compliance and multiple payment methods.',
        navigateTo: '/pos/new-sale',
    },
    {
        target: '[data-tour="pos-search"]',
        title: 'Product Search',
        content: 'Search by name, generic name, or barcode. Press "/" to focus. Tab to select batch.',
    },
    {
        target: '[data-tour="pos-cart"]',
        title: 'Shopping Cart',
        content: 'Items with quantities, batch info, and GST. Edit inline, apply discounts, change batches.',
    },
    {
        target: '[data-tour="pos-payment"]',
        title: 'Payment',
        content: 'Cash, Card, UPI, or split payments. F12 for quick cash checkout. F9 for split payment.',
    },

    // ===== INVOICES =====
    {
        title: 'Invoices',
        content: 'All your sales are saved as invoices. Search, print, email, or process returns. Let\'s view the invoice list.',
        navigateTo: '/pos/invoices',
    },
    {
        target: '[data-tour="pos-invoices-tab"]',
        title: 'Invoice List',
        content: 'Search by invoice number, customer, phone, or date. Click any row to view details, print, or email.',
    },

    // ===== PATIENTS =====
    {
        target: '[data-tour="sidebar-patients"]',
        title: 'Patient Management',
        content: 'Complete patient records with prescription history, family links, and loyalty program.',
        navigateTo: '/patients/list',
    },
    {
        title: 'Patient Records',
        content: 'Each patient has a full profile: contact info, medical history, prescriptions, purchase history, and family connections. Click any patient to view details.',
    },

    // ===== PRESCRIPTIONS =====
    {
        target: '[data-tour="sidebar-prescriptions"]',
        title: 'Prescriptions',
        content: 'Create, track, and manage prescriptions. Import to POS for easy billing.',
        navigateTo: '/prescriptions/all-prescriptions',
    },
    {
        title: 'Prescription List',
        content: 'All prescriptions with status tracking. Click any to view details, track refills, or import to POS. Create new with the + button.',
    },

    // ===== REPORTS =====
    {
        target: '[data-tour="sidebar-reports-&-analytics"]',
        title: 'Reports & Analytics',
        content: 'Comprehensive reports: Sales summary, GST reports, stock movement, profit margins, and more.',
        navigateTo: '/reports/sales',
    },
    {
        title: 'Sales Reports',
        content: 'Detailed sales analytics with charts, filters, and export options. GSTR-ready reports for tax filing.',
    },

    // ===== SETTINGS =====
    {
        target: '[data-tour="sidebar-settings"]',
        title: 'Settings',
        content: 'Configure your store: GST settings, user roles, permissions, and privacy settings.',
        navigateTo: '/settings',
    },
    {
        title: 'Store Settings',
        content: 'Manage GST tax slabs, HSN codes, user roles, and privacy settings.',
    },

    // ===== BACK TO DASHBOARD & COMPLETION =====
    {
        title: 'Tour Complete! 🚀',
        content: 'You\'ve seen all the key areas. Explore the demo data, experiment freely. When ready, click "Start Real Onboarding" in the orange banner.',
        navigateTo: '/dashboard/overview',
    },
];

export default function ProductTour() {
    const router = useRouter();
    const pathname = usePathname();
    const { primaryStore } = useAuthStore();
    const {
        shouldAutoStart,
        hasSeenTour,
        startTour,
        completeTour,
        skipTour,
        setShouldAutoStart,
        setTourActive,
        isTourActive
    } = useTourStore();

    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const pendingPathRef = useRef<string | null>(null);
    const [mounted, setMounted] = useState(false);

    const isDemo = !!primaryStore?.isDemo;
    const step = TOUR_STEPS[currentStep];

    useEffect(() => { setMounted(true); }, []);

    // Auto-start
    useEffect(() => {
        if (isDemo && shouldAutoStart && !hasSeenTour && pathname === '/dashboard/overview') {
            const timer = setTimeout(() => {
                startTour();
                setTourActive(true);
                setShouldAutoStart(false);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isDemo, shouldAutoStart, hasSeenTour, pathname, startTour, setTourActive, setShouldAutoStart]);

    // Navigation completion
    useEffect(() => {
        if (isNavigating && pendingPathRef.current && pathname === pendingPathRef.current) {
            setIsNavigating(false);
            pendingPathRef.current = null;
            setTimeout(() => setCurrentStep(prev => prev + 1), 500);
        }
    }, [pathname, isNavigating]);

    // Update target position
    useEffect(() => {
        if (!isTourActive || !step?.target) {
            setTargetRect(null);
            return;
        }

        const updatePosition = () => {
            const el = document.querySelector(step.target!);
            if (el) {
                setTargetRect(el.getBoundingClientRect());
            } else {
                setTargetRect(null);
            }
        };

        updatePosition();
        const interval = setInterval(updatePosition, 100);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [isTourActive, step, currentStep]);

    const handleNext = useCallback(() => {
        if (isNavigating) return;

        const currentStepData = TOUR_STEPS[currentStep];

        if (currentStepData.navigateTo) {
            setIsNavigating(true);
            pendingPathRef.current = currentStepData.navigateTo;
            router.push(currentStepData.navigateTo);
            return;
        }

        if (currentStep >= TOUR_STEPS.length - 1) {
            setTourActive(false);
            completeTour();
            return;
        }

        setCurrentStep(prev => prev + 1);
    }, [currentStep, isNavigating, router, setTourActive, completeTour]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    }, [currentStep]);

    const handleClose = useCallback(() => {
        if (confirm('End the tour?')) {
            setTourActive(false);
            skipTour();
        }
    }, [setTourActive, skipTour]);

    if (!mounted || !isTourActive || !isDemo) return null;

    // Calculate positions
    const pad = 8;
    const highlightTop = targetRect ? Math.max(0, targetRect.top - pad) : 0;
    const highlightLeft = targetRect ? Math.max(0, targetRect.left - pad) : 0;
    const highlightWidth = targetRect ? targetRect.width + pad * 2 : 0;
    const highlightHeight = targetRect ? Math.min(targetRect.height + pad * 2, window.innerHeight - highlightTop) : 0;
    const highlightRight = highlightLeft + highlightWidth;
    const highlightBottom = highlightTop + highlightHeight;

    // Smart tooltip positioning
    const getTooltipStyle = (): React.CSSProperties => {
        const tooltipWidth = 380;
        const tooltipHeight = 180;
        const margin = 16;

        if (!targetRect || !step.target) {
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: tooltipWidth,
            };
        }

        const spaceBelow = window.innerHeight - highlightBottom;
        const spaceAbove = highlightTop;

        let top: number | undefined;
        let bottom: number | undefined;

        if (spaceBelow >= tooltipHeight + margin) {
            top = highlightBottom + margin;
        } else if (spaceAbove >= tooltipHeight + margin) {
            bottom = window.innerHeight - highlightTop + margin;
        } else {
            top = Math.max(margin, (window.innerHeight - tooltipHeight) / 2);
        }

        const left = Math.max(margin, Math.min(highlightLeft, window.innerWidth - tooltipWidth - margin));

        return { position: 'fixed', top, bottom, left, width: tooltipWidth };
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999]">
            {/* Overlay */}
            {targetRect ? (
                <>
                    <div className="absolute bg-black/35" style={{ top: 0, left: 0, right: 0, height: Math.max(0, highlightTop) }} />
                    <div className="absolute bg-black/35" style={{ top: highlightBottom, left: 0, right: 0, bottom: 0 }} />
                    <div className="absolute bg-black/35" style={{ top: highlightTop, left: 0, width: Math.max(0, highlightLeft), height: highlightHeight }} />
                    <div className="absolute bg-black/35" style={{ top: highlightTop, left: highlightRight, right: 0, height: highlightHeight }} />
                    <div className="absolute border-2 border-emerald-500 rounded-lg pointer-events-none" style={{ top: highlightTop, left: highlightLeft, width: highlightWidth, height: highlightHeight }} />
                </>
            ) : (
                <div className="absolute inset-0 bg-black/35" />
            )}

            {/* Tooltip */}
            <div className="bg-white rounded-xl shadow-2xl p-5" style={getTooltipStyle()}>
                <button onClick={handleClose} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Close">
                    <FiX size={18} />
                </button>

                <div className="text-xs font-medium text-emerald-600 mb-2">
                    {currentStep + 1} / {TOUR_STEPS.length}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 pr-6">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{step.content}</p>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button onClick={handlePrev} disabled={currentStep === 0} className="text-gray-500 hover:text-gray-800 disabled:opacity-30 text-sm flex items-center gap-1 py-2">
                        <FiChevronLeft size={16} /> Previous
                    </button>

                    <button onClick={handleNext} disabled={isNavigating} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1">
                        {isNavigating ? 'Loading...' : currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                        {!isNavigating && currentStep < TOUR_STEPS.length - 1 && <FiChevronRight size={16} />}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
