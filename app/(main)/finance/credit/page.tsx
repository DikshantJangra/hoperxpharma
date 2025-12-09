'use client';

import CreditDashboard from '@/components/Finance/CreditDashboard';

export default function CreditManagementPage() {
    return (
        <div className="min-h-screen bg-gray-50/50 p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Credit Management</h1>
                    <p className="text-gray-500 mt-2 text-lg">Track outstanding dues and manage customer credit accounts.</p>
                </div>
            </div>

            <CreditDashboard />
        </div>
    );
}
