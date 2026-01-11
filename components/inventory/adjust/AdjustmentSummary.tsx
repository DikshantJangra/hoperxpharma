'use client';
import { formatUnitName } from '@/lib/utils/stock-display';

export default function AdjustmentSummary({ items, onSubmit }: any) {
  const totalDelta = items.reduce((sum: number, item: any) => sum + item.delta, 0);
  const financialImpact = items.reduce((sum: number, item: any) => sum + (item.delta * 35), 0);
  const hasControlled = items.some((item: any) => item.reason === 'controlled');
  const isValid = items.every((item: any) => item.batchId && item.reason && item.newQty !== item.currentQty);

  return (
    <div className="flex-shrink-0 bg-white border-t border-[#e2e8f0] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#f8fafc] rounded-lg p-4 mb-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[#64748b] mb-1">Total Items</p>
              <p className="text-xl font-bold text-[#0f172a]">{items.length}</p>
            </div>
            <div>
              <p className="text-[#64748b] mb-1">Total Delta</p>
              <p className={`text-xl font-bold ${totalDelta > 0 ? 'text-[#10b981]' : totalDelta < 0 ? 'text-[#ef4444]' : 'text-[#64748b]'
                }`}>
                {totalDelta > 0 ? '+' : ''}{totalDelta} <span className="text-[10px] font-normal uppercase">Totals</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Net Financial Impact</div>
              <div className={`text-xl font-bold ${financialImpact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ₹{financialImpact.toFixed(2)}
              </div>
            </div>
            <div>
              <p className="text-[#64748b] mb-1">Audit Impact</p>
              <p className="text-xl font-bold text-[#0f172a]">{items.length} entries</p>
            </div>
          </div>

          {hasControlled && (
            <div className="mt-4 p-3 bg-[#fef3c7] border border-[#fde68a] rounded-lg flex items-center gap-2">
              <span className="text-sm font-medium text-[#92400e]">⚠️ Manager PIN Required</span>
              <span className="text-xs text-[#92400e]">(1 controlled substance)</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onSubmit}
            disabled={!isValid}
            className="flex-1 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] disabled:bg-[#cbd5e1] disabled:cursor-not-allowed"
          >
            Review & Confirm Adjustment
          </button>
        </div>
      </div>
    </div>
  );
}
