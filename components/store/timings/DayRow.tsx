import React from "react";
import { FiPlus, FiX } from "react-icons/fi";

interface DayRowProps {
  day: string;
  label: string;
  ranges: Array<{ start: string; end: string }>;
  onChange: (ranges: Array<{ start: string; end: string }>) => void;
}

export default function DayRow({ day, label, ranges, onChange }: DayRowProps) {
  const addRange = () => {
    onChange([...ranges, { start: "09:00", end: "17:00" }]);
  };

  const updateRange = (index: number, field: "start" | "end", value: string) => {
    const updated = [...ranges];
    updated[index][field] = value;
    onChange(updated);
  };

  const removeRange = (index: number) => {
    onChange(ranges.filter((_, i) => i !== index));
  };

  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="w-28 font-medium text-gray-900 pt-2">{label}</div>
      
      <div className="flex-1">
        {ranges.length === 0 ? (
          <div className="text-sm text-gray-500 pt-2">Closed</div>
        ) : (
          <div className="space-y-2">
            {ranges.map((range, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="time"
                  value={range.start}
                  onChange={(e) => updateRange(index, "start", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="time"
                  value={range.end}
                  onChange={(e) => updateRange(index, "end", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={() => removeRange(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  title="Remove range"
                >
                  <FiX size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={addRange}
        className="px-3 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded-lg flex items-center gap-1"
      >
        <FiPlus size={14} />
        Add
      </button>
    </div>
  );
}
