"use client";
import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiClock } from "react-icons/fi";

interface PINStatusCardProps {
  status: "not_set" | "active" | "locked";
}

export default function PINStatusCard({ status }: PINStatusCardProps) {
  return (
    <div className={`border-2 rounded-lg p-6 ${
      status === "active" ? "bg-green-50 border-green-200" :
      status === "locked" ? "bg-red-50 border-red-200" :
      "bg-orange-50 border-orange-200"
    }`}>
      <div className="flex items-start gap-4">
        {status === "active" && <FiCheckCircle size={32} className="text-green-600 flex-shrink-0" />}
        {status === "locked" && <FiXCircle size={32} className="text-red-600 flex-shrink-0" />}
        {status === "not_set" && <FiAlertTriangle size={32} className="text-orange-600 flex-shrink-0" />}
        
        <div className="flex-1">
          <h3 className={`text-lg font-semibold mb-2 ${
            status === "active" ? "text-green-900" :
            status === "locked" ? "text-red-900" :
            "text-orange-900"
          }`}>
            {status === "active" && "Your Approval PIN is Active"}
            {status === "locked" && "Your PIN is Locked"}
            {status === "not_set" && "Set Up Your Approval PIN"}
          </h3>
          <p className={`text-sm mb-4 ${
            status === "active" ? "text-green-800" :
            status === "locked" ? "text-red-800" :
            "text-orange-800"
          }`}>
            {status === "active" && "Your PIN controls sensitive actions such as refunds, voids, stock adjustments, and overrides."}
            {status === "locked" && "Too many failed attempts. Your PIN is locked for 10 minutes for security."}
            {status === "not_set" && "Set up a PIN to approve sensitive actions like refunds, voids, and inventory adjustments."}
          </p>

          {status === "active" && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-green-700 mb-1">Last Used</div>
                <div className="text-sm font-medium text-green-900">2 hours ago</div>
              </div>
              <div>
                <div className="text-xs text-green-700 mb-1">Failed Attempts</div>
                <div className="text-sm font-medium text-green-900">0 / 5</div>
              </div>
              <div>
                <div className="text-xs text-green-700 mb-1">PIN Strength</div>
                <div className="text-sm font-medium text-green-900">Strong (6 digits)</div>
              </div>
            </div>
          )}

          {status === "locked" && (
            <div className="flex items-center gap-2 text-sm text-red-800">
              <FiClock size={16} />
              <span>Unlocks in 8 minutes 32 seconds</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
