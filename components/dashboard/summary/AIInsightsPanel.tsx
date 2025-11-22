"use client"
import { useState, useEffect } from "react"
import { FiTrendingUp, FiPackage, FiClock, FiMessageSquare, FiCpu } from "react-icons/fi"

interface Insight {
    icon: React.ReactNode
    title: string
    description: string
    confidence: number
    cta: string
    color: string
}

const InsightSkeleton = () => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-gray-200 rounded-lg w-10 h-10"></div>
            <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded-md w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded-md w-full"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-12"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded-lg w-full"></div>
    </div>
)

export default function AIInsightsPanel() {
    const [insights, setInsights] = useState<Insight[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        const timer = setTimeout(() => {
            setInsights([])
            setIsLoading(false)
        }, 1500)
        return () => clearTimeout(timer)
    }, [])


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
                {isLoading ? (
                    <>
                        <InsightSkeleton />
                        <InsightSkeleton />
                    </>
                ) : insights.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <FiCpu className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                        <p>No new insights at the moment.</p>
                    </div>
                ) : (
                    insights.map((insight, idx) => {
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
                    })
                )}
            </div>
        </div>
    )
}
