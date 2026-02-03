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
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const fetchBatches = async () => {
      if (!product?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { inventoryApi } = await import('@/lib/api/inventory');
        const response = await inventoryApi.getBatches({ drugId: product.id, minQuantity: 0 });

        console.log('Batch API Response:', response);

        // Resilient parsing: Handle direct array or wrapped { success, data }
        let rawBatches: any[] = [];
        if (Array.isArray(response)) {
          rawBatches = response;
        } else if (response?.success && Array.isArray(response.data)) {
          rawBatches = response.data;
        } else if (response?.data && Array.isArray(response.data)) {
          rawBatches = response.data;
        }

        if (rawBatches.length > 0) {
          const formattedBatches = rawBatches
            .map((batch: any) => ({
              batchId: batch.id,
              batchNumber: batch.batchNumber,
              expiry: new Date(batch.expiryDate).toLocaleDateString(),
              expiryDate: batch.expiryDate,
              qty: Number(batch.baseUnitQuantity || 0),
              mrp: Number(batch.mrp || 0),
              location: batch.location || 'N/A',
              recommended: false,
            }))
            .sort((a: any, b: any) => {
              // Priority 1: In-stock first
              if (a.qty > 0 && b.qty <= 0) return -1;
              if (a.qty <= 0 && b.qty > 0) return 1;

              // Priority 2: FEFO (Earliest expiry first)
              const dateA = new Date(a.expiryDate).getTime();
              const dateB = new Date(b.expiryDate).getTime();
              return dateA - dateB;
            });

          // Mark first in-stock batch as recommended
          if (formattedBatches.length > 0 && formattedBatches[0].qty > 0) {
            formattedBatches[0].recommended = true;
          }

          setBatches(formattedBatches);
          setSelectedIndex(0);
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (batches.length === 0 || isLoading) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, batches.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const selectedBatch = batches[selectedIndex];
          if (selectedBatch && selectedBatch.qty > 0) {
            onSelect(selectedBatch);
          } else if (selectedBatch) {
            toast.error(`Batch ${selectedBatch.batchNumber} is out of stock!`);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Tab':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % batches.length);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [batches, selectedIndex, isLoading, onSelect, onClose]);

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
              batches.map((batch, index) => (
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
                    : index === selectedIndex
                      ? 'border-emerald-500 bg-emerald-50 cursor-pointer shadow-md ring-2 ring-emerald-200'
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
                        {index === selectedIndex && (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">Selected</span>
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

          <div className="mt-4 space-y-3">
            <div className="p-3 bg-[#fef3c7] border border-[#fde68a] rounded-lg flex items-start gap-2">
              <FiAlertCircle className="w-4 h-4 text-[#f59e0b] mt-0.5 shrink-0" />
              <p className="text-xs text-[#92400e]">
                FEFO (First-Expire-First-Out) batch is recommended for optimal inventory management.
              </p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900 font-medium mb-1">Keyboard Shortcuts:</p>
              <p className="text-xs text-blue-700">
                <span className="font-mono bg-blue-100 px-1 rounded">↑/↓</span> Navigate •
                <span className="font-mono bg-blue-100 px-1 rounded ml-1">Enter/Space</span> Select •
                <span className="font-mono bg-blue-100 px-1 rounded ml-1">Esc</span> Close
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
