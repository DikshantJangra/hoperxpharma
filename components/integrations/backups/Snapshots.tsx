'use client';

import { FiCheckCircle, FiDownload, FiRotateCcw, FiShield } from 'react-icons/fi';

const MOCK_SNAPSHOTS = [
  { id: 'snap-001', created: 'Today 3:12 AM', by: 'System', size: '2.1 GB', type: 'Full', integrity: 'OK', storage: 'AWS S3' },
  { id: 'snap-002', created: 'Yesterday 3:12 AM', by: 'System', size: '2.0 GB', type: 'Full', integrity: 'OK', storage: 'AWS S3' },
  { id: 'snap-003', created: '2 days ago 3:12 AM', by: 'Admin', size: '1.9 GB', type: 'Full', integrity: 'OK', storage: 'Local' },
];

export default function Snapshots() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#0f172a]">Snapshots</h2>
          <p className="text-sm text-[#64748b]">Complete system state captures</p>
        </div>
      </div>

      <div className="space-y-3">
        {MOCK_SNAPSHOTS.map(snapshot => (
          <div key={snapshot.id} className="bg-white rounded-lg border border-[#e2e8f0] p-6 hover:border-[#0ea5a3] transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-semibold text-[#0f172a]">{snapshot.id}</h3>
                  <span className="px-2 py-1 bg-[#d1fae5] text-[#065f46] rounded-full text-xs font-medium">
                    <FiCheckCircle className="inline w-3 h-3 mr-1" />
                    {snapshot.integrity}
                  </span>
                  <span className="px-2 py-1 bg-[#f1f5f9] text-[#64748b] rounded text-xs">{snapshot.type}</span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-[#64748b]">Created:</span>
                    <span className="ml-2 font-medium text-[#0f172a]">{snapshot.created}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b]">By:</span>
                    <span className="ml-2 font-medium text-[#0f172a]">{snapshot.by}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b]">Size:</span>
                    <span className="ml-2 font-medium text-[#0f172a]">{snapshot.size}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b]">Storage:</span>
                    <span className="ml-2 font-medium text-[#0f172a]">{snapshot.storage}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-[#f1f5f9] rounded-lg" title="Verify">
                  <FiShield className="w-4 h-4 text-[#64748b]" />
                </button>
                <button className="p-2 hover:bg-[#f1f5f9] rounded-lg" title="Download">
                  <FiDownload className="w-4 h-4 text-[#64748b]" />
                </button>
                <button className="px-3 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm font-medium">
                  <FiRotateCcw className="w-4 h-4" />
                  Restore
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
