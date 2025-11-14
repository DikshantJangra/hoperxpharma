'use client';

import { FiAlertTriangle } from 'react-icons/fi';

export default function RxItemRow({ item, hasAlert }: any) {
  return (
    <div className={`p-4 rounded-lg border ${
      hasAlert ? 'bg-[#fef3c7] border-[#fde68a]' : 'bg-[#f8fafc] border-[#e2e8f0]'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-[#0f172a]">{item.drug}</h4>
            {hasAlert && <FiAlertTriangle className="w-4 h-4 text-[#f59e0b]" />}
          </div>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-[#64748b]">Dose:</span>
              <span className="ml-2 text-[#0f172a] font-medium">{item.dose}</span>
            </div>
            <div>
              <span className="text-[#64748b]">Frequency:</span>
              <span className="ml-2 text-[#0f172a] font-medium">{item.frequency}</span>
            </div>
            <div>
              <span className="text-[#64748b]">Route:</span>
              <span className="ml-2 text-[#0f172a] font-medium">{item.route}</span>
            </div>
            <div>
              <span className="text-[#64748b]">Duration:</span>
              <span className="ml-2 text-[#0f172a] font-medium">{item.duration}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-[#64748b]">Qty</div>
          <div className="text-lg font-semibold text-[#0f172a]">{item.qty}</div>
        </div>
      </div>
      {item.instructions && (
        <div className="text-sm text-[#64748b] mt-2">
          <span className="font-medium">Instructions:</span> {item.instructions}
        </div>
      )}
    </div>
  );
}
