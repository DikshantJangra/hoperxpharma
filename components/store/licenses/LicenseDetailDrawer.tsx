'use client';

import { FiX, FiDownload, FiCheckCircle, FiXCircle, FiClock, FiUser } from 'react-icons/fi';

export default function LicenseDetailDrawer({ license, onClose }: any) {
  return (
    <div className="w-[500px] bg-white border-l border-[#e2e8f0] flex flex-col">
      <div className="p-6 border-b border-[#e2e8f0]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-1">{license.type}</h2>
            <p className="text-sm text-[#64748b]">{license.number}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#f1f5f9] rounded">
            <FiX className="w-5 h-5 text-[#64748b]" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            license.status === 'approved' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fef3c7] text-[#92400e]'
          }`}>
            {license.status}
          </span>
          {license.daysToExpiry < 60 && (
            <span className="px-3 py-1 bg-[#fee2e2] text-[#991b1b] rounded-full text-xs font-medium">
              Expires in {license.daysToExpiry} days
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3">License Information</h3>
          <div className="space-y-3">
            {[
              { label: 'Issuing Authority', value: license.authority },
              { label: 'License Number', value: license.number },
              { label: 'Valid From', value: license.validFrom },
              { label: 'Valid To', value: license.validTo },
              { label: 'Uploaded By', value: license.uploader },
              { label: 'Last Updated', value: license.lastUpdated }
            ].map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[#64748b]">{item.label}:</span>
                <span className="font-medium text-[#0f172a]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
            <FiClock className="w-4 h-4" />
            Audit Timeline
          </h3>
          <div className="space-y-3">
            {[
              { action: 'License approved', user: 'Admin', time: '2025-10-01 10:30 AM', icon: FiCheckCircle, color: 'text-[#10b981]' },
              { action: 'Submitted for verification', user: 'Aman Kumar', time: '2025-10-01 09:15 AM', icon: FiUser, color: 'text-[#64748b]' },
              { action: 'Document uploaded', user: 'Aman Kumar', time: '2025-10-01 09:10 AM', icon: FiUser, color: 'text-[#64748b]' }
            ].map((event, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[#f8fafc] rounded-lg">
                <event.icon className={`w-4 h-4 mt-0.5 ${event.color}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#0f172a]">{event.action}</div>
                  <div className="text-xs text-[#64748b]">{event.user} · {event.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {license.status === 'pending' && (
          <div>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Verification Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] flex items-center justify-center gap-2 text-sm font-medium">
                <FiCheckCircle className="w-4 h-4" />
                Approve License
              </button>
              <button className="w-full px-4 py-2 bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] flex items-center justify-center gap-2 text-sm font-medium">
                <FiXCircle className="w-4 h-4" />
                Reject License
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-[#e2e8f0]">
        <button className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center justify-center gap-2 text-sm font-medium">
          <FiDownload className="w-4 h-4" />
          Download Document
        </button>
      </div>
    </div>
  );
}
