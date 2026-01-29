'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import SupplierForm from './SupplierForm';
import { toast } from 'sonner';

interface SupplierDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newSupplier: any) => void;
    initialData?: any;
}

export default function SupplierDrawer({ isOpen, onClose, onSuccess, initialData }: SupplierDrawerProps) {
    if (!isOpen) return null;

    const handleSave = async (data: any) => {
        try {
            const { supplierApi } = await import('@/lib/api/supplier');

            // Transform form data to match backend schema is handled in SupplierForm? 
            // Actually SupplierForm passes raw form data, page.tsx was mapping it.
            // Let's verify mapping logic in page.tsx.
            // Page.tsx maps it explicitly. We should replicate that here or move it to Form.
            // For now, let's replicate the mapping to be safe.

            const supplierData = {
                id: initialData?.id,
                name: data.name,
                category: data.category,
                status: 'Active',
                gstin: data.gstin,
                dlNumber: data.dlNumber,
                pan: data.pan,
                contactName: data.contactName,
                phoneNumber: data.phoneNumber,
                email: data.email,
                whatsapp: data.whatsapp,
                addressLine1: data.addressLine1,
                addressLine2: data.addressLine2,
                city: data.city,
                state: data.state,
                pinCode: data.pinCode,
                paymentTerms: data.paymentTerms,
                creditLimit: data.creditLimit,
            };

            let result;
            if (initialData?.id) {
                const response = await supplierApi.updateSupplier(initialData.id, supplierData);
                result = response.data;
                toast.success('Supplier updated successfully');
            } else {
                const response = await supplierApi.createSupplier(supplierData);
                result = response.data || response; // API might return data directly or wrapped
                toast.success('Supplier created successfully');
            }

            onSuccess(result);
            onClose();
        } catch (error: any) {
            console.error('Failed to save supplier:', error);
            toast.error(error.message || 'Failed to save supplier');
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                <SupplierForm
                    initialData={initialData}
                    onSave={handleSave}
                    onCancel={onClose}
                    variant="drawer"
                />
            </div>
        </div>,
        document.body
    );
}
