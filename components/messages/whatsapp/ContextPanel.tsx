'use client';

import { useState, useEffect } from 'react';
import { FiUser, FiAlertCircle, FiClock, FiFileText } from 'react-icons/fi';
import { RiCapsuleLine } from 'react-icons/ri';
import { BsReceipt } from 'react-icons/bs';

const ItemSkeleton = () => (
    <div className="p-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
    </div>
)

export default function ContextPanel({ conversation, isLoading: parentLoading }: any) {
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (conversation) {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setRecentPrescriptions([]);
            setOrderHistory([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }
  }, [conversation]);
  
  const isLoadingCombined = isLoading || parentLoading;

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
          {isLoadingCombined ? (
            <><ItemSkeleton/><ItemSkeleton/></>
          ) : recentPrescriptions.length > 0 ? (
            recentPrescriptions.map((rx) => (
                <div key={rx.id} className="p-2 bg-[#f8fafc] rounded-lg hover:bg-[#f1f5f9] cursor-pointer">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#0f172a]">#{rx.id}</span>
                    <span className="text-xs text-[#64748b]">{rx.date}</span>
                </div>
                <p className="text-xs text-[#64748b]">{rx.drug}</p>
                </div>
            ))
          ) : (
            <p className="text-xs text-center text-gray-400 py-2">No recent prescriptions</p>
          )}
        </div>
      </div>

      {/* Order History */}
      <div className="p-4 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2 mb-3">
          <BsReceipt className="w-4 h-4 text-[#64748b]" />
          <h3 className="text-sm font-semibold text-[#0f172a]">Order History</h3>
        </div>
        <div className="space-y-2">
            {isLoadingCombined ? (
                <><ItemSkeleton/><ItemSkeleton/></>
            ) : orderHistory.length > 0 ? (
                orderHistory.map((order) => (
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
                ))
            ) : (
                <p className="text-xs text-center text-gray-400 py-2">No order history</p>
            )}
        </div>

        <div className="mt-3 space-y-1">
          <button className="w-full py-1.5 text-xs text-[#0ea5a3] border border-[#0ea5a3] rounded hover:bg-[#f0fdfa]" disabled={isLoadingCombined}>
            Resend Invoice
          </button>
          <button className="w-full py-1.5 text-xs text-[#0ea5a3] border border-[#0ea5a3] rounded hover:bg-[#f0fdfa]" disabled={isLoadingCombined}>
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
        <button className="w-full mt-2 py-1.5 text-xs border border-dashed border-[#cbd5e1] rounded hover:border-[#0ea5a3] hover:bg-[#f0fdfa]" disabled={isLoadingCombined}>
          + Add Note
        </button>
      </div>
    </div>
  );
}
