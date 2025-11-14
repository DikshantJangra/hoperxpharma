import React from "react";
import { FiEye } from "react-icons/fi";

interface PreviewCardProps {
  timings: any;
}

export default function PreviewCard({ timings }: PreviewCardProps) {
  const formatWeeklySummary = (weekly: any) => {
    if (!weekly) return "No hours set";
    
    // Group consecutive days with same hours
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    const summary: string[] = [];
    
    // Simple format for demo
    const weekdayHours = weekly.monday?.[0];
    const saturdayHours = weekly.saturday?.[0];
    const sundayHours = weekly.sunday?.[0];
    
    if (weekdayHours) {
      summary.push(`Mon–Fri: ${weekdayHours.start}–${weekdayHours.end}`);
    }
    if (saturdayHours) {
      summary.push(`Sat: ${saturdayHours.start}–${saturdayHours.end}`);
    }
    if (!sundayHours || sundayHours.length === 0) {
      summary.push("Sun: Closed");
    }
    
    return summary.join(" • ");
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <FiEye className="text-gray-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-900">Public Preview</h3>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <p className="text-xs text-gray-500 mb-2">How customers see your hours:</p>
        <p className="text-sm text-gray-900 leading-relaxed">
          {formatWeeklySummary(timings?.weekly)}
        </p>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        This preview shows how hours appear on your store listing and receipts.
      </p>
    </div>
  );
}
