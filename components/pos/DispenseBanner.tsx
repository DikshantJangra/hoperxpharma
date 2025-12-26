'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Package } from 'react-icons/fi';

interface DispenseBannerProps {
    dispenseInfo?: {
        id: string;
        prescriptionNumber: string;
        refillNumber: number;
    };
}

export default function DispenseBanner({ dispenseInfo }: DispenseBannerProps) {
    if (!dispenseInfo) return null;

    return (
        <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">Dispense Import</h4>
                                <Badge variant="secondary" className="text-xs">
                                    {dispenseInfo.prescriptionNumber}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {dispenseInfo.refillNumber === 0
                                    ? 'Original Fill'
                                    : `Refill ${dispenseInfo.refillNumber}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        <span>Clinical data locked</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
