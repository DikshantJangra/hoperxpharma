import React from "react";
import { FiCalendar, FiEdit2, FiTrash2 } from "react-icons/fi";

interface Exception {
  id: string;
  type: "holiday" | "special";
  startDate: string;
  endDate: string;
  hours: Array<{ start: string; end: string }>;
  public: boolean;
  note: string;
}

interface ExceptionsListProps {
  exceptions: Exception[];
  onChange: (exceptions: Exception[]) => void;
}

export default function ExceptionsList({ exceptions, onChange }: ExceptionsListProps) {
  const removeException = (id: string) => {
    onChange(exceptions.filter((e) => e.id !== id));
  };

  const formatDateRange = (start: string, end: string) => {
    if (start === end) {
      return new Date(start).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
    return `${new Date(start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${new Date(end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
  };

  const formatHours = (hours: Array<{ start: string; end: string }>) => {
    if (hours.length === 0) return "Closed";
    return hours.map((h) => `${h.start}–${h.end}`).join(", ");
  };

  if (exceptions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FiCalendar size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No exceptions or holidays added yet</p>
        <p className="text-xs mt-1">Use exceptions for temporary hours or holidays</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {exceptions.map((exception) => (
        <div
          key={exception.id}
          className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-teal-300 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-1 text-xs rounded ${
                exception.type === "holiday" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
              }`}>
                {exception.type === "holiday" ? "Holiday" : "Special Hours"}
              </span>
              {exception.public && (
                <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Public</span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900">{exception.note || "Unnamed exception"}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
              <span>{formatDateRange(exception.startDate, exception.endDate)}</span>
              <span>•</span>
              <span>{formatHours(exception.hours)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg">
              <FiEdit2 size={16} />
            </button>
            <button
              onClick={() => removeException(exception.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
