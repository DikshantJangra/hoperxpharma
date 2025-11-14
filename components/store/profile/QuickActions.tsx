import React from "react";
import { FiFileText, FiClock, FiHardDrive, FiExternalLink } from "react-icons/fi";
import Link from "next/link";

interface QuickActionsProps {
  storeId?: string;
}

export default function QuickActions({ storeId }: QuickActionsProps) {
  const actions = [
    { icon: <FiFileText size={16} />, label: "Licenses", path: "/store/licenses" },
    { icon: <FiClock size={16} />, label: "Timings", path: "/store/timings" },
    { icon: <FiHardDrive size={16} />, label: "Hardware", path: "/store/hardware" }
  ];

  return (
    <section className="bg-white shadow-sm rounded-lg p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="space-y-2">
        {actions.map((action) => (
          <Link
            key={action.path}
            href={action.path}
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="text-gray-400 group-hover:text-teal-600">{action.icon}</div>
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{action.label}</span>
            </div>
            <FiExternalLink size={14} className="text-gray-400 group-hover:text-teal-600" />
          </Link>
        ))}
      </div>
    </section>
  );
}
