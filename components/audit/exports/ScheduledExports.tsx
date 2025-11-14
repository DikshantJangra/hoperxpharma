"use client";
import { FiClock, FiPlay, FiPause, FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";

const mockSchedules = [
  {
    id: "sch_001",
    name: "Daily Activity Log Backup",
    schedule: "Daily at 2:00 AM",
    query: "severity:high OR severity:critical",
    format: "ndjson",
    destination: "S3: s3://tenant-exports/daily/",
    lastRun: "2025-11-13T02:00:00Z",
    nextRun: "2025-11-14T02:00:00Z",
    status: "active",
    runCount: 247,
  },
  {
    id: "sch_002",
    name: "Weekly Compliance Report",
    schedule: "Every Monday at 9:00 AM",
    query: "action:prescription.override OR action:inventory.adjust",
    format: "pdf",
    destination: "Email: compliance@hope.com",
    lastRun: "2025-11-11T09:00:00Z",
    nextRun: "2025-11-18T09:00:00Z",
    status: "active",
    runCount: 35,
  },
  {
    id: "sch_003",
    name: "Monthly Access Log Archive",
    schedule: "1st of month at 1:00 AM",
    query: "event:login.* OR event:mfa.*",
    format: "csv",
    destination: "SFTP: sftp.archive.com/access-logs/",
    lastRun: "2025-11-01T01:00:00Z",
    nextRun: "2025-12-01T01:00:00Z",
    status: "paused",
    runCount: 11,
  },
];

export default function ScheduledExports() {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Scheduled Exports</h3>
          <p className="text-sm text-gray-500 mt-1">
            Automated recurring exports for compliance and backup
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
          <FiPlus size={18} />
          New Schedule
        </button>
      </div>

      <div className="grid gap-4">
        {mockSchedules.map((schedule) => (
          <div
            key={schedule.id}
            className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">{schedule.name}</h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      schedule.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {schedule.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiClock size={14} />
                  <span>{schedule.schedule}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {schedule.status === "active" ? (
                  <button
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                    title="Pause"
                  >
                    <FiPause size={18} />
                  </button>
                ) : (
                  <button
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Resume"
                  >
                    <FiPlay size={18} />
                  </button>
                )}
                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded" title="Edit">
                  <FiEdit2 size={18} />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Query</div>
                <div className="text-sm font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">
                  {schedule.query}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Destination</div>
                <div className="text-sm text-gray-700">{schedule.destination}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Format:</span>{" "}
                  <span className="font-medium text-gray-900 uppercase">{schedule.format}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Runs:</span>{" "}
                  <span className="font-medium text-gray-900">{schedule.runCount}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div>Last: {formatDate(schedule.lastRun)}</div>
                <div>Next: {formatDate(schedule.nextRun)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
