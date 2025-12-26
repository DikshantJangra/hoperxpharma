"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    FiPhone, FiMail, FiMapPin, FiCalendar, FiUser,
    FiShoppingCart, FiRefreshCw, FiUpload, FiMessageSquare,
    FiArrowLeft, FiEdit, FiShield, FiActivity, FiFileText,
    FiClock, FiCheckCircle, FiUsers
} from "react-icons/fi";
import { MdLocalPharmacy } from "react-icons/md";
import { patientsApi } from "@/lib/api/patients";
import { useAuthStore } from "@/lib/store/auth-store";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PrescriptionUploadModal from "@/components/patients/PrescriptionUploadModal";
import PatientMergeModal from "@/components/patients/PatientMergeModal";
import PatientConsentsTab from "@/components/patients/PatientConsentsTab";
import PatientHistoryTimeline from "@/components/patients/PatientHistoryTimeline";
import AdherenceChart from "@/components/patients/AdherenceChart";
import PatientConnectionsTab from "@/components/patients/PatientConnectionsTab"; // Import

interface TabProps {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const tabs: TabProps[] = [
    { id: "summary", label: "Summary", icon: <FiUser className="w-4 h-4" /> },
    { id: "prescriptions", label: "Prescriptions", icon: <FiFileText className="w-4 h-4" /> },
    { id: "connections", label: "Family & Connections", icon: <FiUsers className="w-4 h-4" /> }, // Add Tab
    { id: "adherence", label: "Adherence", icon: <FiActivity className="w-4 h-4" /> },
    { id: "sales", label: "Sales History", icon: <FiShoppingCart className="w-4 h-4" /> },
    { id: "consents", label: "Consents", icon: <FiShield className="w-4 h-4" /> },
    { id: "history", label: "History", icon: <FiClock className="w-4 h-4" /> },
];

export default function PatientProfilePage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params?.id as string;
    const { primaryStore } = useAuthStore();

    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("summary");
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);

    useEffect(() => {
        if (patientId) {
            loadPatient();
        }
    }, [patientId]);

    const loadPatient = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await patientsApi.getPatientById(patientId);
            setPatient(data);
        } catch (err: any) {
            console.error("Error loading patient:", err);
            setError(err.message || "Failed to load patient");
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

    const getConsentStatus = (type: string) => {
        if (!patient?.consents) return false;
        return patient.consents.some((c: any) => c.type === type && c.status === "Active");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading patient profile...</p>
                </div>
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error || "Patient not found"}</p>
                    <button
                        onClick={() => router.push("/patients/list")}
                        className="text-teal-600 hover:text-teal-700 flex items-center gap-2 mx-auto"
                    >
                        <FiArrowLeft /> Back to Patients
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    {/* Back Button */}
                    <button
                        onClick={() => router.push("/patients/list")}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Back to Patients
                    </button>

                    {/* Patient Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                                {patient.firstName?.[0]}{patient.lastName?.[0]}
                            </div>

                            {/* Info */}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                    {patient.firstName} {patient.middleName} {patient.lastName}
                                </h1>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                    <span className="flex items-center gap-1">
                                        <FiUser className="w-4 h-4" />
                                        {patient.gender || "Not specified"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <FiCalendar className="w-4 h-4" />
                                        {calculateAge(patient.dateOfBirth)} years
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <FiPhone className="w-4 h-4" />
                                        {patient.phoneNumber}
                                    </span>
                                    {patient.email && (
                                        <span className="flex items-center gap-1">
                                            <FiMail className="w-4 h-4" />
                                            {patient.email}
                                        </span>
                                    )}
                                </div>

                                {/* Consent Badges */}
                                <div className="flex items-center gap-2">
                                    {getConsentStatus("WhatsApp") && (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                            <FiCheckCircle className="w-3 h-3" />
                                            WhatsApp
                                        </span>
                                    )}
                                    {getConsentStatus("Marketing") && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                                            <FiCheckCircle className="w-3 h-3" />
                                            Marketing
                                        </span>
                                    )}
                                    {patient.state && (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1">
                                            <FiMapPin className="w-3 h-3" />
                                            {patient.state}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Edit Button */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowMergeModal(true)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-600"
                                title="Merge duplicate record into this profile"
                            >
                                <FiUser className="w-4 h-4" />
                                <span className="hidden sm:inline">Merge</span>
                            </button>
                            <button
                                onClick={() => router.push(`/patients/edit?id=${patientId}`)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                            >
                                <FiEdit className="w-4 h-4" />
                                Edit Profile
                            </button>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6 flex items-center gap-3">
                        <button
                            onClick={() => router.push(`/pos/new-sale?patientId=${patientId}`)}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 font-medium"
                        >
                            <FiShoppingCart className="w-4 h-4" />
                            New Sale
                        </button>
                        <button
                            onClick={() => router.push(`/patients/refills?patientId=${patientId}`)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                            <FiRefreshCw className="w-4 h-4" />
                            Refill
                        </button>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                            <FiUpload className="w-4 h-4" />
                            Upload Rx
                        </button>
                        <a
                            href={`tel:${patient.phoneNumber}`}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                            <FiPhone className="w-4 h-4" />
                            Call
                        </a>
                        {getConsentStatus("WhatsApp") && (
                            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                                <FiMessageSquare className="w-4 h-4" />
                                WhatsApp
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${activeTab === tab.id
                                    ? "border-teal-600 text-teal-600 font-medium"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                {activeTab === "summary" && <SummaryTab patient={patient} />}
                {activeTab === "prescriptions" && <PrescriptionsTab patient={patient} />}
                {activeTab === "connections" && <PatientConnectionsTab patient={patient} onUpdate={loadPatient} />}
                {activeTab === "adherence" && <AdherenceTab patientId={patientId} />}
                {activeTab === "sales" && <SalesTab patient={patient} />}
                {activeTab === "consents" && <PatientConsentsTab patient={patient} onUpdate={loadPatient} />}
                {activeTab === "history" && <PatientHistoryTimeline patientId={patientId} />}
            </div>

            {/* Modals */}
            <PrescriptionUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                patientId={patientId}
                onUploadComplete={() => {
                    loadPatient(); // Refresh data
                }}
            />

            <PatientMergeModal
                isOpen={showMergeModal}
                onClose={() => setShowMergeModal(false)}
                targetPatient={patient}
                onMergeComplete={() => {
                    loadPatient(); // Refresh data to show merged items
                }}
            />
        </div>
    );
}

// Adherence Tab Component
function AdherenceTab({ patientId }: { patientId: string }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <AdherenceChart patientId={patientId} />
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 whitespace-nowrap">Why it matters</h3>
                <div className="space-y-4 text-sm text-gray-600">
                    <p>
                        High adherence (80%+) ensures medication effectiveness and reduces hospital visits.
                    </p>
                    <div className="p-3 bg-blue-50 text-blue-800 rounded-lg">
                        <strong>Tip:</strong> Suggest auto-refills if adherence is consistently high.
                    </div>
                </div>
            </div>
        </div>
    );
}

// Summary Tab Component
function SummaryTab({ patient }: { patient: any }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Adherence Snapshot */}
            <div className="md:col-span-2">
                <AdherenceChart patientId={patient.id} />
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiUser className="w-5 h-5 text-teal-600" />
                    Personal Information
                </h3>
                <div className="space-y-3">
                    <InfoRow label="Full Name" value={`${patient.firstName} ${patient.middleName || ""} ${patient.lastName}`} />
                    <InfoRow label="Date of Birth" value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "Not provided"} />
                    <InfoRow label="Gender" value={patient.gender || "Not specified"} />
                    <InfoRow label="Blood Group" value={patient.bloodGroup || "Not specified"} />
                </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiPhone className="w-5 h-5 text-teal-600" />
                    Contact Information
                </h3>
                <div className="space-y-3">
                    <InfoRow label="Phone" value={patient.phoneNumber} />
                    <InfoRow label="Email" value={patient.email || "Not provided"} />
                    <InfoRow label="Address" value={
                        patient.addressLine1
                            ? `${patient.addressLine1}${patient.addressLine2 ? ', ' + patient.addressLine2 : ''}, ${patient.city || ''}, ${patient.state || ''} ${patient.pinCode || ''}`
                            : "Not provided"
                    } />
                </div>
            </div>

            {/* Medical Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiActivity className="w-5 h-5 text-teal-600" />
                    Medical Information
                </h3>
                <div className="space-y-3">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Allergies</p>
                        {patient.allergies && patient.allergies.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {patient.allergies.map((allergy: string, idx: number) => (
                                    <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                        {allergy}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-900">None reported</p>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Chronic Conditions</p>
                        {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {patient.chronicConditions.map((condition: string, idx: number) => (
                                    <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                                        {condition}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-900">None reported</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiPhone className="w-5 h-5 text-red-600" />
                    Emergency Contact
                </h3>
                <div className="space-y-3">
                    <InfoRow label="Name" value={patient.emergencyContactName || "Not provided"} />
                    <InfoRow label="Phone" value={patient.emergencyContactPhone || "Not provided"} />
                </div>
            </div>

            {/* Insurance Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiShield className="w-5 h-5 text-teal-600" />
                    Insurance Information
                </h3>
                {patient.insurance && patient.insurance.length > 0 ? (
                    <div className="space-y-3">
                        {patient.insurance.map((ins: any, idx: number) => (
                            <div key={idx} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                                <p className="font-medium text-gray-900">{ins.provider}</p>
                                <p className="text-sm text-gray-600">Policy: {ins.policyNumber}</p>
                                <p className="text-xs text-gray-500">
                                    Valid until: {new Date(ins.validUntil).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No insurance on file</p>
                )}
            </div>
        </div>
    );
}

// Prescriptions Tab Component
function PrescriptionsTab({ patient }: { patient: any }) {
    return (
        <div className="space-y-4">
            {patient.prescriptions && patient.prescriptions.length > 0 ? (
                patient.prescriptions.map((rx: any) => (
                    <div key={rx.id} className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h4 className="font-semibold text-gray-900">Prescription #{rx.id.slice(0, 8)}</h4>
                                <p className="text-sm text-gray-500">{new Date(rx.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${rx.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                                rx.status === "DISPENSED" ? "bg-blue-100 text-blue-700" :
                                    "bg-gray-100 text-gray-700"
                                }`}>
                                {rx.status}
                            </span>
                        </div>
                        {rx.items && rx.items.length > 0 && (
                            <div className="space-y-2">
                                {rx.items.map((item: any, idx: number) => (
                                    <div key={idx} className="text-sm text-gray-700">
                                        • {item.drug?.name || "Unknown medication"} - {item.quantityPrescribed} units
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <MdLocalPharmacy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Prescriptions</h3>
                    <p className="text-gray-500">No prescriptions on file for this patient</p>
                </div>
            )}
        </div>
    );
}

// Sales Tab Component
function SalesTab({ patient }: { patient: any }) {
    return (
        <div className="space-y-4">
            {patient.sales && patient.sales.length > 0 ? (
                patient.sales.map((sale: any) => (
                    <div key={sale.id} className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h4 className="font-semibold text-gray-900">Sale #{sale.id.slice(0, 8)}</h4>
                                <p className="text-sm text-gray-500">{new Date(sale.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="text-lg font-bold text-gray-900">₹{sale.totalAmount}</span>
                        </div>
                        {sale.items && sale.items.length > 0 && (
                            <div className="space-y-2">
                                {sale.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-700">{item.batch?.drug?.name || "Unknown item"}</span>
                                        <span className="text-gray-500">{item.quantity} × ₹{item.unitPrice}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <FiShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sales History</h3>
                    <p className="text-gray-500">No purchases on record for this patient</p>
                </div>
            )}
        </div>
    );
}

// Helper Component
function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-sm font-medium text-gray-900">{value}</p>
        </div>
    );
}
