"use client";

import React, { useEffect, useState } from "react";
import {
  FiX, FiPhone, FiMail, FiMapPin, FiAlertCircle, FiFileText,
  FiShoppingCart, FiRefreshCw, FiEdit, FiCalendar, FiActivity
} from "react-icons/fi";
import { patientsApi } from "@/lib/api/patients";
import { useRouter } from "next/navigation";

interface PatientDetailDrawerProps {
  patientId: string;
  onClose: () => void;
  onEdit?: (patient: any) => void;
  onRefill?: (patient: any) => void;
}

export default function PatientDetailDrawer({
  patientId,
  onClose,
  onEdit,
  onRefill
}: PatientDetailDrawerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPatientDetails();
  }, [patientId]);

  const loadPatientDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientsApi.getPatientById(patientId);
      setPatient(data);
    } catch (err: any) {
      console.error("Error loading patient details:", err);
      setError(err.message || "Failed to load patient details");
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleNewSale = () => {
    router.push(`/pos/new-sale?patientId=${patientId}`);
    onClose();
  };

  const handleEdit = () => {
    if (onEdit && patient) {
      onEdit(patient);
      onClose();
    }
  };

  const handleRefill = () => {
    if (onRefill && patient) {
      onRefill(patient);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end justify-end z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl h-full shadow-xl overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {patient ? `${patient.firstName} ${patient.lastName}` : "Loading..."}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Patient Details</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading patient details...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadPatientDetails}
              className="text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        ) : patient ? (
          <div className="p-6 space-y-6">
            {/* Quick Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleNewSale}
                className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <FiShoppingCart className="w-4 h-4" />
                New Sale
              </button>
              <button
                onClick={handleRefill}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" />
                Refill
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FiEdit className="w-4 h-4" />
                Edit
              </button>
            </div>

            {/* Basic Information */}
            <section className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiFileText className="text-teal-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Age / DOB</p>
                  <p className="text-gray-900 mt-1 font-medium">
                    {calculateAge(patient.dateOfBirth)} years
                    {patient.dateOfBirth && ` • ${new Date(patient.dateOfBirth).toLocaleDateString()}`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Gender</p>
                  <p className="text-gray-900 mt-1 font-medium">{patient.gender || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Blood Group</p>
                  <p className="text-gray-900 mt-1 font-medium">{patient.bloodGroup || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Member Since</p>
                  <p className="text-gray-900 mt-1 font-medium">
                    {new Date(patient.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiPhone className="text-teal-600" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <FiPhone className="text-gray-400" />
                  <a href={`tel:${patient.phoneNumber}`} className="text-teal-600 hover:text-teal-700 font-medium">
                    {patient.phoneNumber}
                  </a>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <FiMail className="text-gray-400" />
                    <a href={`mailto:${patient.email}`} className="text-teal-600 hover:text-teal-700">
                      {patient.email}
                    </a>
                  </div>
                )}
                {(patient.addressLine1 || patient.city) && (
                  <div className="flex items-start gap-3 text-sm">
                    <FiMapPin className="text-gray-400 mt-0.5" />
                    <span className="text-gray-900">
                      {[patient.addressLine1, patient.addressLine2, patient.city, patient.state, patient.pinCode]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Medical Information */}
            <section className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiActivity className="text-teal-600" />
                Medical Information
              </h3>

              {/* Allergies */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Allergies</p>
                {patient.allergies && patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <FiAlertCircle className="w-3 h-3" />
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-900">None reported</p>
                )}
              </div>

              {/* Chronic Conditions */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Chronic Conditions</p>
                {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.chronicConditions.map((condition: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        {condition}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-900">None reported</p>
                )}
              </div>
            </section>

            {/* Emergency Contact */}
            {(patient.emergencyContactName || patient.emergencyContactPhone) && (
              <section className="bg-red-50 rounded-lg p-4 border border-red-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiPhone className="text-red-600" />
                  Emergency Contact
                </h3>
                <div className="space-y-2 text-sm">
                  {patient.emergencyContactName && (
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="text-gray-900 font-medium">{patient.emergencyContactName}</p>
                    </div>
                  )}
                  {patient.emergencyContactPhone && (
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <a
                        href={`tel:${patient.emergencyContactPhone}`}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        {patient.emergencyContactPhone}
                      </a>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Recent Prescriptions */}
            {patient.prescriptions && patient.prescriptions.length > 0 && (
              <section className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiFileText className="text-teal-600" />
                  Recent Prescriptions
                </h3>
                <div className="space-y-2">
                  {patient.prescriptions.slice(0, 5).map((rx: any) => (
                    <div key={rx.id} className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          {new Date(rx.createdAt).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rx.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                          {rx.status}
                        </span>
                      </div>
                      {rx.items && rx.items.length > 0 && (
                        <p className="text-sm text-gray-900">
                          {rx.items.map((item: any) => item.drug?.name || 'Unknown').join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Sales */}
            {patient.sales && patient.sales.length > 0 && (
              <section className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiShoppingCart className="text-teal-600" />
                  Recent Purchases
                </h3>
                <div className="space-y-2">
                  {patient.sales.slice(0, 5).map((sale: any) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">₹{sale.totalAmount}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <FiCalendar className="text-gray-400" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
