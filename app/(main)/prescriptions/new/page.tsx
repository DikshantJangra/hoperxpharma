"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiPlus, FiX, FiUser, FiPackage, FiSave, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { prescriptionApi } from "@/lib/api/prescriptions";
import { drugApi, patientApi } from "@/lib/api/drugs";
import toast, { Toaster } from 'react-hot-toast';

interface PrescriptionItem {
  drugId: string;
  drugName: string;
  quantity: number;
  sig: string;
  daysSupply: number;
  isControlled: boolean;
}

export default function NewPrescriptionPage() {
  const router = useRouter();

  // Patient selection
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [searchingPatients, setSearchingPatients] = useState(false);

  // Drug selection
  const [drugSearch, setDrugSearch] = useState("");
  const [drugResults, setDrugResults] = useState<any[]>([]);
  const [showDrugResults, setShowDrugResults] = useState(false);
  const [searchingDrugs, setSearchingDrugs] = useState(false);

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
  const [prescriberName, setPrescriberName] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Search patients
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (patientSearch.length >= 2) {
        try {
          setSearchingPatients(true);
          const response = await patientApi.searchPatients(patientSearch);
          if (response.success) {
            setPatientResults(response.data || []);
            setShowPatientResults(true);
          }
        } catch (error) {
          console.error('[NewRx] Patient search error:', error);
          toast.error('Failed to search patients');
        } finally {
          setSearchingPatients(false);
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
          setSearchingDrugs(true);
          const response = await drugApi.searchDrugs(drugSearch);
          if (response.success) {
            setDrugResults(response.data || []);
            setShowDrugResults(true);
          }
        } catch (error) {
          console.error('[NewRx] Drug search error:', error);
          toast.error('Failed to search drugs');
        } finally {
          setSearchingDrugs(false);
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
    setErrors({ ...errors, patient: '' });
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
    setErrors({ ...errors, drug: '' });
  };

  const validateItem = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentItem.drugId) {
      newErrors.drug = 'Please select a medication';
    }
    if (!currentItem.quantity || currentItem.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }
    if (!currentItem.sig || currentItem.sig.trim() === '') {
      newErrors.sig = 'Instructions are required';
    }
    if (!currentItem.daysSupply || currentItem.daysSupply < 1) {
      newErrors.daysSupply = 'Days supply must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddItem = () => {
    if (!validateItem()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setItems([...items, currentItem as PrescriptionItem]);
    setCurrentItem({
      quantity: 1,
      sig: "",
      daysSupply: 30
    });
    setDrugSearch("");
    setErrors({});
    toast.success('Medication added');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success('Medication removed');
  };

  const handleSave = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      setErrors({ ...errors, patient: 'Patient is required' });
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }

    try {
      setSaving(true);
      const response = await prescriptionApi.createPrescription({
        patientId: selectedPatient.id,
        prescriberId: undefined, // Optional - for walk-ins
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
        toast.success('✅ Prescription created successfully!');
        setTimeout(() => router.push('/prescriptions'), 1000);
      }
    } catch (error: any) {
      console.error('[NewRx] Save error:', error);
      toast.error(error.response?.data?.message || 'Failed to create prescription');
    } finally {
      setSaving(false);
    }
  };

  // Sig templates
  const sigTemplates = [
    "Take 1 tablet twice daily",
    "Take 1 tablet three times daily",
    "Take 1 capsule at bedtime",
    "Apply topically as needed",
    "Take 1 tablet every 4-6 hours as needed"
  ];

  const currentStep = !selectedPatient ? 1 : items.length === 0 ? 2 : 3;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">New Prescription</h1>
              <p className="text-xs text-gray-500 mt-0.5">Create a new prescription for a patient</p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <div className={`flex items-center gap-1 ${currentStep >= 1 ? 'text-teal-600' : 'text-gray-400'}`}>
                {currentStep > 1 ? <FiCheckCircle className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-xs">1</span>}
                <span className="font-medium">Patient</span>
              </div>
              <span className="text-gray-300">→</span>
              <div className={`flex items-center gap-1 ${currentStep >= 2 ? 'text-teal-600' : 'text-gray-400'}`}>
                {currentStep > 2 ? <FiCheckCircle className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-xs">2</span>}
                <span className="font-medium">Medications</span>
              </div>
              <span className="text-gray-300">→</span>
              <div className={`flex items-center gap-1 ${currentStep >= 3 ? 'text-teal-600' : 'text-gray-400'}`}>
                <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-xs">3</span>
                <span className="font-medium">Review</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => router.push('/prescriptions')}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !selectedPatient || items.length === 0}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                <FiSave className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Prescription'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Patient Selection */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FiUser className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-gray-900">Patient Information</h2>
              {selectedPatient && <FiCheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
            </div>

            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patient by name or phone..."
                className={`w-full pl-9 pr-10 py-2.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.patient ? 'border-red-300' : 'border-gray-300'}`}
              />
              {searchingPatients && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-teal-600 rounded-full border-t-transparent" />
                </div>
              )}

              {showPatientResults && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {patientResults.length > 0 ? (
                    patientResults.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                      >
                        <div className="font-medium text-gray-900 text-sm">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {patient.phoneNumber} • {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'No DOB'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      <FiAlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No patients found</p>
                      <button className="text-teal-600 hover:underline mt-1 text-xs">Add New Patient</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedPatient && (
              <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-gray-600 font-medium">Name</div>
                    <div className="text-gray-900 font-semibold">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 font-medium">Phone</div>
                    <div className="text-gray-900 font-semibold">{selectedPatient.phoneNumber}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 font-medium">Allergies</div>
                    <div className="text-gray-900 font-semibold">
                      {selectedPatient.allergies?.join(', ') || 'None'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prescription Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4">Prescription Details</h2>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="manual">Manual Entry</option>
                  <option value="e-Rx">E-Prescription</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Prescriber (Optional)</label>
                <input
                  type="text"
                  value={prescriberName}
                  onChange={(e) => setPrescriberName(e.target.value)}
                  placeholder="Dr. Name (for walk-ins)"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Add Medications */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FiPackage className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-gray-900">Medications</h2>
            </div>

            {/* Drug Search */}
            <div className="relative mb-3">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={drugSearch}
                onChange={(e) => setDrugSearch(e.target.value)}
                placeholder="Search medication..."
                className={`w-full pl-9 pr-10 py-2.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.drug ? 'border-red-300' : 'border-gray-300'}`}
              />
              {searchingDrugs && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-teal-600 rounded-full border-t-transparent" />
                </div>
              )}

              {showDrugResults && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {drugResults.length > 0 ? (
                    drugResults.map((drug) => (
                      <div
                        key={drug.id}
                        onClick={() => handleSelectDrug(drug)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                      >
                        <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                          {drug.name}
                          {drug.isControlled && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded">CONTROLLED</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {drug.manufacturer} • {drug.packSize}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      <FiAlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No medications found</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Item Details */}
            {currentItem.drugId && (
              <>
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <FiPackage className="w-4 h-4 text-blue-600" />
                    {currentItem.drugName}
                    {currentItem.isControlled && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded border border-amber-300">
                        CONTROLLED SUBSTANCE
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                      className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.quantity ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {errors.quantity && <p className="text-xs text-red-600 mt-1">{errors.quantity}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Days Supply *</label>
                    <input
                      type="number"
                      min="1"
                      value={currentItem.daysSupply}
                      onChange={(e) => setCurrentItem({ ...currentItem, daysSupply: parseInt(e.target.value) || 30 })}
                      className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.daysSupply ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {errors.daysSupply && <p className="text-xs text-red-600 mt-1">{errors.daysSupply}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Sig Template</label>
                    <select
                      onChange={(e) => e.target.value && setCurrentItem({ ...currentItem, sig: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select template...</option>
                      {sigTemplates.map(sig => <option key={sig} value={sig}>{sig}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Sig (Instructions) *</label>
                  <input
                    type="text"
                    value={currentItem.sig}
                    onChange={(e) => setCurrentItem({ ...currentItem, sig: e.target.value })}
                    placeholder="e.g., Take 1 tablet twice daily with food"
                    className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.sig ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.sig && <p className="text-xs text-red-600 mt-1">{errors.sig}</p>}
                </div>

                <button
                  onClick={handleAddItem}
                  className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Medication
                </button>
              </>
            )}

            {/* Items List */}
            {items.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-bold text-gray-900">Added Medications ({items.length})</h3>
                {items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{item.drugName}</h4>
                        {item.isControlled && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded">CONTROLLED</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">Qty:</span> {item.quantity} •
                        <span className="font-medium"> Days:</span> {item.daysSupply} •
                        <span className="font-medium"> Sig:</span> {item.sig}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <FiX className="w-4 h-4" />
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
