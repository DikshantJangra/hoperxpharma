"use client";

import { useState, useEffect } from "react";
import { FiDownload, FiAlertCircle } from "react-icons/fi";

const SettlementRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-200 rounded-full"></div></td>
    </tr>
)

export default function SettlementsTab() {
    const [settlements, setSettlements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setSettlements([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, []);

  return (
    <div className="space-y-6">
      {/* Alert */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
        <FiAlertCircle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-orange-800">
          <div className="font-medium mb-1">Settlement Delayed</div>
          <div className="text-xs">Razorpay settlement for Nov 13 is delayed due to bank holiday. Expected: Nov 15</div>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Settlement Reports</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm" disabled={isLoading}>
            <FiDownload size={16} />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST on Fees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Settlement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <>
                    <SettlementRowSkeleton/>
                    <SettlementRowSkeleton/>
                    <SettlementRowSkeleton/>
                </>
              ) : settlements.length > 0 ? (
                settlements.map((settlement, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{settlement.date}</td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{settlement.provider}</span>
                        <span className="text-xs text-gray-500">{settlement.cycle}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{settlement.gross.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-red-600">-₹{settlement.fees}</td>
                    <td className="px-6 py-4 text-sm text-red-600">-₹{settlement.gst}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">₹{settlement.net.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{settlement.method}</td>
                    <td className="px-6 py-4">
                        <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                            settlement.status === "settled"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                        >
                        {settlement.status}
                        </span>
                    </td>
                    </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">No settlements to display.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
