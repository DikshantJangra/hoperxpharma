'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX, FiUser, FiMapPin, FiPhone, FiMail, FiAward, FiFileText } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { prescribersApi } from '@/lib/api/prescribers';
import { useAuthStore } from '@/lib/store/auth-store';
import toast from 'react-hot-toast';

// --- Zod Schema for Validation ---
const prescriberSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    licenseNumber: z.string().optional(),
    clinic: z.string().min(2, "Clinic name is required"),
    phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional().or(z.literal('')),
    email: z.string().email("Invalid email address").optional().or(z.literal('')),
    specialty: z.string().optional(),
});

type PrescriberFormValues = z.infer<typeof prescriberSchema>;

interface PrescriberFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any | null; // Prescriber data for edit mode
    onSaved?: (prescriber: any) => void;
}

export default function PrescriberFormDrawer({
    isOpen,
    onClose,
    initialData,
    onSaved
}: PrescriberFormDrawerProps) {
    const { primaryStore } = useAuthStore();
    const isEditMode = !!initialData;
    const [isDirty, setIsDirty] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting, dirtyFields }
    } = useForm<PrescriberFormValues>({
        resolver: zodResolver(prescriberSchema),
        defaultValues: {
            name: '',
            licenseNumber: '',
            clinic: '',
            phoneNumber: '',
            email: '',
            specialty: '',
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
            reset({
                name: initialData.name,
                licenseNumber: initialData.licenseNumber,
                clinic: initialData.clinic || '',
                phoneNumber: initialData.phoneNumber || '',
                email: initialData.email || '',
                specialty: initialData.specialty || '',
            });
        } else if (isOpen && !initialData) {
            reset({
                name: '',
                licenseNumber: '',
                clinic: '',
                phoneNumber: '',
                email: '',
                specialty: '',
            });
        }
        setIsDirty(false);
    }, [isOpen, initialData, reset]);

    const handleClose = () => {
        if (isDirty) {
            if (confirm('You have unsaved changes. Are you sure you want to close?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const onSubmit = async (data: PrescriberFormValues) => {
        if (!primaryStore?.id) {
            toast.error('Store not found. Please log in again.');
            return;
        }

        try {
            const apiData = {
                storeId: primaryStore.id,
                ...data
            };

            let response;
            // Prescriber API might not have update yet based on controller, but let's assume create for now or check if I need to add update.
            // The controller only had get and create. I should stick to create for "Add Prescriber".
            // If edit is needed, I'll need to update backend. For now user emphasized "Add Prescriber".

            if (isEditMode) {
                // response = await prescribersApi.updatePrescriber(initialData.id, apiData);
                toast.error("Edit functionality not yet implemented on backend");
                return;
            } else {
                response = await prescribersApi.createPrescriber(apiData);
                toast.success(`Prescriber added • ${response.data.name}`);
            }

            if (onSaved) {
                onSaved(response.data);
            }

            onClose();
        } catch (err: any) {
            console.error('Error saving prescriber:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to save prescriber';
            toast.error(errorMessage);
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col bg-white shadow-2xl">

                                        {/* Header */}
                                        <div className="bg-emerald-600 px-6 py-6">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <Dialog.Title className="text-lg font-semibold leading-6 text-white">
                                                        {isEditMode ? 'Edit Prescriber' : 'Add New Prescriber'}
                                                    </Dialog.Title>
                                                    <p className="mt-1 text-sm text-emerald-100">
                                                        Enter doctor details for your records.
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

                                        {/* Content */}
                                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                            {/* Section: Basic Information */}
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                                    Basic Information
                                                </h3>

                                                {/* Name */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Full Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="mt-1 relative rounded-md shadow-sm">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                            <FiUser className="text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            {...register('name')}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/\b\w/g, c => c.toUpperCase());
                                                                e.target.value = val;
                                                                register('name').onChange(e);
                                                            }}
                                                            className="block w-full rounded-md border-gray-300 pl-10 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 border"
                                                            placeholder="Dr. John Doe"
                                                        />
                                                    </div>
                                                    {errors.name && (
                                                        <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                                                    )}
                                                </div>

                                                {/* Clinic */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Primary Clinic / Hospital <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="mt-1 relative rounded-md shadow-sm">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                            <FiMapPin className="text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            {...register('clinic')}
                                                            className="block w-full rounded-md border-gray-300 pl-10 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 border"
                                                            placeholder="e.g. Apollo Hospital"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section: Professional Details */}
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                                    Professional Details
                                                </h3>

                                                {/* License */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        License Number
                                                    </label>
                                                    <div className="mt-1 relative rounded-md shadow-sm">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                            <FiFileText className="text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            {...register('licenseNumber')}
                                                            className="block w-full rounded-md border-gray-300 pl-10 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 border"
                                                            placeholder="State Medical Council No."
                                                        />
                                                    </div>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Required for controlled medications.
                                                    </p>
                                                    {errors.licenseNumber && (
                                                        <p className="mt-1 text-xs text-red-500">{errors.licenseNumber.message}</p>
                                                    )}
                                                </div>

                                                {/* Specialty */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Specialty
                                                    </label>
                                                    <div className="mt-1 relative rounded-md shadow-sm">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                            <FiAward className="text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            {...register('specialty')}
                                                            className="block w-full rounded-md border-gray-300 pl-10 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 border"
                                                            placeholder="e.g. Cardiologist, General Physician"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section: Contact Information */}
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                                    Contact Information
                                                </h3>

                                                {/* Phone */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Phone Number
                                                    </label>
                                                    <div className="mt-1 relative rounded-md shadow-sm">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                            <FiPhone className="text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="tel"
                                                            {...register('phoneNumber')}
                                                            maxLength={10}
                                                            className="block w-full rounded-md border-gray-300 pl-10 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 border"
                                                            placeholder="9876543210"
                                                        />
                                                    </div>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Used for quick verification calls.
                                                    </p>
                                                    {errors.phoneNumber && (
                                                        <p className="mt-1 text-xs text-red-500">{errors.phoneNumber.message}</p>
                                                    )}
                                                </div>

                                                {/* Email */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Email Address
                                                    </label>
                                                    <div className="mt-1 relative rounded-md shadow-sm">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                            <FiMail className="text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="email"
                                                            {...register('email')}
                                                            className="block w-full rounded-md border-gray-300 pl-10 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 border"
                                                            placeholder="doctor@clinic.com"
                                                        />
                                                    </div>
                                                    {errors.email && (
                                                        <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex flex-shrink-0 justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
                                            <button
                                                type="button"
                                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none transition-colors"
                                                onClick={handleClose}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="inline-flex justify-center items-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                                            >
                                                {isSubmitting ? 'Saving...' : (isEditMode ? 'Update' : 'Save Prescriber')}
                                            </button>
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
