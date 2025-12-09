import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiUser, FiX, FiPhone, FiMail, FiCalendar } from 'react-icons/fi';
import { patientApi } from '@/lib/api/drugs';
import toast from 'react-hot-toast';

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    dateOfBirth?: string;
    allergies?: string[];
    chronicConditions?: string[];
}

interface PatientSearchSelectProps {
    onSelect: (patient: Patient | null) => void;
    selectedPatient: Patient | null;
}

export default function PatientSearchSelect({ onSelect, selectedPatient }: PatientSearchSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (search.length >= 2) {
                setLoading(true);
                try {
                    const response = await patientApi.searchPatients(search);
                    if (response.success) {
                        setResults(response.data || []);
                        setIsOpen(true);
                    }
                } catch (error) {
                    console.error('Failed to search patients', error);
                    toast.error('Failed to search patients');
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleQuickAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            const newPatient = {
                firstName: formData.get('firstName') as string || '',
                lastName: formData.get('lastName') as string || '',
                phoneNumber: formData.get('phoneNumber') as string || '',
                email: formData.get('email') as string || undefined,
                dateOfBirth: formData.get('dateOfBirth') as string || undefined,
            };

            const response = await patientApi.createPatient(newPatient);
            if (response.success) {
                toast.success('Patient added successfully!');
                onSelect(response.data);
                setShowAddModal(false);
                setSearch('');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add patient');
        }
    };

    const handleSelectPatient = (patient: Patient) => {
        onSelect(patient);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="relative">
            {/* Selected View */}
            {selectedPatient ? (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                                <FiUser className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-gray-900">
                                    {selectedPatient.firstName} {selectedPatient.lastName}
                                </div>
                                <div className="text-xs text-gray-600 flex items-center gap-3 mt-0.5">
                                    <span className="flex items-center gap-1">
                                        <FiPhone className="w-3 h-3" />
                                        {selectedPatient.phoneNumber}
                                    </span>
                                    {selectedPatient.email && (
                                        <span className="flex items-center gap-1">
                                            <FiMail className="w-3 h-3" />
                                            {selectedPatient.email}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => onSelect(null)}
                            className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
                            title="Remove patient"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                    {(selectedPatient.allergies?.length || selectedPatient.chronicConditions?.length) ? (
                        <div className="mt-2 pt-2 border-t border-teal-200 grid grid-cols-2 gap-2 text-xs">
                            {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                                <div>
                                    <span className="font-medium text-gray-700">Allergies:</span>
                                    <span className="text-red-600 ml-1">{selectedPatient.allergies.join(', ')}</span>
                                </div>
                            )}
                            {selectedPatient.chronicConditions && selectedPatient.chronicConditions.length > 0 && (
                                <div>
                                    <span className="font-medium text-gray-700">Conditions:</span>
                                    <span className="text-gray-600 ml-1">{selectedPatient.chronicConditions.join(', ')}</span>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            ) : (
                /* Search Input */
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        className="w-full pl-9 pr-10 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => search.length >= 2 && setIsOpen(true)}
                    />
                    {loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin h-4 w-4 border-2 border-teal-600 rounded-full border-t-transparent" />
                        </div>
                    )}

                    {/* Dropdown */}
                    {isOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                            ) : results.length > 0 ? (
                                <>
                                    <div className="p-2 bg-gray-50 border-b border-gray-200">
                                        <p className="text-xs text-gray-600 font-medium">
                                            Found {results.length} patient{results.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    {results.map(patient => (
                                        <button
                                            key={patient.id}
                                            className="w-full text-left p-3 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-none transition-colors"
                                            onClick={() => handleSelectPatient(patient)}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                                                <FiUser className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {patient.firstName} {patient.lastName}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                                                    <div className="flex items-center gap-1">
                                                        <FiPhone className="w-3 h-3" />
                                                        {patient.phoneNumber}
                                                    </div>
                                                    {patient.email && (
                                                        <div className="flex items-center gap-1">
                                                            <FiMail className="w-3 h-3" />
                                                            {patient.email}
                                                        </div>
                                                    )}
                                                    {patient.dateOfBirth && (
                                                        <div className="flex items-center gap-1">
                                                            <FiCalendar className="w-3 h-3" />
                                                            {new Date(patient.dateOfBirth).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </>
                            ) : (
                                <div className="p-4 text-center">
                                    <FiUser className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm text-gray-500 mb-3">No patients found</p>
                                    <button
                                        onMouseDown={(e) => {
                                            e.preventDefault(); // Prevent blur
                                            setShowAddModal(true);
                                            setIsOpen(false);
                                        }}
                                        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2 mx-auto"
                                    >
                                        <FiPlus className="w-4 h-4" />
                                        Add New Patient
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Click outside closer */}
                    {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
                </div>
            )}

            {/* Quick Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Add New Patient</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleQuickAdd} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        First Name *
                                    </label>
                                    <input
                                        name="firstName"
                                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Last Name *
                                    </label>
                                    <input
                                        name="lastName"
                                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Phone Number *
                                </label>
                                <input
                                    name="phoneNumber"
                                    type="tel"
                                    placeholder="e.g., +91 98765 43210"
                                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Email
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="patient@example.com"
                                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Date of Birth
                                </label>
                                <input
                                    name="dateOfBirth"
                                    type="date"
                                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold transition-colors shadow-sm"
                                >
                                    Add Patient
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
