import { FiX, FiAlertCircle } from "react-icons/fi";

export default function DuplicateModal({ duplicates, onClose, onCreateNew }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FiAlertCircle className="text-orange-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Similar record(s) found</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            We found existing patients that may match. To avoid duplicates choose an action.
          </p>

          <div className="space-y-3 mb-6">
            {duplicates.map((dup: any) => (
              <div key={dup.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-400">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{dup.name}</p>
                    <p className="text-sm text-gray-600">MRN: {dup.mrn}</p>
                    <p className="text-sm text-gray-600">Phone: {dup.phone}</p>
                  </div>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                    {Math.round(dup.similarity * 100)}% match
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="text-sm text-blue-600 hover:text-blue-700">Open existing</button>
                  <button className="text-sm text-blue-600 hover:text-blue-700">Merge</button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onCreateNew(true)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Create new anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
