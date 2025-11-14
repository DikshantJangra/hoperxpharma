"use client";
import { useState } from "react";
import { FiChevronDown, FiChevronRight, FiAlertTriangle } from "react-icons/fi";

interface PermissionMatrixProps {
  roleId: string;
}

const permissions = [
  {
    category: "Inventory",
    items: [
      { name: "View stock", enabled: true, risk: "normal" },
      { name: "Add stock", enabled: true, risk: "normal" },
      { name: "Edit stock", enabled: true, risk: "normal" },
      { name: "Delete stock", enabled: false, risk: "high" },
      { name: "Adjust stock", enabled: true, risk: "semi" },
      { name: "View expiry", enabled: true, risk: "normal" },
    ],
  },
  {
    category: "POS / Sales",
    items: [
      { name: "Create sale", enabled: true, risk: "normal" },
      { name: "Edit sale", enabled: true, risk: "semi" },
      { name: "Void sale", enabled: true, risk: "high" },
      { name: "Refund sale", enabled: true, risk: "semi" },
      { name: "Approve refund", enabled: true, risk: "high" },
    ],
  },
  {
    category: "Prescriptions",
    items: [
      { name: "View", enabled: true, risk: "normal" },
      { name: "Create new", enabled: true, risk: "normal" },
      { name: "Modify", enabled: true, risk: "semi" },
      { name: "Approve", enabled: true, risk: "semi" },
      { name: "Override warnings (requires PIN)", enabled: true, risk: "high" },
      { name: "Delete", enabled: false, risk: "high" },
    ],
  },
  {
    category: "Settings",
    items: [
      { name: "View settings", enabled: true, risk: "normal" },
      { name: "Edit store profile", enabled: true, risk: "semi" },
      { name: "Manage users", enabled: true, risk: "high" },
      { name: "API access", enabled: true, risk: "high" },
    ],
  },
];

export default function PermissionMatrix({ roleId }: PermissionMatrixProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Inventory: true,
  });

  const toggleCategory = (category: string) => {
    setExpanded({ ...expanded, [category]: !expanded[category] });
  };

  const getRiskColor = (risk: string) => {
    if (risk === "high") return "text-red-600";
    if (risk === "semi") return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Permission Matrix</h3>
      <div className="space-y-2">
        {permissions.map((perm) => (
          <div key={perm.category} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleCategory(perm.category)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                {expanded[perm.category] ? (
                  <FiChevronDown size={18} className="text-gray-600" />
                ) : (
                  <FiChevronRight size={18} className="text-gray-600" />
                )}
                <span className="font-medium text-gray-900">{perm.category}</span>
              </div>
              <span className="text-xs text-gray-500">
                {perm.items.filter((i) => i.enabled).length} / {perm.items.length} enabled
              </span>
            </button>
            {expanded[perm.category] && (
              <div className="px-4 pb-3 space-y-2">
                {perm.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={item.enabled} className="sr-only peer" readOnly />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                      <span className="text-sm text-gray-700">{item.name}</span>
                      {item.risk === "high" && (
                        <FiAlertTriangle size={14} className="text-red-600" title="High-risk permission" />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${getRiskColor(item.risk)}`}>
                      {item.risk === "high" ? "High Risk" : item.risk === "semi" ? "Semi-sensitive" : "Normal"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
