'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiPlay, FiPause } from 'react-icons/fi';

const CampaignSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 animate-pulse">
        <div className="flex items-start justify-between mb-4">
            <div>
                <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-16"></div>
            </div>
            <div className="h-7 w-7 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-4 gap-4">
            <div className="h-8 bg-gray-100 rounded"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
        </div>
    </div>
);

export default function Campaigns({ isLoading: parentLoading }: { isLoading: boolean }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setCampaigns([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#0f172a]">Campaigns</h2>
        <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2" disabled={isLoading || parentLoading}>
          <FiPlus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      <div className="grid gap-4">
        {isLoading || parentLoading ? (
            <>
                <CampaignSkeleton/>
                <CampaignSkeleton/>
            </>
        ) : campaigns.length > 0 ? (
            campaigns.map((campaign) => (
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
            ))
        ) : (
            <div className="text-center py-10 text-gray-500">
                No campaigns created yet.
            </div>
        )}
      </div>
    </div>
  );
}
