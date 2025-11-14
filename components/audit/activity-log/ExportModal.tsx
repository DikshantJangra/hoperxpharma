"use client";
import { useState } from "react";
import { FiX, FiDownload, FiAlertCircle, FiShield } from "react-icons/fi";

interface ExportModalProps {
  selectedEvents: string[];
  onClose: () => void;
}

export default function ExportModal({ selectedEvents, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<"csv" | "json" | "pdf">("csv");
  const [includePayload, setIncludePayload] = useState(true);
  const [redactPHI, setRedactPHI] = useState(true);
  const [signedExport, setSignedExport] = useState(false);

  const estimatedSize = selectedEvents.length > 0 ? selectedEvents.length * 2.5 : 7120;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Export Activity Logs</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Scope</label>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <div className="text-sm text-blue-900">
                {selectedEvents.length > 0
                  ? `${selectedEvents.length} selected events`
                  : "All events matching current filters (2,847 events)"}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Estimated size: {estimatedSize.toFixed(1)} KB
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "csv", label: "CSV", desc: "Spreadsheet format" },
                { value: "json", label: "JSON", desc: "Full payload" },
                { value: "pdf", label: "PDF", desc: "Signed report" },
              ].map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => setFormat(fmt.value as any)}
                  className={`p-4 border-2 rounded-lg text-left ${
                    format === fmt.value
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-gray-900">{fmt.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Options</label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePayload}
                  onChange={(e) => setIncludePayload(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Include Full Payload</div>
                  <div className="text-xs text-gray-500">
                    Export complete event data including request/response bodies
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={redactPHI}
                  onChange={(e) => setRedactPHI(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Redact PHI/PII</div>
                  <div className="text-xs text-gray-500">
                    Automatically mask patient health information and personal data
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={signedExport}
                  onChange={(e) => setSignedExport(e.target.checked)}
                  className="mt-1"
                />
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-gray-900">Cryptographically Signed</div>
                  <FiShield size={14} className="text-purple-600" />
                </div>
                <div className="text-xs text-gray-500">
                  Generate tamper-proof export with verification hash (takes ~2 min)
                </div>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview (First 3 rows)</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-40 overflow-auto">
              <pre className="text-xs font-mono text-gray-700">
                {format === "csv" &&
                  "eventId,timestamp,severity,actor,action,resource\nevt_001,2025-11-13T10:12:34Z,high,Aman Verma,inventory.adjust,B2025-01\nevt_002,2025-11-13T10:08:15Z,critical,Priya Singh,prescription.override,RX-5678"}
                {format === "json" &&
                  '[\n  {\n    "eventId": "evt_001",\n    "timestamp": "2025-11-13T10:12:34Z",\n    "severity": "high",\n    "actor": {"name": "Aman Verma"},\n    ...\n  }\n]'}
                {format === "pdf" && "PDF Report Preview:\n\nActivity Log Export\nGenerated: Nov 13, 2025\nEvents: 2,847\nSigned: Yes\n\n[Event details follow...]"}
              </pre>
            </div>
          </div>

          {/* Warning */}
          {!redactPHI && (
            <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <FiAlertCircle size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <div className="font-medium mb-1">PHI Redaction Disabled</div>
                <div className="text-xs">
                  Export will contain unmasked patient data. Ensure you have Compliance role and proper authorization.
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
          <button className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            <FiDownload size={18} />
            Export {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
