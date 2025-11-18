'use client';

import React, { useState } from 'react';
import { FiX, FiSave, FiFlag } from 'react-icons/fi';

interface AnnotationEditorProps {
  eventId: string;
  onClose: () => void;
  onSave: (annotation: { text: string; pinned: boolean }) => void;
}

export default function AnnotationEditor({ eventId, onClose, onSave }: AnnotationEditorProps) {
  const [text, setText] = useState('');
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (text.trim().length === 0) return;
    
    setSaving(true);
    
    // Mock API call
    setTimeout(() => {
      onSave({ text: text.trim(), pinned });
      setSaving(false);
    }, 500);
  };

  const remainingChars = 2000 - text.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add Annotation</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={saving}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annotation Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add context or notes about this event..."
              maxLength={2000}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={saving}
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {remainingChars} characters remaining
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={saving}
              />
              <span className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                <FiFlag className="w-4 h-4" />
                Pin this annotation
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Pinned annotations appear prominently in the timeline
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={text.trim().length === 0 || saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4" />
                Save Annotation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}