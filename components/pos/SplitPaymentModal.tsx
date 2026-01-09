'use client';

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import ProcessingLoader from './animations/ProcessingLoader';

export default function SplitPaymentModal({ total = 0, onConfirm, onClose }: any) {
  // Use strings for inputs to allow decimals (e.g. "10.") without forcing parse
  const [cash, setCash] = useState('');
  const [card, setCard] = useState('');
  const [upi, setUpi] = useState('');
  const [wallet, setWallet] = useState('');
  const [credit, setCredit] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to safely parse string to float
  const safeParse = (val: string) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Auto-calculate credit when other fields change
  useEffect(() => {
    const valCash = safeParse(cash);
    const valCard = safeParse(card);
    const valUpi = safeParse(upi);
    const valWallet = safeParse(wallet);

    const otherPayments = valCash + valCard + valUpi + valWallet;

    // Calculate remaining, capped at 0 (can't have negative credit auto-fill)
    // Use Number.toFixed to prevent floating point anomalies during typing
    const remaining = Math.max(0, total - otherPayments);

    // Only update if difference is significant to avoid fighting user input?
    // User wants "Keep on auto written", so we overwrite.
    setCredit(remaining > 0 ? remaining.toFixed(2).replace(/\.00$/, '') : '');

  }, [cash, card, upi, wallet, total]);

  // Enable enhanced keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation();

  const valCash = safeParse(cash);
  const valCard = safeParse(card);
  const valUpi = safeParse(upi);
  const valWallet = safeParse(wallet);
  const valCredit = safeParse(credit);

  // FIX: collected should only include actual payments, not credit
  const collected = valCash + valCard + valUpi + valWallet;

  // Balance here means "Amount Remaining to be covered" (likely by Credit)
  const balance = total - collected;

  // Validation: Ensure Total = (Received + Credit)
  const totalAllocated = collected + valCredit;
  const isBalanced = Math.abs(total - totalAllocated) < 0.01;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm({
        cash: valCash,
        card: valCard,
        upi: valUpi,
        wallet: valWallet,
        credit: valCredit
      });
    } finally {
      setIsProcessing(false);
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
          <h3 className="text-lg font-bold text-[#0f172a]">Split Payment</h3>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#0f172a] p-1 rounded hover:bg-[#f8fafc]">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-sm text-[#64748b] mb-1 block">Cash</label>
            <input
              type="number"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-sm text-[#64748b] mb-1 block">Card</label>
            <input
              type="number"
              value={card}
              onChange={(e) => setCard(e.target.value)}
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-sm text-[#64748b] mb-1 block">UPI</label>
            <input
              type="number"
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-sm text-[#64748b] mb-1 block">Wallet</label>
            <input
              type="number"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-sm text-[#64748b] mb-1 block flex items-center justify-between">
              <span>Credit (Pay Later)</span>
              <span className="text-[10px] text-teal-600 bg-teal-50 px-1 rounded">Auto-filled</span>
            </label>
            <input
              type="number"
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              className="w-full px-3 py-2 border border-orange-200 bg-orange-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-orange-800"
              placeholder="0.00"
            />
          </div>

          <div className="pt-3 border-t border-[#e2e8f0] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Total Amount</span>
              <span className="font-semibold">₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Collected (Received)</span>
              <span className="font-semibold font-mono">₹{collected.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Remaining Balance</span>
              {/* If balanced (meaning remaining is covered by credit), show it neutrally or as a success?
                  The user wants to see "Balance Due". If balance > 0, it means we have debt.
               */}
              <span className={`font-bold text-lg font-mono ${balance > 0.01 ? 'text-orange-600' : 'text-gray-900'}`}>
                ₹{balance.toFixed(2)}
              </span>
            </div>
            {!isBalanced && (
              <div className="text-xs text-red-500 text-right font-medium">
                Mismatch: ₹{(total - totalAllocated).toFixed(2)}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[#e2e8f0] flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isBalanced || isProcessing}
            className="flex-1 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] disabled:bg-[#cbd5e1] disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <ProcessingLoader size="sm" color="white" />
                <span>Processing...</span>
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
