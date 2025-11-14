import React from "react";
import { FiX, FiPlus } from "react-icons/fi";

interface AddExceptionModalProps {
  onClose: () => void;
  onCreate: (exception: any) => void;
}

export default function AddExceptionModal({ onClose, onCreate }: AddExceptionModalProps) {
  const [type, setType] = React.useState<"holiday" | "special">("holiday");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [hours, setHours] = React.useState<Array<{ start: string; end: string }>>([]);
  const [publicFlag, setPublicFlag] = React.useState(true);
  const [note, setNote] = React.useState("");

  const addHourRange = () => {
    setHours([...hours, { start: "09:00", end: "17:00" }]);
  };

  const updateHour = (index: number, field: "start" | "end", value: string) => {
    const updated = [...hours];
    updated[index][field] = value;
    setHours(updated);
  };

  const removeHour = (index: number) => {
    setHours(hours.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!startDate || !note) return;

    onCreate({
      id: `exc_${Date.now()}`,
      type,
      startDate,
      endDate: endDate || startDate,
      hours,
      public: publicFlag,
      note
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Add Exception / Holiday</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: type === "holiday" ? "#0ea5a3" : "#e5e7eb" }}>
                <input
                  type="radio"
                  name="type"
                  value="holiday"
                  checked={type === "holiday"}
                  onChange={(e) => setType(e.target.value as "holiday")}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Holiday (Closed)</p>
                  <p className="text-xs text-gray-500">Store will be closed</p>
                </div>
              </label>
              <label className="flex-1 flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: type === "special" ? "#0ea5a3" : "#e5e7eb" }}>
                <input
                  type="radio"
                  name="type"
                  value="special"
                  checked={type === "special"}
                  onChange={(e) => setType(e.target.value as "special")}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Special Hours</p>
                  <p className="text-xs text-gray-500">Different hours</p>
                </div>
              </label>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Hours (only for special) */}
          {type === "special" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Hours</label>
                <button
                  onClick={addHourRange}
                  className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  <FiPlus size={14} />
                  Add Range
                </button>
              </div>
              {hours.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No hours set (will be closed)</p>
              ) : (
                <div className="space-y-2">
                  {hours.map((range, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={range.start}
                        onChange={(e) => updateHour(index, "start", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                      <span className="text-gray-400">—</span>
                      <input
                        type="time"
                        value={range.end}
                        onChange={(e) => updateHour(index, "end", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        onClick={() => removeHour(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note / Reason</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Independence Day, Inventory Day"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Public Flag */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Make Public</p>
              <p className="text-xs text-gray-500">Show on store listing and notify customers</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={publicFlag}
                onChange={(e) => setPublicFlag(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!startDate || !note}
            className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Exception
          </button>
        </div>
      </div>
    </div>
  );
}
