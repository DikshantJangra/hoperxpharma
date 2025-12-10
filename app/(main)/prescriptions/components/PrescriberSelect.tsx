import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiUser, FiX, FiCheck } from 'react-icons/fi';
import { prescribersApi } from '@/lib/api/prescribers';
import { useAuthStore } from '@/lib/store/auth-store';
import toast from 'react-hot-toast';

interface Prescriber {
    id: string;
    name: string;
    clinic?: string;
    licenseNumber?: string;
}

interface PrescriberSelectProps {
    onSelect: (prescriber: Prescriber) => void;
    selectedPrescriber: Prescriber | null;
}

export default function PrescriberSelect({ onSelect, selectedPrescriber }: PrescriberSelectProps) {
    const { primaryStore } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<Prescriber[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if ((isOpen || search.length > 0) && primaryStore?.id) {
                setLoading(true);
                try {
                    const response = await prescribersApi.getPrescribers({
                        search,
                        storeId: primaryStore.id
                    });

                    // The apiClient returns the parsed body directly { success, data, message }
                    if (response.success) {
                        setResults(response.data || []);
                    }
                } catch (error) {
                    console.error('Failed to search prescribers', error);
                } finally {
                    setLoading(false);
                }
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, isOpen, primaryStore?.id]);

    const handleQuickAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!primaryStore?.id) {
            toast.error('Store context missing');
            return;
        }

        const formData = new FormData(e.currentTarget);
        try {
            const newPrescriber = {
                name: formData.get('name') as string || '',
                licenseNumber: formData.get('licenseNumber') as string || '',
                clinic: formData.get('clinic') as string || undefined,
                phoneNumber: formData.get('phone') as string || undefined,
                storeId: primaryStore.id
            };
            const response = await prescribersApi.createPrescriber(newPrescriber);

            // apiClient returns the body directly
            if (response.success) {
                toast.success('Prescriber added');
                onSelect(response.data);
                setShowAddModal(false);
                setSearch('');
            }
        } catch (error: any) {
            const errorMessage = error.data?.message
                || error.message
                || 'Failed to add prescriber';
            toast.error(errorMessage);
            console.error('Error adding prescriber:', error);
        }
    };

    return (
        <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">Prescriber</label>

            {/* Selected View */}
            {selectedPrescriber ? (
                <div className="flex items-center justify-between p-2 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                            <FiUser className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-900">{selectedPrescriber.name}</div>
                            {selectedPrescriber.clinic && (
                                <div className="text-xs text-gray-500">{selectedPrescriber.clinic}</div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => onSelect(null as any)}
                        className="text-gray-400 hover:text-red-500 p-1"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                /* Search Input */
                <div className="relative">
                    <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search doctor..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        value={search}
                        onFocus={() => setIsOpen(true)}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {/* Dropdown */}
                    {isOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-xs text-gray-500">Loading...</div>
                            ) : results.length > 0 ? (
                                results.map(doc => (
                                    <button
                                        key={doc.id}
                                        className="w-full text-left p-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-none"
                                        onClick={() => {
                                            onSelect(doc);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                            <FiUser className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {doc.clinic} • {doc.licenseNumber}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-3 text-center">
                                    <p className="text-xs text-gray-500 mb-2">No doctors found</p>
                                    <button
                                        onMouseDown={(e) => {
                                            e.preventDefault(); // Prevent blur
                                            setShowAddModal(true);
                                            setIsOpen(false);
                                        }}
                                        className="text-xs text-teal-600 font-medium hover:underline flex items-center justify-center gap-1 w-full"
                                    >
                                        <FiPlus className="w-3 h-3" /> Add "{search}"
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Click outside closer would go here, simplified for now */}
                    {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
                </div>
            )}

            {/* Quick Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Add Prescriber</h3>
                            <button onClick={() => setShowAddModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleQuickAdd} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Doctor Name *</label>
                                <input name="name" defaultValue={search} className="w-full border rounded p-2 text-sm" required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">License Number *</label>
                                <input name="licenseNumber" className="w-full border rounded p-2 text-sm" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Clinic/Hospital</label>
                                    <input name="clinic" className="w-full border rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Specialty</label>
                                    <input name="specialty" className="w-full border rounded p-2 text-sm" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-teal-600 text-white rounded hover:bg-teal-700">Add Doctor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
