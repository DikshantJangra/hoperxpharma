'use client';

import { FiFileText, FiDownload, FiUpload, FiCheckCircle, FiClock, FiAlertTriangle } from 'react-icons/fi';

export default function LicenseCard({ license, onClick }: any) {
  const getStatusColor = () => {
    if (license.status === 'approved') return 'bg-[#d1fae5] text-[#065f46]';
    if (license.status === 'expiring' || license.daysToExpiry < 60) return 'bg-[#fef3c7] text-[#92400e]';
    if (license.status === 'expired') return 'bg-[#fee2e2] text-[#991b1b]';
    return 'bg-[#f1f5f9] text-[#64748b]';
  };

  const getStatusIcon = () => {
    if (license.status === 'approved') return <FiCheckCircle className="w-3 h-3" />;
    if (license.status === 'expiring' || license.daysToExpiry < 60) return <FiAlertTriangle className="w-3 h-3" />;
    return <FiClock className="w-3 h-3" />;
  };

  return (
    <div onClick={onClick} className="bg-white rounded-lg border border-[#e2e8f0] p-5 hover:border-[#0ea5a3] transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <FiFileText className="w-6 h-6 text-[#0ea5a3]" />
          <div>
            <h3 className="font-semibold text-[#0f172a]">{license.type}</h3>
            <p className="text-xs text-[#64748b]">{license.authority}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor()}`}>
          {getStatusIcon()}
          {license.status === 'approved' && license.daysToExpiry < 60 ? 'Expiring' : license.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-[#64748b]">License No:</span>
          <span className="font-medium text-[#0f172a]">{license.number}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#64748b]">Valid Until:</span>
          <span className="font-medium text-[#0f172a]">{license.validTo}</span>
        </div>
        {license.daysToExpiry < 60 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Expires in:</span>
            <span className={`font-semibold ${license.daysToExpiry < 14 ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>
              {license.daysToExpiry} days
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#f1f5f9]">
        <div className="text-xs text-[#94a3b8]">
          Uploaded by {license.uploader}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 hover:bg-[#f1f5f9] rounded" title="Download">
            <FiDownload className="w-4 h-4 text-[#64748b]" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 hover:bg-[#f1f5f9] rounded" title="Upload new version">
            <FiUpload className="w-4 h-4 text-[#64748b]" />
          </button>
        </div>
      </div>
    </div>
  );
}
