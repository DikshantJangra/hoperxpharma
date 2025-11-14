import React from "react";
import { FiX, FiAlertCircle } from "react-icons/fi";

interface PublishModalProps {
  onClose: () => void;
  onPublish: (reason?: string) => void;
  publishing: boolean;
}

export default function PublishModal({ onClose, onPublish, publishing }: PublishModalProps) {
  const [reason, setReason] = React.useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Publish Store Hours</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-1">Publishing will update public hours</p>
              <p>Changes will affect POS and customer-facing pages immediately.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Updated for holiday season"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">This will be recorded in the audit log</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={publishing}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onPublish(reason)}
            disabled={publishing}
            className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            {publishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing...
              </>
            ) : (
              "Publish Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
