'use client';

import { FiMonitor, FiPrinter, FiCpu, FiVolume2, FiMoreVertical } from 'react-icons/fi';

export default function DeviceCard({ device, onClick }: any) {
  const getIcon = () => {
    if (device.type === 'pos_terminal') return <FiMonitor className="w-6 h-6 text-[#0ea5a3]" />;
    if (device.type === 'printer') return <FiPrinter className="w-6 h-6 text-[#0ea5a3]" />;
    if (device.type === 'scanner') return <FiCpu className="w-6 h-6 text-[#0ea5a3]" />;
    return <FiVolume2 className="w-6 h-6 text-[#0ea5a3]" />;
  };

  return (
    <div onClick={onClick} className="bg-white rounded-lg border border-[#e2e8f0] p-4 hover:border-[#0ea5a3] transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <h3 className="font-semibold text-[#0f172a]">{device.name}</h3>
            <p className="text-xs text-[#64748b]">{device.model} • {device.serial}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            device.status === 'online' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'
          }`}>
            {device.status}
          </span>
          <button onClick={(e) => { e.stopPropagation(); }} className="p-1 hover:bg-[#f1f5f9] rounded">
            <FiMoreVertical className="w-4 h-4 text-[#64748b]" />
          </button>
        </div>
      </div>
      <div className="space-y-1 text-sm">
        {device.ip && <div className="text-[#64748b]">IP: <span className="text-[#0f172a]">{device.ip}</span></div>}
        <div className="text-[#64748b]">Location: <span className="text-[#0f172a]">{device.location}</span></div>
        <div className="text-[#94a3b8] text-xs">Last seen: {device.lastSeen}</div>
      </div>
    </div>
  );
}
