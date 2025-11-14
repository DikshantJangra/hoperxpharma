"use client";
import { useState } from "react";
import { FiX, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

interface RevertModalProps {
  eventId: string;
  onClose: () => void;
}

export default function RevertModal({ eventId, onClose }: RevertModalProps) {
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [pin, setPin] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiAlertTriangle size={20} className="text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Request Revert</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiAlertTriangle size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <div className="font-medium mb-1">Revert Request Workflow</div>
                <div className="text-xs">
                  This creates a revert request that requires approval. Original event remains immutable. Approved reverts create reconciliation entries.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-2">Event ID</div>
            <div className="text-sm font-mono text-gray-900">{eventId}</div>
            <div className="text-xs text-gray-600 mt-2">
              Action: inventory.adjust • Batch B2025-01 qty 120 → 115
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Revert <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this action needs to be reverted..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Urgency</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "low", label: "Low", color: "blue" },
                { value: "medium", label: "Medium", color: "orange" },
                { value: "high", label: "High", color: "red" },
              ].map((urg) => (
                <button
                  key={urg.value}
                  onClick={() => setUrgency(urg.value as any)}
                  className={`p-3 border-2 rounded-lg ${
                    urgency === urg.value
                      ? `border-${urg.color}-500 bg-${urg.color}-50`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-gray-900">{urg.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm with PIN <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your 4-digit PIN"
              maxLength={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiCheckCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">Approval Chain</div>
                <div className="text-xs">
                  Manager → Compliance Officer • Estimated approval time: 2-4 hours
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button
            disabled={!reason.trim() || pin.length !== 4}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Revert Request
          </button>
        </div>
      </div>
    </div>
  );
}
