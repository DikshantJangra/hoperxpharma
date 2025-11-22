interface KPICardProps {
    icon: React.ReactNode
    title: string
    value: string
    microtext: string
    ctaLabel: string
    variant?: 'default' | 'critical'
    updated?: string
    onAction: () => void
    loading?: boolean
}

export default function KPICard({ icon, title, value, microtext, ctaLabel, variant = 'default', updated, onAction, loading = false }: KPICardProps) {
    return (
        <div className={`p-4 rounded-xl border transition-all duration-200 ${variant === 'critical' ? 'bg-red-50 border-red-100 hover:border-red-200' : 'bg-white border-[#e6eef2] hover:border-[#0ea5a3]/30'}`} style={{ boxShadow: '0 4px 12px rgba(3,15,31,0.03)' }}>
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${variant === 'critical' ? 'bg-red-100 text-red-600' : 'bg-[#0ea5a3]/10 text-[#0ea5a3]'}`}>
                    {icon}
                </div>
                {updated && !loading && <span className="text-[10px] font-medium text-[#6b7280] bg-gray-100 px-1.5 py-0.5 rounded">Updated {updated}</span>}
            </div>
            <div>
                <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1">{title}</h3>
                {loading ? (
                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                ) : (
                    <div className={`text-2xl font-bold mb-1 ${variant === 'critical' ? 'text-red-700' : 'text-[#0f172a]'}`}>{value}</div>
                )}
                <div className="flex items-center justify-between">
                    {loading ? (
                        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse"></div>
                    ) : (
                        <p className="text-[11px] text-[#6b7280] font-medium">{microtext}</p>
                    )}
                    <button onClick={onAction} className={`text-[11px] font-bold hover:underline ${variant === 'critical' ? 'text-red-600' : 'text-[#0ea5a3]'}`}>
                        {ctaLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
