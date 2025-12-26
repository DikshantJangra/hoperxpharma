'use client';

import { useState } from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

export default function AdjustBatchModal({ batch, onClose, onSuccess }: any) {
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentQty = Number(batch.qtyOnHand) || 0;
  const resultingQty = currentQty + delta;

  // Enable enhanced keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation();

  const handleSubmit = async () => {
    if (!reason || delta === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    if (resultingQty < 0) {
      toast.error('Resulting quantity cannot be negative');
      return;
    }

    setIsSubmitting(true);

    try {
      const { inventoryApi } = await import('@/lib/api/inventory');

      await inventoryApi.adjustStock({
        batchId: batch.id,
        quantityAdjusted: delta,
        reason
      });

      toast.success(`Stock adjusted successfully: ${delta > 0 ? '+' : ''}${delta} units`);

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error: any) {
      console.error('Failed to adjust stock:', error);
      toast.error(error.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        data-focus-trap="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
          <h3 className="text-lg font-bold text-[#0f172a]">Adjust Batch Quantity</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#f8fafc] rounded" disabled={isSubmitting}>
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-[#0f172a] mb-1">Batch: {batch.id}</p>
            <p className="text-xs text-[#64748b]">{batch.itemName}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-[#64748b] mb-2 block">Adjustment</label>
            <input
              type="number"
              value={delta || ''}
              onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
              placeholder="Enter +/- quantity"
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              disabled={isSubmitting}
            />
            <p className="text-xs text-[#64748b] mt-1">
              Current: {currentQty} → Resulting: <span className={resultingQty < 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}>{resultingQty}</span>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-[#64748b] mb-2 block">Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              disabled={isSubmitting}
            >
              <option value="">Select reason...</option>
              <option value="count">Count correction</option>
              <option value="damage">Damage</option>
              <option value="expiry">Expiry write-off</option>
              <option value="return">Return to supplier</option>
              <option value="lost">Lost/Theft</option>
            </select>
          </div>

          {delta < 0 && (
            <div className="p-3 bg-[#fef3c7] border border-[#fde68a] rounded-lg flex items-start gap-2">
              <FiAlertCircle className="w-4 h-4 text-[#f59e0b] mt-0.5 shrink-0" />
              <p className="text-xs text-[#92400e]">
                Negative adjustments are audited. This action will be logged with your user ID and timestamp.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#e2e8f0] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc]"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || delta === 0 || isSubmitting}
            className="flex-1 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] disabled:bg-[#cbd5e1] disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adjusting...
              </>
            ) : (
              'Confirm Adjustment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
