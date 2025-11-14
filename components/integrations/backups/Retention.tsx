'use client';

import { FiClock, FiShield } from 'react-icons/fi';

export default function Retention() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-[#0f172a] mb-6">Retention & Compliance</h2>
      
      <div className="grid grid-cols-2 gap-6">
        {[
          { label: 'Database', retention: '365 days', compliance: 'CDSCO' },
          { label: 'Invoices', retention: '8 years', compliance: 'GST' },
          { label: 'Prescriptions', retention: '5 years', compliance: 'CDSCO' },
          { label: 'Logs', retention: '90 days', compliance: 'Audit' }
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-lg border border-[#e2e8f0] p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiClock className="w-5 h-5 text-[#0ea5a3]" />
              <h3 className="font-semibold text-[#0f172a]">{item.label}</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Retention:</span>
                <span className="font-medium text-[#0f172a]">{item.retention}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Compliance:</span>
                <span className="px-2 py-1 bg-[#d1fae5] text-[#065f46] rounded text-xs font-medium">
                  <FiShield className="inline w-3 h-3 mr-1" />
                  {item.compliance}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
