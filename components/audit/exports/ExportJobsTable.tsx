"use client";
import { useState, useEffect } from "react";
import { FiDownload, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiTrash2, FiShield } from "react-icons/fi";
import { MdLock } from "react-icons/md";

const JobRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded w-8"></div></td>
    </tr>
);

export default function ExportJobsTable({ isLoading }: { isLoading: boolean }) {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading) {
        setJobs([]);
    }
  }, [isLoading]);

  const statusConfig = {
    completed: { color: "bg-green-100 text-green-700", icon: <FiCheckCircle size={14} /> },
    running: { color: "bg-blue-100 text-blue-700", icon: <FiClock size={14} /> },
    failed: { color: "bg-red-100 text-red-700", icon: <FiXCircle size={14} /> },
    queued: { color: "bg-gray-100 text-gray-700", icon: <FiClock size={14} /> },
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return 'N/A';
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
            {isLoading ? (
                <>
                    <JobRowSkeleton/>
                    <JobRowSkeleton/>
                    <JobRowSkeleton/>
                </>
            ) : jobs.length > 0 ? (
                jobs.map((job) => (
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
                            <div className="flex flex-col">
                                <span className="text-sm text-gray-900">{formatBytes(job.sizeBytes)}</span>
                                <span className="text-xs text-gray-500">{job.rowCount?.toLocaleString()} rows</span>
                            </div>
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
                ))
            ) : (
                <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-500">No export jobs found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
