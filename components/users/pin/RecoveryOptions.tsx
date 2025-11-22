"use client";
import { FiMail, FiSmartphone, FiCheckCircle, FiXCircle } from "react-icons/fi";

export default function RecoveryOptions() {
  const methods = [
    { name: "Email Recovery", icon: <FiMail size={18} />, status: "verified", value: "-" },
    { name: "Mobile OTP", icon: <FiSmartphone size={18} />, status: "verified", value: "-" },
    { name: "Backup Codes", icon: <FiCheckCircle size={18} />, status: "active", value: "5 codes remaining" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">PIN Recovery Options</h3>
      <div className="space-y-3">
        {methods.map((method, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-blue-600">{method.icon}</div>
              <div>
                <div className="font-medium text-gray-900">{method.name}</div>
                <div className="text-sm text-gray-600">{method.value}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {method.status === "verified" ? (
                <FiCheckCircle size={18} className="text-green-600" />
              ) : (
                <FiXCircle size={18} className="text-gray-400" />
              )}
              <button className="text-sm text-blue-600 hover:text-blue-700">
                {method.status === "verified" ? "Change" : "Setup"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
