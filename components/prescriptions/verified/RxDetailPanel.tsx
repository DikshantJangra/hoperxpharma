'use client';

import { useState } from 'react';
import { FiCheckCircle, FiMessageSquare, FiAlertTriangle, FiClock, FiPrinter } from 'react-icons/fi';
import ClinicalAlerts from './ClinicalAlerts';
import RxItemRow from './RxItemRow';
import PinModal from './PinModal';

const RxDetailPanelSkeleton = () => (
    <div className="h-full flex flex-col bg-white animate-pulse">
        <div className="p-6 border-b border-[#e2e8f0]">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="h-7 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-100 rounded w-24"></div>
                </div>
                <div className="h-9 w-24 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-10 bg-gray-100 rounded-lg"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            <div className="h-20 bg-gray-100 rounded-lg mb-6"></div> {/* Clinical Alerts */}
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="space-y-2">
                <div className="h-20 bg-gray-100 rounded-lg"></div>
                <div className="h-20 bg-gray-100 rounded-lg"></div>
            </div>
        </div>

        <div className="p-6 border-t border-[#e2e8f0] bg-[#f8fafc]">
            <div className="flex items-center gap-3">
                <div className="h-12 bg-gray-200 rounded-lg flex-1"></div>
                <div className="h-12 bg-gray-100 rounded-lg w-24"></div>
                <div className="h-12 bg-gray-100 rounded-lg w-24"></div>
                <div className="h-12 bg-gray-100 rounded-lg w-16"></div>
            </div>
        </div>
    </div>
)

export default function RxDetailPanel({ rx, isLoading }: any) {
  const [showPinModal, setShowPinModal] = useState(false);

  if (isLoading) {
    return <RxDetailPanelSkeleton />;
  }

  if (!rx) {
    return (
      <div className="bg-white border-l border-gray-200 p-6">
        <p className="text-sm text-gray-500">Select a prescription to view details</p>
      </div>
    );
  }

  const detail = rx; // Use the passed rx prop

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-[#e2e8f0]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#0f172a]">{detail.patient.name}</h2>
            <p className="text-sm text-[#64748b]">{detail.patient.age}y {detail.patient.sex} • MRN: {detail.patient.mrn}</p>
            <p className="text-sm text-[#64748b]">{detail.clinician.name} • {detail.clinician.clinic}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[#f1f5f9] rounded-lg" title="Print" disabled={isLoading}>
              <FiPrinter className="w-5 h-5 text-[#64748b]" />
            </button>
            <span className="px-3 py-1 bg-[#f1f5f9] text-[#64748b] rounded-lg text-sm">
              {detail.id}
            </span>
          </div>
        </div>

        {detail.patient.allergies.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#fef3c7] border border-[#fde68a] rounded-lg">
            <FiAlertTriangle className="w-4 h-4 text-[#92400e]" />
            <span className="text-sm text-[#92400e]">
              <span className="font-semibold">Allergies:</span> {detail.patient.allergies.join(', ')}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <ClinicalAlerts flags={detail.clinicalFlags} isLoading={isLoading} />

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Medications</h3>
          <div className="space-y-2">
            {detail.items.map((item: any) => (
              <RxItemRow key={item.lineId} item={item} hasAlert={detail.clinicalFlags.allergyMatches.includes(item.lineId)} isLoading={isLoading} />
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-[#e2e8f0] bg-[#f8fafc]">
        <div className="flex items-center gap-3">
          <button className="flex-1 px-4 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] flex items-center justify-center gap-2 font-medium" disabled={isLoading}>
            <FiCheckCircle className="w-5 h-5" />
            Accept — Reserve & Dispense
            <span className="text-xs opacity-75">(A)</span>
          </button>
          <button className="px-4 py-3 border border-[#cbd5e1] rounded-lg hover:bg-white flex items-center gap-2 font-medium" disabled={isLoading}>
            <FiMessageSquare className="w-5 h-5" />
            Clarify
            <span className="text-xs text-[#64748b]">(C)</span>
          </button>
          <button onClick={() => setShowPinModal(true)} className="px-4 py-3 border border-[#f59e0b] bg-[#fef3c7] text-[#92400e] rounded-lg hover:bg-[#fde68a] flex items-center gap-2 font-medium" disabled={isLoading}>
            <FiAlertTriangle className="w-5 h-5" />
            Override
            <span className="text-xs opacity-75">(O)</span>
          </button>
          <button className="px-4 py-3 border border-[#cbd5e1] rounded-lg hover:bg-white flex items-center gap-2" disabled={isLoading}>
            <FiClock className="w-5 h-5 text-[#64748b]" />
            Hold
          </button>
        </div>
      </div>

      {showPinModal && <PinModal onClose={() => setShowPinModal(false)} />}
    </div>
  );
}
