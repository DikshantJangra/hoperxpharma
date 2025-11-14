'use client';

import { useState } from 'react';
import { FiX, FiSearch, FiUser, FiPhone, FiMapPin } from 'react-icons/fi';

const MOCK_CUSTOMERS = [
  { id: '1', name: 'Rajesh Kumar', phone: '+91 98765 43210', gstin: '29ABCDE1234F1Z5', address: 'MG Road, Bangalore' },
  { id: '2', name: 'Priya Sharma', phone: '+91 98765 43211', gstin: '', address: 'Indiranagar, Bangalore' },
  { id: '3', name: 'Amit Patel', phone: '+91 98765 43212', gstin: '24XYZAB5678G2H9', address: 'Koramangala, Bangalore' },
];

export default function CustomerModal({ onSelect, onClose }: any) {
  const [search, setSearch] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);

  const filtered = MOCK_CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
          <h3 className="text-lg font-bold text-[#0f172a]">Select Customer</h3>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#0f172a] p-1 rounded hover:bg-[#f8fafc]">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {filtered.map((customer) => (
              <div
                key={customer.id}
                onClick={() => onSelect(customer)}
                className="p-3 border border-[#e2e8f0] rounded-lg hover:border-[#0ea5a3] hover:bg-[#f0fdfa] cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-[#0f172a] flex items-center gap-2">
                      <FiUser className="w-4 h-4" />
                      {customer.name}
                    </div>
                    <div className="text-sm text-[#64748b] mt-1 flex items-center gap-2">
                      <FiPhone className="w-3 h-3" />
                      {customer.phone}
                    </div>
                    {customer.gstin && (
                      <div className="text-xs text-[#64748b] mt-1">GSTIN: {customer.gstin}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowAddNew(true)}
            className="w-full mt-4 py-2 border-2 border-dashed border-[#cbd5e1] rounded-lg text-sm text-[#0ea5a3] hover:border-[#0ea5a3] hover:bg-[#f0fdfa]"
          >
            + Add New Customer
          </button>
        </div>
      </div>
    </div>
  );
}
