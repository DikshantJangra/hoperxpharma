'use client';

import { FiX, FiActivity, FiWifi, FiClock, FiUser } from 'react-icons/fi';

export default function DeviceDetailDrawer({ device, onClose }: any) {
  return (
    <div className="w-[450px] bg-white border-l border-[#e2e8f0] flex flex-col">
      <div className="p-6 border-b border-[#e2e8f0]">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-[#0f172a]">{device.name}</h2>
            <p className="text-sm text-[#64748b]">{device.model}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#f1f5f9] rounded">
            <FiX className="w-5 h-5 text-[#64748b]" />
          </button>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          device.status === 'online' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'
        }`}>
          {device.status}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Device Information</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Serial', value: device.serial },
              { label: 'Vendor', value: device.vendor },
              { label: 'Type', value: device.type },
              { label: 'Location', value: device.location },
              { label: 'Assigned To', value: device.assignedTo || 'Unassigned' }
            ].map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-[#64748b]">{item.label}:</span>
                <span className="font-medium text-[#0f172a]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
            <FiWifi className="w-4 h-4" />
            Connectivity
          </h3>
          <div className="space-y-2 text-sm">
            {device.ip && <div className="flex justify-between"><span className="text-[#64748b]">IP:</span><span className="font-medium text-[#0f172a]">{device.ip}</span></div>}
            {device.mac && <div className="flex justify-between"><span className="text-[#64748b]">MAC:</span><span className="font-medium text-[#0f172a]">{device.mac}</span></div>}
            <div className="flex justify-between"><span className="text-[#64748b]">Last Seen:</span><span className="font-medium text-[#0f172a]">{device.lastSeen}</span></div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg hover:bg-[#f0fdfa] hover:border-[#0ea5a3] text-sm font-medium flex items-center justify-center gap-2">
              <FiActivity className="w-4 h-4" />
              Test Print
            </button>
            <button className="w-full px-4 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg hover:bg-[#f0fdfa] hover:border-[#0ea5a3] text-sm font-medium flex items-center justify-center gap-2">
              <FiWifi className="w-4 h-4" />
              Ping Device
            </button>
            <button className="w-full px-4 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg hover:bg-[#f0fdfa] hover:border-[#0ea5a3] text-sm font-medium flex items-center justify-center gap-2">
              <FiUser className="w-4 h-4" />
              Assign to User
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
            <FiClock className="w-4 h-4" />
            Recent Activity
          </h3>
          <div className="space-y-2">
            {[
              { action: 'Device online', time: '2 min ago' },
              { action: 'Test print successful', time: '1 hour ago' },
              { action: 'Device registered', time: '2 days ago' }
            ].map((log, i) => (
              <div key={i} className="p-3 bg-[#f8fafc] rounded-lg">
                <div className="text-sm text-[#0f172a]">{log.action}</div>
                <div className="text-xs text-[#64748b]">{log.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
