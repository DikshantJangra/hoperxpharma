
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AiOutlineExclamationCircle } from 'react-icons/ai';

interface RiskItem {
    type: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    deduction: number;
}

interface GSTRiskListProps {
    risks: RiskItem[];
    onResolve?: (id: string) => void;
}

export function GSTRiskList({ risks, onResolve }: GSTRiskListProps) {
    if (!risks || risks.length === 0) return null;

    return (
        <Card className="border-l-4 border-l-red-500">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <AiOutlineExclamationCircle className="text-red-500" />
                    Compliance Risks Detected
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {risks.map((risk, idx) => (
                        <div key={idx} className="flex justify-between items-start p-3 bg-red-50/50 rounded-md">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant={risk.severity === 'HIGH' ? 'destructive' : 'secondary'} className="text-[10px]">
                                        {risk.severity}
                                    </Badge>
                                    <span className="font-medium text-sm text-red-900">{risk.type.replace('_', ' ')}</span>
                                </div>
                                <p className="text-sm text-red-700">{risk.message}</p>
                            </div>
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                                -{risk.deduction} pts
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
