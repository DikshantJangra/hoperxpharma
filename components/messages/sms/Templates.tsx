'use client';

import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const MOCK_TEMPLATES = [
  { id: '1', name: 'Pickup Ready', body: 'Hi {name}, your prescription {order_no} is ready at {store_name}.', category: 'Transactional', uses: 245 },
  { id: '2', name: 'Refill Reminder', body: 'Hi {name}, time to refill {medicine}. Reply REFILL to order.', category: 'Transactional', uses: 189 },
  { id: '3', name: 'Invoice Link', body: 'Invoice #{inv} ₹{amount}. View: {link}', category: 'Transactional', uses: 567 },
  { id: '4', name: 'OTP', body: 'Your OTP is {otp}. Valid for 5 min.', category: 'Transactional', uses: 1024 },
];

export default function Templates() {
  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#0f172a]">Templates</h2>
        <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          New Template
        </button>
      </div>

      <div className="grid gap-4">
        {MOCK_TEMPLATES.map((template) => (
          <div key={template.id} className="bg-white border border-[#e2e8f0] rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-[#0f172a]">{template.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-[#f0fdfa] text-[#0ea5a3] text-xs rounded">{template.category}</span>
                  <span className="text-xs text-[#64748b]">Used {template.uses} times</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1.5 hover:bg-[#f8fafc] rounded">
                  <FiEdit2 className="w-4 h-4 text-[#64748b]" />
                </button>
                <button className="p-1.5 hover:bg-[#fef2f2] rounded">
                  <FiTrash2 className="w-4 h-4 text-[#ef4444]" />
                </button>
              </div>
            </div>
            <p className="text-sm text-[#64748b] bg-[#f8fafc] p-3 rounded">{template.body}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-[#94a3b8]">
              <span>Variables: {template.body.match(/\{[^}]+\}/g)?.join(', ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
