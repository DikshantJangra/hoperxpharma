"use client";
import { useState } from "react";
import { FiX, FiAlertCircle, FiShield, FiEye, FiLock } from "react-icons/fi";

interface CreateExportModalProps {
  onClose: () => void;
}

export default function CreateExportModal({ onClose }: CreateExportModalProps) {
  const [scope, setScope] = useState<"current" | "custom" | "saved">("current");
  const [format, setFormat] = useState<"csv" | "json" | "ndjson" | "pdf">("csv");
  const [redaction, setRedaction] = useState<"none" | "mask_pii" | "remove_phi">("mask_pii");
  const [signed, setSigned] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">Export Audit Data</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Scope</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "current", label: "Current View", desc: "Visible rows (50)" },
                { value: "custom", label: "Custom Filters", desc: "Configure query" },
                { value: "saved", label: "Saved Query", desc: "Use watchlist" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setScope(opt.value as any)}
                  className={`p-4 border-2 rounded-lg text-left ${
                    scope === opt.value
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-gray-900">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                defaultValue="2025-10-01"
              />
              <input
                type="date"
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                defaultValue="2025-11-13"
              />
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: "csv", label: "CSV", desc: "Spreadsheet" },
                { value: "json", label: "JSON", desc: "Full payload" },
                { value: "ndjson", label: "NDJSON", desc: "Streaming" },
                { value: "pdf", label: "PDF", desc: "Signed report" },
              ].map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => setFormat(fmt.value as any)}
                  className={`p-3 border-2 rounded-lg text-left ${
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

          {/* Redaction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Privacy & Redaction</label>
            <div className="space-y-2">
              {[
                { value: "none", label: "No Redaction", desc: "Raw data (requires approval)", risk: true },
                { value: "mask_pii", label: "Mask PII", desc: "Replace phone, email with masked values" },
                { value: "remove_phi", label: "Remove PHI (HIPAA)", desc: "Remove clinical sensitive fields" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer ${
                    redaction === opt.value
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    checked={redaction === opt.value}
                    onChange={() => setRedaction(opt.value as any)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{opt.label}</span>
                      {opt.risk && <FiAlertCircle size={14} className="text-orange-600" />}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Security Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Security Options</label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={signed}
                  onChange={(e) => setSigned(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">Cryptographically Signed</span>
                    <FiShield size={14} className="text-purple-600" />
                  </div>
                  <div className="text-xs text-gray-500">
                    Generate tamper-proof export with SHA256 hash and signature (takes ~2 min)
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">Require Approval</span>
                    <FiLock size={14} className="text-orange-600" />
                  </div>
                  <div className="text-xs text-gray-500">
                    Request approval from Compliance Officer before export runs
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason & Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this export is needed (required for compliance audit trail)..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          {/* Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiEye size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">Export Preview</div>
                <div className="text-xs space-y-1">
                  <div>Estimated rows: ~12,345</div>
                  <div>Estimated size: ~4.5 MB</div>
                  <div>Estimated time: 2-3 minutes</div>
                  <div>Retention: 7 days (default)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {redaction === "none" && (
            <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <FiAlertCircle size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <div className="font-medium mb-1">No Redaction Selected</div>
                <div className="text-xs">
                  Export will contain unmasked patient data. Ensure you have proper authorization and compliance clearance.
                </div>
              </div>
            </div>
          )}

          {signed && (
            <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <FiShield size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-800">
                <div className="font-medium mb-1">Signed Export</div>
                <div className="text-xs">
                  Export will include SHA256 checksums and cryptographic signature for auditor verification. Verification instructions will be included.
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
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-teal-600 hover:bg-teal-50 rounded-lg">
              Preview Sample
            </button>
            <button
              disabled={!reason.trim()}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requireApproval ? "Request Export" : "Start Export"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
