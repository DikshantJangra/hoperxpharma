'use client';

import { FiX, FiShield, FiUsers, FiClock } from 'react-icons/fi';

export default function PermissionDrawer({ permission, onClose }: any) {
  return (
    <div className="w-[450px] bg-white border-l border-[#e2e8f0] flex flex-col">
      <div className="p-6 border-b border-[#e2e8f0]">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="font-mono text-lg font-semibold text-[#0f172a] mb-1">{permission.name}</h2>
            <p className="text-sm text-[#64748b]">{permission.description}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#f1f5f9] rounded">
            <FiX className="w-5 h-5 text-[#64748b]" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            permission.severity === 'critical' ? 'bg-[#fee2e2] text-[#991b1b]' :
            permission.severity === 'high' ? 'bg-[#fef3c7] text-[#92400e]' :
            'bg-[#f1f5f9] text-[#64748b]'
          }`}>
            <FiShield className="inline w-3 h-3 mr-1" />
            {permission.severity}
          </span>
          <span className="px-3 py-1 bg-[#f1f5f9] text-[#64748b] rounded-full text-xs font-medium capitalize">
            {permission.category}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
            <FiUsers className="w-4 h-4" />
            Included in Roles
          </h3>
          <div className="space-y-2">
            {['Admin', 'Inventory Manager', 'Pharmacist'].map(role => (
              <div key={role} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                <span className="text-sm font-medium text-[#0f172a]">{role}</span>
                <button className="text-xs text-[#0ea5a3] hover:underline">View Role</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
            <FiUsers className="w-4 h-4" />
            Assigned Users ({permission.users})
          </h3>
          <div className="space-y-2">
            {['Aman Kumar', 'Riya Sharma', 'Priya Patel'].map(user => (
              <div key={user} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                <div>
                  <div className="text-sm font-medium text-[#0f172a]">{user}</div>
                  <div className="text-xs text-[#64748b]">via Admin role</div>
                </div>
                <button className="text-xs text-[#64748b] hover:text-[#0ea5a3]">Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
            <FiClock className="w-4 h-4" />
            Recent Changes
          </h3>
          <div className="space-y-2">
            {[
              { action: 'Permission enabled for Inventory Manager', user: 'Admin', time: '3 days ago' },
              { action: 'Permission removed from Cashier', user: 'Admin', time: '1 week ago' }
            ].map((log, i) => (
              <div key={i} className="p-3 bg-[#f8fafc] rounded-lg">
                <div className="text-sm text-[#0f172a] mb-1">{log.action}</div>
                <div className="text-xs text-[#64748b]">{log.user} · {log.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Related Permissions</h3>
          <div className="space-y-1">
            {['inventory.view', 'inventory.edit', 'inventory.delete'].map(rel => (
              <button key={rel} className="w-full text-left px-3 py-2 bg-[#f8fafc] rounded-lg hover:bg-[#f0fdfa] text-sm font-mono text-[#64748b] hover:text-[#0ea5a3] transition-colors">
                {rel}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
