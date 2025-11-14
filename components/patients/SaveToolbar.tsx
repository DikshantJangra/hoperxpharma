import { FiLoader } from "react-icons/fi";

export default function SaveToolbar({ loading, onSave, onSaveAndNew, onCancel, showSaveAndNew }: any) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        
        {showSaveAndNew && (
          <button
            onClick={onSaveAndNew}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
          >
            Save & New
          </button>
        )}
        
        <button
          onClick={() => onSave()}
          disabled={loading}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <FiLoader className="animate-spin" size={16} />}
          Save
        </button>
      </div>
    </div>
  );
}
