'use client';

import { FiClock, FiDatabase, FiFile, FiAlertTriangle } from 'react-icons/fi';

export default function Restore() {
  return (
    <div className="p-6">
      <div className="bg-[#f0fdfa] border border-[#0ea5a3] rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <FiAlertTriangle className="w-5 h-5 text-[#0ea5a3] mt-0.5" />
          <div>
            <h3 className="font-semibold text-[#0f172a] mb-1">Restore with Confidence</h3>
            <p className="text-sm text-[#64748b]">
              Choose what to restore and preview changes before applying. Your current data remains safe until you confirm.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 hover:border-[#0ea5a3] transition-colors cursor-pointer">
          <FiClock className="w-8 h-8 text-[#0ea5a3] mb-3" />
          <h3 className="font-semibold text-[#0f172a] mb-2">Point-in-Time Restore</h3>
          <p className="text-sm text-[#64748b] mb-4">Restore database to a specific timestamp</p>
          <button className="w-full px-4 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg hover:bg-[#f0fdfa] hover:border-[#0ea5a3] text-sm font-medium">
            Select Time
          </button>
        </div>

        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 hover:border-[#0ea5a3] transition-colors cursor-pointer">
          <FiDatabase className="w-8 h-8 text-[#3b82f6] mb-3" />
          <h3 className="font-semibold text-[#0f172a] mb-2">Snapshot Restore</h3>
          <p className="text-sm text-[#64748b] mb-4">Restore from a saved snapshot</p>
          <button className="w-full px-4 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg hover:bg-[#f0fdfa] hover:border-[#0ea5a3] text-sm font-medium">
            Browse Snapshots
          </button>
        </div>

        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 hover:border-[#0ea5a3] transition-colors cursor-pointer">
          <FiFile className="w-8 h-8 text-[#8b5cf6] mb-3" />
          <h3 className="font-semibold text-[#0f172a] mb-2">Partial Restore</h3>
          <p className="text-sm text-[#64748b] mb-4">Restore specific items only</p>
          <button className="w-full px-4 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg hover:bg-[#f0fdfa] hover:border-[#0ea5a3] text-sm font-medium">
            Select Items
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg border border-[#e2e8f0] p-6">
        <h3 className="text-lg font-semibold text-[#0f172a] mb-4">Recent Restore Points</h3>
        <div className="space-y-3">
          {[
            { time: 'Today 3:12 AM', type: 'Full', size: '2.1 GB', verified: true },
            { time: 'Yesterday 3:12 AM', type: 'Full', size: '2.0 GB', verified: true },
            { time: '2 days ago 3:12 AM', type: 'Full', size: '1.9 GB', verified: true }
          ].map((point, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-lg hover:bg-[#f0fdfa] transition-colors">
              <div className="flex items-center gap-4">
                <FiDatabase className="w-5 h-5 text-[#64748b]" />
                <div>
                  <div className="font-medium text-[#0f172a]">{point.time}</div>
                  <div className="text-sm text-[#64748b]">{point.type} · {point.size}</div>
                </div>
              </div>
              <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] text-sm font-medium">
                Restore
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
