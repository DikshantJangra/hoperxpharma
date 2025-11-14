"use client";
import { FiFilter, FiStar, FiBell, FiPlus, FiClock } from "react-icons/fi";
import { MdSecurity, MdInventory, MdReceipt, MdPeople } from "react-icons/md";

export default function SavedFilters() {
  const savedFilters = [
    { name: "All Admin Actions", icon: <MdSecurity size={16} />, count: 234, active: false },
    { name: "Refunds & Adjusts", icon: <MdReceipt size={16} />, count: 45, active: false },
    { name: "Controlled Substances", icon: <MdInventory size={16} />, count: 12, active: false },
    { name: "Login Failures", icon: <MdPeople size={16} />, count: 8, active: true },
    { name: "E-invoice Changes", icon: <MdReceipt size={16} />, count: 23, active: false },
  ];

  const watchlists = [
    { name: "High-value refunds", alert: true, triggered: 2 },
    { name: "After-hours access", alert: true, triggered: 0 },
    { name: "Batch adjustments", alert: false, triggered: 5 },
  ];

  return (
    <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <FiFilter size={16} />
          Saved Filters
        </h3>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Saved Filters */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">My Filters</div>
          <div className="space-y-1">
            {savedFilters.map((filter, idx) => (
              <button
                key={idx}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                  filter.active
                    ? "bg-teal-100 text-teal-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  {filter.icon}
                  <span>{filter.name}</span>
                </div>
                <span className="text-xs bg-white px-2 py-0.5 rounded">{filter.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Watchlists */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-1">
            <FiBell size={12} />
            Watchlists
          </div>
          <div className="space-y-1">
            {watchlists.map((watch, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  <FiStar size={14} className={watch.alert ? "text-orange-500" : "text-gray-400"} />
                  <span>{watch.name}</span>
                </div>
                {watch.triggered > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                    {watch.triggered}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">Quick Links</div>
          <div className="space-y-1">
            <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
              Show only high severity
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
              Show API calls
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
              Show system changes
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
              Prescription edits
            </button>
          </div>
        </div>

        {/* Retention Status */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700 text-xs font-medium mb-2">
            <FiClock size={14} />
            Retention Policy
          </div>
          <div className="text-xs text-blue-600">
            <div>Financial: 7 years</div>
            <div>Auth logs: 1 year</div>
            <div className="mt-2 text-blue-500">Next archive: Jan 15, 2026</div>
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">
          <FiPlus size={16} />
          Create Saved Query
        </button>
      </div>
    </div>
  );
}
