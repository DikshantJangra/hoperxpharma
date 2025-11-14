"use client";
import { FiActivity, FiAlertTriangle, FiCheckCircle, FiXCircle } from "react-icons/fi";

const providerHealth = [
  { name: "Razorpay", uptime: 99.8, latency: 45, failed: 2, status: "healthy" },
  { name: "PhonePe PG", uptime: 99.2, latency: 52, failed: 5, status: "healthy" },
  { name: "HDFC POS", uptime: 98.5, latency: 120, failed: 12, status: "degraded" },
  { name: "BharatPe QR", uptime: 99.9, latency: 38, failed: 1, status: "healthy" },
];

const bankStatus = [
  { bank: "HDFC Bank", status: "operational", upi: true },
  { bank: "ICICI Bank", status: "operational", upi: true },
  { bank: "SBI", status: "degraded", upi: true },
  { bank: "Axis Bank", status: "operational", upi: true },
  { bank: "Kotak Mahindra", status: "operational", upi: true },
  { bank: "Yes Bank", status: "down", upi: false },
];

export default function PaymentHealthTab() {
  return (
    <div className="space-y-6">
      {/* Alerts */}
      <div className="space-y-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <FiXCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <div className="font-medium mb-1">Yes Bank UPI Down</div>
            <div className="text-xs">NPCI reports Yes Bank UPI services unavailable. Fallback to other banks active.</div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
          <FiAlertTriangle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-orange-800">
            <div className="font-medium mb-1">HDFC POS Latency Spike</div>
            <div className="text-xs">Average response time increased to 120ms (normal: 60ms). Monitoring...</div>
          </div>
        </div>
      </div>

      {/* Provider Health */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Provider Health (Last 7 Days)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uptime</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Latency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failed Payments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {providerHealth.map((provider, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{provider.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                        <div
                          className="h-full bg-green-600"
                          style={{ width: `${provider.uptime}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-700">{provider.uptime}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{provider.latency}ms</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{provider.failed}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        provider.status === "healthy"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {provider.status === "healthy" ? (
                        <FiCheckCircle size={12} />
                      ) : (
                        <FiAlertTriangle size={12} />
                      )}
                      {provider.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NPCI Bank Status */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiActivity size={20} className="text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">NPCI Bank Status (Live)</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {bankStatus.map((bank, idx) => (
              <div
                key={idx}
                className={`border-2 rounded-lg p-4 ${
                  bank.status === "operational"
                    ? "border-green-200 bg-green-50"
                    : bank.status === "degraded"
                    ? "border-orange-200 bg-orange-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{bank.bank}</span>
                  {bank.status === "operational" ? (
                    <FiCheckCircle size={16} className="text-green-600" />
                  ) : bank.status === "degraded" ? (
                    <FiAlertTriangle size={16} className="text-orange-600" />
                  ) : (
                    <FiXCircle size={16} className="text-red-600" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">UPI:</span>
                  <span
                    className={`text-xs font-medium ${
                      bank.upi ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {bank.upi ? "Active" : "Down"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
