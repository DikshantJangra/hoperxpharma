'use client';

import { useState } from 'react';
import { FiCheckCircle, FiClock, FiDatabase, FiDownload, FiPlay, FiShield } from 'react-icons/fi';
import Overview from '@/components/integrations/backups/Overview';
import BackupPlans from '@/components/integrations/backups/BackupPlans';
import Restore from '@/components/integrations/backups/Restore';
import Snapshots from '@/components/integrations/backups/Snapshots';
import Storage from '@/components/integrations/backups/Storage';
import Retention from '@/components/integrations/backups/Retention';
import ActivityLog from '@/components/integrations/backups/ActivityLog';

export default function BackupsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'restore' | 'snapshots' | 'storage' | 'retention' | 'activity'>('overview');

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Backup & Restore</h1>
            <p className="text-sm text-[#64748b]">Integrations › Backups</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm font-medium">
              <FiShield className="w-4 h-4" />
              Verify Integrity
            </button>
            <button className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm font-medium">
              <FiDownload className="w-4 h-4" />
              Download Backup
            </button>
            <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm font-medium">
              <FiPlay className="w-4 h-4" />
              Run Backup Now
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#f0fdfa] rounded-lg border border-[#0ea5a3]">
            <FiCheckCircle className="w-5 h-5 text-[#10b981]" />
            <div>
              <div className="text-xs text-[#64748b]">Last Backup</div>
              <div className="text-sm font-semibold text-[#0f172a]">Today · 3:12 AM</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
            <FiClock className="w-5 h-5 text-[#64748b]" />
            <div>
              <div className="text-xs text-[#64748b]">Next Scheduled</div>
              <div className="text-sm font-semibold text-[#0f172a]">Tonight · 2:00 AM</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
            <FiDatabase className="w-5 h-5 text-[#64748b]" />
            <div>
              <div className="text-xs text-[#64748b]">Storage Used</div>
              <div className="text-sm font-semibold text-[#0f172a]">2.1 GB / 100 GB</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
            <FiShield className="w-5 h-5 text-[#10b981]" />
            <div>
              <div className="text-xs text-[#64748b]">Health</div>
              <div className="text-sm font-semibold text-[#10b981]">All OK</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#64748b] mt-3">
          Don't worry, your data is safe. Backups are encrypted and integrity-verified.
        </p>
      </div>

      <div className="bg-white border-b border-[#e2e8f0] px-6">
        <div className="flex items-center gap-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'plans', label: 'Backup Plans' },
            { id: 'restore', label: 'Restore' },
            { id: 'snapshots', label: 'Snapshots' },
            { id: 'storage', label: 'Storage' },
            { id: 'retention', label: 'Retention' },
            { id: 'activity', label: 'Activity' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-[#0ea5a3] text-[#0ea5a3]' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'plans' && <BackupPlans />}
        {activeTab === 'restore' && <Restore />}
        {activeTab === 'snapshots' && <Snapshots />}
        {activeTab === 'storage' && <Storage />}
        {activeTab === 'retention' && <Retention />}
        {activeTab === 'activity' && <ActivityLog />}
      </div>
    </div>
  );
}
