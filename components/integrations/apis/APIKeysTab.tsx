"use client";
import { FiCopy, FiEye, FiEyeOff, FiRefreshCw, FiTrash2, FiPlus } from "react-icons/fi";
import { useState } from "react";

const apiKeys = [
  { id: "1", name: "POS Sync", type: "Live", created: "Today", status: "Active", lastUsed: "1 hour ago", key: "pk_live_9b2*******4fa" },
  { id: "2", name: "Tally Integration", type: "Live", created: "Nov 10", status: "Active", lastUsed: "5 min ago", key: "pk_live_3a1*******8cd" },
  { id: "3", name: "Website API", type: "Live", created: "Nov 5", status: "Active", lastUsed: "2 hours ago", key: "pk_live_7f4*******2be" },
];

export default function APIKeysTab() {
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          <div className="font-medium mb-1">💡 What are API Keys?</div>
          <div className="text-xs">
            API keys connect HopeRx to other software. If you don't use outside apps, you can ignore this section.
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
          <FiPlus size={18} />
          Generate New Key
        </button>
      </div>

      {/* API Keys Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Key</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {apiKeys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{key.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {key.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-gray-700">
                        {visibleKeys[key.id] ? "pk_live_9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b" : key.key}
                      </span>
                      <button
                        onClick={() => setVisibleKeys({ ...visibleKeys, [key.id]: !visibleKeys[key.id] })}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {visibleKeys[key.id] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <FiCopy size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{key.created}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      {key.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{key.lastUsed}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="Rotate">
                        <FiRefreshCw size={16} />
                      </button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded" title="Revoke">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
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
