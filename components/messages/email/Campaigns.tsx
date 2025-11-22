'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiPlay, FiPause, FiEdit, FiBarChart2 } from 'react-icons/fi';

const CampaignCardSkeleton = () => (
    <div className="bg-[#f8fafc] rounded-lg border border-[#e2e8f0] p-4 animate-pulse">
        <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3"></div>
                <div className="flex items-center gap-4">
                    <div className="h-3 bg-gray-100 rounded w-16"></div>
                    <div className="h-3 bg-gray-100 rounded w-16"></div>
                    <div className="h-3 bg-gray-100 rounded w-16"></div>
                </div>
            </div>
            <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            </div>
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
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-[#e2e8f0]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0f172a]">Campaigns</h2>
            <p className="text-sm text-[#64748b]">Bulk email and scheduled newsletters</p>
          </div>
          <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm font-medium" disabled={isLoading || parentLoading}>
            <FiPlus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-3">
            {isLoading || parentLoading ? (
                <>
                    <CampaignCardSkeleton/>
                    <CampaignCardSkeleton/>
                </>
            ) : campaigns.length > 0 ? (
                campaigns.map(campaign => (
                    <div key={campaign.id} className="bg-[#f8fafc] rounded-lg border border-[#e2e8f0] p-4 hover:border-[#0ea5a3] transition-colors">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-[#0f172a]">{campaign.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'active' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#f1f5f9] text-[#64748b]'
                            }`}>
                            {campaign.status === 'active' ? <FiPlay className="inline w-3 h-3 mr-1" /> : <FiPause className="inline w-3 h-3 mr-1" />}
                            {campaign.status}
                            </span>
                        </div>
                        <div className="text-sm text-[#64748b] mb-2">Scheduled: {campaign.scheduled}</div>
                        <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
                            <span>Sent: <span className="font-semibold text-[#0f172a]">{campaign.sent}</span></span>
                            <span>Opened: <span className="font-semibold text-[#10b981]">{campaign.opened}</span></span>
                            <span>Clicked: <span className="font-semibold text-[#0ea5a3]">{campaign.clicked}</span></span>
                        </div>
                        </div>
                        <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white rounded-lg" title="Analytics">
                            <FiBarChart2 className="w-4 h-4 text-[#64748b]" />
                        </button>
                        <button className="p-2 hover:bg-white rounded-lg" title="Edit">
                            <FiEdit className="w-4 h-4 text-[#64748b]" />
                        </button>
                        <button className="p-2 hover:bg-white rounded-lg" title={campaign.status === 'active' ? 'Pause' : 'Activate'}>
                            {campaign.status === 'active' ? <FiPause className="w-4 h-4 text-[#64748b]" /> : <FiPlay className="w-4 h-4 text-[#10b981]" />}
                        </button>
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
    </div>
  );
}
