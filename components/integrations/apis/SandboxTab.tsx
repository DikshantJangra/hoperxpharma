"use client";
import { FiAlertCircle } from "react-icons/fi";

export default function SandboxTab() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiAlertCircle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-orange-800">
            <div className="font-medium mb-1">Test Mode for Developers</div>
            <div className="text-xs">This mode is for developers. Your real data is safe. No actual sales or payments will be created.</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Test Mode</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test API Key</label>
            <input
              type="text"
              value="pk_test_xxxxxxxxxxxxxxxxxx"
              readOnly
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sample cURL Request</label>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`curl -X GET https://api.hoperxpharma.com/v1/inventory \\
  -H "Authorization: Bearer pk_test_xxxxxxxxxx"`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
