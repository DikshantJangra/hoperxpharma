"use client";
import { useState } from "react";
import { FiPlus, FiDownload, FiClock, FiCheckCircle, FiAlertCircle, FiShield } from "react-icons/fi";
import ExportJobsTable from "@/components/audit/exports/ExportJobsTable";
import CreateExportModal from "@/components/audit/exports/CreateExportModal";
import ScheduledExports from "@/components/audit/exports/ScheduledExports";
import VerificationPanel from "@/components/audit/exports/VerificationPanel";

export default function ExportsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"jobs" | "scheduled" | "verify">("jobs");

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Exports</h1>
            <p className="text-sm text-gray-500 mt-1">
              Secure, verifiable, and compliant audit data exports for investigations and compliance
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <FiPlus size={18} />
            New Export
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-700 text-xs font-medium">
              <FiDownload size={14} />
              Total Exports
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-1">247</div>
            <div className="text-xs text-blue-600 mt-1">Last 30 days</div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 text-xs font-medium">
              <FiCheckCircle size={14} />
              Completed
            </div>
            <div className="text-2xl font-bold text-green-900 mt-1">234</div>
            <div className="text-xs text-green-600 mt-1">94.7% success rate</div>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-orange-700 text-xs font-medium">
              <FiClock size={14} />
              In Progress
            </div>
            <div className="text-2xl font-bold text-orange-900 mt-1">3</div>
            <div className="text-xs text-orange-600 mt-1">Avg: 4m 32s</div>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-purple-700 text-xs font-medium">
              <FiShield size={14} />
              Signed Exports
            </div>
            <div className="text-2xl font-bold text-purple-900 mt-1">89</div>
            <div className="text-xs text-purple-600 mt-1">36% of total</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex-shrink-0">
        <div className="flex gap-1">
          {[
            { id: "jobs", label: "Export Jobs" },
            { id: "scheduled", label: "Scheduled Exports" },
            { id: "verify", label: "Verify Export" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "jobs" && <ExportJobsTable />}
        {activeTab === "scheduled" && <ScheduledExports />}
        {activeTab === "verify" && <VerificationPanel />}
      </div>

      {/* Create Export Modal */}
      {showCreateModal && <CreateExportModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
