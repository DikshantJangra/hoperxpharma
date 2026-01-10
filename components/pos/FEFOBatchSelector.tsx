'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FEFORecommendation } from '@/lib/api/fefo';
import { AlertTriangle, Calendar, Package, TrendingDown } from 'react-icons/fi';
import dayjs from 'dayjs';

interface FEFOBatchSelectorProps {
    drugId: string;
    drugName: string;
    quantity: number;
    recommendation: FEFORecommendation | null;
    onSelectBatch: (batchId: string, isOverride: boolean, reason?: string) => void;
    onCancel: () => void;
    isOpen: boolean;
}

export function FEFOBatchSelector({
    drugId,
    drugName,
    quantity,
    recommendation,
    onSelectBatch,
    onCancel,
    isOpen
}: FEFOBatchSelectorProps) {
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(
        recommendation?.recommendedBatchId || null
    );
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');

    if (!recommendation) {
        return (
            <Dialog open={isOpen} onOpenChange={() => onCancel()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>No Stock Available</DialogTitle>
                    </DialogHeader>
                    <Alert variant="destructive">
                        <AlertDescription>
                            No batches available for {drugName}
                        </AlertDescription>
                    </Alert>
                    <Button onClick={onCancel}>Close</Button>
                </DialogContent>
            </Dialog>
        );
    }

    const isOverride = selectedBatchId !== recommendation.recommendedBatchId;

    const handleConfirmSelection = () => {
        if (!selectedBatchId) return;

        if (isOverride) {
            setShowOverrideModal(true);
        } else {
            onSelectBatch(selectedBatchId, false);
        }
    };

    const handleConfirmOverride = () => {
        if (!selectedBatchId) return;
        onSelectBatch(selectedBatchId, true, overrideReason || undefined);
        setShowOverrideModal(false);
    };

    const getBatchExpiryColor = (daysToExpiry: number) => {
        if (daysToExpiry < 0) return 'text-red-600 bg-red-50';
        if (daysToExpiry <= 30) return 'text-orange-600 bg-orange-50';
        if (daysToExpiry <= 90) return 'text-yellow-600 bg-yellow-50';
        return 'text-green-600 bg-green-50';
    };

    return (
        <>
            <Dialog open={isOpen && !showOverrideModal} onOpenChange={() => onCancel()}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Select Batch - {drugName}</DialogTitle>
                        <p className="text-sm text-gray-500">Quantity needed: {quantity}</p>
                    </DialogHeader>

                    {/* FEFO Warning */}
                    {isOverride && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                You are selecting a batch that is NOT the oldest expiry. This deviation will be logged.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Recommended Batch (Highlighted) */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700">Recommended (FEFO):</h3>
                        <div
                            onClick={() => setSelectedBatchId(recommendation.recommendedBatchId)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedBatchId === recommendation.recommendedBatchId
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 hover:border-emerald-300'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-emerald-600" />
                                        <span className="font-semibold">
                                            Batch: {recommendation.batchNumber}
                                        </span>
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                                            FEFO RECOMMENDED
                                        </span>
                                    </div>

                                    <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <div className="text-gray-500">Expiry Date</div>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Calendar className="h-3 w-3" />
                                                <span className="font-medium">
                                                    {dayjs(recommendation.expiryDate).format('DD MMM YYYY')}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500">Days to Expiry</div>
                                            <div className={`inline-block px-2 py-1 rounded mt-1 ${getBatchExpiryColor(recommendation.daysToExpiry)}`}>
                                                {recommendation.daysToExpiry} days
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500">Available Stock</div>
                                            <div className="font-medium mt-1">{recommendation.quantityInStock} units</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <div className="text-lg font-bold">₹{Number(recommendation.mrp).toFixed(2)}</div>
                                    <div className="text-xs text-gray-500">MRP</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alternative Batches */}
                    {recommendation.alternativeBatches.length > 1 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-700">Other Batches:</h3>
                            <div className="space-y-2">
                                {recommendation.alternativeBatches
                                    .filter(b => !b.isRecommended)
                                    .map((batch) => (
                                        <div
                                            key={batch.id}
                                            onClick={() => setSelectedBatchId(batch.id)}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedBatchId === batch.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4 text-gray-600" />
                                                        <span className="font-medium">Batch: {batch.batchNumber}</span>
                                                        {batch.daysDifferenceFromRecommended > 0 && (
                                                            <span className="text-xs text-orange-600 flex items-center gap-1">
                                                                <TrendingDown className="h-3 w-3" />
                                                                +{batch.daysDifferenceFromRecommended} days newer
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-500">Expiry: </span>
                                                            <span className="font-medium">{dayjs(batch.expiryDate).format('DD MMM YYYY')}</span>
                                                        </div>
                                                        <div>
                                                            <span className={`px-2 py-0.5 rounded text-xs ${getBatchExpiryColor(batch.daysToExpiry)}`}>
                                                                {batch.daysToExpiry} days
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Stock: </span>
                                                            <span className="font-medium">{batch.quantityInStock}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <div className="font-bold">₹{Number(batch.mrp).toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Expiry Risk Summary */}
                    {recommendation.expiryRisk.batchesExpiringSoon > 0 && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>{recommendation.expiryRisk.batchesExpiringSoon}</strong> batches expiring within 90 days.
                                Total value at risk: <strong>₹{recommendation.expiryRisk.totalAtRisk.toFixed(2)}</strong>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmSelection}
                            disabled={!selectedBatchId}
                            className={isOverride ? 'bg-orange-600 hover:bg-orange-700' : ''}
                        >
                            {isOverride ? 'Override FEFO' : 'Confirm Selection'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Override Reason Modal */}
            <Dialog open={showOverrideModal} onOpenChange={() => setShowOverrideModal(false)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>FEFO Override Reason</DialogTitle>
                    </DialogHeader>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            You are choosing a batch that is not the oldest expiry. Please provide a reason for this deviation.
                        </AlertDescription>
                    </Alert>
                    <Textarea
                        placeholder="Enter reason for FEFO override (e.g., 'Customer requested', 'Damaged packaging on older batch', etc.)"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        rows={3}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowOverrideModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmOverride}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            Confirm Override
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
