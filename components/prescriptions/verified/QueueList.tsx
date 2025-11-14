'use client';

import { FiClock, FiAlertTriangle } from 'react-icons/fi';

const MOCK_QUEUE = [
  { id: 'rx_001', patient: 'Riya Sharma', age: 36, clinician: 'Dr. Kumar', uploadedAt: '10 min ago', priority: 'urgent', flags: ['allergy'], medCount: 3 },
  { id: 'rx_002', patient: 'Amit Patel', age: 52, clinician: 'Dr. Singh', uploadedAt: '25 min ago', priority: 'normal', flags: [], medCount: 2 },
  { id: 'rx_003', patient: 'Priya Gupta', age: 28, clinician: 'Dr. Kumar', uploadedAt: '1 hour ago', priority: 'normal', flags: ['interaction'], medCount: 4 },
];

export default function QueueList({ filter, searchQuery, onSelectRx, selectedRx }: any) {
  return (
    <div className="w-80 bg-white border-r border-[#e2e8f0] flex flex-col">
      <div className="p-4 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => {}} className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-[#0ea5a3] text-white">
            All (12)
          </button>
          <button onClick={() => {}} className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-[#f1f5f9] text-[#64748b]">
            Urgent (3)
          </button>
        </div>
        <p className="text-xs text-[#64748b]">Use J/K to navigate</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {MOCK_QUEUE.map(rx => (
          <div key={rx.id} onClick={() => onSelectRx(rx)} className={`p-4 border-b border-[#f1f5f9] cursor-pointer hover:bg-[#f8fafc] ${
              selectedRx?.id === rx.id ? 'bg-[#f0fdfa] border-l-4 border-l-[#0ea5a3]' : ''
            }`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm text-[#0f172a]">{rx.patient}</h3>
                  {rx.priority === 'urgent' && (
                    <span className="px-2 py-0.5 bg-[#fee2e2] text-[#991b1b] rounded text-xs font-medium">
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#64748b]">{rx.age}y • {rx.medCount} meds</p>
              </div>
              {rx.flags.length > 0 && (
                <FiAlertTriangle className="w-4 h-4 text-[#f59e0b]" />
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-[#94a3b8]">
              <span>{rx.clinician}</span>
              <span className="flex items-center gap-1">
                <FiClock className="w-3 h-3" />
                {rx.uploadedAt}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
