import React from "react";
import { FiX, FiPackage } from "react-icons/fi";

interface RefillModalProps {
  patient: any;
  onClose: () => void;
}

export default function RefillModal({ patient, onClose }: RefillModalProps) {
  const [prescriptions, setPrescriptions] = React.useState([
    { id: "rx_001", drug: "Metformin 500mg", qty: 30, refillsLeft: 2 },
    { id: "rx_002", drug: "Lisinopril 10mg", qty: 30, refillsLeft: 1 }
  ]);

  const handleRefill = () => {
    // Process refill
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Start Refill</h2>
            <p className="text-sm text-gray-500 mt-1">{patient.name} • {patient.mrn}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-3">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <FiPackage className="text-gray-400" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{rx.drug}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Quantity: {rx.qty} • {rx.refillsLeft} refills remaining
                  </p>
                </div>
                <input
                  type="number"
                  defaultValue={rx.qty}
                  className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            ))}
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
            onClick={handleRefill}
            className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Process Refill
          </button>
        </div>
      </div>
    </div>
  );
}
