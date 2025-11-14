'use client';

import { FiUser, FiAlertCircle, FiClock, FiFileText } from 'react-icons/fi';
import { RiCapsuleLine } from 'react-icons/ri';
import { BsReceipt } from 'react-icons/bs';

export default function ContextPanel({ conversation }: any) {
  return (
    <div className="w-80 bg-white border-l border-[#e2e8f0] overflow-y-auto">
      {/* Patient Profile */}
      <div className="p-4 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2 mb-3">
          <FiUser className="w-4 h-4 text-[#64748b]" />
          <h3 className="text-sm font-semibold text-[#0f172a]">Patient Profile</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#64748b]">Name:</span>
            <span className="font-medium text-[#0f172a]">{conversation.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Age:</span>
            <span className="font-medium text-[#0f172a]">45 years</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Gender:</span>
            <span className="font-medium text-[#0f172a]">Male</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Last Visit:</span>
            <span className="font-medium text-[#0f172a]">2 days ago</span>
          </div>
        </div>

        {/* Allergies Alert */}
        <div className="mt-3 p-2 bg-[#fef3c7] border border-[#fde68a] rounded-lg flex items-start gap-2">
          <FiAlertCircle className="w-4 h-4 text-[#f59e0b] mt-0.5 shrink-0" />
          <div className="text-xs text-[#92400e]">
            <p className="font-semibold">Allergies:</p>
            <p>Penicillin, Sulfa drugs</p>
          </div>
        </div>

        {/* Chronic Conditions */}
        <div className="mt-3">
          <p className="text-xs font-semibold text-[#64748b] mb-1">Chronic Conditions:</p>
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-1 bg-[#f1f5f9] text-[#64748b] text-xs rounded">Hypertension</span>
            <span className="px-2 py-1 bg-[#f1f5f9] text-[#64748b] text-xs rounded">Diabetes</span>
          </div>
        </div>
      </div>

      {/* Recent Prescriptions */}
      <div className="p-4 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2 mb-3">
          <RiCapsuleLine className="w-4 h-4 text-[#64748b]" />
          <h3 className="text-sm font-semibold text-[#0f172a]">Recent Prescriptions</h3>
        </div>
        <div className="space-y-2">
          {[
            { id: 'RX-1021', drug: 'Telmisartan 40mg', date: '6 days ago' },
            { id: 'RX-0987', drug: 'Metformin 500mg', date: '12 days ago' },
          ].map((rx) => (
            <div key={rx.id} className="p-2 bg-[#f8fafc] rounded-lg hover:bg-[#f1f5f9] cursor-pointer">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#0f172a]">#{rx.id}</span>
                <span className="text-xs text-[#64748b]">{rx.date}</span>
              </div>
              <p className="text-xs text-[#64748b]">{rx.drug}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order History */}
      <div className="p-4 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2 mb-3">
          <BsReceipt className="w-4 h-4 text-[#64748b]" />
          <h3 className="text-sm font-semibold text-[#0f172a]">Order History</h3>
        </div>
        <div className="space-y-2">
          {[
            { id: 'INV-234', amount: 850, date: '2 days ago', status: 'Paid' },
            { id: 'INV-198', amount: 320, date: '15 days ago', status: 'Paid' },
          ].map((order) => (
            <div key={order.id} className="p-2 bg-[#f8fafc] rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#0f172a]">{order.id}</span>
                <span className="px-2 py-0.5 bg-[#d1fae5] text-[#065f46] text-xs rounded">
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b]">{order.date}</span>
                <span className="text-xs font-semibold text-[#0f172a]">₹{order.amount}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-1">
          <button className="w-full py-1.5 text-xs text-[#0ea5a3] border border-[#0ea5a3] rounded hover:bg-[#f0fdfa]">
            Resend Invoice
          </button>
          <button className="w-full py-1.5 text-xs text-[#0ea5a3] border border-[#0ea5a3] rounded hover:bg-[#f0fdfa]">
            Repeat Order
          </button>
        </div>
      </div>

      {/* Internal Notes */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <FiFileText className="w-4 h-4 text-[#64748b]" />
          <h3 className="text-sm font-semibold text-[#0f172a]">Internal Notes</h3>
        </div>
        <div className="space-y-2">
          <div className="p-2 bg-[#fef3c7] rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FiClock className="w-3 h-3 text-[#92400e]" />
              <span className="text-xs text-[#92400e]">Aman • 2 days ago</span>
            </div>
            <p className="text-xs text-[#92400e]">Regular customer. Prefers home delivery.</p>
          </div>
        </div>
        <button className="w-full mt-2 py-1.5 text-xs border border-dashed border-[#cbd5e1] rounded hover:border-[#0ea5a3] hover:bg-[#f0fdfa]">
          + Add Note
        </button>
      </div>
    </div>
  );
}
