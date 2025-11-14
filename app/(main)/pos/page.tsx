'use client';

import Link from 'next/link';
import { BsCart3, BsReceipt } from 'react-icons/bs';
import { MdAccessTime } from 'react-icons/md';

export default function POSPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[#0f172a]">Point of Sale</h1>
            <p className="text-[#6b7280] mt-2">Fast billing and checkout system for your pharmacy.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <Link href="/pos/new-sale">
                    <div className="p-6 bg-white border-2 border-[#0ea5a3] rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
                        <BsCart3 className="w-8 h-8 text-[#0ea5a3] mb-3" />
                        <h3 className="text-lg font-semibold text-[#0f172a] mb-1">New Sale</h3>
                        <p className="text-sm text-[#64748b]">Start a new transaction</p>
                    </div>
                </Link>

                <div className="p-6 bg-white border border-[#e2e8f0] rounded-lg hover:shadow-lg transition-shadow cursor-pointer opacity-50">
                    <MdAccessTime className="w-8 h-8 text-[#64748b] mb-3" />
                    <h3 className="text-lg font-semibold text-[#0f172a] mb-1">Held Sales</h3>
                    <p className="text-sm text-[#64748b]">Resume saved transactions</p>
                </div>

                <Link href="/pos/invoices">
                    <div className="p-6 bg-white border border-[#e2e8f0] rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
                        <BsReceipt className="w-8 h-8 text-[#64748b] mb-3" />
                        <h3 className="text-lg font-semibold text-[#0f172a] mb-1">Invoices</h3>
                        <p className="text-sm text-[#64748b]">View all sales & returns</p>
                    </div>
                </Link>

                <div className="p-6 bg-white border border-[#e2e8f0] rounded-lg hover:shadow-lg transition-shadow cursor-pointer opacity-50">
                    <BsReceipt className="w-8 h-8 text-[#64748b] mb-3" />
                    <h3 className="text-lg font-semibold text-[#0f172a] mb-1">Reports</h3>
                    <p className="text-sm text-[#64748b]">X/Z reports & analytics</p>
                </div>
            </div>
        </div>
    )
}
