"use client"
import { useState, useEffect } from "react"
import { FiZap, FiTrendingUp, FiAlertTriangle, FiClock, FiPackage, FiShield } from "react-icons/fi"
import { dashboardApi, Insight } from "@/lib/api/dashboard"

export default function AIInsights() {
    const [loading, setLoading] = useState(true)
    const [insights, setInsights] = useState<Insight[]>([])

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                setLoading(true)
                const data = await dashboardApi.getInsights()
                setInsights(data)
            } catch (error) {
                console.error("Failed to fetch insights:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchInsights()
        // Refresh insights every 60 seconds
        const interval = setInterval(fetchInsights, 60000)
        return () => clearInterval(interval)
    }, [])

    const getIconComponent = (iconName: string) => {
        const icons: Record<string, any> = {
            'package': FiPackage,
            'shield': FiShield,
            'clock': FiClock,
            'alert-triangle': FiAlertTriangle,
            'trending-up': FiTrendingUp
        }
        const IconComponent = icons[iconName] || FiAlertTriangle
        return <IconComponent className="text-yellow-300" size={16} />
    }

    const getSeverityColor = (severity: string) => {
        const colors: Record<string, string> = {
            'CRITICAL': 'bg-red-500/20 border-red-400/30',
            'HIGH': 'bg-orange-500/20 border-orange-400/30',
            'MEDIUM': 'bg-yellow-500/20 border-yellow-400/30',
            'LOW': 'bg-blue-500/20 border-blue-400/30',
            'INFO': 'bg-white/10 border-white/10'
        }
        return colors[severity] || 'bg-white/10 border-white/10'
    }

    return (
        <div className="bg-gradient-to-br from-[#0ea5a3] to-[#0b8d8b] rounded-xl p-6 text-white h-full relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-8 -mb-8 blur-xl"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <FiZap className="text-yellow-300" size={20} />
                    </div>
                    <h3 className="font-bold text-lg">AI Insights</h3>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <>
                            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10 animate-pulse">
                                <div className="h-4 w-3/4 bg-white/20 rounded mb-2"></div>
                                <div className="h-3 w-1/2 bg-white/10 rounded"></div>
                            </div>
                            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10 animate-pulse">
                                <div className="h-4 w-2/3 bg-white/20 rounded mb-2"></div>
                                <div className="h-3 w-1/2 bg-white/10 rounded"></div>
                            </div>
                            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10 animate-pulse">
                                <div className="h-4 w-3/4 bg-white/20 rounded mb-2"></div>
                                <div className="h-3 w-1/2 bg-white/10 rounded"></div>
                            </div>
                        </>
                    ) : insights.length > 0 ? (
                        insights.map((insight) => (
                            <div
                                key={insight.id}
                                className={`p-3 rounded-lg backdrop-blur-sm border ${getSeverityColor(insight.severity)} transition-all hover:scale-[1.02]`}
                            >
                                <div className="flex items-start gap-2">
                                    <div className="mt-0.5">
                                        {getIconComponent(insight.icon)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{insight.title}</p>
                                        <p className="text-xs text-white/80 mt-1">{insight.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-white/80 text-sm">
                            No critical insights at the moment
                        </div>
                    )}
                </div>

                <button className="w-full mt-6 py-2.5 bg-white text-[#0ea5a3] font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm shadow-lg shadow-black/5">
                    View All Insights
                </button>
            </div>
        </div>
    )
}
