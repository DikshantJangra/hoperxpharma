"use client";
import { useState } from "react";
import { FiEye, FiEyeOff, FiDownload, FiRefreshCw } from "react-icons/fi";

export default function BackupCodes() {
  const [revealed, setRevealed] = useState(false);

  const codes = ["••••-1234", "••••-6723", "••••-8991", "••••-4521", "••••-7890"];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Backup Codes</h3>
      <p className="text-sm text-gray-600 mb-4">
        Use these codes when you forget your PIN or lose access to your phone
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-2">
          {codes.map((code, idx) => (
            <div key={idx} className="font-mono text-sm text-gray-700 bg-white px-3 py-2 rounded border border-gray-200">
              {revealed ? `1234-${Math.random().toString().slice(2, 6)}` : code}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setRevealed(!revealed)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          {revealed ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          {revealed ? "Hide" : "Reveal"} Codes
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          <FiDownload size={16} />
          Download PDF
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200">
          <FiRefreshCw size={16} />
          Regenerate
        </button>
      </div>
    </div>
  );
}
