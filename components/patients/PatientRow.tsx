import React from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiRefreshCw, FiMessageSquare, FiMoreVertical, FiCheckCircle } from "react-icons/fi";
import PatientAvatar from "./PatientAvatar";
import MaskedValue from "./MaskedValue";
import { usePremiumTheme } from '@/lib/hooks/usePremiumTheme';

interface PatientRowProps {
  patient: any;
  selected: boolean;
  onSelect: () => void;
  onView?: () => void; // Made optional since we'll use router
  onEdit: () => void;
  onRefill: () => void;
  onMessage: () => void;
}

export default function PatientRow({ patient, selected, onSelect, onView, onEdit, onRefill, onMessage }: PatientRowProps) {
  const router = useRouter();
  const { isPremium } = usePremiumTheme();

  // Construct full name from firstName and lastName
  const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient';

  const handleViewClick = () => {
    // Navigate to profile page
    router.push(`/patients/${patient.id}`);
  };

  return (
    <div className={`flex items-center gap-4 px-4 py-3 transition-all duration-200 group border-b border-transparent ${selected
        ? isPremium ? 'bg-emerald-50/80 border-emerald-100' : 'bg-teal-50'
        : isPremium ? 'hover:bg-white hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:border-emerald-500/10 hover:scale-[1.002] hover:-translate-y-[1px]' : 'hover:bg-gray-50'
      }`}>
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={onSelect}
        className="rounded text-teal-600 focus:ring-teal-500"
      />

      {/* Patient Info */}
      <div className="flex-1 flex items-center gap-3">
        <div className={isPremium ? 'ring-2 ring-offset-2 ring-emerald-500/10 rounded-full' : ''}>
          <PatientAvatar name={fullName} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleViewClick}
              className="text-sm font-medium text-gray-900 hover:text-teal-600"
            >
              {fullName}
            </button>
            <span className="text-xs text-gray-500">
              {patient.age || '—'} • {patient.gender || patient.sex || '—'}
            </span>
            {patient.tags?.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                {patient.tags[0]}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {patient.mrn || patient.id}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="w-32">
        <MaskedValue
          value={patient.phoneNumber || patient.primaryPhone}
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
      <div className={`w-40 flex items-center gap-2 ${isPremium ? 'opacity-80 group-hover:opacity-100 transition-opacity' : ''}`}>
        <button
          onClick={handleViewClick}
          className={`p-2 rounded-lg transition-colors ${isPremium
              ? 'text-emerald-600/70 hover:text-emerald-700 hover:bg-emerald-50 hover:shadow-sm'
              : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'
            }`}
          title="View details"
        >
          <FiEye size={16} />
        </button>
        <button
          onClick={onEdit}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${isPremium
              ? 'text-emerald-700 border-emerald-200/50 hover:bg-emerald-50 hover:border-emerald-200 shadow-sm bg-white'
              : 'text-gray-700 hover:text-teal-600 hover:bg-teal-50 border-gray-200'
            }`}
          title="Edit patient"
        >
          Edit
        </button>
        {patient.pendingRefillsCount > 0 && (
          <button
            onClick={onRefill}
            className={`p-2 rounded-lg transition-colors ${isPremium
                ? 'text-amber-600/70 hover:text-amber-700 hover:bg-amber-50 hover:shadow-sm'
                : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
              }`}
            title="Start refill"
          >
            <FiRefreshCw size={16} />
          </button>
        )}
        <button
          onClick={onMessage}
          className={`p-2 rounded-lg transition-colors ${isPremium
              ? 'text-blue-600/70 hover:text-blue-700 hover:bg-blue-50 hover:shadow-sm'
              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
          title="Send message"
        >
          <FiMessageSquare size={16} />
        </button>
      </div>
    </div>
  );
}
