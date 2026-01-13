'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FiPackage, FiX, FiCheckCircle } from 'react-icons/fi';
import { useAuthStore } from '@/lib/store/auth-store';
import SecureMarginReveal from '@/components/common/SecureMarginReveal';
import * as salesLedgerApi from '@/lib/api/salesLedger';
import { MarginStats } from '@/types/finance';

interface ExposeMarginEstimateProps {
    items: any[];
}

export default function ExposeMarginEstimate({ items }: ExposeMarginEstimateProps) {
    const { user } = useAuthStore();
    const [marginStats, setMarginStats] = useState<MarginStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);



    // Auto-update when items change, but only if visible
    useEffect(() => {
        if (!show || !items || items.length === 0) return;

        const timer = setTimeout(() => {
            handleEstimate(true); // silent update
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
    }, [items, show]);

    const handleEstimate = async (silent = false) => {
        if (!silent) setLoading(true);
        if (!show) setShow(true);

        try {
            // Sanitize payload: Ensure Price and Unit are correct
            // The Basket often stores 'qty' in Base Units (Tablets), but 'unit' might default to 'Strip'.
            // We need to calculate the REAL unit price (Per Tablet) if that's what's being sold.

            const payload = items.map(item => {
                // 1. Derive Price: If lineTotal exists, use that to get per-qty price. 
                // This is the safest way to get the actual "Selling Price Per 1 Qty".
                // e.g. LineTotal ₹2, Qty 1 -> Price ₹2.
                // e.g. LineTotal ₹22, Qty 11 -> Price ₹2.
                let effectivePrice = item.price;
                if (!effectivePrice && item.lineTotal && item.qty) {
                    effectivePrice = item.lineTotal / item.qty;
                }

                // Debug logging
                console.log('🔍 Margin Estimate Item:', {
                    price: item.price,
                    lineTotal: item.lineTotal,
                    qty: item.qty,
                    effectivePrice,
                    unit: item.unit
                });

                // 2. Derive Unit:
                // If item.unit is 'Strip' but Qty is 1, and Price is small, it's likely a Tablet?
                // Actually, let's just pass what we have. My backend rewrite is smarter now.
                // But passing the correct price is CRITICAL.

                return {
                    batchId: item.batchId,
                    qty: item.qty,
                    unit: item.unit || item.displayUnit, // Pass what we have
                    price: effectivePrice, // <--- CRITICAL FIX
                    mrp: item.mrp,
                    discount: item.discount,
                    gstRate: item.gstRate,
                    conversionFactor: item.conversionFactor,
                    tabletsPerStrip: item.tabletsPerStrip // Pass if available
                };
            });

            const stats = await salesLedgerApi.estimateMargin(payload);
            setMarginStats(stats);
        } catch (e) {
            if (!silent) toast.error('Failed to estimate margin');
            // Don't clear stats on silent fail to avoid flicker
        } finally {
            setLoading(false);
        }
    };

    // Only render for Owner/Admin and if items exist
    if (!user || !['OWNER', 'ADMIN'].includes(user.role)) return null;
    if (!items || items.length === 0) return null;

    if (!show) {
        return (
            <div className="mt-3">
                <button
                    onClick={() => handleEstimate(false)}
                    className="w-full text-xs font-semibold text-emerald-600/80 hover:text-emerald-800 flex items-center justify-center gap-2 transition-all hover:bg-emerald-50 py-3 rounded-lg border border-emerald-100/50 border-dashed"
                    title="Provisional Estimate (Private)"
                >
                    <FiPackage className="w-3.5 h-3.5" /> Check Potential Margin
                </button>
            </div>
        )
    }

    return (
        <div className="mt-4 mb-2 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100/50 animate-in fade-in slide-in-from-top-1 select-none">
            <div className="flex items-center justify-between mb-3 border-b border-emerald-100/50 pb-2">
                <div className="flex items-center gap-1.5">
                    <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-800">Provisional Profit</span>
                </div>
                <button
                    onClick={() => { setShow(false); setMarginStats(null); }}
                    className="text-emerald-400 hover:text-emerald-700 p-0.5"
                >
                    <FiX size={12} />
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col gap-2">
                    <div className="h-6 w-24 bg-emerald-200/50 rounded animate-pulse"></div>
                    <div className="h-4 w-16 bg-emerald-100/50 rounded animate-pulse"></div>
                </div>
            ) : marginStats ? (
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <div className="text-[10px] text-emerald-600/70 font-medium mb-0.5">Total Margin</div>
                        <SecureMarginReveal value={marginStats.totalMargin} label="" blurIntensity='medium' />
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-emerald-600/70 font-medium mb-0.5">Net %</div>
                        <SecureMarginReveal value={marginStats.netMarginPercent} label="" isCurrency={false} blurIntensity='medium' />
                    </div>
                </div>
            ) : (
                <span className="text-xs text-red-400">Unavailable</span>
            )}

            <div className="mt-2 text-[9px] text-center text-emerald-600/40 italic">
                Only visible to {user.role}
            </div>
        </div>
    )
}
