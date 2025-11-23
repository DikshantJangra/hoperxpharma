'use client';

import { useState, useEffect } from 'react';
import { FiMail, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import LeftNav from '@/components/messages/email/LeftNav';
import Composer from '@/components/messages/email/Composer';
import Templates from '@/components/messages/email/Templates';
import Campaigns from '@/components/messages/email/Campaigns';
import Inbox from '@/components/messages/email/Inbox';
import Logs from '@/components/messages/email/Logs';

const StatSkeleton = () => (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-4 bg-gray-300 rounded w-8"></div>
    </div>
)

export default function EmailPage() {
  const [activeView, setActiveView] = useState<'composer' | 'templates' | 'campaigns' | 'inbox' | 'logs'>('composer');
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setStats({
            deliverability: 0,
            credits: 0
        });
        setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Email</h1>
            <p className="text-sm text-[#64748b]">Messages › Email</p>
          </div>
          <div className="flex items-center gap-3">
            {isLoading ? (
                <>
                    <StatSkeleton/>
                    <StatSkeleton/>
                </>
            ): (
                <>
                    <div className="px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium bg-[#d1fae5] text-[#065f46]">
                        <FiCheckCircle className="w-4 h-4" />
                        SES Connected
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f1f5f9] rounded-lg text-sm">
                        <span className="text-[#64748b]">Deliverability:</span>
                        <span className="font-semibold text-[#10b981]">{stats.deliverability}%</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f1f5f9] rounded-lg text-sm">
                        <span className="text-[#64748b]">Credits:</span>
                        <span className="font-semibold text-[#0f172a]">{stats.credits}</span>
                    </div>
                </>
            )}
          </div>
        </div>
        <p className="text-xs text-[#64748b] mt-2">
          Emails routed via SES. Configure DKIM, SPF, DMARC in Settings.
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <LeftNav activeView={activeView} onViewChange={setActiveView} />
        
        <div className="flex-1 overflow-hidden">
          {activeView === 'composer' && <Composer isLoading={isLoading} />}
          {activeView === 'templates' && <Templates isLoading={isLoading} />}
          {activeView === 'campaigns' && <Campaigns isLoading={isLoading} />}
          {activeView === 'inbox' && <Inbox isLoading={isLoading} />}
          {activeView === 'logs' && <Logs isLoading={isLoading} />}
        </div>
      </div>
    </div>
  );
}
