'use client';

import Link from 'next/link';
import { BsCart3, BsReceipt } from 'react-icons/bs';
import { MdAccessTime } from 'react-icons/md';
import { usePremiumTheme } from '@/lib/hooks/usePremiumTheme';

export default function POSPage() {
    const { isPremium } = usePremiumTheme();
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[#0f172a]">Point of Sale</h1>
            <p className="text-[#6b7280] mt-2">Fast billing and checkout system for your pharmacy.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <Link href="/pos/new-sale">
                    <div
                        className={`
                            p-6 rounded-lg border transition-all cursor-pointer h-full
                            ${isPremium
                                ? 'bg-white/60 backdrop-blur-md border-emerald-500/20 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(16,185,129,0.2)] hover:scale-[1.02] hover:-translate-y-1 duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
                                : 'bg-white border-[#0ea5a3] hover:shadow-lg transition-shadow border-2'
                            }
                        `}
                    >
                        <BsCart3 className={`w-8 h-8 mb-3 ${isPremium ? 'text-emerald-500 drop-shadow-sm' : 'text-[#0ea5a3]'}`} />
                        <h3 className="text-lg font-semibold text-[#0f172a] mb-1">New Sale</h3>
                        <p className="text-sm text-[#64748b]">Start a new transaction</p>
                    </div>
                </Link>

                <div
                    className={`
                        p-6 rounded-lg border transition-all cursor-pointer opacity-50 h-full
                        ${isPremium
                            ? 'bg-white/40 border-white/20'
                            : 'bg-white border-[#e2e8f0] hover:shadow-lg'
                        }
                    `}
                >
                    <MdAccessTime className="w-8 h-8 text-[#64748b] mb-3" />
                    <h3 className="text-lg font-semibold text-[#0f172a] mb-1">Held Sales</h3>
                    <p className="text-sm text-[#64748b]">Resume saved transactions</p>
                </div>

                <Link href="/pos/invoices">
                    <div
                        className={`
                            p-6 rounded-lg border transition-all cursor-pointer h-full
                            ${isPremium
                                ? 'bg-white/60 backdrop-blur-md border-white/40 shadow-sm hover:shadow-md hover:scale-[1.02] hover:-translate-y-1 hover:border-emerald-500/10 duration-300'
                                : 'bg-white border-[#e2e8f0] hover:shadow-lg'
                            }
                        `}
                    >
                        <BsReceipt className={`w-8 h-8 mb-3 ${isPremium ? 'text-emerald-600/70' : 'text-[#64748b]'}`} />
                        <h3 className="text-lg font-semibold text-[#0f172a] mb-1">Invoices</h3>
                        <p className="text-sm text-[#64748b]">View all sales & returns</p>
                    </div>
                </Link>

                <div
                    className={`
                        p-6 rounded-lg border transition-all cursor-pointer opacity-50 h-full
                        ${isPremium
                            ? 'bg-white/40 border-white/20'
                            : 'bg-white border-[#e2e8f0] hover:shadow-lg'
                        }
                    `}
                >
                    <BsReceipt className="w-8 h-8 text-[#64748b] mb-3" />
                    <h3 className="text-lg font-semibold text-[#0f172a] mb-1">Reports</h3>
                    <p className="text-sm text-[#64748b]">X/Z reports & analytics</p>
                </div>
            </div>
        </div>
    )
}
