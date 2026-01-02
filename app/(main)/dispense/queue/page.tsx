"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiClock, FiAlertCircle, FiUser, FiArrowRight } from "react-icons/fi";
import { MdLocalPharmacy } from "react-icons/md";
import { toast } from 'react-hot-toast';
import { dispenseApi } from "@/lib/api/prescriptions";
import { useRouter } from "next/navigation";

const PrescriptionCardSkeleton = () => (
    <div className="p-4 rounded-xl border-2 border-[#e2e8f0] animate-pulse">
        <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-24"></div>
            </div>
        </div>
        <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-100 rounded w-16"></div>
            <div className="h-4 bg-gray-100 rounded w-12"></div>
        </div>
    </div>
);

export default function QueuePage() {
    const router = useRouter();
    const [queueItems, setQueueItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [stats, setStats] = useState({
        total: 0,
        urgent: 0,
        controlled: 0,
        avgWaitTime: "-"
    });

    // Fetch queue data from API
    useEffect(() => {
        fetchQueue();
        // Refresh every 30 seconds
        const interval = setInterval(fetchQueue, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchQueue = async () => {
        try {
            setIsLoading(true);
            const response = await dispenseApi.getQueue();

            if (response.success) {
                setQueueItems(response.data || []);
                setStats({
                    total: response.stats?.total || 0,
                    urgent: response.stats?.urgent || 0,
                    controlled: response.data?.filter((item: any) =>
                        item.prescription?.items?.some((i: any) => i.isControlled)
                    ).length || 0,
                    avgWaitTime: response.stats?.avgWaitTime ? `${response.stats.avgWaitTime} min` : "-"
                });
            }
        } catch (error) {
            console.error('[Queue] Failed to fetch:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredQueue = queueItems.filter(item => {
        const prescription = item.prescription;
        const patient = prescription?.patient;
        const patientName = `${patient?.firstName || ''} ${patient?.lastName || ''}`.toLowerCase();

        const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
            prescription?.id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === "all" || item.workflowStatus?.toLowerCase() === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const selectedItem = queueItems.find(item => item.id === selectedId);
    const selectedRx = selectedItem?.prescription;

    const handleStartFill = async (prescriptionId: string) => {
        try {
            const response = await dispenseApi.startFill(prescriptionId);
            if (response.success) {
                // Navigate to fill page
                router.push(`/dispense/fill?prescriptionId=${prescriptionId}`);
            }
        } catch (error: any) {
            console.error('[Queue] Start fill error:', error);
            toast.error(error.response?.data?.message || 'Failed to start fill', {
                icon: <FiAlertCircle className="text-white" size={20} />
            });
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Prescription Queue</h1>
                    <p className="text-sm text-[#64748b]">Overview of all prescriptions in the pipeline</p>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
                <div className="max-w-7xl mx-auto grid grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <MdLocalPharmacy className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Total in Queue</div>
                            <div className="text-2xl font-bold text-blue-600">{isLoading ? '...' : stats.total}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <FiAlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Urgent</div>
                            <div className="text-2xl font-bold text-red-600">{isLoading ? '...' : stats.urgent}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <FiAlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Controlled</div>
                            <div className="text-2xl font-bold text-amber-600">{isLoading ? '...' : stats.controlled}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <FiClock className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Avg Wait Time</div>
                            <div className="text-2xl font-bold text-green-600">{isLoading ? '...' : stats.avgWaitTime}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Prescription List (40%) */}
                <div className="w-2/5 border-r border-[#e2e8f0] bg-white flex flex-col">
                    <div className="p-4 border-b border-[#e2e8f0]">
                        <div className="relative mb-3">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by patient name or Rx ID..."
                                className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="flex gap-2">
                            {["all", "intake", "verify", "fill", "check"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === status ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                        }`}
                                >
                                    {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {isLoading ? (
                            <>
                                <PrescriptionCardSkeleton />
                                <PrescriptionCardSkeleton />
                                <PrescriptionCardSkeleton />
                            </>
                        ) : filteredQueue.length > 0 ? (
                            filteredQueue.map((item) => {
                                const rx = item.prescription;
                                const patient = rx?.patient;
                                const patientName = `${patient?.firstName || ''} ${patient?.lastName || ''}`;
                                const drugCount = rx?.items?.length || 0;
                                const isControlled = rx?.items?.some((i: any) => i.isControlled);
                                const priority = rx?.priority || 'Normal';

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedId(item.id)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedId === item.id ? "border-[#0ea5a3] bg-emerald-50" :
                                            priority === "Urgent" ? "border-red-200 bg-red-50 hover:border-red-300" :
                                                isControlled ? "border-amber-200 bg-amber-50 hover:border-amber-300" :
                                                    item.slaStatus === 'green' ? "border-green-200 bg-green-50 hover:border-green-300" :
                                                        "border-[#e2e8f0] hover:border-[#cbd5e1]"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-semibold text-[#0f172a]">{patientName}</h3>
                                                <p className="text-sm text-[#64748b]">{rx?.id?.slice(0, 12)}...</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {priority === "Urgent" && (
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">URGENT</span>
                                                )}
                                                {isControlled && (
                                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">C-II</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-[#64748b]">
                                            <span className="flex items-center gap-1">
                                                <FiClock className="w-4 h-4" />
                                                {item.timeInQueue || '0 min'}
                                            </span>
                                            <span>{drugCount} drug{drugCount > 1 ? "s" : ""}</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-10 text-gray-500">No prescriptions in queue</div>
                        )}
                    </div>
                </div>

                {/* Right: Prescription Detail (60%) */}
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
                                        <div className="text-sm text-[#64748b]">DOB</div>
                                        <div className="font-medium text-[#0f172a]">
                                            {selectedRx.patient?.dateOfBirth ? new Date(selectedRx.patient.dateOfBirth).toLocaleDateString() : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Phone</div>
                                        <div className="font-medium text-[#0f172a]">{selectedRx.patient?.phoneNumber || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Allergies</div>
                                        <div className="font-medium text-[#0f172a]">
                                            {selectedRx.patient?.allergies?.join(', ') || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Prescription Details */}
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Prescription Details</h2>
                                {selectedRx.items && selectedRx.items.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedRx.items.map((item: any, idx: number) => (
                                            <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="font-medium text-[#0f172a]">{item.drug?.name}</div>
                                                <div className="text-sm text-[#64748b] mt-1">
                                                    Qty: {item.quantityPrescribed} | {item.sig || 'No instructions'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-500">No items</div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleStartFill(selectedRx.id)}
                                    className="flex-1 px-6 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors flex items-center justify-center gap-2"
                                >
                                    Start Fill
                                    <FiArrowRight className="w-5 h-5" />
                                </button>
                            </div>
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
