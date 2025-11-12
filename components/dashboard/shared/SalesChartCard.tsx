interface SalesChartCardProps {
    // No specific props for now, as it's a placeholder
}

export default function SalesChartCard({}: SalesChartCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-gray-800">Sales Analytics</h3>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-md">This Week</button>
                    <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-md">This Month</button>
                </div>
            </div>
            {/* Chart Placeholder */}
            <div className="w-full flex items-end justify-between gap-2 flex-1">
                {[40, 60, 50, 75, 80, 65, 90].map((h, i) => (
                    <div key={i} className="w-full flex flex-col items-center gap-2">
                        <div className="w-full bg-emerald-500 rounded-t-md" style={{ height: `${h}%` }}></div>
                        <span className="text-xs text-gray-500">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
