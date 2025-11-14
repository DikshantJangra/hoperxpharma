import React from "react";
import { FiX, FiDownload, FiFileText, FiCheckCircle } from "react-icons/fi";

interface ExportProfileModalProps {
  storeId?: string;
  onClose: () => void;
}

export default function ExportProfileModal({ storeId, onClose }: ExportProfileModalProps) {
  const [format, setFormat] = React.useState("pdf");
  const [signed, setSigned] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);

  const handleExport = async () => {
    setExporting(true);
    // Simulate export
    setTimeout(() => {
      setExporting(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Export Store Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === "pdf"}
                  onChange={(e) => setFormat(e.target.value)}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <FiFileText className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">PDF Document</p>
                  <p className="text-xs text-gray-500">Formatted for printing</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === "json"}
                  onChange={(e) => setFormat(e.target.value)}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <FiFileText className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">JSON Data</p>
                  <p className="text-xs text-gray-500">Machine-readable format</p>
                </div>
              </label>
            </div>
          </div>

          {/* Signed Export */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Digitally Signed</p>
              <p className="text-xs text-gray-500">Includes SHA256 signature</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={signed}
                onChange={(e) => setSigned(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <p className="text-xs text-gray-500">
            Export signed profile — for marketplaces and onboarding.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FiDownload size={16} />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
