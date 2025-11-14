import React from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface MiniCalendarProps {
  exceptions: any[];
}

export default function MiniCalendar({ exceptions }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const hasException = (day: number) => {
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString()
      .split("T")[0];
    return exceptions.some((e) => e.startDate <= dateStr && dateStr <= e.endDate);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-gray-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-900">Calendar</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
            <FiChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="text-center mb-3">
        <p className="text-sm font-medium text-gray-900">
          {currentMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
        {blanks.map((i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => (
          <div
            key={day}
            className={`text-center text-xs py-1.5 rounded ${
              hasException(day)
                ? "bg-teal-100 text-teal-700 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <div className="w-3 h-3 rounded bg-teal-100" />
        <span>Exception / Holiday</span>
      </div>
    </div>
  );
}
