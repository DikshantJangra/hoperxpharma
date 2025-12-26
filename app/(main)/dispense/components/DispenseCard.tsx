'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FiUser, FiPill, FiAlertCircle } from 'react-icons/fi';

interface DispenseCardProps {
    dispense: any;
    onClick: () => void;
}

export default function DispenseCard({ dispense, onClick }: DispenseCardProps) {
    const prescription = dispense.refill?.prescription;
    const patient = prescription?.patient;
    const medications = dispense.prescriptionVersion?.items || [];
    const isUrgent = dispense.priority === 'URGENT';

    return (
        <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
            style={{ borderLeftColor: isUrgent ? '#ef4444' : '#3b82f6' }}
            onClick={onClick}
        >
            <CardContent className="p-4">
                {/* Priority Badge */}
                {isUrgent && (
                    <Badge variant="destructive" className="mb-2 text-xs">
                        <FiAlertCircle className="h-3 w-3 mr-1" />
                        URGENT
                    </Badge>
                )}

                {/* Patient Name */}
                <div className="flex items-center gap-2 mb-2">
                    <FiUser className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold">
                        {patient?.firstName} {patient?.lastName}
                    </h4>
                </div>

                {/* Medication Count */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <FiPill className="h-4 w-4" />
                    <span>{medications.length} medication{medications.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Refill Info & Rx Badge */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                        {dispense.refill?.refillNumber === 0
                            ? 'Original'
                            : `Refill ${dispense.refill?.refillNumber}`}
                    </span>
                    <Badge variant="outline" className="text-xs">
                        {prescription?.prescriptionNumber}
                    </Badge>
                </div>

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground mt-2">
                    Queued {new Date(dispense.queuedAt).toLocaleTimeString()}
                </p>
            </CardContent>
        </Card>
    );
}
