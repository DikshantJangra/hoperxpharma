"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    FiPhone, FiMail, FiMapPin, FiCalendar, FiUser,
    FiShoppingCart, FiRefreshCw, FiUpload, FiMessageSquare,
    FiArrowLeft, FiEdit, FiShield, FiActivity, FiFileText,
    FiClock, FiCheckCircle, FiUsers, FiTrendingUp, FiAlertTriangle, FiArrowRight, FiDollarSign,
    FiBell, FiZap
} from "react-icons/fi";
import { MdLocalPharmacy } from "react-icons/md";
import { toast } from "sonner";
import { patientsApi } from "@/lib/api/patients";
import { useAuthStore } from "@/lib/store/auth-store";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PrescriptionUploadModal from "@/components/patients/PrescriptionUploadModal";
import PatientMergeModal from "@/components/patients/PatientMergeModal";
import PatientConsentsTab from "@/components/patients/PatientConsentsTab";
import PatientHistoryTimeline from "@/components/patients/PatientHistoryTimeline";
import AdherenceChart from "@/components/patients/AdherenceChart";
import PatientConnectionsTab from "@/components/patients/PatientConnectionsTab";
import PatientInsightsPanel from "@/components/patients/PatientInsightsPanel";
import GrowthTrustOverlay from "@/components/patients/GrowthTrustOverlay";
import PurchaseBehaviorOverlay from "@/components/patients/PurchaseBehaviorOverlay";
import { AnimatePresence, motion } from "framer-motion";
import { prescriptionApi } from "@/lib/api/prescriptions";
import PatientFormDrawer from "@/components/patients/PatientFormDrawer";


interface TabProps {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const tabs: TabProps[] = [
    { id: "summary", label: "Summary", icon: <FiUser className="w-4 h-4" /> },
    { id: "prescriptions", label: "Prescriptions", icon: <FiFileText className="w-4 h-4" /> },
    { id: "connections", label: "Family & Connections", icon: <FiUsers className="w-4 h-4" /> },
    { id: "adherence", label: "Adherence", icon: <FiActivity className="w-4 h-4" /> },
    { id: "sales", label: "Sales History", icon: <FiShoppingCart className="w-4 h-4" /> },
    { id: "engagement", label: "Engagement", icon: <FiMessageSquare className="w-4 h-4" /> },
    { id: "consents", label: "Consents", icon: <FiShield className="w-4 h-4" /> },
];

export default function PatientProfilePage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params?.id as string;
    const { primaryStore } = useAuthStore();

    const [patient, setPatient] = useState<any>(null);
    const [insights, setInsights] = useState<any>(null);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("summary");
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [showEditDrawer, setShowEditDrawer] = useState(false);

