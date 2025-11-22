"use client";
import { useState, useEffect } from "react";
import { FiClock, FiPlay, FiPause, FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";

const ScheduleCardSkeleton = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
        <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/4"></div>
            </div>
            <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
        </div>
        <div className="h-10 bg-gray-100 rounded-lg mb-4"></div>
        <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
            <div className="h-4 bg-gray-100 rounded w-1/3"></div>
            <div className="h-4 bg-gray-100 rounded w-1/4"></div>
        </div>
    </div>
)

export default function ScheduledExports({ isLoading }: { isLoading: boolean }) {
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading) {
        setSchedules([]);
    }
  }, [isLoading]);
  
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
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700" disabled={isLoading}>
          <FiPlus size={18} />
          New Schedule
        </button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
            <>
                <ScheduleCardSkeleton/>
                <ScheduleCardSkeleton/>
            </>
        ) : schedules.length > 0 ? (
            schedules.map((schedule) => (
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
            ))
        ) : (
            <div className="text-center py-10 text-gray-500">
                No scheduled exports found.
            </div>
        )}
      </div>
    </div>
  );
}
