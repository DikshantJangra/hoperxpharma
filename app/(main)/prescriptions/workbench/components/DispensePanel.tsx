'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FiX, FiUser, FiArrowRight, FiShoppingCart } from 'react-icons/fi';
import { RiCapsuleLine } from 'react-icons/ri';

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
    onSendToPOS
}: DispensePanelProps) {
    if (!isOpen) return null;

    const prescription = dispense.refill?.prescription;
    const patient = prescription?.patient;
    const medications = dispense.prescriptionVersion?.items || [];

    const statusFlow = {
        'QUEUED': 'VERIFYING',
        'VERIFYING': 'FILLING',
        'FILLING': 'CHECKING',
        'CHECKING': 'READY',
        'READY': null
    };

    const nextStatus = statusFlow[dispense.status as keyof typeof statusFlow];

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div className="flex-1 bg-black/20" onClick={onClose} />

            {/* Panel */}
            <div className="w-96 bg-white shadow-xl overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Dispense Details</h2>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <FiX className="h-5 w-5" />
                        </Button>
                    </div>

                    <Badge variant={dispense.priority === 'URGENT' ? 'destructive' : 'outline'}>
                        {dispense.status}
                    </Badge>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Patient Info */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <FiUser className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold">Patient</h3>
                            </div>
                            <div className="space-y-2">
                                <p className="font-medium">{patient?.firstName} {patient?.lastName}</p>
                                <p className="text-sm text-gray-600">{patient?.phoneNumber}</p>
                                <p className="text-sm text-gray-600">
                                    DOB: {patient?.dateOfBirth
                                        ? new Date(patient.dateOfBirth).toLocaleDateString()
                                        : 'Not provided'
                                    }
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Prescription Info */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <RiCapsuleLine className="h-5 w-5 text-green-600" />
                                <h3 className="font-semibold">Prescription</h3>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <span className="font-medium">Rx #:</span> {prescription?.prescriptionNumber}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">Refill:</span> {dispense.refill?.refillNumber === 0 ? 'Original' : `#${dispense.refill?.refillNumber}`}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">Medications:</span> {medications.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Medications List */}
                    <div>
                        <h3 className="font-semibold mb-3">Medications</h3>
                        <div className="space-y-2">
                            {medications.map((med: any, index: number) => (
                                <Card key={index}>
                                    <CardContent className="p-3">
                                        <p className="font-medium text-sm">{med.drugName || med.name}</p>
                                        <p className="text-xs text-gray-600">
                                            {med.strength} • Qty: {med.quantity}
                                        </p>
                                        {med.instructions && (
                                            <p className="text-xs text-gray-500 mt-1">{med.instructions}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-4 border-t">
                        {nextStatus && (
                            <Button
                                className="w-full"
                                onClick={() => onStatusUpdate(dispense.id, nextStatus)}
                            >
                                <FiArrowRight className="h-4 w-4 mr-2" />
                                Move to {nextStatus}
                            </Button>
                        )}

                        {dispense.status === 'READY' && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => onSendToPOS(dispense.id)}
                            >
                                <FiShoppingCart className="h-4 w-4 mr-2" />
                                Send to POS
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}