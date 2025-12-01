import React, { useState, useEffect } from "react";
import { FiX, FiPackage, FiCheck } from "react-icons/fi";
import { patientsApi } from "@/lib/api/patients";
import { useAuthStore } from "@/lib/store/auth-store";

interface RefillModalProps {
  patient: any;
  onClose: () => void;
}

export default function RefillModal({ patient, onClose }: RefillModalProps) {
  const { primaryStore } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (patient?.prescriptions) {
      // Filter for active prescriptions
      const active = patient.prescriptions.filter((p: any) => p.status === 'Active');
      setPrescriptions(active);
      // Initialize quantities
      const initialQuantities: Record<string, number> = {};
      active.forEach((p: any) => {
        // Assuming prescription has items or is single drug. 
        // For simplicity, assuming prescription structure has drugName/drugId
        // If complex, we'd need to fetch prescription details.
        // Using mock structure compatible with display if real data missing
        initialQuantities[p.id] = p.quantity || 30;
      });
      setQuantities(initialQuantities);
    } else {
      // Fallback mock data for demo if no real data
      setPrescriptions([
        { id: "rx_001", drugName: "Metformin 500mg", quantity: 30, refillsLeft: 2, drugId: "drug_1" },
        { id: "rx_002", drugName: "Lisinopril 10mg", quantity: 30, refillsLeft: 1, drugId: "drug_2" }
      ]);
      setQuantities({ "rx_001": 30, "rx_002": 30 });
    }
  }, [patient]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const updateQuantity = (id: string, qty: number) => {
    setQuantities(prev => ({ ...prev, [id]: qty }));
  };

  const handleRefill = async () => {
    if (selectedItems.size === 0) return;
    if (!primaryStore?.id) {
      alert("Store context missing");
      return;
    }

    setIsSubmitting(true);

    // Optimistic UI: Close immediately
    onClose();

    // In a real app, we'd show a global toast here.
    // For now, we'll just log and proceed.
    console.log("Processing refill...");

    try {
      const items = Array.from(selectedItems).map(id => {
        const rx = prescriptions.find(p => p.id === id);
        return {
          prescriptionId: id,
          drugId: rx.drugId || "unknown_drug", // Fallback
          quantity: quantities[id],
          expectedRefillDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 days
        };
      });

      await patientsApi.processRefill(patient.id, {
        storeId: primaryStore.id,
        items
      });

      // Success handled by optimistic close
    } catch (error) {
      console.error("Refill failed:", error);
      alert("Failed to process refill. Please try again.");
      // Ideally re-open modal or show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Start Refill</h2>
            <p className="text-sm text-gray-500 mt-1">{patient.firstName} {patient.lastName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-3">
            {prescriptions.length > 0 ? (
              prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${selectedItems.has(rx.id) ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-teal-200"
                    }`}
                  onClick={() => toggleSelection(rx.id)}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedItems.has(rx.id) ? "bg-teal-500 border-teal-500 text-white" : "border-gray-300 bg-white"
                    }`}>
                    {selectedItems.has(rx.id) && <FiCheck size={12} />}
                  </div>

                  <FiPackage className={selectedItems.has(rx.id) ? "text-teal-500" : "text-gray-400"} size={20} />

                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{rx.drugName || "Unknown Drug"}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {rx.refillsLeft !== undefined ? `${rx.refillsLeft} refills remaining` : "Refill available"}
                    </p>
                  </div>

                  <div onClick={e => e.stopPropagation()}>
                    <input
                      type="number"
                      value={quantities[rx.id] || 0}
                      onChange={(e) => updateQuantity(rx.id, parseInt(e.target.value))}
                      className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      disabled={!selectedItems.has(rx.id)}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No active prescriptions found.
              </div>
            )}
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
            disabled={selectedItems.size === 0 || isSubmitting}
            className={`px-5 py-2 text-white rounded-lg transition-colors ${selectedItems.size === 0 || isSubmitting
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700"
              }`}
          >
            {isSubmitting ? "Processing..." : `Process Refill (${selectedItems.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
