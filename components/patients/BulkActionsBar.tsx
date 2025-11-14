import React from "react";
import { FiX, FiDownload, FiMessageSquare, FiTrash2 } from "react-icons/fi";

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onExport: () => void;
  onMessage: () => void;
}

export default function BulkActionsBar({ selectedCount, onClear, onExport, onMessage }: BulkActionsBarProps) {
  return (
    <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onClear}
          className="p-1 text-gray-600 hover:text-gray-900"
        >
          <FiX size={18} />
        </button>
        <span className="text-sm font-medium text-gray-900">
          {selectedCount} patient{selectedCount !== 1 ? "s" : ""} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onMessage}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-white rounded-lg flex items-center gap-2"
        >
          <FiMessageSquare size={16} />
          Message
        </button>
        <button
          onClick={onExport}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-white rounded-lg flex items-center gap-2"
        >
          <FiDownload size={16} />
          Export
        </button>
        <button className="px-4 py-2 text-sm text-red-600 hover:bg-white rounded-lg flex items-center gap-2">
          <FiTrash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}
