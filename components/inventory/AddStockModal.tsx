'use client';

import React, { useState } from 'react';
import { Medicine } from '@/types/medicine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FiX, FiCheckCircle, FiLoader, FiPackage, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import SaltEntrySection from './SaltEntrySection';

interface AddStockModalProps {
    isOpen: boolean;
    medicine: Medicine;
    onClose: () => void;
    onSuccess: () => void;
}

interface BatchFormData {
    batchNumber: string;
    expiryDate: string;
    quantityReceived: number;
    mrp: number;
    costPerUnit: number;
    supplier: string;
    rackLocation: string;
}

export default function AddStockModal({ isOpen, medicine, onClose, onSuccess }: AddStockModalProps) {
    const [formData, setFormData] = useState<BatchFormData>({
        batchNumber: '',
        expiryDate: '',
        quantityReceived: 0,
        mrp: 0,
        costPerUnit: 0,
        supplier: '',
        rackLocation: '',
    });

    const [errors, setErrors] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showSaltEntry, setShowSaltEntry] = useState(false);

    const handleChange = (field: keyof BatchFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors([]); // Clear errors on change
    };

    const validate = (): boolean => {
        const validationErrors: string[] = [];

        if (!formData.batchNumber.trim()) {
            validationErrors.push('Batch number is required');
        }

        if (!formData.expiryDate) {
            validationErrors.push('Expiry date is required');
        }

        if (formData.quantityReceived <= 0) {
            validationErrors.push('Quantity must be greater than 0');
        }

        if (formData.mrp <= 0) {
            validationErrors.push('MRP must be greater than 0');
        }

        if (formData.costPerUnit <= 0) {
            validationErrors.push('Cost per unit must be greater than 0');
        }

        if (formData.costPerUnit > formData.mrp) {
            validationErrors.push('Cost per unit cannot exceed MRP');
        }

        setErrors(validationErrors);
        return validationErrors.length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            return;
        }

        setProcessing(true);
        setErrors([]);

        try {
            // TODO: Replace with actual API endpoint
            const response = await fetch('/api/inventory/add-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    medicineId: medicine.id,
                    medicineName: medicine.name,
                    ...formData,
                    expiryDate: new Date(formData.expiryDate).toISOString(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add stock');
            }

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Failed to add stock:', error);
            setErrors([error instanceof Error ? error.message : 'Failed to add stock. Please try again.']);
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    const margin = formData.mrp && formData.costPerUnit
        ? ((formData.mrp - formData.costPerUnit) / formData.mrp * 100).toFixed(1)
        : 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Add Stock</h2>
                        <p className="text-sm text-gray-500 mt-1">Add batch and stock details for this medicine</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <FiX className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-6">
                    {/* Success Message */}
                    {success && (
                        <Alert className="mb-4 bg-green-50 border-green-200">
                            <FiCheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Stock added successfully!
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Error Messages */}
                    {errors.length > 0 && (
                        <Alert className="mb-4 bg-red-50 border-red-200">
                            <AlertDescription className="text-red-800">
                                <ul className="list-disc list-inside text-sm">
                                    {errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Medicine Info Card */}
                    <Card className="p-4 mb-6 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <FiPackage className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-900">{medicine.name}</h3>
                                <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                                    {medicine.genericName && (
                                        <span>Generic: {medicine.genericName}</span>
                                    )}
                                    {medicine.manufacturerName && (
                                        <span>• {medicine.manufacturerName}</span>
                                    )}
                                    {medicine.type && (
                                        <span>• {medicine.type}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Batch Details Form */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Batch Number */}
                            <div>
                                <Label htmlFor="batchNumber">Batch Number *</Label>
                                <Input
                                    id="batchNumber"
                                    value={formData.batchNumber}
                                    onChange={(e) => handleChange('batchNumber', e.target.value)}
                                    placeholder="e.g., BT2024001"
                                />
                            </div>

                            {/* Expiry Date */}
                            <div>
                                <Label htmlFor="expiryDate">Expiry Date *</Label>
                                <Input
                                    id="expiryDate"
                                    type="date"
                                    value={formData.expiryDate}
                                    onChange={(e) => handleChange('expiryDate', e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Quantity */}
                            <div>
                                <Label htmlFor="quantity">Quantity Received *</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    value={formData.quantityReceived || ''}
                                    onChange={(e) => handleChange('quantityReceived', parseInt(e.target.value) || 0)}
                                    placeholder="100"
                                />
                                <p className="text-xs text-gray-500 mt-1">Units/tablets</p>
                            </div>

                            {/* MRP */}
                            <div>
                                <Label htmlFor="mrp">MRP (₹) *</Label>
                                <Input
                                    id="mrp"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.mrp || ''}
                                    onChange={(e) => handleChange('mrp', parseFloat(e.target.value) || 0)}
                                    placeholder="10.00"
                                />
                            </div>

                            {/* Cost */}
                            <div>
                                <Label htmlFor="cost">Cost/Unit (₹) *</Label>
                                <Input
                                    id="cost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.costPerUnit || ''}
                                    onChange={(e) => handleChange('costPerUnit', parseFloat(e.target.value) || 0)}
                                    placeholder="8.00"
                                />
                            </div>
                        </div>

                        {/* Margin Indicator */}
                        {formData.mrp > 0 && formData.costPerUnit > 0 && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700">Profit Margin:</span>
                                    <span className="font-semibold text-blue-700">
                                        {margin}% (₹{(formData.mrp - formData.costPerUnit).toFixed(2)} per unit)
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Supplier */}
                            <div>
                                <Label htmlFor="supplier">Supplier (Optional)</Label>
                                <Input
                                    id="supplier"
                                    value={formData.supplier}
                                    onChange={(e) => handleChange('supplier', e.target.value)}
                                    placeholder="e.g., ABC Pharma Distributors"
                                />
                            </div>

                            {/* Rack Location */}
                            <div>
                                <Label htmlFor="rack">Rack/Location (Optional)</Label>
                                <Input
                                    id="rack"
                                    value={formData.rackLocation}
                                    onChange={(e) => handleChange('rackLocation', e.target.value)}
                                    placeholder="e.g., A-12"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <Button variant="outline" onClick={onClose} disabled={processing}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {processing ? (
                                <>
                                    <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <FiCheckCircle className="mr-2 h-4 w-4" />
                                    Add to Inventory
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Salt Composition - Optional */}
                    {medicine.composition && (
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={() => setShowSaltEntry(!showSaltEntry)}
                                className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                            >
                                {showSaltEntry ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                                {showSaltEntry ? 'Hide' : 'Verify'} Salt Composition
                            </button>

                            {!showSaltEntry && (
                                <p className="text-xs text-gray-600 mt-1">{medicine.composition}</p>
                            )}

                            {showSaltEntry && (
                                <div className="mt-2">
                                    <SaltEntrySection initialComposition={medicine.composition} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
