'use client';

import { useState } from 'react';
import { FiX } from 'react-icons/fi';

export default function SplitPaymentModal({ total, onConfirm, onClose }: any) {
  const [cash, setCash] = useState(0);
  const [card, setCard] = useState(0);
  const [upi, setUpi] = useState(0);
  const [wallet, setWallet] = useState(0);

  const collected = cash + card + upi + wallet;
  const balance = total - collected;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
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
              value={cash || ''}
              onChange={(e) => setCash(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-sm text-[#64748b] mb-1 block">Card</label>
            <input
              type="number"
              value={card || ''}
              onChange={(e) => setCard(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-sm text-[#64748b] mb-1 block">UPI</label>
            <input
              type="number"
              value={upi || ''}
              onChange={(e) => setUpi(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-sm text-[#64748b] mb-1 block">Wallet</label>
            <input
              type="number"
              value={wallet || ''}
              onChange={(e) => setWallet(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              placeholder="0.00"
            />
          </div>

          <div className="pt-3 border-t border-[#e2e8f0] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Total Amount</span>
              <span className="font-semibold">₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Collected</span>
              <span className="font-semibold">₹{collected.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Balance Due</span>
              <span className={`font-bold text-lg ${balance > 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
                ₹{balance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#e2e8f0] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc]"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ cash, card, upi, wallet })}
            disabled={balance !== 0}
            className="flex-1 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] disabled:bg-[#cbd5e1] disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
