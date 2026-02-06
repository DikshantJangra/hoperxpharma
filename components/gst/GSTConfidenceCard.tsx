
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AiOutlineSafetyCertificate, AiOutlineWarning, AiOutlineCheckCircle } from 'react-icons/ai';

interface GSTConfidenceCardProps {
    score: number;
    status?: string;
    loading?: boolean;
}

export function GSTConfidenceCard({ score, status, loading }: GSTConfidenceCardProps) {
    if (loading) return (
        <Card className="animate-pulse bg-muted/20 h-[140px]">
            <CardContent className="h-full">
                <div />
            </CardContent>
        </Card>
    );

    let color = 'text-green-500';
    let label = status || 'Excellent';
    let Icon = AiOutlineCheckCircle;
    let progressColor = 'bg-primary';

    if (score < 50) {
        color = 'text-red-500';
        label = 'Critical Risk';
        Icon = AiOutlineWarning;
        progressColor = 'bg-red-500';
    } else if (score < 80) {
        color = 'text-yellow-500';
        label = 'Attention Needed';
        Icon = AiOutlineSafetyCertificate;
        progressColor = 'bg-yellow-500';
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">GST Confidence Score</CardTitle>
                <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="flex items-end gap-2 mb-2">
                    <span className={`text-4xl font-bold ${color}`}>{Math.round(score)}</span>
                    <span className="text-sm text-muted-foreground mb-1">/ 100</span>
                </div>
                <div className="space-y-1">
                    <Progress value={score} className={`h-2 ${progressColor}`} />
                    <p className={`text-xs font-medium ${color} pt-1`}>
                        {label}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
