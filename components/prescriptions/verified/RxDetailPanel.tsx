'use client';

import { useState } from 'react';
import { FiCheckCircle, FiMessageSquare, FiAlertTriangle, FiClock, FiPrinter } from 'react-icons/fi';
import ClinicalAlerts from './ClinicalAlerts';
import RxItemRow from './RxItemRow';
import PinModal from './PinModal';

const MOCK_RX_DETAIL = {
  id: 'rx_001',
  patient: { name: 'Riya Sharma', age: 36, sex: 'F', mrn: 'MRN-1001', allergies: ['Penicillin'] },
  clinician: { name: 'Dr. Kumar', clinic: 'City Health' },
  uploadedAt: '10 min ago',
  items: [
    { lineId: 'l1', drug: 'Paracetamol 500mg Tab', dose: '500 mg', frequency: 'TID', route: 'Oral', duration: '5 days', qty: 15, instructions: 'After food' },
    { lineId: 'l2', drug: 'Amoxicillin 250mg Cap', dose: '250 mg', frequency: 'TID', route: 'Oral', duration: '7 days', qty: 21, instructions: 'Complete course' }
  ],
  clinicalFlags: { allergyMatches: ['l2'], interactions: [], doseOutOfRange: [] }
};

export default function RxDetailPanel({ rx }: any) {
  const [showPinModal, setShowPinModal] = useState(false);
  const detail = MOCK_RX_DETAIL;

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
            <button className="p-2 hover:bg-[#f1f5f9] rounded-lg" title="Print">
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
        <ClinicalAlerts flags={detail.clinicalFlags} />

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Medications</h3>
          <div className="space-y-2">
            {detail.items.map(item => (
              <RxItemRow key={item.lineId} item={item} hasAlert={detail.clinicalFlags.allergyMatches.includes(item.lineId)} />
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-[#e2e8f0] bg-[#f8fafc]">
        <div className="flex items-center gap-3">
          <button className="flex-1 px-4 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] flex items-center justify-center gap-2 font-medium">
            <FiCheckCircle className="w-5 h-5" />
            Accept — Reserve & Dispense
            <span className="text-xs opacity-75">(A)</span>
          </button>
          <button className="px-4 py-3 border border-[#cbd5e1] rounded-lg hover:bg-white flex items-center gap-2 font-medium">
            <FiMessageSquare className="w-5 h-5" />
            Clarify
            <span className="text-xs text-[#64748b]">(C)</span>
          </button>
          <button onClick={() => setShowPinModal(true)} className="px-4 py-3 border border-[#f59e0b] bg-[#fef3c7] text-[#92400e] rounded-lg hover:bg-[#fde68a] flex items-center gap-2 font-medium">
            <FiAlertTriangle className="w-5 h-5" />
            Override
            <span className="text-xs opacity-75">(O)</span>
          </button>
          <button className="px-4 py-3 border border-[#cbd5e1] rounded-lg hover:bg-white flex items-center gap-2">
            <FiClock className="w-5 h-5 text-[#64748b]" />
            Hold
          </button>
        </div>
      </div>

      {showPinModal && <PinModal onClose={() => setShowPinModal(false)} />}
    </div>
  );
}
