"use client";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

export default function AppIntegrationsTab() {
  const apps = [
    { name: "Zoho Books", desc: "Sync invoices & payments automatically", status: "Connected", sync: "Two-way", lastSync: "2 min ago" },
    { name: "Tally", desc: "Export daily sales vouchers automatically", status: "Connected", sync: "One-way", lastSync: "5 min ago" },
    { name: "Google Sheets", desc: "Inventory syncing", status: "Not Connected", sync: "—", lastSync: "—" },
    { name: "WhatsApp Bot", desc: "Send automated order confirmations", status: "Not Connected", sync: "—", lastSync: "—" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {apps.map((app, idx) => (
        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{app.name}</h3>
              <p className="text-sm text-gray-600">{app.desc}</p>
            </div>
            {app.status === "Connected" ? (
              <FiCheckCircle size={20} className="text-green-600 flex-shrink-0" />
            ) : (
              <FiXCircle size={20} className="text-gray-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
            <div>Sync: <span className="font-medium">{app.sync}</span></div>
            <div>Last: <span className="font-medium">{app.lastSync}</span></div>
          </div>
          <button className={`w-full px-4 py-2 rounded-lg text-sm font-medium ${
            app.status === "Connected"
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-teal-600 text-white hover:bg-teal-700"
          }`}>
            {app.status === "Connected" ? "Manage" : "Connect"}
          </button>
        </div>
      ))}
    </div>
  );
}
