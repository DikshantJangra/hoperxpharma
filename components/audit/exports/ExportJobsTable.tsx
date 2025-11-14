"use client";
import { FiDownload, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiTrash2, FiShield } from "react-icons/fi";
import { MdLock } from "react-icons/md";

const mockJobs = [
  {
    id: "exp_20251113_001",
    requestedBy: "Priya Singh",
    requestedAt: "2025-11-13T10:30:00Z",
    status: "completed",
    format: "ndjson",
    compression: "gzip",
    signed: true,
    rowCount: 12345,
    sizeBytes: 4567890,
    query: "action:inventory.adjust AND severity:high",
    dateRange: "Oct 1 - Nov 13, 2025",
    redaction: "mask_pii",
    retainUntil: "2025-11-20",
    legalHold: false,
    downloadUrl: "#",
  },
  {
    id: "exp_20251113_002",
    requestedBy: "Aman Verma",
    requestedAt: "2025-11-13T11:15:00Z",
    status: "running",
    format: "csv",
    compression: "none",
    signed: false,
    rowCount: null,
    sizeBytes: null,
    query: "event:login.failed",
    dateRange: "Last 7 days",
    redaction: "none",
    progress: 67,
    retainUntil: "2025-11-20",
    legalHold: false,
  },
  {
    id: "exp_20251113_003",
    requestedBy: "Vikram Rao",
    requestedAt: "2025-11-13T09:45:00Z",
    status: "failed",
    format: "json",
    compression: "zip",
    signed: false,
    rowCount: null,
    sizeBytes: null,
    query: "resource.type:prescription",
    dateRange: "Last 30 days",
    redaction: "remove_phi",
    error: "Query timeout after 5 minutes",
    retainUntil: "2025-11-20",
    legalHold: false,
  },
  {
    id: "exp_20251112_004",
    requestedBy: "Compliance Team",
    requestedAt: "2025-11-12T14:20:00Z",
    status: "completed",
    format: "pdf",
    compression: "none",
    signed: true,
    rowCount: 500,
    sizeBytes: 1234567,
    query: "severity:critical",
    dateRange: "Q3 2025",
    redaction: "mask_pii",
    retainUntil: "2026-11-12",
    legalHold: true,
    downloadUrl: "#",
  },
];

export default function ExportJobsTable() {
  const statusConfig = {
    completed: { color: "bg-green-100 text-green-700", icon: <FiCheckCircle size={14} /> },
    running: { color: "bg-blue-100 text-blue-700", icon: <FiClock size={14} /> },
    failed: { color: "bg-red-100 text-red-700", icon: <FiXCircle size={14} /> },
    queued: { color: "bg-gray-100 text-gray-700", icon: <FiClock size={14} /> },
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Export ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested By</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Query</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retain Until</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockJobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-gray-900">{job.id}</span>
                      {job.signed && (
                        <FiShield size={14} className="text-purple-600" title="Signed export" />
                      )}
                      {job.legalHold && (
                        <MdLock size={14} className="text-orange-600" title="Legal hold" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(job.requestedAt)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium w-fit ${
                        statusConfig[job.status as keyof typeof statusConfig].color
                      }`}
                    >
                      {statusConfig[job.status as keyof typeof statusConfig].icon}
                      {job.status}
                    </span>
                    {job.status === "running" && job.progress && (
                      <div className="w-24">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{job.progress}%</span>
                      </div>
                    )}
                    {job.status === "failed" && (
                      <span className="text-xs text-red-600">{job.error}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">{job.requestedBy}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col max-w-xs">
                    <span className="text-sm font-mono text-gray-700 truncate">{job.query}</span>
                    <span className="text-xs text-gray-500">{job.dateRange}</span>
                    <span className="text-xs text-gray-500">Redaction: {job.redaction}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-900 uppercase">{job.format}</span>
                    {job.compression !== "none" && (
                      <span className="text-xs text-gray-500">{job.compression}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {job.rowCount && job.sizeBytes ? (
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900">{formatBytes(job.sizeBytes)}</span>
                      <span className="text-xs text-gray-500">{job.rowCount.toLocaleString()} rows</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700">{job.retainUntil}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {job.status === "completed" && (
                      <button
                        className="p-1.5 text-teal-600 hover:bg-teal-50 rounded"
                        title="Download"
                      >
                        <FiDownload size={16} />
                      </button>
                    )}
                    {job.status === "failed" && (
                      <button
                        className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                        title="Retry"
                      >
                        <FiAlertCircle size={16} />
                      </button>
                    )}
                    {!job.legalHold && (
                      <button
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
