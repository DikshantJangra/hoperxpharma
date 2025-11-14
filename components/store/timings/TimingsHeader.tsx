import React from "react";
import { FiGlobe, FiSave, FiCheck } from "react-icons/fi";

interface TimingsHeaderProps {
  timezone?: string;
  isDirty: boolean;
  saving: boolean;
  onPublish: () => void;
}

export default function TimingsHeader({ timezone, isDirty, saving, onPublish }: TimingsHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Store Timings</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <FiGlobe size={14} />
              <span>All times shown in store timezone: {timezone || "Asia/Kolkata"}</span>
              <button className="text-teal-600 hover:text-teal-700 ml-1">Change?</button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isDirty && (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                <FiSave size={16} />
                {saving ? "Saving draft..." : "Draft saved • Publish to make changes live"}
              </div>
            )}
            <button
              onClick={onPublish}
              disabled={!isDirty}
              className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiCheck size={16} />
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
