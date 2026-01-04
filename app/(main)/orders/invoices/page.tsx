'use client';

import { useState } from 'react';
import { FiFileText, FiList } from 'react-icons/fi';
import CreateInvoiceTab from '@/components/invoices/CreateInvoiceTab';
import InvoiceHistoryTab from '@/components/invoices/InvoiceHistoryTab';

type TabType = 'create' | 'history';

export default function ConsolidatedInvoicesPage() {
    const [activeTab, setActiveTab] = useState<TabType>('create');

    const tabs = [
        { id: 'create' as TabType, label: 'Create Invoice', icon: FiFileText },
        { id: 'history' as TabType, label: 'Invoice History', icon: FiList },
    ];

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Supplier Invoices</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Consolidate GRNs and manage supplier invoices
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-4 border-b border-gray-200">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-emerald-600 text-emerald-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'create' && <CreateInvoiceTab />}
                {activeTab === 'history' && <InvoiceHistoryTab />}
            </div>
        </div>
    );
}
