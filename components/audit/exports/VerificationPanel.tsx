"use client";
import { useState } from "react";
import { FiUpload, FiCheckCircle, FiXCircle, FiShield, FiAlertCircle } from "react-icons/fi";

export default function VerificationPanel() {
  const [verificationResult, setVerificationResult] = useState<"success" | "failed" | null>(null);
  const [metadata, setMetadata] = useState("");

  const handleVerify = () => {
    // Simulate verification
    setVerificationResult(Math.random() > 0.3 ? "success" : "failed");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-6">
          <FiShield size={24} className="text-purple-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Verify Export Integrity</h3>
            <p className="text-sm text-gray-500 mt-1">
              Upload metadata.json and signature files to verify cryptographic integrity of signed exports
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload metadata.json
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors cursor-pointer">
              <FiUpload size={32} className="mx-auto text-gray-400 mb-2" />
              <div className="text-sm text-gray-600">
                Click to upload or drag and drop
              </div>
              <div className="text-xs text-gray-500 mt-1">
                metadata.json file from your export
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or paste metadata JSON
            </label>
            <textarea
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              placeholder='{"exportId":"exp_20251113_xyz","hash":"sha256:...","signature":"..."}'
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload signature.sig (optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-teal-500 transition-colors cursor-pointer">
              <FiUpload size={24} className="mx-auto text-gray-400 mb-1" />
              <div className="text-xs text-gray-600">
                signature.sig file (for signed exports)
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleVerify}
          disabled={!metadata.trim()}
          className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Verify Export
        </button>
      </div>

      {/* Verification Result */}
      {verificationResult && (
        <div
          className={`border-2 rounded-lg p-6 ${
            verificationResult === "success"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {verificationResult === "success" ? (
              <FiCheckCircle size={24} className="text-green-600 flex-shrink-0" />
            ) : (
              <FiXCircle size={24} className="text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h4
                className={`text-lg font-semibold mb-2 ${
                  verificationResult === "success" ? "text-green-900" : "text-red-900"
                }`}
              >
                {verificationResult === "success"
                  ? "✓ Verification Successful"
                  : "✗ Verification Failed"}
              </h4>
              {verificationResult === "success" ? (
                <div className="space-y-3 text-sm text-green-800">
                  <div className="bg-white border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-green-600 mb-1">Export ID</div>
                        <div className="font-mono">exp_20251113_xyz</div>
                      </div>
                      <div>
                        <div className="text-xs text-green-600 mb-1">Requested By</div>
                        <div>-</div>
                      </div>
                      <div>
                        <div className="text-xs text-green-600 mb-1">Row Count</div>
                        <div>0 rows</div>
                      </div>
                      <div>
                        <div className="text-xs text-green-600 mb-1">Date Range</div>
                        <div>Oct 1 - Nov 13, 2025</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FiCheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Hash Verification</div>
                      <div className="text-xs">
                        SHA256 checksum matches: a3f5b9c2d1e4f6a7...
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FiCheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Signature Verification</div>
                      <div className="text-xs">
                        Valid signature from HopeRxPharma (key fingerprint: 4A3B2C1D)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FiCheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Integrity Check</div>
                      <div className="text-xs">
                        Export has not been tampered with since creation
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm text-red-800">
                  <div className="flex items-start gap-2">
                    <FiXCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Hash Mismatch</div>
                      <div className="text-xs">
                        Computed hash does not match metadata hash. File may have been modified.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FiAlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Signature Invalid</div>
                      <div className="text-xs">
                        Could not verify signature with known public keys
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-3 mt-3">
                    <div className="text-xs font-medium mb-1">Recommendation</div>
                    <div className="text-xs">
                      Do not trust this export. Contact the export creator to verify authenticity
                      or request a new signed export.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-blue-900 mb-3">How to Verify Exports</h4>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex gap-2">
            <span className="font-medium">1.</span>
            <span>Download the export files including metadata.json and signature.sig</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium">2.</span>
            <span>Upload or paste the metadata.json content above</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium">3.</span>
            <span>Optionally upload signature.sig for signed exports</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium">4.</span>
            <span>Click Verify Export to check integrity and authenticity</span>
          </li>
        </ol>
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="text-xs text-blue-700">
            <div className="font-medium mb-1">Public Key Fingerprint</div>
            <div className="font-mono">4A3B2C1D-5E6F7A8B-9C0D1E2F-3A4B5C6D</div>
          </div>
        </div>
      </div>
    </div>
  );
}
