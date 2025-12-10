'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FiPlus, FiSearch, FiAlertCircle, FiUser } from 'react-icons/fi';
import { MdLocalHospital } from 'react-icons/md';
import { prescribersApi, Prescriber } from '@/lib/api/prescribers';
import { useAuthStore } from '@/lib/store/auth-store';
import PrescriberFormDrawer from '@/components/prescribers/PrescriberFormDrawer';
import PrescriberRow from '@/components/prescribers/PrescriberRow';
import toast from 'react-hot-toast';

export default function PrescribersPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { primaryStore } = useAuthStore();
    const [prescribers, setPrescribers] = useState<Prescriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedPrescriber, setSelectedPrescriber] = useState<Prescriber | null>(null);

    // Initial load and URL params check
    useEffect(() => {
        if (primaryStore?.id) {
            loadPrescribers();
        }
        if (searchParams?.get('new') === 'true') {
            handleNewPrescriber();
        }
    }, [searchParams, primaryStore?.id]);

    // Search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (primaryStore?.id) {
                loadPrescribers();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, primaryStore?.id]);

    const loadPrescribers = async () => {
        if (!primaryStore?.id) return;

        try {
            setLoading(true);
            const response = await prescribersApi.getPrescribers({
                search,
                storeId: primaryStore.id
            });
            // API returns { success: true, response: [...] } or just array? 
            // My API client returns response.data
            // The controller returns ApiResponse.success(prescribers, ...) which is { success: true, data: [...], message: ... }
            if (response.success) {
                setPrescribers(response.data || []);
            } else {
                setPrescribers([]); // Fallback
            }
        } catch (error) {
            console.error('Failed to load prescribers:', error);
            toast.error('Failed to load prescribers');
        } finally {
            setLoading(false);
        }
    };

    const handleNewPrescriber = () => {
        setSelectedPrescriber(null);
        setIsDrawerOpen(true);
    };

    const handleEditPrescriber = (prescriber: Prescriber) => {
        setSelectedPrescriber(prescriber);
        setIsDrawerOpen(true);
    };

    const handleSaved = (prescriber: Prescriber) => {
        loadPrescribers();

        // If we have a returnUrl, redirect back
        const returnUrl = searchParams?.get('returnUrl');
        if (returnUrl) {
            router.push(returnUrl);
        }
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        // Clear query param if it exists
        if (searchParams?.get('new') === 'true') {
            router.replace('/prescribers');
        }
    };

    return (
        <div className="flex bg-gray-50 flex-col h-full">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                            <MdLocalHospital className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Prescribers</h1>
                            <p className="text-sm text-gray-500">Manage doctors and clinics</p>
                        </div>
                    </div>
                    <button
                        onClick={handleNewPrescriber}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
                    >
                        <FiPlus className="w-4 h-4" />
                        Add Prescriber
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mt-6 max-w-md relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by name, license number, or clinic..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                ) : prescribers.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Doctor
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Details
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {prescribers.map((prescriber) => (
                                    <PrescriberRow
                                        key={prescriber.id}
                                        prescriber={prescriber}
                                        onEdit={handleEditPrescriber}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-gray-200 border-dashed">
                        <div className="p-4 bg-gray-50 rounded-full mb-4">
                            <FiUser className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No prescribers found</h3>
                        <p className="text-gray-500 mt-1 max-w-sm text-center">
                            {search ? 'Try adjusting your search terms.' : 'Get started by adding your first prescriber.'}
                        </p>
                        {!search && (
                            <button
                                onClick={handleNewPrescriber}
                                className="mt-4 text-emerald-600 font-medium hover:text-emerald-700 hover:underline"
                            >
                                Add New Prescriber
                            </button>
                        )}
                    </div>
                )}
            </div>

            <PrescriberFormDrawer
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
                initialData={selectedPrescriber}
                onSaved={handleSaved}
            />
        </div>
    );
}
