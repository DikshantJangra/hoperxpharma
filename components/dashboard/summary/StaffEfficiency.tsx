"use client"

interface StaffMember {
    name: string
    avatar: string
    prescriptions: number
    avgTime: string
    accuracy: number
    trend: number[]
}

export default function StaffEfficiency() {
    const staff: StaffMember[] = [
        { name: "Dr. Priya Sharma", avatar: "PS", prescriptions: 342, avgTime: "2m 45s", accuracy: 99.2, trend: [65, 70, 68, 75, 80, 78, 85] },
        { name: "Rajesh Kumar", avatar: "RK", prescriptions: 298, avgTime: "3m 12s", accuracy: 98.8, trend: [60, 65, 70, 68, 72, 75, 78] },
        { name: "Anita Desai", avatar: "AD", prescriptions: 276, avgTime: "3m 28s", accuracy: 98.1, trend: [55, 58, 62, 65, 68, 70, 72] }
    ]

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-base font-semibold text-gray-800">Team Performance</h3>
                    <p className="text-sm text-gray-600 mt-1">Overall avg fill time: 3m 12s · Accuracy 98.4%</p>
                </div>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    View Detailed Analytics
                </button>
            </div>

            <div className="space-y-4">
                {staff.map((member, idx) => (
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
                ))}
            </div>
        </div>
    )
}
