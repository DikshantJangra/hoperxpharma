import React, { useState, useEffect } from 'react';
import { inventoryApi } from '@/lib/api/inventory';
import { toast } from 'sonner';

interface Batch {
    id: string;
    batchNumber: string;
    quantityInStock: number;
    expiryDate: string;
    mrp: number;
    location?: string;
    manufacturerBarcode?: string;
}

interface BatchSelectorProps {
    drugId: string;
    currentBatchNumber: string;
    onBatchSelect: (batch: Batch | null) => void;
    disabled?: boolean;
}

/**
 * Dropdown selector for choosing existing batch or creating new one
 * Fetches all batches for a drug and allows user to select or create new
 */
export default function BatchSelector({
    drugId,
    currentBatchNumber,
    onBatchSelect,
    disabled = false
}: BatchSelectorProps) {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(false);
    const [isNewBatch, setIsNewBatch] = useState(false);
    const [customBatchNumber, setCustomBatchNumber] = useState('');

    // Fetch batches for this drug
    useEffect(() => {
        const fetchBatches = async () => {
            if (!drugId) return;

            setLoading(true);
            try {
                const response = await inventoryApi.getBatches({
                    drugId,
                    limit: 50,
                    minQuantity: 0 // Include even zero-stock batches
                });

                if (response.success && response.data) {
                    setBatches(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch batches:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBatches();
    }, [drugId]);

    const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;

        if (value === '_new_') {
            setIsNewBatch(true);
            setCustomBatchNumber('');
            onBatchSelect(null); // Signal creating new batch
        } else {
            setIsNewBatch(false);
            const selectedBatch = batches.find(b => b.batchNumber === value);
            if (selectedBatch) {
                onBatchSelect(selectedBatch);
                toast.success(`Using existing batch: ${value}`, {
                    description: `Current stock: ${selectedBatch.quantityInStock} units`
                });
            }
        }
    };

    const handleCustomBatchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomBatchNumber(value);
        // Create a pseudo-batch object for new batch
        if (value.trim()) {
            onBatchSelect({
                id: '',
                batchNumber: value,
                quantityInStock: 0,
                expiryDate: '',
                mrp: 0,
                location: '',
                manufacturerBarcode: ''
            } as Batch);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', {
                month: '2-digit',
                year: '2-digit'
            });
        } catch {
            return '';
        }
    };

    return (
        <div className="space-y-2">
            <div className="relative">
                <select
                    value={isNewBatch ? '_new_' : currentBatchNumber || ''}
                    onChange={handleSelectionChange}
                    disabled={disabled || loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                >
                    <option value="_new_">➕ Create New Batch</option>
                    {batches.length > 0 && (
                        <>
                            <option disabled className="text-gray-400">──────────────</option>
                            {batches.map((batch) => (
                                <option key={batch.id} value={batch.batchNumber}>
                                    {batch.batchNumber} - Stock: {batch.quantityInStock} | Exp: {formatDate(batch.expiryDate)}
                                </option>
                            ))}
                        </>
                    )}
                </select>

                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Custom batch input when "Create New" is selected */}
            {isNewBatch && (
                <input
                    type="text"
                    value={customBatchNumber}
                    onChange={handleCustomBatchInput}
                    placeholder="Enter new batch number..."
                    className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm animate-in fade-in slide-in-from-top-2 duration-200"
                    autoFocus
                    disabled={disabled}
                />
            )}
        </div>
    );
}
