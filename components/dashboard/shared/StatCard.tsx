import { RiArrowRightUpLine } from "react-icons/ri"

interface StatCardProps {
    icon: React.ReactNode
    title: string
    value: string
    trend: string
    color: string
}

export default function StatCard({ icon, title, value, trend, color }: StatCardProps) {
    const colors = {
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500' },
        red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500' }
    }
    const style = colors[color as keyof typeof colors];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                <div className={`mt-2 text-xs font-medium flex items-center gap-1 ${style.text}`}>
                    {color !== 'red' && <RiArrowRightUpLine />}
                    <span>{trend}</span>
                </div>
            </div>
            <div className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center ${style.icon}`}>
                {icon}
            </div>
        </div>
    )
}
