import { FiChevronRight } from "react-icons/fi"

interface InsightProps {
    type: 'critical' | 'forecast' | 'warning'
    title: string
    description: string
    confidence?: number
    primaryAction: string
    secondaryAction?: string
}

export default function AIInsights() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full flex flex-col">
            <h3 className="text-base font-semibold text-gray-800 mb-4">AI Inventory Insights</h3>
            <div className="space-y-3 flex-1">
                <InsightCard 
                    type="critical"
                    title="CRITICAL: Atorvastatin 10mg — 4 left"
                    description="Stock critically low. Reorder recommended immediately."
                    primaryAction="Create PO"
                    secondaryAction="View Stock"
                />
                <InsightCard 
                    type="forecast"
                    title="AI FORECAST: High demand for Amoxicillin"
                    description="Predicted 40% increase based on seasonal trends."
                    confidence={72}
                    primaryAction="Review"
                    secondaryAction="Snooze"
                />
                <InsightCard 
                    type="warning"
                    title="NEAR EXPIRY: 2 items in < 7 days"
                    description="Metformin 500mg, Paracetamol 650mg"
                    primaryAction="View Items"
                    secondaryAction="Dismiss"
                />
            </div>
        </div>
    )
}

function InsightCard({ type, title, description, confidence, primaryAction, secondaryAction }: InsightProps) {
    const styles = {
        critical: { 
            bg: 'bg-[#fff6f6]', 
            border: 'border-l-4 border-l-[#ef4444] border-[#ef4444]/20', 
            text: 'text-[#ef4444]', 
            btnPrimary: 'bg-[#ef4444] text-white hover:bg-[#ef4444]/90',
            btnSecondary: 'text-[#ef4444] hover:text-[#ef4444]/80'
        },
        forecast: { 
            bg: 'bg-blue-50', 
            border: 'border-l-4 border-l-blue-500 border-blue-200', 
            text: 'text-blue-700', 
            btnPrimary: 'bg-blue-600 text-white hover:bg-blue-700',
            btnSecondary: 'text-blue-600 hover:text-blue-700'
        },
        warning: { 
            bg: 'bg-amber-50', 
            border: 'border-l-4 border-l-amber-500 border-amber-200', 
            text: 'text-amber-700', 
            btnPrimary: 'bg-amber-600 text-white hover:bg-amber-700',
            btnSecondary: 'text-amber-600 hover:text-amber-700'
        }
    }
    const style = styles[type]

    return (
        <div className={`p-4 rounded-lg border ${style.border} ${style.bg}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
                <p className={`text-xs font-bold ${style.text} uppercase tracking-wide`}>{title}</p>
                {confidence && (
                    <span className="text-xs bg-white px-2 py-0.5 rounded-full font-semibold text-[#6b7280] border border-gray-200">
                        {confidence}% confidence
                    </span>
                )}
            </div>
            <p className="text-xs text-[#0f172a] mb-4 leading-relaxed">{description}</p>
            <div className="flex items-center gap-2">
                <button className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${style.btnPrimary}`}>
                    {primaryAction}
                </button>
                {secondaryAction && (
                    <button className={`text-xs font-semibold ${style.btnSecondary} transition-colors`}>
                        {secondaryAction}
                    </button>
                )}
            </div>
        </div>
    )
}
