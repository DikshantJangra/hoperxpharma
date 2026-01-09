'use client';

import { useState } from 'react';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { toast } from 'sonner';
import ProcessingLoader from './animations/ProcessingLoader';

export default function DraftSettingsModal({ onClose, onDeleteAllDrafts }: any) {
  const [autoRestore, setAutoRestore] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pos_auto_restore_drafts') !== 'false';
    }
    return true;
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleAutoRestore = () => {
    const newValue = !autoRestore;
    setAutoRestore(newValue);
    localStorage.setItem('pos_auto_restore_drafts', String(newValue));
    toast.success(newValue ? 'Auto-restore enabled' : 'Auto-restore disabled');
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      await onDeleteAllDrafts();
      setShowDeleteConfirm(false);
      toast.success('All drafts deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete drafts');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg w-full max-w-md mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Draft Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Auto-restore toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <div className="text-sm font-semibold text-gray-900">Auto-restore Drafts</div>
              <div className="text-xs text-gray-500 mt-0.5">Automatically restore last draft on page load</div>
            </div>
            <button
              onClick={handleToggleAutoRestore}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoRestore ? 'bg-teal-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRestore ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Delete all drafts */}
          <div className="border border-red-200 rounded-lg p-3 bg-red-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-900">Delete All Drafts</div>
                <div className="text-xs text-red-600 mt-0.5">Permanently remove all saved drafts</div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="ml-3 flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiTrash2 className="w-3 h-3" />
                Delete All
              </button>
            </div>
          </div>
        </div>

        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <div className="bg-white rounded-lg p-6 m-4 max-w-sm shadow-2xl">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h4>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete all drafts? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <ProcessingLoader size="sm" color="white" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    'Delete All'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
