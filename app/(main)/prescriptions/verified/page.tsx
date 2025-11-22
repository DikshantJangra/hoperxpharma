'use client';

import { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import QueueList from '@/components/prescriptions/verified/QueueList';
import RxDetailPanel from '@/components/prescriptions/verified/RxDetailPanel';
import ContextDrawer from '@/components/prescriptions/verified/ContextDrawer';

export default function VerifiedPage() {
  const [selectedRx, setSelectedRx] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [pendingCount, setPendingCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setPendingCount(0);
        setUrgentCount(0);
        setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Prescription Verification</h1>
            <p className="text-sm text-[#64748b]">Prescriptions › Verified</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="px-3 py-1.5 bg-[#fef3c7] rounded-lg">
                <span className="text-[#64748b]">Pending:</span>
                {isLoading ? <span className="ml-2 font-semibold text-[#92400e] animate-pulse">...</span> : <span className="ml-2 font-semibold text-[#92400e]">{pendingCount}</span>}
              </div>
              <div className="px-3 py-1.5 bg-[#fee2e2] rounded-lg">
                <span className="text-[#64748b]">Urgent:</span>
                {isLoading ? <span className="ml-2 font-semibold text-[#991b1b] animate-pulse">...</span> : <span className="ml-2 font-semibold text-[#991b1b]">{urgentCount}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Search by Rx ID, patient name, phone, clinician... (Press / to focus)" 
            className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]" 
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <QueueList filter={filter} searchQuery={searchQuery} onSelectRx={setSelectedRx} selectedRx={selectedRx} isLoading={isLoading} />
        <div className="flex-1 overflow-hidden">
          {selectedRx ? <RxDetailPanel rx={selectedRx} isLoading={isLoading && !selectedRx} /> : (
            <div className="h-full flex items-center justify-center text-[#64748b]">
              <div className="text-center">
                <p className="text-lg mb-2">No prescription selected</p>
                <p className="text-sm">Select a prescription from the queue to verify</p>
              </div>
            </div>
          )}
        </div>
        {selectedRx && <ContextDrawer rx={selectedRx} isLoading={isLoading && !selectedRx} />}
      </div>
    </div>
  );
}
