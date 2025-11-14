import React from "react";
import { FiEye, FiRefreshCw, FiMessageSquare, FiMoreVertical, FiCheckCircle } from "react-icons/fi";
import PatientAvatar from "./PatientAvatar";
import MaskedValue from "./MaskedValue";

interface PatientRowProps {
  patient: any;
  selected: boolean;
  onSelect: () => void;
  onView: () => void;
  onRefill: () => void;
  onMessage: () => void;
}

export default function PatientRow({ patient, selected, onSelect, onView, onRefill, onMessage }: PatientRowProps) {
  return (
    <div className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors ${selected ? "bg-teal-50" : ""}`}>
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={onSelect}
        className="rounded text-teal-600 focus:ring-teal-500"
      />

      {/* Patient Info */}
      <div className="flex-1 flex items-center gap-3">
        <PatientAvatar name={patient.name} />
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={onView}
              className="text-sm font-medium text-gray-900 hover:text-teal-600"
            >
              {patient.name}
            </button>
            <span className="text-xs text-gray-500">
              {patient.age} • {patient.sex}
            </span>
            {patient.tags?.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                {patient.tags[0]}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {patient.mrn}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="w-32">
        <MaskedValue
          value={patient.primaryPhone}
          masked={patient.maskedPhone}
          verified={patient.phoneVerified}
        />
      </div>

      {/* Last Visit */}
      <div className="w-24 text-sm text-gray-600">
        {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
      </div>

      {/* Status Badges */}
      <div className="w-32 flex items-center gap-2">
        {patient.allergies?.length > 0 && (
          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded" title={patient.allergies.join(", ")}>
            {patient.allergies.length} allergy
          </span>
        )}
        {patient.pendingRefillsCount > 0 && (
          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
            {patient.pendingRefillsCount} refill
          </span>
        )}
        {patient.activeMedsCount > 0 && (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
            {patient.activeMedsCount} meds
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="w-40 flex items-center gap-2">
        <button
          onClick={onView}
          className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
          title="View details"
        >
          <FiEye size={16} />
        </button>
        {patient.pendingRefillsCount > 0 && (
          <button
            onClick={onRefill}
            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
            title="Start refill"
          >
            <FiRefreshCw size={16} />
          </button>
        )}
        <button
          onClick={onMessage}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
          title="Send message"
        >
          <FiMessageSquare size={16} />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <FiMoreVertical size={16} />
        </button>
      </div>
    </div>
  );
}
