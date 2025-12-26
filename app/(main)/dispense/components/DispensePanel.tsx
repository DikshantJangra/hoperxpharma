'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FiX, FiArrowRight, FiPackage, FiCheckCircle } from 'react-icons/fi';

interface DispensePanelProps {
    dispense: any;
    isOpen: boolean;
    onClose: () => void;
    onStatusUpdate: (dispenseId: string, newStatus: string) => void;
    onSendToPOS: (dispenseId: string) => void;
}

export default function DispensePanel({
    dispense,
    isOpen,
    onClose,
    onStatusUpdate,
    onSendToPOS,
}: DispensePanelProps) {
    if (!isOpen) return null;

    const prescription = dispense.refill?.prescription;
    const patient = prescription?.patient;
    const prescriptionVersion = dispense.prescriptionVersion;
    const medications = prescriptionVersion?.items || [];

    const getNextAction = () => {
        const statusFlow: Record<string, { next: string; label: string; icon: any }> = {
            QUEUED: { next: 'VERIFYING', label: 'Start Verifying', icon: FiArrowRight },
            VERIFYING: { next: 'FILLING', label: 'Start Filling', icon: FiPackage },
            FILLING: { next: 'CHECKING', label: 'Start Checking', icon: FiCheckCircle },
            CHECKING: { next: 'READY', label: 'Mark Ready', icon: FiCheckCircle },
            READY: { next: 'POS', label: 'Send to POS', icon: FiArrowRight },
        };

        return statusFlow[dispense.status] || null;
    };

    const nextAction = getNextAction();

    const handlePrimaryAction = () => {
        if (nextAction) {
            if (nextAction.next === 'POS') {
                onSendToPOS(dispense.id);
            } else {
                onStatusUpdate(dispense.id, nextAction.next);
            }
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            {/* Side Panel */}
            <div className="fixed right-0 top-0 bottom-0 w-[500px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Dispense Task</h2>
                        <p className="text-sm text-muted-foreground">
                            {patient?.firstName} {patient?.lastName}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <FiX className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Prescription Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Prescription Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <label className="text-xs text-muted-foreground">Rx Number</label>
                                <p className="font-medium">{prescription?.prescriptionNumber}</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Refill</label>
                                <p className="font-medium">
                                    {dispense.refill?.refillNumber === 0
                                        ? 'Original Fill'
                                        : `Refill ${dispense.refill?.refillNumber} of ${prescription?.totalRefills}`}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Current Status</label>
                                <div className="mt-1">
                                    <Badge>{dispense.status}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Medications to Dispense */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Medications ({medications.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {medications.map((item: any, index: number) => (
                                <div key={index} className="p-3 border rounded-lg">
                                    <h4 className="font-semibold">{item.drug?.name}</h4>
                                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                        <div>
                                            <label className="text-xs text-muted-foreground">Quantity</label>
                                            <p className="font-medium">{item.quantityPrescribed}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Form</label>
                                            <p className="font-medium">{item.drug?.form || 'N/A'}</p>
                                        </div>
                                    </div>
                                    {item.sig && (
                                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                                            <strong>Directions:</strong> {item.sig}
                                        </div>
                                    )}
                                    {item.substitutionAllowed === false && (
                                        <Badge variant="secondary" className="mt-2 text-xs">
                                            No Substitution
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Instructions */}
                    {prescriptionVersion?.instructions && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">General Instructions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">
                                    {prescriptionVersion.instructions}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes */}
                    {dispense.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{dispense.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t bg-gray-50">
                    {nextAction && (
                        <Button
                            onClick={handlePrimaryAction}
                            size="lg"
                            className="w-full"
                        >
                            {React.createElement(nextAction.icon, { className: 'h-5 w-5 mr-2' })}
                            {nextAction.label}
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
}
