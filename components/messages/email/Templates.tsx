'use client';

import { useState } from 'react';
import { FiPlus, FiEdit, FiCopy, FiTrash2, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';

const MOCK_TEMPLATES = [
  { id: '1', name: 'Invoice', category: 'transactional', status: 'approved', subject: 'Your Invoice #{invoice_no} — HopeRxPharma', lastUsed: '2 hours ago' },
  { id: '2', name: 'Prescription Summary', category: 'clinical', status: 'approved', subject: 'Prescription Summary for {name}', lastUsed: '1 hour ago' },
  { id: '3', name: 'Refill Reminder', category: 'transactional', status: 'approved', subject: 'Refill Reminder: {medicine_name}', lastUsed: '3 hours ago' },
  { id: '4', name: 'Recall Notice', category: 'recall', status: 'pending', subject: 'Urgent: Product Recall — Batch {batch_no}', lastUsed: 'Never' },
];

export default function Templates() {
  const [activeTab, setActiveTab] = useState<'transactional' | 'clinical' | 'marketing' | 'recall'>('transactional');

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-[#e2e8f0]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#0f172a]">Templates Library</h2>
          <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm font-medium">
            <FiPlus className="w-4 h-4" />
            Create Template
          </button>
        </div>
        <div className="flex items-center gap-2">
          {['transactional', 'clinical', 'marketing', 'recall'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                activeTab === tab ? 'bg-[#0ea5a3] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-3">
          {MOCK_TEMPLATES.filter(t => t.category === activeTab).map(template => (
            <div key={template.id} className="bg-[#f8fafc] rounded-lg border border-[#e2e8f0] p-4 hover:border-[#0ea5a3] transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-[#0f172a]">{template.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.status === 'approved' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fef3c7] text-[#92400e]'
                    }`}>
                      {template.status === 'approved' ? <FiCheckCircle className="inline w-3 h-3 mr-1" /> : <FiClock className="inline w-3 h-3 mr-1" />}
                      {template.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#64748b] mb-2">{template.subject}</p>
                  <div className="text-xs text-[#94a3b8]">Last used: {template.lastUsed}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-white rounded-lg" title="Edit">
                    <FiEdit className="w-4 h-4 text-[#64748b]" />
                  </button>
                  <button className="p-2 hover:bg-white rounded-lg" title="Duplicate">
                    <FiCopy className="w-4 h-4 text-[#64748b]" />
                  </button>
                  <button className="p-2 hover:bg-[#fee2e2] rounded-lg" title="Delete">
                    <FiTrash2 className="w-4 h-4 text-[#ef4444]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
