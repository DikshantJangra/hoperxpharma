'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Package, Clock, User } from 'react-icons/fi';
import { toast } from 'sonner';
import { baseFetch } from '@/lib/api-client';

interface DispenseImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (dispense: any) => void;
}

export default function DispenseImportModal({
    isOpen,
    onClose,
    onImport,
}: DispenseImportModalProps) {
    const [readyDispenses, setReadyDispenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchReadyDispenses();
        }
    }, [isOpen]);

    const fetchReadyDispenses = async () => {
        try {
            setLoading(true);
            const data = await baseFetch('/api/v1/dispenses?status=READY');
            setReadyDispenses(data.dispenses || []);
        } catch (error) {
            toast.error('Failed to load ready dispenses');
            console.error('[DispenseImport] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = (dispense: any) => {
        onImport(dispense);
        onClose();
        toast.success('Dispense imported to POS');
    };

    const filteredDispenses = readyDispenses.filter(dispense => {
        const searchLower = searchTerm.toLowerCase();
        const patient = dispense.refill?.prescription?.patient;
        const rxNumber = dispense.refill?.prescription?.prescriptionNumber || '';

        return (
            rxNumber.toLowerCase().includes(searchLower) ||
            patient?.firstName?.toLowerCase().includes(searchLower) ||
            patient?.lastName?.toLowerCase().includes(searchLower) ||
            patient?.phoneNumber?.includes(searchTerm)
        );
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import from Ready Dispenses</DialogTitle>
                </DialogHeader>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search by patient name, Rx number, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Dispenses List */}
                <div className="flex-1 overflow-y-auto space-y-3">
                    {loading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Loading ready dispenses...
                        </div>
                    ) : filteredDispenses.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold mb-2">No Ready Dispenses</h3>
                            <p className="text-sm text-muted-foreground">
                                {searchTerm
                                    ? 'No dispenses match your search'
                                    : 'All dispenses are either in progress or completed'}
                            </p>
                        </div>
                    ) : (
                        filteredDispenses.map((dispense) => {
                            const prescription = dispense.refill?.prescription;
                            const patient = prescription?.patient;
                            const medications = dispense.prescriptionVersion?.items || [];

                            return (
                                <Card
                                    key={dispense.id}
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => handleImport(dispense)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                {/* Patient Name */}
                                                <div className="flex items-center gap-2 mb-1">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <h4 className="font-semibold">
                                                        {patient?.firstName} {patient?.lastName}
                                                    </h4>
                                                </div>

                                                {/* Phone */}
                                                {patient?.phoneNumber && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {patient.phoneNumber}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Rx Number Badge */}
                                            <Badge variant="outline">
                                                {prescription?.prescriptionNumber}
                                            </Badge>
                                        </div>

                                        {/* Medications Count */}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                            <Package className="h-4 w-4" />
                                            <span>{medications.length} medication{medications.length !== 1 ? 's' : ''}</span>
                                        </div>

                                        {/* Refill Info */}
                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <span className="text-xs text-muted-foreground">
                                                {dispense.refill?.refillNumber === 0
                                                    ? 'Original Fill'
                                                    : `Refill ${dispense.refill?.refillNumber}`}
                                            </span>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                Ready {new Date(dispense.readyAt).toLocaleTimeString()}
                                            </div>
                                        </div>

                                        {/* Medications Preview */}
                                        {medications.length > 0 && (
                                            <div className="mt-3 pt-3 border-t">
                                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                                    Medications:
                                                </p>
                                                <div className="space-y-1">
                                                    {medications.slice(0, 3).map((item: any, idx: number) => (
                                                        <p key={idx} className="text-xs">
                                                            • {item.drug?.name} ({item.quantityPrescribed})
                                                        </p>
                                                    ))}
                                                    {medications.length > 3 && (
                                                        <p className="text-xs text-muted-foreground">
                                                            +{medications.length - 3} more...
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="pt-4 border-t flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                        {filteredDispenses.length} ready dispense{filteredDispenses.length !== 1 ? 's' : ''}
                    </p>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
