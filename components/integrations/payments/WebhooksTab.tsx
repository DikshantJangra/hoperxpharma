"use client";
import { FiCopy, FiRefreshCw, FiCheckCircle, FiXCircle, FiAlertCircle } from "react-icons/fi";

const webhookLogs = [
  { id: "1", event: "payment.success", provider: "Razorpay", status: "received", timestamp: "2025-11-13 14:30:22", latency: "45ms" },
  { id: "2", event: "payment.failed", provider: "PhonePe", status: "failed", timestamp: "2025-11-13 14:28:15", latency: "—", error: "Signature mismatch" },
  { id: "3", event: "refund.processed", provider: "Razorpay", status: "received", timestamp: "2025-11-13 14:15:08", latency: "52ms" },
  { id: "4", event: "settlement.completed", provider: "HDFC POS", status: "retried", timestamp: "2025-11-13 13:45:33", latency: "120ms" },
];

export default function WebhooksTab() {
  return (
    <div className="space-y-6">
      {/* Webhook Endpoint */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhook Endpoint</h3>
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            value="https://hoperxpharma.com/api/webhooks/payments"
            readOnly
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
          />
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <FiCopy size={16} />
            Copy
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FiCheckCircle size={16} className="text-green-600" />
          <span className="text-green-700">Endpoint is healthy • Last check: 2 min ago</span>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">
            <FiRefreshCw size={16} />
            Rotate Keys
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Razorpay Key ID</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value="rzp_live_xxxxxxxxxx"
                readOnly
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
              />
              <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                <FiCopy size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Razorpay Secret</label>
            <div className="flex items-center gap-3">
              <input
                type="password"
                value="••••••••••••••••"
                readOnly
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
              />
              <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                <FiCopy size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Logs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Webhook Events</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Latency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {webhookLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">{log.event}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{log.provider}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        log.status === "received"
                          ? "bg-green-100 text-green-700"
                          : log.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {log.status === "received" && <FiCheckCircle size={12} />}
                      {log.status === "failed" && <FiXCircle size={12} />}
                      {log.status === "retried" && <FiAlertCircle size={12} />}
                      {log.status}
                    </span>
                    {log.error && <div className="text-xs text-red-600 mt-1">{log.error}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{log.timestamp}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{log.latency}</td>
                  <td className="px-6 py-4">
                    <button className="text-sm text-teal-600 hover:text-teal-700">Replay</button>
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
