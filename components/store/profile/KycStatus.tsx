import React from "react";
import { FiCheckCircle, FiAlertCircle, FiClock, FiUpload } from "react-icons/fi";

interface KycStatusProps {
  status?: string;
  storeId?: string;
}

export default function KycStatus({ status = "pending", storeId }: KycStatusProps) {
  const statusConfig = {
    verified: {
      icon: <FiCheckCircle size={20} />,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      label: "KYC Verified"
    },
    pending: {
      icon: <FiClock size={20} />,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      label: "KYC Pending"
    },
    rejected: {
      icon: <FiAlertCircle size={20} />,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      label: "KYC Rejected"
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <section className="bg-white shadow-sm rounded-lg p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">KYC & Documents</h3>

      {/* Status Badge */}
      <div className={`flex items-center gap-3 p-4 rounded-lg border ${config.bg} ${config.border} mb-4`}>
        <div className={config.color}>{config.icon}</div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
          {status === "pending" && (
            <p className="text-xs text-gray-600 mt-1">Upload documents to verify</p>
          )}
          {status === "rejected" && (
            <p className="text-xs text-gray-600 mt-1">Please resubmit documents</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button className="w-full px-4 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded-lg flex items-center justify-center gap-2 border border-teal-200">
          <FiUpload size={16} />
          Upload Documents
        </button>
        <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
          View Licenses
        </button>
      </div>
    </section>
  );
}
