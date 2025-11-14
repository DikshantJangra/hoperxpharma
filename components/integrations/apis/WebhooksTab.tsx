"use client";
import { FiCheckCircle, FiXCircle, FiPlus } from "react-icons/fi";

export default function WebhooksTab() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          <div className="font-medium mb-2">💡 What are Webhooks?</div>
          <div className="text-xs space-y-1">
            <div>• Your website gets notified when a sale occurs</div>
            <div>• Inventory updates sync to another system instantly</div>
            <div>• Your WhatsApp bot gets notified of low stock</div>
          </div>
        </div>
      </div>

      <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
        <FiPlus size={18} />
        Create Webhook
      </button>

      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deliveries</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-mono text-gray-900">sale.created</td>
              <td className="px-6 py-4 text-sm text-gray-700">https://example.com/webhook</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                  <FiCheckCircle size={12} />
                  OK
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">50 / 50</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-mono text-gray-900">stock.updated</td>
              <td className="px-6 py-4 text-sm text-gray-700">https://example.com/stock</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                  <FiXCircle size={12} />
                  Failing
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">38 / 50</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
