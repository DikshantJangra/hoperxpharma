'use client';

import { FiPlus, FiPlay, FiEdit, FiTrash2, FiCheckCircle, FiClock } from 'react-icons/fi';

const MOCK_PLANS = [
  { id: '1', name: 'Daily Full Backup', frequency: 'Daily 2:00 AM', type: 'Full', encryption: 'AES-256', storage: 'AWS S3', retention: '30 days', status: 'active', lastRun: 'Success · 3:12 AM' },
  { id: '2', name: 'Hourly Incremental', frequency: 'Every 12 hours', type: 'Incremental', encryption: 'AES-256', storage: 'Local', retention: '7 days', status: 'active', lastRun: 'Success · 3:00 PM' },
  { id: '3', name: 'Weekly Archive', frequency: 'Weekly Sunday', type: 'Full', encryption: 'KMS', storage: 'Google Drive', retention: '90 days', status: 'paused', lastRun: 'Never' },
];

export default function BackupPlans() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#0f172a]">Backup Plans</h2>
          <p className="text-sm text-[#64748b]">Automated backup schedules</p>
        </div>
        <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm font-medium">
          <FiPlus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      <div className="space-y-4">
        {MOCK_PLANS.map(plan => (
          <div key={plan.id} className="bg-white rounded-lg border border-[#e2e8f0] p-6 hover:border-[#0ea5a3] transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-[#0f172a]">{plan.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    plan.status === 'active' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#f1f5f9] text-[#64748b]'
                  }`}>
                    {plan.status === 'active' ? <FiCheckCircle className="inline w-3 h-3 mr-1" /> : <FiClock className="inline w-3 h-3 mr-1" />}
                    {plan.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-[#64748b]">Frequency:</span>
                    <span className="ml-2 font-medium text-[#0f172a]">{plan.frequency}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b]">Type:</span>
                    <span className="ml-2 font-medium text-[#0f172a]">{plan.type}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b]">Encryption:</span>
                    <span className="ml-2 font-medium text-[#0f172a]">{plan.encryption}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b]">Storage:</span>
                    <span className="ml-2 font-medium text-[#0f172a]">{plan.storage}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b]">Retention:</span>
                    <span className="ml-2 font-medium text-[#0f172a]">{plan.retention}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b]">Last run:</span>
                    <span className="ml-2 font-medium text-[#10b981]">{plan.lastRun}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-[#f1f5f9] rounded-lg" title="Run now">
                  <FiPlay className="w-4 h-4 text-[#0ea5a3]" />
                </button>
                <button className="p-2 hover:bg-[#f1f5f9] rounded-lg" title="Edit">
                  <FiEdit className="w-4 h-4 text-[#64748b]" />
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
  );
}
