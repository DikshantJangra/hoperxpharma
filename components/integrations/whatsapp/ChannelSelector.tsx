'use client';

import { FiPlus, FiCheckCircle, FiClock, FiMoreVertical } from 'react-icons/fi';
import { SiWhatsapp, SiTwilio } from 'react-icons/si';

const MOCK_CHANNELS = [
  { id: '1', name: 'Main Store', phone: '+91 98765 43210', provider: 'Meta', status: 'connected', lastMessage: '2 min ago' },
  { id: '2', name: 'Branch Store', phone: '+91 98765 43211', provider: 'Twilio', status: 'connected', lastMessage: '15 min ago' },
];

export default function ChannelSelector({ selectedChannel, onSelectChannel, onAddChannel }: any) {
  return (
    <div className="w-72 bg-white border-r border-[#e2e8f0] flex flex-col">
      <div className="p-4 border-b border-[#e2e8f0]">
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Connected Channels</h3>
        <button onClick={onAddChannel} className="w-full px-3 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center justify-center gap-2 text-sm font-medium">
          <FiPlus className="w-4 h-4" />
          Add Channel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {MOCK_CHANNELS.map(channel => (
          <div key={channel.id} onClick={() => onSelectChannel(channel)} className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
              selectedChannel?.id === channel.id ? 'bg-[#f0fdfa] border border-[#0ea5a3]' : 'hover:bg-[#f8fafc] border border-transparent'
            }`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {channel.provider === 'Meta' ? (
                  <SiWhatsapp className="w-5 h-5 text-[#25d366]" />
                ) : (
                  <SiTwilio className="w-5 h-5 text-[#f22f46]" />
                )}
                <div>
                  <div className="font-medium text-sm text-[#0f172a]">{channel.name}</div>
                  <div className="text-xs text-[#64748b]">{channel.phone}</div>
                </div>
              </div>
              <button className="p-1 hover:bg-[#f1f5f9] rounded">
                <FiMoreVertical className="w-4 h-4 text-[#64748b]" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs">
                <FiCheckCircle className="w-3 h-3 text-[#10b981]" />
                <span className="text-[#10b981]">{channel.status}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#64748b]">
                <FiClock className="w-3 h-3" />
                {channel.lastMessage}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[#e2e8f0] bg-[#f8fafc]">
        <div className="text-xs text-[#64748b] space-y-1">
          <div className="flex justify-between">
            <span>Total Channels:</span>
            <span className="font-semibold text-[#0f172a]">{MOCK_CHANNELS.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Active:</span>
            <span className="font-semibold text-[#10b981]">{MOCK_CHANNELS.filter(c => c.status === 'connected').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
