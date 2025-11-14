import React from "react";
import { FiDownload, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

interface HistoryHeaderProps {
  patientName: string;
  mrn: string;
  onExport: () => void;
}

export default function HistoryHeader({ patientName, mrn, onExport }: HistoryHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/patients/list" className="text-gray-400 hover:text-gray-600">
              <FiArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Patient History</h1>
              <p className="text-sm text-gray-500 mt-0.5">{patientName} • {mrn}</p>
            </div>
          </div>

          <button
            onClick={onExport}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
          >
            <FiDownload size={16} />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
