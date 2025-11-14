"use client";
import { FiUpload, FiCheckCircle, FiAlertTriangle, FiXCircle, FiLink } from "react-icons/fi";

const reconciliationData = [
  { id: "1", date: "2025-11-13 10:30", amount: 850, upiRef: "UPI/234567890", posInvoice: "INV-5677", status: "matched" },
  { id: "2", date: "2025-11-13 11:15", amount: 1250, upiRef: "UPI/234567891", posInvoice: null, status: "unmatched" },
  { id: "3", date: "2025-11-13 12:00", amount: 450, upiRef: "UPI/234567892", posInvoice: "INV-5679", status: "matched" },
  { id: "4", date: "2025-11-13 14:30", amount: 2340, upiRef: "UPI/234567893", posInvoice: "INV-5680", status: "partial" },
];

export default function ReconciliationTab() {
  return (
    <div className="space-y-6">
      {/* Import Statement */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Provider Statement</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors cursor-pointer">
            <FiUpload size={32} className="mx-auto text-gray-400 mb-2" />
            <div className="text-sm text-gray-600">Upload CSV/Excel from Razorpay, Paytm, or PhonePe</div>
          </div>
          <div className="text-gray-500">OR</div>
          <button className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
            Auto-Fetch via API
          </button>
        </div>
      </div>

      {/* Reconciliation Score */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-2">
            <FiCheckCircle size={16} />
            Matched
          </div>
          <div className="text-3xl font-bold text-green-900">234</div>
          <div className="text-xs text-green-600 mt-1">94.3% of transactions</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-700 text-sm font-medium mb-2">
            <FiAlertTriangle size={16} />
            Partial Match
          </div>
          <div className="text-3xl font-bold text-orange-900">8</div>
          <div className="text-xs text-orange-600 mt-1">Needs review</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 text-sm font-medium mb-2">
            <FiXCircle size={16} />
            Unmatched
          </div>
          <div className="text-3xl font-bold text-red-900">6</div>
          <div className="text-xs text-red-600 mt-1">Requires action</div>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Payment Reconciliation</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UPI Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">POS Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reconciliationData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{item.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{item.amount}</td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-700">{item.upiRef}</td>
                  <td className="px-6 py-4 text-sm">
                    {item.posInvoice ? (
                      <span className="text-teal-600 font-medium">{item.posInvoice}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        item.status === "matched"
                          ? "bg-green-100 text-green-700"
                          : item.status === "partial"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.status === "matched" && <FiCheckCircle size={12} />}
                      {item.status === "partial" && <FiAlertTriangle size={12} />}
                      {item.status === "unmatched" && <FiXCircle size={12} />}
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.status !== "matched" && (
                      <button className="flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 text-sm">
                        <FiLink size={14} />
                        Link
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
