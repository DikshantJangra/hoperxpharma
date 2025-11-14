'use client';

import { useState } from 'react';
import { FiPlus, FiActivity, FiMessageSquare, FiDollarSign, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import ChannelSelector from '@/components/integrations/whatsapp/ChannelSelector';
import OverviewDashboard from '@/components/integrations/whatsapp/OverviewDashboard';
import QuickComposer from '@/components/integrations/whatsapp/QuickComposer';
import TemplatesLibrary from '@/components/integrations/whatsapp/TemplatesLibrary';
import AutomationFlows from '@/components/integrations/whatsapp/AutomationFlows';
import Inbox from '@/components/integrations/whatsapp/Inbox';
import ConnectChannelModal from '@/components/integrations/whatsapp/ConnectChannelModal';

export default function WhatsAppIntegrationPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'automation' | 'campaigns'>('overview');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [showInbox, setShowInbox] = useState(true);

  const isConnected = true;
  const connectionStatus = isConnected ? 'Connected' : 'Disconnected';

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">WhatsApp Integration</h1>
            <p className="text-sm text-[#64748b]">Integrations › WhatsApp</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium ${
              isConnected ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'
            }`}>
              {isConnected ? <FiCheckCircle className="w-4 h-4" /> : <FiAlertCircle className="w-4 h-4" />}
              {connectionStatus}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f1f5f9] rounded-lg text-sm">
              <FiMessageSquare className="w-4 h-4 text-[#64748b]" />
              <span className="text-[#64748b]">Today:</span>
              <span className="font-semibold text-[#0f172a]">247</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f1f5f9] rounded-lg text-sm">
              <FiActivity className="w-4 h-4 text-[#64748b]" />
              <span className="text-[#64748b]">Delivered:</span>
              <span className="font-semibold text-[#10b981]">242</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f1f5f9] rounded-lg text-sm">
              <FiDollarSign className="w-4 h-4 text-[#64748b]" />
              <span className="text-[#64748b]">Cost:</span>
              <span className="font-semibold text-[#0f172a]">₹124</span>
            </div>
            {!isConnected && (
              <button onClick={() => setShowConnectModal(true)} className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm font-medium">
                <FiPlus className="w-4 h-4" />
                Connect Channel
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-[#64748b]">
          Connect WhatsApp Business (WABA) or use 3rd-party providers (Twilio, 360dialog). Messages are logged for compliance.
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <ChannelSelector selectedChannel={selectedChannel} onSelectChannel={setSelectedChannel} onAddChannel={() => setShowConnectModal(true)} />

        <div className={`${showInbox ? 'flex-1' : 'flex-[2]'} flex flex-col overflow-hidden`}>
          <div className="bg-white border-b border-[#e2e8f0] px-6">
            <div className="flex items-center gap-1">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'templates', label: 'Templates' },
                { id: 'automation', label: 'Automation' },
                { id: 'campaigns', label: 'Campaigns' }
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
            {activeTab === 'overview' && (
              <div className="p-6 space-y-6">
                <OverviewDashboard />
                <QuickComposer />
              </div>
            )}
            {activeTab === 'templates' && <TemplatesLibrary />}
            {activeTab === 'automation' && <AutomationFlows />}
            {activeTab === 'campaigns' && (
              <div className="p-6">
                <div className="text-center py-12">
                  <p className="text-[#64748b]">Campaigns feature coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {showInbox && <Inbox onClose={() => setShowInbox(false)} />}
      </div>

      {showConnectModal && <ConnectChannelModal onClose={() => setShowConnectModal(false)} />}
    </div>
  );
}
