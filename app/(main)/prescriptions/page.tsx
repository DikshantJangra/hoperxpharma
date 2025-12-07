"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiPlus, FiClock, FiUser, FiAlertCircle, FiCheck } from "react-icons/fi";
import { prescriptionApi } from "@/lib/api/prescriptions";

const StatusBadge = ({ status }: { status: string }) => {
    const colors: any = {
        'DRAFT': 'bg-gray-100 text-gray-700',
        'IN_PROGRESS': 'bg-blue-100 text-blue-700',
        'ON_HOLD': 'bg-amber-100 text-amber-700',
        'COMPLETED': 'bg-green-100 text-green-700',
        'CANCELLED': 'bg-red-100 text-red-700'
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

export default function PrescriptionsPage() {
    const router = useRouter();
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        fetchPrescriptions();
    }, [statusFilter]);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            const response = await prescriptionApi.getPrescriptions({
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                search: searchTerm || undefined
            });

            if (response.success) {
                setPrescriptions(response.data || []);
            }
        } catch (error) {
            console.error('[Prescriptions] Failed to fetch:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchPrescriptions();
    };

    const handleVerify = async (id: string) => {
        try {
            const response = await prescriptionApi.verifyPrescription(id);
            if (response.success) {
                alert('✅ Prescription verified and sent to dispense queue!');
                fetchPrescriptions();
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to verify prescription');
        }
    };

    const selectedRx = prescriptions.find(rx => rx.id === selectedId);

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Prescriptions</h1>
                        <p className="text-sm text-[#64748b]">Manage and verify prescriptions</p>
                    </div>
                    <button
                        onClick={() => router.push('/prescriptions/new')}
                        className="px-6 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                    >
                        <FiPlus className="w-5 h-5" />
                        New Prescription
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by patient name or Rx ID..."
                            className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['ALL', 'DRAFT', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                                        ? 'bg-[#0ea5a3] text-white'
                                        : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                                    }`}
                            >
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: List */}
                <div className="w-2/5 bg-white border-r border-[#e2e8f0] overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0ea5a3] mx-auto"></div>
                        </div>
                    ) : prescriptions.length > 0 ? (
                        <div className="divide-y divide-[#e2e8f0]">
                            {prescriptions.map((rx) => (
                                <div
                                    key={rx.id}
                                    onClick={() => setSelectedId(rx.id)}
                                    className={`p-4 cursor-pointer transition-colors ${selectedId === rx.id ? 'bg-emerald-50' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-[#0f172a]">
                                                {rx.patient?.firstName} {rx.patient?.lastName}
                                            </h3>
                                            <p className="text-sm text-[#64748b]">{rx.id.slice(0, 12)}...</p>
                                        </div>
                                        <StatusBadge status={rx.status} />
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-[#64748b]">
                                        <span className="flex items-center gap-1">
                                            <FiClock className="w-4 h-4" />
                                            {new Date(rx.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FiUser className="w-4 h-4" />
                                            {rx.prescriber?.name || 'Unknown'}
                                        </span>
                                    </div>
                                    {rx.priority === 'Urgent' && (
                                        <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                                            URGENT
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <FiAlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No prescriptions found</p>
                        </div>
                    )}
                </div>

                {/* Right: Details */}
                <div className="flex-1 overflow-y-auto p-6">
                    {selectedRx ? (
                        <div className="max-w-3xl mx-auto space-y-6">
                            {/* Patient Info */}
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Patient Information</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-[#64748b]">Name</div>
                                        <div className="font-medium text-[#0f172a]">
                                            {selectedRx.patient?.firstName} {selectedRx.patient?.lastName}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Phone</div>
                                        <div className="font-medium text-[#0f172a]">
                                            {selectedRx.patient?.phoneNumber || '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Allergies</div>
                                        <div className="font-medium text-[#0f172a]">
                                            {selectedRx.patient?.allergies?.join(', ') || 'None'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Chronic Conditions</div>
                                        <div className="font-medium text-[#0f172a]">
                                            {selectedRx.patient?.chronicConditions?.join(', ') || 'None'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Prescription Items */}
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Medications</h2>
                                {selectedRx.items && selectedRx.items.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedRx.items.map((item: any, idx: number) => (
                                            <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-[#0f172a]">
                                                            {item.drug?.name}
                                                        </h3>
                                                        <p className="text-sm text-[#64748b] mt-1">
                                                            Qty: {item.quantityPrescribed}
                                                        </p>
                                                        {item.sig && (
                                                            <p className="text-sm text-[#64748b] mt-1">
                                                                Sig: {item.sig}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {item.isControlled && (
                                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                                                            Controlled
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center py-4 text-gray-500">No items</p>
                                )}
                            </div>

                            {/* Actions */}
                            {selectedRx.status === 'DRAFT' && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleVerify(selectedRx.id)}
                                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FiCheck className="w-5 h-5" />
                                        Verify & Send to Queue
                                    </button>
                                    <button
                                        onClick={() => router.push(`/prescriptions/${selectedRx.id}/edit`)}
                                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                    >
                                        Edit
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-[#64748b]">
                            Select a prescription to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
