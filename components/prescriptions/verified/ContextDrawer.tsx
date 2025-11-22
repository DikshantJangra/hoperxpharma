'use client';

import { useState, useEffect } from 'react';
import { FiClock, FiPackage } from 'react-icons/fi';

const HistoryItemSkeleton = () => (
    <div className="p-3 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
    </div>
)

export default function ContextDrawer({ rx, isLoading }: any) {
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<any[]>([]);

  useEffect(() => {
    if (rx && !isLoading) {
        // Simulate fetching patient history and inventory status based on rx
        setPatientHistory([]);
        setInventoryStatus([]);
    } else if (!rx) {
        setPatientHistory([]);
        setInventoryStatus([]);
    }
  }, [rx, isLoading]);

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
            {isLoading ? (
                <>
                    <HistoryItemSkeleton/>
                    <HistoryItemSkeleton/>
                </>
            ) : patientHistory.length > 0 ? (
                patientHistory.map((item, i) => (
                    <div key={i} className="p-3 bg-[#f8fafc] rounded-lg">
                        <div className="text-sm font-medium text-[#0f172a]">{item.drug}</div>
                        <div className="text-xs text-[#64748b]">{item.date} • Qty: {item.qty}</div>
                    </div>
                ))
            ) : (
                <div className="text-center text-gray-500 text-xs">No patient history found.</div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
            <FiPackage className="w-4 h-4" />
            Inventory Status
          </h4>
          <div className="space-y-2">
            {isLoading ? (
                <>
                    <HistoryItemSkeleton/>
                    <HistoryItemSkeleton/>
                </>
            ) : inventoryStatus.length > 0 ? (
                inventoryStatus.map((item, i) => (
                    <div key={i} className="p-3 bg-[#f8fafc] rounded-lg">
                        <div className="text-sm font-medium text-[#0f172a] mb-1">{item.drug}</div>
                        <div className="text-xs text-[#64748b]">
                            Stock: <span className="font-semibold text-[#10b981]">{item.stock}</span>
                        </div>
                        <div className="text-xs text-[#64748b]">
                            Batch: {item.batch} • Exp: {item.expiry}
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center text-gray-500 text-xs">No inventory status found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
