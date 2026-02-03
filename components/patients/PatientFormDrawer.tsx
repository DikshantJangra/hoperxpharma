'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX, FiUser, FiHeart, FiLock } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { patientsApi } from '@/lib/api/patients';
import { useAuthStore } from '@/lib/store/auth-store';
import toast from 'react-hot-toast';

// --- Zod Schema for Validation ---
const patientSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    gender: z.enum(['male', 'female', 'other']),
    email: z.string().email("Invalid email address").optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    bloodGroup: z.string().optional(),
    allergies: z.string().optional(),
    chronicConditions: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    insuranceProvider: z.string().optional(),
    insuranceNumber: z.string().optional(),
    consentSms: z.boolean().optional(),
    consentData: z.boolean().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any | null; // Patient data for edit mode
    onSaved?: (patient: any) => void;
}

export default function PatientFormDrawer({
    isOpen,
    onClose,
    initialData,
    onSaved
}: PatientFormDrawerProps) {
    const { primaryStore } = useAuthStore();
    const isEditMode = !!initialData;
    const [activeTab, setActiveTab] = useState<'basic' | 'clinical'>('basic');
    const [isDirty, setIsDirty] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting, dirtyFields }
    } = useForm<PatientFormValues>({
        resolver: zodResolver(patientSchema),
        defaultValues: {
            consentSms: true,
            consentData: false,
            gender: undefined,
        }
    });

    // Watch for changes to detect dirty state
    useEffect(() => {
        const subscription = watch(() => {
            setIsDirty(Object.keys(dirtyFields).length > 0);
        });
        return () => subscription.unsubscribe();
    }, [watch, dirtyFields]);

    // Reset form when drawer opens/closes or data changes
    useEffect(() => {
        if (isOpen && initialData) {
            // Transform API data to form data
            const fullName = `${initialData.firstName} ${initialData.lastName}`.trim();
            reset({
                fullName,
                phone: initialData.phoneNumber || '',
                dateOfBirth: initialData.dateOfBirth ? initialData.dateOfBirth.split('T')[0] : '',
                gender: initialData.gender || undefined,
                email: initialData.email || '',
                address: initialData.addressLine1 || '',
                city: initialData.city || '',
                state: initialData.state || '',
                pincode: initialData.pinCode || '',
                bloodGroup: initialData.bloodGroup || '',
                allergies: initialData.allergies?.join(', ') || '',
                chronicConditions: initialData.chronicConditions?.join(', ') || '',
                emergencyContactName: initialData.emergencyContactName || '',
                emergencyContactPhone: initialData.emergencyContactPhone || '',
                insuranceProvider: '',
                insuranceNumber: '',
                consentSms: true,
                consentData: false,
            });
        } else if (isOpen && !initialData) {
            reset({
                consentSms: true,
                consentData: false,
                gender: undefined,
            });
        }
        setActiveTab('basic');
        setIsDirty(false);
    }, [isOpen, initialData, reset]);

    // Handle close with dirty check
    const handleClose = () => {
        if (isDirty) {
            if (confirm('You have unsaved changes. Are you sure you want to close?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    // Transform form data to API format
    const transformToApiFormat = (data: PatientFormValues) => {
        const nameParts = data.fullName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || nameParts[0];

        return {
            storeId: primaryStore?.id,
            firstName,
            lastName,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            phoneNumber: data.phone,
            email: data.email || undefined,
            addressLine1: data.address || undefined,
            city: data.city || undefined,
            state: data.state || undefined,
            pinCode: data.pincode || undefined,
            bloodGroup: data.bloodGroup || undefined,
            allergies: data.allergies ? data.allergies.split(',').map(a => a.trim()).filter(Boolean) : [],
            chronicConditions: data.chronicConditions ? data.chronicConditions.split(',').map(c => c.trim()).filter(Boolean) : [],
            emergencyContactName: data.emergencyContactName || undefined,
            emergencyContactPhone: data.emergencyContactPhone || undefined,
        };
    };

    const onSubmit = async (data: PatientFormValues) => {
        if (!primaryStore?.id) {
            toast.error('Store not found. Please log in again.');
            return;
        }

        try {
            const apiData = transformToApiFormat(data);

            let patientResponse;
            if (isEditMode) {
                patientResponse = await patientsApi.updatePatient(initialData.id, apiData);
                toast.success('Patient updated successfully');
            } else {
                patientResponse = await patientsApi.createPatient(apiData);
                toast.success(`Patient created • ${patientResponse.data?.firstName} ${patientResponse.data?.lastName}`);
            }

            const patientId = isEditMode ? initialData.id : patientResponse.data?.id;

            // Handle consents for new patients
            if (!isEditMode && patientId) {
                if (data.consentData) {
                    await patientsApi.createConsent({
                        patientId,
                        type: 'Data Processing',
                        status: 'Active',
                    });
                }

                if (data.consentSms) {
                    await patientsApi.createConsent({
                        patientId,
                        type: 'Marketing',
                        status: 'Active',
                    });
                }
            }

            // Handle insurance if provided
            if (data.insuranceProvider && data.insuranceNumber && patientId) {
                await patientsApi.addInsurance(patientId, {
                    provider: data.insuranceProvider,
                    policyNumber: data.insuranceNumber,
                    validFrom: new Date().toISOString(),
                    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'active',
                });
            }

            // Callback with updated patient data
            if (onSaved) {
                onSaved(isEditMode ? { ...initialData, ...apiData } : patientResponse.data);
            }

            onClose();
        } catch (err: any) {
            console.error('Error saving patient:', err);
            const errorMessage = err.message || err.data?.message || 'Failed to save patient';
            toast.error(errorMessage);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            // Cmd/Ctrl + Enter to submit
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(onSubmit)();
            }

            // Escape to close
            if (e.key === 'Escape') {
                e.preventDefault();
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isDirty, handleSubmit]);

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                {/* Backdrop with Blur */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                                    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col bg-white shadow-2xl">

                                        {/* --- Header --- */}
                                        <div className="bg-emerald-600 px-6 py-6">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <Dialog.Title className="text-lg font-semibold leading-6 text-white">
                                                        {isEditMode ? 'Edit Patient Profile' : 'Register New Patient'}
                                                    </Dialog.Title>
                                                    <p className="mt-1 text-sm text-emerald-100">
                                                        {isEditMode
                                                            ? "Update clinical records and contact details."
                                                            : "Add a new patient to your pharmacy database."}
                                                    </p>
                                                </div>
                                                <div className="ml-3 flex h-7 items-center">
                                                    <button
                                                        type="button"
                                                        className="relative rounded-md text-emerald-200 hover:text-white focus:outline-none transition-colors"
                                                        onClick={handleClose}
                                                    >
                                                        <FiX className="h-6 w-6" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* --- Tabs --- */}
                                        <div className="border-b border-gray-200">
                                            <nav className="-mb-px flex" aria-label="Tabs">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('basic')}
                                                    className={`w-1/2 py-4 px-1 text-center border-b-2 text-sm font-medium transition-colors ${activeTab === 'basic'
                                                        ? 'border-emerald-500 text-emerald-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <FiUser className="w-4 h-4 inline-block mr-2 -mt-1" />
                                                    Basic Info
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('clinical')}
                                                    className={`w-1/2 py-4 px-1 text-center border-b-2 text-sm font-medium transition-colors ${activeTab === 'clinical'
                                                        ? 'border-emerald-500 text-emerald-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <FiHeart className="w-4 h-4 inline-block mr-2 -mt-1" />
                                                    Clinical Data
                                                </button>
                                            </nav>
                                        </div>

                                        {/* --- Scrollable Content --- */}
                                        <div className="flex-1 overflow-y-auto p-6">
                                            {activeTab === 'basic' ? (
                                                <div className="space-y-6">
                                                    {/* Full Name */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Full Name <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="mt-1">
                                                            <input
                                                                {...register('fullName')}
                                                                type="text"
                                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                                                                placeholder="e.g. Rajesh Kumar"
                                                            />
                                                            {errors.fullName && (
                                                                <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Phone & DOB Row */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                Mobile Number <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                {...register('phone')}
                                                                type="tel"
                                                                maxLength={10}
                                                                onInput={(e) => {
                                                                    // Only allow numeric input
                                                                    const target = e.target as HTMLInputElement;
                                                                    target.value = target.value.replace(/[^0-9]/g, '');
                                                                }}
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                                                                placeholder="9876543210"
                                                            />
                                                            {errors.phone && (
                                                                <p className="mt-1 text-xs text-red-500 animate-pulse">{errors.phone.message}</p>
                                                            )}
                                                            <p className="mt-1 text-xs text-gray-500">10 digits only</p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                Date of Birth <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                {...register('dateOfBirth')}
                                                                type="date"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                                                            />
                                                            {errors.dateOfBirth && (
                                                                <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth.message}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Gender Pills */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Gender <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="flex gap-3">
                                                            {['male', 'female', 'other'].map((g) => (
                                                                <label key={g} className="flex-1 cursor-pointer">
                                                                    <input
                                                                        type="radio"
                                                                        {...register('gender')}
                                                                        value={g}
                                                                        className="peer sr-only"
                                                                    />
                                                                    <div className="rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-50 peer-checked:border-emerald-600 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 transition-all capitalize">
                                                                        {g}
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                        {errors.gender && (
                                                            <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>
                                                        )}
                                                    </div>

                                                    {/* Email */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                                        <input
                                                            {...register('email')}
                                                            type="email"
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                                                            placeholder="patient@example.com"
                                                        />
                                                        {errors.email && (
                                                            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                                                        )}
                                                    </div>

                                                    {/* Address */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Address</label>
                                                        <textarea
                                                            {...register('address')}
                                                            rows={2}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border"
                                                            placeholder="Street address"
                                                        />
                                                    </div>

                                                    {/* City, State, Pincode */}
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">City</label>
                                                            <input
                                                                {...register('city')}
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">State</label>
                                                            <input
                                                                {...register('state')}
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">Pincode</label>
                                                            <input
                                                                {...register('pincode')}
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                                                                placeholder="110001"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Consent Switch */}
                                                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-gray-50">
                                                        <div className="flex items-center">
                                                            <FiLock className="h-5 w-5 text-emerald-600 mr-3" />
                                                            <span className="text-sm font-medium text-gray-900">Enable SMS/WhatsApp Alerts</span>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            {...register('consentSms')}
                                                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {/* Blood Group */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                                                        <select
                                                            {...register('bloodGroup')}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                                                        >
                                                            <option value="">Select</option>
                                                            <option value="A+">A+</option>
                                                            <option value="A-">A-</option>
                                                            <option value="B+">B+</option>
                                                            <option value="B-">B-</option>
                                                            <option value="O+">O+</option>
                                                            <option value="O-">O-</option>
                                                            <option value="AB+">AB+</option>
                                                            <option value="AB-">AB-</option>
                                                        </select>
                                                    </div>

                                                    {/* Allergies */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Known Allergies</label>
                                                        <textarea
                                                            {...register('allergies')}
                                                            rows={3}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border"
                                                            placeholder="e.g. Penicillin, Peanuts (comma-separated)"
                                                        />
                                                    </div>

                                                    {/* Chronic Conditions */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Chronic Conditions</label>
                                                        <textarea
                                                            {...register('chronicConditions')}
                                                            rows={3}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border"
                                                            placeholder="e.g. Type 2 Diabetes, Hypertension (comma-separated)"
                                                        />
                                                    </div>

                                                    {/* Emergency Contact */}
                                                    <div className="border-t border-gray-200 pt-6">
                                                        <h4 className="text-sm font-medium text-gray-900 mb-4">Emergency Contact</h4>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                                                                <input
                                                                    {...register('emergencyContactName')}
                                                                    type="text"
                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                                                <input
                                                                    {...register('emergencyContactPhone')}
                                                                    type="tel"
                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                                                                    placeholder="9876543210"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Insurance */}
                                                    <div className="border-t border-gray-200 pt-6">
                                                        <h4 className="text-sm font-medium text-gray-900 mb-4">Insurance Information</h4>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">Insurance Provider</label>
                                                                <input
                                                                    {...register('insuranceProvider')}
                                                                    type="text"
                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                                                                    placeholder="e.g. Star Health"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">Policy Number</label>
                                                                <input
                                                                    {...register('insuranceNumber')}
                                                                    type="text"
                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Data Consent */}
                                                    <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 bg-gray-50">
                                                        <input
                                                            type="checkbox"
                                                            {...register('consentData')}
                                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                        />
                                                        <span className="text-sm text-gray-700">
                                                            I consent to the collection and processing of my health data as per DPDPA regulations
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* --- Footer --- */}
                                        <div className="flex flex-shrink-0 justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
                                            <div className="text-xs text-gray-500">
                                                {Object.keys(errors).length > 0 && (
                                                    <span className="text-red-600 font-medium">
                                                        ⚠️ {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} - fix to continue
                                                    </span>
                                                )}
                                                {isDirty && Object.keys(errors).length === 0 && <span className="text-amber-600">● Unsaved changes</span>}
                                                {!isDirty && Object.keys(errors).length === 0 && <span>Press Esc to close • ⌘↵ to save</span>}
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none transition-colors"
                                                    onClick={handleClose}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || Object.keys(errors).length > 0}
                                                    className="inline-flex justify-center items-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    title={Object.keys(errors).length > 0 ? 'Please fix validation errors first' : ''}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        isEditMode ? 'Update Patient' : 'Create Patient'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
