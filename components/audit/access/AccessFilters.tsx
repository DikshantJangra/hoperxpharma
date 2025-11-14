"use client";
import { FiFilter, FiBell, FiPlus } from "react-icons/fi";
import { MdSecurity, MdDevices, MdLocationOn, MdPerson } from "react-icons/md";

export default function AccessFilters() {
  const savedFilters = [
    { name: "All Successful Logins", icon: <MdSecurity size={16} />, count: 1847 },
    { name: "Failed Attempts Only", icon: <MdSecurity size={16} />, count: 34 },
    { name: "New Device Logins", icon: <MdDevices size={16} />, count: 12 },
    { name: "Geo-anomalies", icon: <MdLocationOn size={16} />, count: 5 },
    { name: "Login from new IP", icon: <MdLocationOn size={16} />, count: 18 },
    { name: "Inactive user attempts", icon: <MdPerson size={16} />, count: 2 },
    { name: "Root/Admin access", icon: <MdSecurity size={16} />, count: 67 },
  ];

  const watchlists = [
    { name: "Too many failed attempts", triggered: 3, severity: "high" },
    { name: "Login outside India", triggered: 0, severity: "medium" },
    { name: "Repeated login from IP", triggered: 1, severity: "low" },
    { name: "Login on restricted roles", triggered: 0, severity: "high" },
    { name: "OTP/MFA failure spikes", triggered: 2, severity: "medium" },
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
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
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

        {/* Security Watchlists */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-1">
            <FiBell size={12} />
            Security Watchlists
          </div>
          <div className="space-y-2">
            {watchlists.map((watch, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FiBell size={14} className="text-orange-500" />
                    <span className="text-sm font-medium text-gray-900">{watch.name}</span>
                  </div>
                  {watch.triggered > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                      {watch.triggered}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      watch.severity === "high"
                        ? "bg-red-100 text-red-700"
                        : watch.severity === "medium"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {watch.severity}
                  </span>
                  {watch.triggered > 0 && (
                    <span className="text-xs text-gray-500">Last: 2h ago</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">
          <FiPlus size={16} />
          Create Alert Rule
        </button>
      </div>
    </div>
  );
}
