import React from "react";
import DayRow from "./DayRow";

interface WeeklyEditorProps {
  weekly: any;
  onChange: (weekly: any) => void;
}

export default function WeeklyEditor({ weekly = {}, onChange }: WeeklyEditorProps) {
  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" }
  ];

  const updateDay = (day: string, ranges: any[]) => {
    onChange({ ...weekly, [day]: ranges });
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h2>
      <div className="space-y-1">
        {days.map((day) => (
          <DayRow
            key={day.key}
            day={day.key}
            label={day.label}
            ranges={weekly[day.key] || []}
            onChange={(ranges) => updateDay(day.key, ranges)}
          />
        ))}
      </div>
    </div>
  );
}
