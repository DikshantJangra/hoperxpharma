'use client';

import { FiClock, FiPackage } from 'react-icons/fi';

export default function ContextDrawer({ rx }: any) {
  return (
    <div className="w-80 bg-white border-l border-[#e2e8f0] overflow-y-auto">
      <div className="p-4 border-b border-[#e2e8f0]">
        <h3 className="text-sm font-semibold text-[#0f172a]">Context & Tools</h3>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
            <FiClock className="w-4 h-4" />
            Patient History
          </h4>
          <div className="space-y-2">
            {[
              { drug: 'Paracetamol 500mg', date: '2 weeks ago', qty: 10 },
              { drug: 'Cetirizine 10mg', date: '1 month ago', qty: 30 }
            ].map((item, i) => (
              <div key={i} className="p-3 bg-[#f8fafc] rounded-lg">
                <div className="text-sm font-medium text-[#0f172a]">{item.drug}</div>
                <div className="text-xs text-[#64748b]">{item.date} • Qty: {item.qty}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
            <FiPackage className="w-4 h-4" />
            Inventory Status
          </h4>
          <div className="space-y-2">
            {[
              { drug: 'Paracetamol 500mg', stock: 250, batch: 'B-2025-01', expiry: '2026-12' },
              { drug: 'Amoxicillin 250mg', stock: 120, batch: 'B-2025-11', expiry: '2026-01' }
            ].map((item, i) => (
              <div key={i} className="p-3 bg-[#f8fafc] rounded-lg">
                <div className="text-sm font-medium text-[#0f172a] mb-1">{item.drug}</div>
                <div className="text-xs text-[#64748b]">
                  Stock: <span className="font-semibold text-[#10b981]">{item.stock}</span>
                </div>
                <div className="text-xs text-[#64748b]">
                  Batch: {item.batch} • Exp: {item.expiry}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