    useEffect(() => {
        if (patientId) {
            loadPatient();
            loadInsights();
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

    const loadInsights = async () => {
        try {
            setInsightsLoading(true);
            const data = await patientsApi.getPatientInsights(patientId);
            setInsights(data);
        } catch (err: any) {
            console.error("Error loading patient insights:", err);
            // Set empty insights object so UI doesn't crash
            setInsights(null);
            // Only show error toast if it's not a 500 (which likely means analytics not backfilled)
            if (err?.status !== 500) {
                toast.error('Failed to load patient analytics');
            }
        } finally {
            setInsightsLoading(false);
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
            {/* Premium Sticky Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <button
                                onClick={() => router.back()}
                                className="p-2 transition-colors hover:bg-gray-100 rounded-xl group"
                                title="Go Back"
                            >
                                <FiArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
                            </button>
                            <div className="shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-700 text-xl font-bold shadow-inner">
                                    {patient.firstName?.[0]}{patient.lastName?.[0]}
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900 leading-tight">
                                        {patient.firstName} {patient.middleName || ""} {patient.lastName}
                                    </h1>
                                    <div className="flex items-center gap-1.5">
                                        {insights?.identity?.lifecycleStage && (
                                            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-teal-100">
                                                {insights.identity.lifecycleStage.replace('_', ' ')}
                                            </span>
                                        )}
                                        {patient.mrn && (
                                            <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-medium rounded-md border border-gray-100">
                                                {patient.mrn}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                                    <span className="flex items-center gap-1.5">
                                        <FiUser className="w-3.5 h-3.5" />
                                        {calculateAge(patient.dateOfBirth)}y • {patient.gender || "NA"}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <FiPhone className="w-3.5 h-3.5" />
                                        {patient.phoneNumber}
                                    </span>
                                    {patient.bloodGroup && (
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-3.5 h-3.5 text-[10px] font-bold flex items-center justify-center border border-gray-400 rounded-full">B</span>
                                            {patient.bloodGroup}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => router.push(`/main/patients/refills?patientId=${patientId}`)}
                                    className="h-10 w-10 flex items-center justify-center border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                                    title="Predictive Refills"
                                >
                                    <FiRefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowEditDrawer(true)}
                                    className="h-10 w-10 flex items-center justify-center border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                                    title="Edit Profile"
                                >
                                    <FiEdit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowMergeModal(true)}
                                    className="h-10 w-10 flex items-center justify-center border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                                    title="Merge Records"
                                >
                                    <FiUsers className="w-4 h-4" />
                                </button>
                                <div className="w-[1px] h-6 bg-gray-100 mx-2" />
                            </div>
                            <button
                                onClick={() => router.push(`/main/pos/new-sale?patientId=${patientId}`)}
                                className="h-10 px-6 bg-teal-600 text-white rounded-xl hover:bg-teal-700 flex items-center gap-2 font-bold shadow-lg shadow-teal-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <FiShoppingCart className="w-4 h-4" />
                                New Sale
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <PatientMergeModal
                isOpen={showMergeModal}
                onClose={() => setShowMergeModal(false)}
                targetPatient={patient}
                onMergeComplete={loadPatient}
            />
            <PrescriptionUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                patientId={patientId}
                onUploadComplete={loadPatient}
            />
            <PatientFormDrawer
                isOpen={showEditDrawer}
                onClose={() => setShowEditDrawer(false)}
                initialData={patient}
                onSaved={(updated) => {
                    setPatient(updated);
                    setShowEditDrawer(false);
                    loadInsights(); // Refresh insights as well
                }}
            />

            {/* Premium Tab Bar */}
            <div className="bg-white border-b border-gray-200 overflow-x-auto scroller-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center gap-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-1 py-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all relative ${activeTab === tab.id
                                    ? "border-teal-600 text-teal-700 font-bold"
                                    : "border-transparent text-gray-500 hover:text-gray-800"
                                    }`}
                            >
                                <span className={`p-1.5 rounded-lg transition-colors ${activeTab === tab.id ? "bg-teal-50" : "bg-transparent"}`}>
                                    {React.cloneElement(tab.icon as React.ReactElement, { className: "w-4 h-4" })}
                                </span>
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-teal-600 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                {activeTab === "summary" && <SummaryTab patient={patient} insights={insights} insightsLoading={insightsLoading} />}
                {activeTab === "prescriptions" && <PrescriptionsTab patient={patient} patientId={patientId} router={router} />}
                {activeTab === "connections" && <PatientConnectionsTab patient={patient} onUpdate={loadPatient} />}
                {activeTab === "adherence" && <AdherenceTab patientId={patientId} />}
                {activeTab === "sales" && <SalesTab patient={patient} patientId={patientId} router={router} />}
                {activeTab === "engagement" && <EngagementTab patient={patient} />}
                {activeTab === "consents" && <PatientConsentsTab patient={patient} onUpdate={loadPatient} />}
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
                    <div className="p-3 bg-blue-50 text-blue-800 rounded-lg mt-4">
                        <strong>Tip:</strong> Suggest auto-refills if adherence is consistently high.
                    </div>
                </div>
            </div>
        </div>
    );
}



// Summary Tab Component
function SummaryTab({ patient, insights, insightsLoading }: { patient: any, insights: any, insightsLoading: boolean }) {
    const [activeOverlay, setActiveOverlay] = useState<'growth' | 'purchase' | null>(null);

    return (
        <div className="relative min-h-[600px]">
            {/* Analysis Overlays - Positioned to cover the content area */}
            <AnimatePresence mode="wait">
                {activeOverlay === 'growth' && (
                    <GrowthTrustOverlay
                        isOpen={true}
                        onClose={() => setActiveOverlay(null)}
                        insights={insights}
                    />
                )}
                {activeOverlay === 'purchase' && (
                    <PurchaseBehaviorOverlay
                        isOpen={true}
                        onClose={() => setActiveOverlay(null)}
                        patient={patient}
                        insights={insights}
                    />
                )}
            </AnimatePresence>

            <div className="grid grid-cols-12 gap-8 items-start">
                {/* Sticky Left Sidebar: Insights */}
                <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-[120px]">
                    {insightsLoading ? (
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 animate-pulse space-y-6">
                            <div className="h-20 bg-gray-50 rounded-2xl" />
                            <div className="h-40 bg-gray-50 rounded-2xl" />
                        </div>
                    ) : (
                        <PatientInsightsPanel
                            insights={insights}
                            onViewGrowthTrust={() => setActiveOverlay('growth')}
                            onViewPurchaseBehavior={() => setActiveOverlay('purchase')}
                        />
                    )}
                </div>

                {/* Scrollable Right Column: Comprehensive Info */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    {/* Personal Information Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <FiUser className="text-teal-600" />
                                Personal Information
                            </h3>
                        </div>
                        <div className="p-8 grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                            <InfoItem label="Full Name" value={`${patient.firstName} ${patient.middleName || ""} ${patient.lastName}`} />
                            <InfoItem label="MRN / ID" value={patient.mrn || "N/A"} />
                            <InfoItem label="Phone" value={patient.phoneNumber} />
                            <InfoItem label="Email" value={patient.email || "N/A"} />
                            <InfoItem label="Birthday" value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "N/A"} />
                            <InfoItem label="Gender" value={patient.gender || "N/A"} />
                            <InfoItem label="Blood Group" value={patient.bloodGroup || "N/A"} />
                            <div className="col-span-2">
                                <InfoItem label="Address" value={
                                    patient.addressLine1
                                        ? `${patient.addressLine1}${patient.addressLine2 ? ', ' + patient.addressLine2 : ''}, ${patient.city || ''}, ${patient.state || ''} ${patient.pinCode || ''}`
                                        : "N/A"
                                } />
                            </div>
                        </div>
                    </div>

                    {/* Medical Information */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <FiActivity className="text-teal-600" />
                                Medical Information
                            </h3>
                        </div>
                        <div className="p-8 space-y-6">
                            <InfoItem
                                label="Allergies"
                                value={patient.allergies && patient.allergies.length > 0 ? patient.allergies.join(", ") : "None reported"}
                            />
                            <InfoItem
                                label="Chronic Conditions"
                                value={patient.chronicConditions && patient.chronicConditions.length > 0 ? patient.chronicConditions.join(", ") : "None reported"}
                            />
                        </div>
                    </div>

                    {/* Insurance & Coverage */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <FiShield className="text-blue-600" />
                                Insurance & Coverage
                            </h3>
                        </div>
                        <div className="p-8">
                            {patient.insurance && patient.insurance.length > 0 ? (
                                <div className="space-y-4">
                                    {patient.insurance.map((ins: any) => (
                                        <div key={ins.id} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-gray-900">{ins.provider}</p>
                                                <p className="text-xs text-gray-500 font-medium">Policy: {ins.policyNumber}</p>
                                            </div>
                                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-lg">Active</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-sm text-gray-400 font-medium">No insurance records on file</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value, className = "" }: { label: string, value: string, className?: string }) {
    return (
        <div className={className}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-semibold text-gray-800">{value || "N/A"}</p>
        </div>
    );
}


// Prescriptions Tab Component
function PrescriptionsTab({ patient, patientId, router }: { patient: any; patientId: string; router: any }) {
    const [selectedRxId, setSelectedRxId] = useState<string | null>(null);
    const [selectedRxData, setSelectedRxData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (selectedRxId) {
            const fetchRxDetails = async () => {
                setIsLoading(true);
                try {
                    const response = await prescriptionApi.getPrescriptionById(selectedRxId);
                    if (response.success) {
                        setSelectedRxData(response.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch RX details:", error);
                    toast.error("Could not load prescription details");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchRxDetails();
        } else {
            setSelectedRxData(null);
        }
    }, [selectedRxId]);

    const handleDispense = (rxId: string) => {
        router.push(`/pos/new-sale?prescriptionId=${rxId}`);
    };

    if (!patient.prescriptions || patient.prescriptions.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center">
                <MdLocalPharmacy className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No active prescriptions</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">Upload a medical prescription to start tracking medication adherence and refills.</p>
                <button
                    onClick={() => { }}
                    className="mt-6 px-6 py-2 bg-teal-50 text-teal-700 rounded-xl font-bold text-sm border border-teal-100 hover:bg-teal-100 transition-colors"
                >
                    Upload Prescription
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
            {/* Left: List of Prescriptions */}
            <div className={`${selectedRxId ? 'lg:w-[400px]' : 'w-full max-w-4xl'} space-y-4 transition-all duration-300`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Prescription History</h3>
                    {selectedRxId && (
                        <button
                            onClick={() => setSelectedRxId(null)}
                            className="text-xs font-bold text-teal-600 hover:text-teal-700"
                        >
                            View All
                        </button>
                    )}
                </div>

                <div className={`${selectedRxId ? 'grid grid-cols-2 gap-3' : 'space-y-4'}`}>
                    {patient.prescriptions.map((rx: any) => (
                        <div
                            key={rx.id}
                            onClick={() => setSelectedRxId(rx.id)}
                            className={`cursor-pointer rounded-2xl border transition-all duration-200 group relative ${selectedRxId === rx.id
                                ? "bg-teal-50 border-teal-500 ring-1 ring-teal-500 shadow-sm"
                                : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-md"
                                } overflow-hidden ${selectedRxId ? 'aspect-square flex flex-col items-center justify-center text-center p-4' : 'p-4'}`}
                        >
                            <div className={`${selectedRxId ? 'flex flex-col items-center gap-2' : 'flex items-center justify-between'}`}>
                                <div className={`flex items-center gap-3 ${selectedRxId ? 'flex-col' : ''}`}>
                                    <div className={`p-2 rounded-xl shadow-sm transition-colors ${selectedRxId === rx.id ? 'bg-teal-600 text-white' : 'bg-gray-50 text-teal-600'
                                        }`}>
                                        <FiFileText className={selectedRxId ? 'w-5 h-5' : 'w-4 h-4'} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-gray-900 ${selectedRxId ? 'text-xs' : 'text-sm'}`}>
                                            {rx.prescriptionNumber || `Rx #${rx.id.slice(-6).toUpperCase()}`}
                                        </h4>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                            {new Date(rx.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-2 ${selectedRxId ? 'mt-auto' : ''}`}>
                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black tracking-wider uppercase ${rx.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                                        rx.status === "COMPLETED" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                                        }`}>
                                        {rx.status}
                                    </span>
                                    {!selectedRxId && (
                                        <FiArrowRight className="w-4 h-4 text-gray-300 group-hover:text-teal-600 transition-colors" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Detailed View */}
            <AnimatePresence mode="wait">
                {selectedRxId ? (
                    <motion.div
                        key="details"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden flex flex-col"
                    >
                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center p-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                            </div>
                        ) : selectedRxData ? (
                            <>
                                <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                                    {selectedRxData.prescriptionNumber}
                                                </h2>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${selectedRxData.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                                                    selectedRxData.status === "COMPLETED" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                                                    }`}>
                                                    {selectedRxData.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium">
                                                Issued on {new Date(selectedRxData.issueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDispense(selectedRxData.id)}
                                                className="px-6 py-2.5 bg-teal-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center gap-2"
                                            >
                                                <FiShoppingCart />
                                                Dispense Now
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Prescriber</p>
                                            <p className="text-sm font-bold text-gray-900">Dr. {selectedRxData.prescriber?.name || "Unspecified"}</p>
                                            <p className="text-[10px] text-gray-500">{selectedRxData.prescriber?.specialty || "General Physician"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Refills</p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {selectedRxData.refills?.filter((r: any) => r.status === 'FULLY_USED').length || 0} / {selectedRxData.totalRefills + 1} Used
                                            </p>
                                            <p className="text-[10px] text-teal-600 font-bold">{selectedRxData.totalRefills - (selectedRxData.refills?.filter((r: any) => r.status === 'FULLY_USED').length || 0) + 1} Remaining</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Expiry Date</p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {new Date(selectedRxData.expiryDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Priority</p>
                                            <p className={`text-sm font-bold ${selectedRxData.priority === 'URGENT' ? 'text-red-600' : 'text-gray-900'}`}>
                                                {selectedRxData.priority || 'Normal'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 flex-1 overflow-y-auto space-y-8">
                                    {/* Medication Items */}
                                    <div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Medication Details</h3>
                                        <div className="space-y-4">
                                            {selectedRxData.items?.map((item: any, idx: number) => (
                                                <div key={idx} className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between group/item hover:bg-white hover:border-teal-100 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-teal-600 border border-gray-50 group-hover/item:bg-teal-600 group-hover/item:text-white transition-colors">
                                                            <MdLocalPharmacy size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{item.drug?.name}</p>
                                                            <p className="text-xs text-gray-500 font-medium mt-0.5">{item.sig}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-lg font-black text-gray-900 tracking-tight">{item.quantityPrescribed}</span>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.unit || "Units"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Clinical Notes */}
                                    {selectedRxData.instructions && (
                                        <div>
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Clinical Instructions</h3>
                                            <div className="p-6 bg-blue-50/30 rounded-3xl border border-blue-50 text-sm text-gray-700 leading-relaxed italic">
                                                "{selectedRxData.instructions}"
                                            </div>
                                        </div>
                                    )}

                                    {/* Files / Images */}
                                    {selectedRxData.files && selectedRxData.files.length > 0 && (
                                        <div>
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Prescription Originals</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {selectedRxData.files.map((file: any) => (
                                                    <div key={file.id} className="aspect-[3/4] rounded-2xl border border-gray-100 overflow-hidden relative group cursor-zoom-in">
                                                        <img src={file.fileUrl} alt="Prescription" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <FiUpload className="text-white" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                                <div className="p-4 bg-gray-50 rounded-full mb-4">
                                    <FiAlertTriangle size={32} className="text-amber-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">No Data Available</h3>
                                <p className="text-sm text-gray-500 max-w-xs mt-1">We couldn't retrieve the detailed records for this prescription.</p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <div className="hidden lg:flex flex-1 items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl p-12 text-center bg-gray-50/30">
                        <div>
                            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-gray-50 flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <FiFileText size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Select a Prescription</h3>
                            <p className="text-sm text-gray-500 max-w-xs mt-1">Choose a prescription from the list to view clinical notes, items, and dispense history.</p>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Unified Sales History (Timeline + Sales Ledger Merged)
function SalesTab({ patient, patientId, router }: { patient: any; patientId: string; router: any }) {
    const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');
    const [typeFilter, setTypeFilter] = React.useState<'ALL' | 'RECEIPT' | 'CREDIT_NOTE'>('ALL');
    const [periodFilter, setPeriodFilter] = React.useState<'3M' | '6M' | '1Y' | 'ALL'>('ALL');
    const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

    useEffect(() => {
        const loadTimeline = async () => {
            try {
                const data = await patientsApi.getPatientHistory(patientId);
                if (data?.events?.groups) {
                    const allEvents = data.events.groups.flatMap((g: any) => g.events);
                    setTimelineEvents(allEvents);
                }
            } catch (err) {
                console.error("Failed to load timeline for sales history merge:", err);
            }
        };
        loadTimeline();
    }, [patientId]);

    const allSales = React.useMemo(() => {
        return timelineEvents
            .filter(e => e.type === 'sale')
            .map(e => e.data);
    }, [timelineEvents]);

    const filteredSales = allSales.filter((sale: any) => {
        const matchesStatus = statusFilter === 'ALL' || sale.paymentStatus === statusFilter;
        const matchesType = typeFilter === 'ALL' || sale.invoiceType === typeFilter;
        let matchesPeriod = true;
        if (periodFilter !== 'ALL') {
            const saleDate = new Date(sale.createdAt);
            const now = new Date();
            const diffMonths = (now.getFullYear() - saleDate.getFullYear()) * 12 + (now.getMonth() - saleDate.getMonth());
            if (periodFilter === '3M') matchesPeriod = diffMonths <= 3;
            else if (periodFilter === '6M') matchesPeriod = diffMonths <= 6;
            else if (periodFilter === '1Y') matchesPeriod = diffMonths <= 12;
        }
        return matchesStatus && matchesType && matchesPeriod;
    });

    const mergedHistory = React.useMemo(() => {
        const activities = timelineEvents.filter(e => e.type !== 'sale');
        const salesEntries = filteredSales.map((sale: any) => ({
            type: 'sale_detailed',
            date: sale.createdAt,
            data: sale,
            id: sale.id
        }));

        return [...activities, ...salesEntries].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [timelineEvents, filteredSales]);

    return (
        <div className="space-y-8 max-w-5xl">
            {/* Filter Header */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-wrap items-center gap-6">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter History</p>
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-100">
                        {(['ALL', 'PAID', 'UNPAID'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${statusFilter === s ? 'bg-white text-teal-700 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Period</p>
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-100">
                        {(['3M', '6M', 'ALL'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriodFilter(p as any)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${periodFilter === p ? 'bg-white text-blue-700 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</p>
                    <select
                        value={typeFilter}
                        onChange={(e: any) => setTypeFilter(e.target.value)}
                        className="h-10 px-4 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                        <option value="ALL">ALL TYPES</option>
                        <option value="RECEIPT">RECEIPTS</option>
                        <option value="CREDIT_NOTE">CREDIT NOTES</option>
                    </select>
                </div>
            </div>

            {/* Unified Feed Layout */}
            <div className="relative">
                <div className="absolute left-[27px] top-0 bottom-0 w-[2px] bg-gray-100" />
                <div className="space-y-8">
                    {mergedHistory.length > 0 ? (
                        mergedHistory.map((item: any, idx) => {
                            if (item.type === 'sale_detailed') {
                                return (
                                    <div key={item.id} className="relative pl-16">
                                        <div className="absolute left-0 top-6 w-14 h-14 bg-white rounded-2xl border-2 border-teal-500 shadow-lg shadow-teal-100 flex items-center justify-center text-teal-600 z-10 transition-transform hover:scale-110">
                                            <FiShoppingCart size={22} />
                                        </div>
                                        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-teal-100 transition-all group">
                                            <div className="px-8 py-5 flex items-center justify-between bg-gray-50/30 group-hover:bg-white transition-colors border-b border-gray-50">
                                                <div>
                                                    <h4 className="font-black text-gray-900 text-sm tracking-tight">
                                                        {item.data.invoiceNumber || `Sale #${item.id.slice(-6).toUpperCase()}`}
                                                    </h4>
                                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                                        {new Date(item.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-3 justify-end">
                                                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg uppercase ${item.data.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                            {item.data.paymentStatus}
                                                        </span>
                                                        <p className="text-xl font-black text-gray-900 tracking-tighter">₹{Number(item.data.total).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="px-8 py-6">
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {item.data.items?.map((detail: any, i: number) => (
                                                        <div key={i} className="px-3 py-1.5 bg-gray-50 group-hover:bg-teal-50/30 rounded-xl border border-gray-100 text-[11px] font-bold text-gray-600 flex items-center gap-2 transition-colors">
                                                            <span className="text-teal-600">{detail.quantity}×</span>
                                                            {detail.batch?.drug?.name || detail.drug?.name}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                    <div className="flex gap-2">
                                                        {item.data.paymentSplits?.map((split: any, i: number) => (
                                                            <span key={i} className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                                                                {split.paymentMethod}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <button className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:text-teal-700 flex items-center gap-2">
                                                        View Receipt <FiArrowRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={item.eventId || idx} className="relative pl-16">
                                        <div className={`absolute left-4 top-2 w-7 h-7 rounded-lg border-2 border-white shadow-sm flex items-center justify-center text-white z-10 
                                            ${item.type === 'prescription' ? 'bg-blue-500' :
                                                item.type === 'consent' ? 'bg-purple-500' :
                                                    item.type === 'adherence' ? 'bg-amber-500' : 'bg-gray-400'}`}>
                                            {item.type === 'prescription' ? <FiFileText size={12} /> :
                                                item.type === 'consent' ? <FiShield size={12} /> :
                                                    item.type === 'adherence' ? <FiActivity size={12} /> : <FiClock size={12} />}
                                        </div>
                                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{item.type}</p>
                                                    <h4 className="text-sm font-black text-gray-800 leading-tight">{item.title}</h4>
                                                    <p className="text-xs text-gray-500 mt-1 font-medium">{item.description}</p>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                    {new Date(item.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        })
                    ) : (
                        <div className="bg-white rounded-[40px] border border-dashed border-gray-200 p-20 text-center ml-16">
                            <FiClock className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-gray-900">No History Found</h3>
                            <p className="text-gray-500 text-sm max-w-xs mx-auto">Either the patient doesn't have any records yet, or the current filters are too restrictive.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Engagement Tab Implementation
function EngagementTab({ patient }: { patient: any }) {
    const [automatedSettings, setAutomatedSettings] = useState({ birthdays: true, refills: true, payments: true, marketing: false });
    const [notifPrefs, setNotifPrefs] = useState({ sms: true, email: true, whatsapp: true });

    return (
        <div className="grid grid-cols-12 gap-8 max-w-6xl">
            <div className="col-span-12 lg:col-span-7 space-y-6">
                <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-10 py-8 border-b border-gray-50 bg-gray-50/30">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-100">
                                <FiZap size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">Automated Campaigns</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Hands-free Engagement</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-10 space-y-8">
                        <AutomationToggle icon={<FiCalendar className="text-blue-500" />} title="Birthday Greetings" desc="Send automated warm wishes via WhatsApp & SMS on their special day." enabled={automatedSettings.birthdays} onChange={() => setAutomatedSettings(s => ({ ...s, birthdays: !s.birthdays }))} />
                        <AutomationToggle icon={<FiRefreshCw className="text-teal-500" />} title="Refill Reminders" desc="Alert patient 3 days before their chronic medications run out." enabled={automatedSettings.refills} onChange={() => setAutomatedSettings(s => ({ ...s, refills: !s.refills }))} />
                        <AutomationToggle icon={<FiDollarSign className="text-amber-500" />} title="Payment Pending Alerts" desc="Automated follow-ups for outstanding balances over ₹500." enabled={automatedSettings.payments} onChange={() => setAutomatedSettings(s => ({ ...s, payments: !s.payments }))} />
                    </div>
                </div>
                <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] mb-8">Reachability Preferences</h3>
                    <div className="grid grid-cols-3 gap-6">
                        <PrefCard icon={<FiPhone />} label="WhatsApp" active={notifPrefs.whatsapp} onClick={() => setNotifPrefs(p => ({ ...p, whatsapp: !p.whatsapp }))} />
                        <PrefCard icon={<FiMessageSquare />} label="SMS" active={notifPrefs.sms} onClick={() => setNotifPrefs(p => ({ ...p, sms: !p.sms }))} />
                        <PrefCard icon={<FiMail />} label="Email" active={notifPrefs.email} onClick={() => setNotifPrefs(p => ({ ...p, email: !p.email }))} />
                    </div>
                </div>
            </div>
            <div className="col-span-12 lg:col-span-5 space-y-6">
                <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"><FiClock className="text-teal-600" /> Interaction Log</h3>
                    </div>
                    <div className="p-4 max-h-[500px] overflow-y-auto">
                        <div className="space-y-4">
                            <LogEntry type="WhatsApp" title="Refill Alert Sent" date="Today, 10:30 AM" content="Hey {name}, your Metform-500 is running low! Reply 'YES' to deliver." />
                            <LogEntry type="SMS" title="Payment Received" date="Feb 02, 2024" content="Thank you for your payment of ₹1,240. Invoice #2940." />
                            <LogEntry type="Automation" title="Birthday Workflow" date="Jan 15, 2024" content="Birthday greeting delivered via WhatsApp (System Auto)." />
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50/50 border-t border-gray-50">
                        <button className="w-full py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-teal-600 hover:bg-teal-50 transition-colors">Send Manual Message</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helpers
function AutomationToggle({ icon, title, desc, enabled, onChange }: any) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-gray-100 transition-all">
                    {React.cloneElement(icon, { size: 20 })}
                </div>
                <div>
                    <h4 className="text-sm font-black text-gray-900 leading-none mb-1">{title}</h4>
                    <p className="text-xs text-gray-500 font-medium max-w-sm">{desc}</p>
                </div>
            </div>
            <button onClick={onChange} className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${enabled ? 'bg-teal-600' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${enabled ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    );
}

function PrefCard({ icon, label, active, onClick }: any) {
    return (
        <button onClick={onClick} className={`p-6 rounded-[32px] border transition-all flex flex-col items-center gap-3 ${active ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm' : 'bg-gray-50 border-transparent text-gray-400 opacity-60'}`}>
            {React.cloneElement(icon, { size: 24 })}
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}

function LogEntry({ type, title, date, content }: any) {
    return (
        <div className="p-5 bg-gray-50/50 rounded-3xl border border-gray-100/50 hover:bg-white hover:shadow-sm transition-all group">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">{type}</span>
                <span className="text-[9px] font-bold text-gray-400">{date}</span>
            </div>
            <h5 className="text-xs font-black text-gray-800 mb-1">{title}</h5>
            <p className="text-[11px] text-gray-500 italic">"{content}"</p>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-sm font-medium text-gray-900">{value}</p>
        </div>
    );
}
