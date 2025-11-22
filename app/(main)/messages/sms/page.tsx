'use client';

import { useState, useEffect } from 'react';
import { FiSettings } from 'react-icons/fi';
import SMSNav from '@/components/messages/sms/SMSNav';
import Composer from '@/components/messages/sms/Composer';
import Templates from '@/components/messages/sms/Templates';
import Campaigns from '@/components/messages/sms/Campaigns';
import Inbox from '@/components/messages/sms/Inbox';
import Logs from '@/components/messages/sms/Logs';

const StatSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
        <div className="h-4 bg-gray-300 rounded w-12"></div>
    </div>
)

export default function SMSPage() {
  const [activeTab, setActiveTab] = useState<'composer' | 'templates' | 'campaigns' | 'inbox' | 'logs'>('composer');
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setStats({ credits: 0, cost: "0.00", throttle: 0 });
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, [])

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">SMS</h1>
            <p className="text-sm text-[#64748b]">Messages › SMS</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-[#64748b]">Provider</p>
              <select className="text-sm font-medium text-[#0f172a] border-none focus:outline-none" disabled={isLoading}>
                <option>Twilio - +91 98XXXX</option>
                <option>MSG91 - 5XXXX</option>
              </select>
            </div>
            {isLoading ? (
                <StatSkeleton/>
            ) : (
                <div className="text-right">
                    <p className="text-xs text-[#64748b]">Credits</p>
                    <p className="text-sm font-semibold text-[#0f172a]">{stats.credits}</p>
                </div>
            )}
            <button className="p-2 hover:bg-[#f8fafc] rounded-lg" disabled={isLoading}>
              <FiSettings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-2 px-2 py-1 bg-[#d1fae5] rounded">
            <div className="w-2 h-2 bg-[#10b981] rounded-full" />
            <span className="text-[#065f46]">Connected</span>
          </div>
          <span className="text-[#64748b]">•</span>
          {isLoading ? (
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <>
                <span className="text-[#64748b]">Cost/day: ₹{stats.cost}</span>
                <span className="text-[#64748b]">•</span>
                <span className="text-[#64748b]">Throttle: {stats.throttle} msg/sec</span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <SMSNav activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 overflow-hidden">
          {activeTab === 'composer' && <Composer />}
          {activeTab === 'templates' && <Templates />}
          {activeTab === 'campaigns' && <Campaigns />}
          {activeTab === 'inbox' && <Inbox />}
          {activeTab === 'logs' && <Logs />}
        </div>
      </div>
    </div>
  );
}
