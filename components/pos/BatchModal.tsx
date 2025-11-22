'use client';

import { useState, useEffect } from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';

interface Batch {
  batchId: string;
  expiry: string;
  qty: number;
  mrp: number;
  location: string;
  recommended?: boolean;
}

const BatchCardSkeleton = () => (
    <div className="p-4 border-2 rounded-lg animate-pulse border-[#e2e8f0]">
        <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
            <div className="space-y-2 text-right ml-4">
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="h-3 bg-gray-100 rounded w-8"></div>
            </div>
        </div>
    </div>
)

export default function BatchModal({ product, onSelect, onClose }: any) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setBatches([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, [product]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
          <div>
            <h3 className="text-lg font-bold text-[#0f172a]">Select Batch</h3>
            <p className="text-sm text-[#64748b]">{product?.name}</p>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#0f172a] p-1 rounded hover:bg-[#f8fafc]" disabled={isLoading}>
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[400px] overflow-y-auto">
          <div className="space-y-2">
            {isLoading ? (
                <>
                    <BatchCardSkeleton/>
                    <BatchCardSkeleton/>
                    <BatchCardSkeleton/>
                </>
            ) : batches.length > 0 ? (
                batches.map((batch) => (
                    <div
                        key={batch.batchId}
                        onClick={() => onSelect(batch)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        batch.recommended
                            ? 'border-[#0ea5a3] bg-[#f0fdfa]'
                            : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#0f172a]">{batch.batchId}</span>
                            {batch.recommended && (
                                <span className="px-2 py-0.5 bg-[#0ea5a3] text-white text-xs rounded-full">FEFO</span>
                            )}
                            </div>
                            <div className="text-sm text-[#64748b] mt-1">
                            Expiry: {batch.expiry} • Location: {batch.location}
                            </div>
                        </div>
                        <div className="text-right ml-4">
                            <div className="font-semibold text-[#0f172a]">₹{batch.mrp}</div>
                            <div className="text-sm text-[#64748b]">Qty: {batch.qty}</div>
                        </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-10 text-gray-500">No batches available for this product.</div>
            )}
          </div>

          <div className="mt-4 p-3 bg-[#fef3c7] border border-[#fde68a] rounded-lg flex items-start gap-2">
            <FiAlertCircle className="w-4 h-4 text-[#f59e0b] mt-0.5 shrink-0" />
            <p className="text-xs text-[#92400e]">
              FEFO (First-Expire-First-Out) batch is recommended for optimal inventory management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
