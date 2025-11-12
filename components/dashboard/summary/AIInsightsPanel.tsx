"use client"
import { FiTrendingUp, FiPackage, FiClock, FiMessageSquare } from "react-icons/fi"

interface Insight {
    icon: React.ReactNode
    title: string
    description: string
    confidence: number
    cta: string
    color: string
}

export default function AIInsightsPanel() {
    const insights: Insight[] = [
        {
            icon: <FiTrendingUp size={18} />,
            title: "Demand Surge Predicted",
            description: "Amoxicillin demand up 42% next week",
            confidence: 88,
            cta: "Review Forecast",
            color: "blue"
        },
        {
            icon: <FiPackage size={18} />,
            title: "Slow-moving Stock",
            description: "5 SKUs unsold for 60+ days",
            confidence: 92,
            cta: "Liquidate",
            color: "amber"
        },
        {
            icon: <FiClock size={18} />,
            title: "Workflow Bottleneck",
            description: "Average fill time +25% on Sundays",
            confidence: 85,
            cta: "Optimize Staffing",
            color: "purple"
        },
        {
            icon: <FiMessageSquare size={18} />,
            title: "Patient Feedback Trend",
            description: "92% positive (↑10%)",
            confidence: 95,
            cta: "View Comments",
            color: "emerald"
        }
    ]

    const colorClasses = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', btn: 'bg-amber-600 hover:bg-amber-700' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', btn: 'bg-purple-600 hover:bg-purple-700' },
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700' }
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 h-full">
            <h3 className="text-base font-semibold text-gray-800 mb-4">AI Insights</h3>
            <div className="space-y-3">
                {insights.map((insight, idx) => {
                    const colors = colorClasses[insight.color as keyof typeof colorClasses]
                    return (
                        <div key={idx} className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
                            <div className="flex items-start gap-3 mb-3">
                                <div className={`p-2 bg-white rounded-lg ${colors.text}`}>
                                    {insight.icon}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-bold ${colors.text} mb-1`}>{insight.title}</h4>
                                    <p className="text-xs text-gray-700">{insight.description}</p>
                                </div>
                                <span className="text-xs bg-white px-2 py-1 rounded-full font-semibold text-gray-600 border border-gray-200">
                                    {insight.confidence}%
                                </span>
                            </div>
                            <button className={`w-full px-3 py-2 ${colors.btn} text-white rounded-lg text-xs font-semibold transition-colors`}>
                                {insight.cta} →
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
