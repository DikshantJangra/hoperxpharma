'use client';

import { useState, useEffect } from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'sonner';

interface Batch {
  batchId: string;
  batchNumber: string;
  expiry: string;
  expiryDate?: string; // Raw ISO date
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
    const fetchBatches = async () => {
      if (!product?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { inventoryApi } = await import('@/lib/api/inventory');
        const response = await inventoryApi.getBatches({ drugId: product.id, limit: 100 });

        console.log('Batch API Response:', response);

        // Handle paginated response - data is an array of batches
        let batchesData: any[] = [];

        if (response?.data) {
          // Check if it's a paginated response or direct array
          batchesData = Array.isArray(response.data) ? response.data : [];
        }

        console.log('Batches Data:', batchesData);

        if (batchesData.length > 0) {
          // Transform to match expected format
          const formattedBatches: Batch[] = batchesData
            .map((batch: any) => ({
              batchId: batch.id,
              batchNumber: batch.batchNumber,
              expiry: new Date(batch.expiryDate).toLocaleDateString(),
              expiryDate: batch.expiryDate,
              qty: batch.quantityInStock,
              mrp: Number(batch.mrp),
              location: batch.location || 'N/A',
              recommended: false, // Will set after sorting
            }))
            .sort((a, b) => {
              // Sort by stock: in-stock (qty > 0) first, then out-of-stock (qty = 0)
              if (a.qty > 0 && b.qty === 0) return -1;
              if (a.qty === 0 && b.qty > 0) return 1;
              // If both have stock or both out of stock, maintain FEFO (earliest expiry first)
              return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
            });

          // Mark first in-stock batch as recommended (FEFO)
          if (formattedBatches.length > 0 && formattedBatches[0].qty > 0) {
            formattedBatches[0].recommended = true;
          }

          setBatches(formattedBatches);
        } else {
          setBatches([]);
        }
      } catch (error) {
        console.error('Failed to fetch batches:', error);
        setBatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatches();
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
                <BatchCardSkeleton />
                <BatchCardSkeleton />
                <BatchCardSkeleton />
              </>
            ) : batches.length > 0 ? (
              batches.map((batch) => (
                <div
                  key={batch.batchId}
                  onClick={() => {
                    if (batch.qty <= 0) {
                      toast.error(`Batch ${batch.batchNumber} is out of stock!`);
                      return;
                    }
                    onSelect(batch);
                  }}
                  className={`p-4 border-2 rounded-lg transition-all ${batch.qty <= 0
                    ? 'opacity-50 cursor-not-allowed border-gray-300 bg-gray-50'
                    : batch.recommended
                      ? 'border-[#0ea5a3] bg-[#f0fdfa] cursor-pointer hover:shadow-md'
                      : 'border-[#e2e8f0] hover:border-[#cbd5e1] cursor-pointer hover:shadow-md'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0f172a]">{batch.batchNumber}</span>
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
                      <div className={`text-sm font-medium ${batch.qty === 0 ? 'text-red-600' : batch.qty < 5 ? 'text-orange-600' : 'text-[#64748b]'
                        }`}>
                        {batch.qty === 0 ? 'Out of Stock' : `Qty: ${batch.qty}`}
                        {batch.qty > 0 && batch.qty < 5 && ' (Low)'}
                      </div>
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
