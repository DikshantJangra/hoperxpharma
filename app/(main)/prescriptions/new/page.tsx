"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiPlus, FiX, FiUser, FiPackage, FiSave } from "react-icons/fi";
import { prescriptionApi } from "@/lib/api/prescriptions";
import { drugApi, patientApi } from "@/lib/api/drugs";

interface PrescriptionItem {
  drugId: string;
  drugName: string;
  quantity: number;
  sig: string;
  daysSupply?: number;
  isControlled: boolean;
}

export default function NewPrescriptionPage() {
  const router = useRouter();

  // Patient selection
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPatientResults, setShowPatientResults] = useState(false);

  // Drug selection
  const [drugSearch, setDrugSearch] = useState("");
  const [drugResults, setDrugResults] = useState<any[]>([]);
  const [showDrugResults, setShowDrugResults] = useState(false);

  // Prescription items
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<PrescriptionItem>>({
    quantity: 1,
    sig: "",
    daysSupply: 30
  });

  // Form state
  const [priority, setPriority] = useState<'Normal' | 'Urgent'>('Normal');
  const [source, setSource] = useState<'manual' | 'e-Rx'>('manual');
  const [prescriberId, setPrescriberId] = useState("");
  const [saving, setSaving] = useState(false);

  // Search patients
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (patientSearch.length >= 2) {
        try {
          const response = await patientApi.searchPatients(patientSearch);
          if (response.success) {
            setPatientResults(response.data || []);
            setShowPatientResults(true);
          }
        } catch (error) {
          console.error('[NewRx] Patient search error:', error);
        }
      } else {
        setPatientResults([]);
        setShowPatientResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Search drugs
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (drugSearch.length >= 2) {
        try {
          const response = await drugApi.searchDrugs(drugSearch);
          if (response.success) {
            setDrugResults(response.data || []);
            setShowDrugResults(true);
          }
        } catch (error) {
          console.error('[NewRx] Drug search error:', error);
        }
      } else {
        setDrugResults([]);
        setShowDrugResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [drugSearch]);

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.firstName} ${patient.lastName}`);
    setShowPatientResults(false);
  };

  const handleSelectDrug = (drug: any) => {
    setCurrentItem({
      ...currentItem,
      drugId: drug.id,
      drugName: drug.name,
      isControlled: drug.isControlled || false
    });
    setDrugSearch(drug.name);
    setShowDrugResults(false);
  };

  const handleAddItem = () => {
    if (!currentItem.drugId || !currentItem.quantity || !currentItem.sig) {
      alert('Please fill in all required fields');
      return;
    }

    setItems([...items, currentItem as PrescriptionItem]);
    setCurrentItem({
      quantity: 1,
      sig: "",
      daysSupply: 30
    });
    setDrugSearch("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedPatient) {
      alert('Please select a patient');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one medication');
      return;
    }

    try {
      setSaving(true);
      const response = await prescriptionApi.createPrescription({
        patientId: selectedPatient.id,
        prescriberId: prescriberId || undefined,
        source,
        priority,
        items: items.map(item => ({
          drugId: item.drugId,
          quantity: item.quantity,
          sig: item.sig,
          daysSupply: item.daysSupply,
          isControlled: item.isControlled
        }))
      });

      if (response.success) {
        alert('✅ Prescription created successfully!');
        router.push('/prescriptions');
      }
    } catch (error: any) {
      console.error('[NewRx] Save error:', error);
      alert(error.response?.data?.message || 'Failed to create prescription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] p-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">New Prescription</h1>
            <p className="text-sm text-[#64748b]">Create a new prescription for a patient</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/prescriptions')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !selectedPatient || items.length === 0}
              className="px-6 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiSave className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Prescription'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Patient Selection */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiUser className="w-6 h-6 text-[#0ea5a3]" />
              <h2 className="text-lg font-semibold text-[#0f172a]">Patient Information</h2>
            </div>

            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patient by name or phone..."
                className="w-full pl-10 pr-4 py-3 border-2 border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              />

              {showPatientResults && patientResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {patientResults.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-[#e2e8f0] last:border-0"
                    >
                      <div className="font-medium text-[#0f172a]">
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className="text-sm text-[#64748b]">
                        {patient.phoneNumber} • {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'No DOB'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedPatient && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-[#64748b]">Name</div>
                    <div className="font-medium text-[#0f172a]">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#64748b]">Phone</div>
                    <div className="font-medium text-[#0f172a]">{selectedPatient.phoneNumber}</div>
                  </div>
                  <div>
                    <div className="text-[#64748b]">Allergies</div>
                    <div className="font-medium text-[#0f172a]">
                      {selectedPatient.allergies?.join(', ') || 'None'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prescription Details */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Prescription Details</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-2">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-4 py-3 border-2 border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-2">Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as any)}
                  className="w-full px-4 py-3 border-2 border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                >
                  <option value="manual">Manual Entry</option>
                  <option value="e-Rx">E-Prescription</option>
                </select>
              </div>
            </div>
          </div>

          {/* Add Medications */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiPackage className="w-6 h-6 text-[#0ea5a3]" />
              <h2 className="text-lg font-semibold text-[#0f172a]">Medications</h2>
            </div>

            {/* Drug Search */}
            <div className="relative mb-4">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
              <input
                type="text"
                value={drugSearch}
                onChange={(e) => setDrugSearch(e.target.value)}
                placeholder="Search medication..."
                className="w-full pl-10 pr-4 py-3 border-2 border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              />

              {showDrugResults && drugResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {drugResults.map((drug) => (
                    <div
                      key={drug.id}
                      onClick={() => handleSelectDrug(drug)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-[#e2e8f0] last:border-0"
                    >
                      <div className="font-medium text-[#0f172a]">{drug.name}</div>
                      <div className="text-sm text-[#64748b]">
                        {drug.manufacturer} • {drug.packSize}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Item Details */}
            {currentItem.drugId && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-2">Quantity</label>
                  <input
                    type="number"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#0f172a] mb-2">Sig (Instructions)</label>
                  <input
                    type="text"
                    value={currentItem.sig}
                    onChange={(e) => setCurrentItem({ ...currentItem, sig: e.target.value })}
                    placeholder="e.g., Take 1 tablet twice daily"
                    className="w-full px-4 py-3 border-2 border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                  />
                </div>
              </div>
            )}

            {currentItem.drugId && (
              <button
                onClick={handleAddItem}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <FiPlus className="w-5 h-5" />
                Add Medication
              </button>
            )}

            {/* Items List */}
            {items.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-[#0f172a]">Added Medications ({items.length})</h3>
                {items.map((item, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#0f172a]">{item.drugName}</h4>
                      <p className="text-sm text-[#64748b] mt-1">
                        Qty: {item.quantity} • {item.sig}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
