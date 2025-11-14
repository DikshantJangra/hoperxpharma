"use client";
import { FiCopy, FiDownload } from "react-icons/fi";

export default function DocsTab() {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">API Documentation</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          <FiDownload size={16} />
          Download Postman Collection
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h3>
        <p className="text-sm text-gray-700 mb-4">
          All API requests require authentication using your API key in the Authorization header.
        </p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
          <button className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white">
            <FiCopy size={14} />
          </button>
          <pre className="text-xs">
{`Authorization: Bearer YOUR_API_KEY`}
          </pre>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Endpoints</h3>
        <div className="space-y-4">
          {[
            { method: "GET", path: "/v1/inventory", desc: "List all inventory items" },
            { method: "GET", path: "/v1/sales", desc: "List all sales" },
            { method: "POST", path: "/v1/sales", desc: "Create a new sale" },
            { method: "GET", path: "/v1/prescriptions", desc: "List prescriptions" },
            { method: "GET", path: "/v1/customers", desc: "List customers" },
          ].map((endpoint, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                endpoint.method === "GET" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
              }`}>
                {endpoint.method}
              </span>
              <span className="font-mono text-sm text-gray-900">{endpoint.path}</span>
              <span className="text-sm text-gray-600">{endpoint.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Limits</h3>
        <p className="text-sm text-gray-700">
          • 1000 requests per minute<br />
          • Bursting allowed up to 1500 requests<br />
          • Rate limit headers included in all responses
        </p>
      </div>
    </div>
  );
}
