'use client';

import { FiDatabase, FiFile, FiSettings, FiList, FiCheckCircle } from 'react-icons/fi';

export default function Overview() {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
        <h3 className="text-lg font-semibold text-[#0f172a] mb-4">Backup Timeline (Last 30 Days)</h3>
        <div className="flex items-end gap-2 h-48">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="flex-1 bg-[#d1fae5] rounded-t" style={{ height: `${Math.random() * 100}%` }}></div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#d1fae5] rounded"></div>
            <span className="text-[#64748b]">Success</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#fef3c7] rounded"></div>
            <span className="text-[#64748b]">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#fee2e2] rounded"></div>
            <span className="text-[#64748b]">Failed</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {[
          { icon: FiDatabase, label: 'Database Backups', last: 'Today 3:12 AM', size: '1.2 GB', color: 'text-[#3b82f6]' },
          { icon: FiFile, label: 'File Backups', last: 'Today 3:15 AM', size: '850 MB', color: 'text-[#8b5cf6]' },
          { icon: FiSettings, label: 'Config Backups', last: 'Today 3:10 AM', size: '12 MB', color: 'text-[#f59e0b]' },
          { icon: FiList, label: 'Logs Backups', last: 'Today 3:18 AM', size: '45 MB', color: 'text-[#78716c]' }
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-lg border border-[#e2e8f0] p-6">
            <div className="flex items-center gap-3 mb-4">
              <item.icon className={`w-6 h-6 ${item.color}`} />
              <h3 className="font-semibold text-[#0f172a]">{item.label}</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Last backup:</span>
                <span className="font-medium text-[#0f172a]">{item.last}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Size:</span>
                <span className="font-medium text-[#0f172a]">{item.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Integrity:</span>
                <span className="flex items-center gap-1 font-medium text-[#10b981]">
                  <FiCheckCircle className="w-3 h-3" />
                  OK
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
        <h3 className="text-lg font-semibold text-[#0f172a] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-3">
          {['Create Full Backup', 'Create Incremental', 'Restore Latest', 'Verify All'].map(action => (
            <button key={action} className="px-4 py-3 border border-[#cbd5e1] rounded-lg hover:border-[#0ea5a3] hover:bg-[#f0fdfa] text-sm font-medium text-[#64748b] hover:text-[#0ea5a3] transition-colors">
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
