import React from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiMessageSquare, FiRefreshCw, FiChevronRight, FiEdit2, FiPhone, FiCalendar } from "react-icons/fi";
import PatientAvatar from "./PatientAvatar";
import MaskedValue from "./MaskedValue";
import { motion } from "framer-motion";

interface PatientRowProps {
  patient: any;
  selected: boolean;
  onSelect: () => void;
  onView?: () => void;
  onEdit: () => void;
  onRefill: () => void;
  onMessage: () => void;
}

export default function PatientRow({ patient, selected, onSelect, onView, onEdit, onRefill, onMessage }: PatientRowProps) {
  const router = useRouter();

  const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient';

  const handleRowClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking checkbox or buttons
    if ((e.target as HTMLElement).closest('button, input')) return;
    router.push(`/patients/${patient.id}`);
  };

  const statusLabel = patient.lifecycleStage?.replace('_', ' ') || 'New';

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={handleRowClick}
      className={`group relative flex items-center gap-6 px-8 py-5 transition-all cursor-pointer border-b border-gray-50 bg-white hover:bg-teal-50/10 ${selected ? 'bg-teal-50/30' : ''
        }`}
    >
      <div className="flex items-center gap-6 flex-1 min-w-0">
        {/* Checkbox */}
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="w-5 h-5 rounded-lg border-gray-200 text-teal-600 focus:ring-teal-500 transition-all opacity-0 group-hover:opacity-100 checked:opacity-100"
          />
        </div>

        {/* Patient Identity */}
        <div className="flex items-center gap-4 min-w-[280px]">
          <div className="relative">
            <PatientAvatar name={fullName} src={patient.avatarUrl} />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${patient.isActive ? 'bg-green-500' : 'bg-gray-300'
              }`} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-black text-gray-900 group-hover:text-teal-600 transition-colors truncate tracking-tight">
              {fullName}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 whitespace-nowrap">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                {patient.mrn || `#${patient.id.slice(-6).toUpperCase()}`}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {patient.age || '—'}Y • {patient.gender?.[0] || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Lifecycle Badge */}
        <div className="w-32 hidden lg:block">
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${patient.lifecycleStage === 'CREDIT_ELIGIBLE' ? 'bg-purple-50 text-purple-600 border-purple-100' :
            patient.lifecycleStage === 'TRUSTED' ? 'bg-green-50 text-green-600 border-green-100' :
              'bg-gray-50 text-gray-500 border-gray-100'
            }`}>
            {statusLabel}
          </span>
        </div>

        {/* Contact Info */}
        <div className="w-40 hidden md:block">
          <div className="flex items-center gap-2 text-gray-400 mb-0.5">
            <FiPhone size={10} />
            <span className="text-[9px] font-black uppercase tracking-widest">Phone</span>
          </div>
          <div className="text-sm font-semibold text-gray-700">
            <MaskedValue
              value={patient.phoneNumber || patient.primaryPhone}
              masked={patient.maskedPhone}
              verified={patient.phoneVerified}
            />
          </div>
        </div>

        {/* Last Interaction */}
        <div className="w-32 hidden xl:block">
          <div className="flex items-center gap-2 text-gray-400 mb-0.5">
            <FiCalendar size={10} />
            <span className="text-[9px] font-black uppercase tracking-widest">Last Visit</span>
          </div>
          <p className="text-sm font-semibold text-gray-700">
            {patient.lastVisitAt ? new Date(patient.lastVisitAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Never"}
          </p>
        </div>

        {/* Financial Context */}
        <div className="w-32 hidden 2xl:block">
          <div className="flex items-center gap-2 text-gray-400 mb-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest">Bill Vol</span>
          </div>
          <p className="text-sm font-black text-gray-900 leading-none">
            ₹{Math.round(patient.avgBillAmount || 0).toLocaleString()}
            <span className="text-[10px] text-gray-400 font-bold ml-1">avg</span>
          </p>
        </div>
      </div>

      {/* Floating Action Menu */}
      <div className="flex items-center justify-end gap-2 pr-2">
        <button
          onClick={onMessage}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-all text-gray-400 hover:text-blue-600 hover:bg-blue-50"
          title="Message"
        >
          <FiMessageSquare size={18} />
        </button>
        {patient.pendingRefillsCount > 0 && (
          <button
            onClick={onRefill}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all text-gray-400 hover:text-amber-600 hover:bg-amber-50"
            title="Refill"
          >
            <FiRefreshCw size={18} />
          </button>
        )}
        <button
          onClick={onEdit}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-all text-gray-400 hover:text-teal-600 hover:bg-teal-50"
          title="Edit"
        >
          <FiEdit2 size={16} />
        </button>
        <div className="w-[1px] h-6 bg-gray-100 mx-1" />
        <button
          onClick={() => router.push(`/patients/${patient.id}`)}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-all bg-gray-50 text-gray-400 group-hover:bg-teal-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-teal-100"
        >
          <FiChevronRight size={20} />
        </button>
      </div>
    </motion.div>
  );
}
