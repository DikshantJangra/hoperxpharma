import React from "react";
import { FiSave, FiRotateCcw, FiDownload, FiClock, FiCheck } from "react-icons/fi";

interface StoreHeaderProps {
  name?: string;
  lastUpdated?: string;
  lastUpdatedBy?: { name: string };
  onSave: () => void;
  onUndo: () => void;
  onExport: () => void;
  saving: boolean;
  isDirty: boolean;
}

export default function StoreHeader({
  name,
  lastUpdated,
  lastUpdatedBy,
  onSave,
  onUndo,
  onExport,
  saving,
  isDirty
}: StoreHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Store Profile</h1>
            {lastUpdated && (
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <FiClock size={14} />
                <span>Last updated {new Date(lastUpdated).toLocaleString()} by {lastUpdatedBy?.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isDirty && (
              <button
                onClick={onUndo}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
              >
                <FiRotateCcw size={16} />
                Undo
              </button>
            )}
            <button
              onClick={onExport}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
            >
              <FiDownload size={16} />
              Export
            </button>
            <button
              onClick={onSave}
              disabled={!isDirty || saving}
              className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave size={16} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
