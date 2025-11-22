"use client"
import { FiZap, FiTrendingUp, FiAlertTriangle, FiClock } from "react-icons/fi"

export default function AIInsights() {
    const loading = true; // Default to loading state

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
                    ) : (
                        <div className="text-center py-8 text-white/80 text-sm">
                            No insights available
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
