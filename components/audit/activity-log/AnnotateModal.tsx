"use client";
import { useState } from "react";
import { FiX, FiMessageSquare, FiLock, FiAlertCircle } from "react-icons/fi";

interface AnnotateModalProps {
  eventIds: string[];
  onClose: () => void;
}

export default function AnnotateModal({ eventIds, onClose }: AnnotateModalProps) {
  const [annotation, setAnnotation] = useState("");
  const [visibility, setVisibility] = useState<"investigators" | "all">("investigators");
  const [requirePin, setRequirePin] = useState(false);
  const [pin, setPin] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiMessageSquare size={20} className="text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">Add Annotation</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Event Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="text-sm text-blue-900">
              Annotating {eventIds.length} event{eventIds.length > 1 ? "s" : ""}
            </div>
            <div className="text-xs text-blue-600 mt-1 font-mono">
              {eventIds.slice(0, 3).join(", ")}
              {eventIds.length > 3 && ` +${eventIds.length - 3} more`}
            </div>
          </div>

          {/* Immutability Notice */}
          <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <FiLock size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-800">
              <div className="font-medium mb-1">Immutable Annotation</div>
              <div className="text-xs">
                This annotation will be stored as a separate audit event. Original events remain unchanged.
              </div>
            </div>
          </div>

          {/* Annotation Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annotation Text
            </label>
            <textarea
              value={annotation}
              onChange={(e) => setAnnotation(e.target.value)}
              placeholder="Add investigator notes for this event (visible to investigators only)..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {annotation.length} / 2000 characters
              </span>
              <span className="text-xs text-gray-500">
                Markdown supported
              </span>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Visibility</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={visibility === "investigators"}
                  onChange={() => setVisibility("investigators")}
                  className="text-teal-600"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Investigators Only</div>
                  <div className="text-xs text-gray-500">
                    Visible to users with audit.annotate permission
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={visibility === "all"}
                  onChange={() => setVisibility("all")}
                  className="text-teal-600"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">All Users</div>
                  <div className="text-xs text-gray-500">
                    Visible to anyone who can view this event
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* PIN Verification */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={requirePin}
                onChange={(e) => setRequirePin(e.target.checked)}
              />
              <div className="text-sm font-medium text-gray-900">Require PIN verification</div>
            </label>
            {requirePin && (
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your 4-digit PIN"
                maxLength={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            )}
          </div>

          {/* Warning */}
          {annotation.length > 0 && (
            <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <FiAlertCircle size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <div className="font-medium mb-1">Annotation will be logged</div>
                <div className="text-xs">
                  This action creates a new audit event: annotation.create with your user ID and timestamp.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            disabled={!annotation.trim() || (requirePin && pin.length !== 4)}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Annotation
          </button>
        </div>
      </div>
    </div>
  );
}
