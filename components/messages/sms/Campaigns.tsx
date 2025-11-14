'use client';

import { FiPlus, FiPlay, FiPause } from 'react-icons/fi';

const MOCK_CAMPAIGNS = [
  { id: '1', name: 'Refill Drive - January', status: 'Active', sent: 1240, delivered: 1198, failed: 42, optouts: 3 },
  { id: '2', name: 'Seasonal Flu Reminder', status: 'Scheduled', sent: 0, delivered: 0, failed: 0, optouts: 0 },
  { id: '3', name: 'New Year Wellness', status: 'Completed', sent: 3420, delivered: 3380, failed: 40, optouts: 12 },
];

export default function Campaigns() {
  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#0f172a]">Campaigns</h2>
        <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      <div className="grid gap-4">
        {MOCK_CAMPAIGNS.map((campaign) => (
          <div key={campaign.id} className="bg-white border border-[#e2e8f0] rounded-lg p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[#0f172a]">{campaign.name}</h3>
                <span className={`inline-block px-2 py-0.5 text-xs rounded mt-1 ${
                  campaign.status === 'Active' ? 'bg-[#d1fae5] text-[#065f46]' :
                  campaign.status === 'Scheduled' ? 'bg-[#fef3c7] text-[#92400e]' :
                  'bg-[#f1f5f9] text-[#64748b]'
                }`}>
                  {campaign.status}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {campaign.status === 'Active' && (
                  <button className="p-1.5 hover:bg-[#f8fafc] rounded">
                    <FiPause className="w-4 h-4 text-[#64748b]" />
                  </button>
                )}
                {campaign.status === 'Scheduled' && (
                  <button className="p-1.5 hover:bg-[#f8fafc] rounded">
                    <FiPlay className="w-4 h-4 text-[#0ea5a3]" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-[#64748b]">Sent</p>
                <p className="text-lg font-semibold text-[#0f172a]">{campaign.sent}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b]">Delivered</p>
                <p className="text-lg font-semibold text-[#10b981]">{campaign.delivered}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b]">Failed</p>
                <p className="text-lg font-semibold text-[#ef4444]">{campaign.failed}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b]">Opt-outs</p>
                <p className="text-lg font-semibold text-[#f59e0b]">{campaign.optouts}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
