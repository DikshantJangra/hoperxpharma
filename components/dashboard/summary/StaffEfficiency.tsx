"use client"
import { useState, useEffect } from "react"

interface StaffMember {
    name: string
    avatar: string
    prescriptions: number
    avgTime: string
    accuracy: number
    trend: number[]
}

const StaffRowSkeleton = () => (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg animate-pulse">
        <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div>
                <div className="h-5 bg-gray-200 rounded-md w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded-md w-24"></div>
            </div>
        </div>
        <div className="flex items-center gap-8">
            <div className="text-center">
                <div className="h-3 bg-gray-200 rounded-md w-12 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-10"></div>
            </div>
            <div className="text-center">
                <div className="h-3 bg-gray-200 rounded-md w-12 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-10"></div>
            </div>
            <div className="w-24 h-10 bg-gray-200 rounded-md"></div>
        </div>
    </div>
)

export default function StaffEfficiency() {
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [summary, setSummary] = useState<any>(null)

    useEffect(() => {
        setIsLoading(true)
        const timer = setTimeout(() => {
            setStaff([])
            setSummary(null)
            setIsLoading(false)
        }, 1500)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-base font-semibold text-gray-800">Team Performance</h3>
                    {isLoading ? (
                         <div className="h-4 bg-gray-200 rounded-md w-64 mt-1 animate-pulse"></div>
                    ) : (
                        <p className="text-sm text-gray-600 mt-1">
                           {summary ? `Overall avg fill time: ${summary.avgTime} · Accuracy ${summary.accuracy}%` : "No performance summary available."}
                        </p>
                    )}
                </div>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors" disabled={isLoading}>
                    View Detailed Analytics
                </button>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <>
                        <StaffRowSkeleton />
                        <StaffRowSkeleton />
                        <StaffRowSkeleton />
                    </>
                ) : staff.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <p>No team performance data available.</p>
                    </div>
                ) : (
                    staff.map((member, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {member.avatar}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{member.name}</h4>
                                    <p className="text-xs text-gray-600">Filled {member.prescriptions} prescriptions</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-center">
                                    <p className="text-xs text-gray-600 mb-1">Avg Time</p>
                                    <p className="text-sm font-bold text-gray-900">{member.avgTime}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-600 mb-1">Accuracy</p>
                                    <p className="text-sm font-bold text-emerald-600">{member.accuracy}%</p>
                                </div>
                                <div className="w-24 h-10">
                                    <svg className="w-full h-full" viewBox="0 0 100 40">
                                        <polyline
                                            points={member.trend.map((val, i) => `${(i / (member.trend.length - 1)) * 100},${40 - (val / 100) * 40}`).join(' ')}
                                            fill="none"
                                            stroke="#0ea5a3"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
