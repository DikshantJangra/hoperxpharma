interface KPICardProps {
    title: string
    value: string
    microtext: string
    ctaLabel: string
    icon: React.ReactNode
    updated?: string
    variant?: 'default' | 'critical'
    onAction: () => void
}

export default function KPICard({ title, value, microtext, ctaLabel, icon, updated, variant = 'default', onAction }: KPICardProps) {
    return (
        <button 
            onClick={onAction}
            className={`w-full flex flex-col p-4 rounded-lg bg-white border transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-3 focus:ring-[#0ea5a3]/20 text-left group ${
                variant === 'critical' 
                    ? 'border-[#ef4444]/30 hover:border-[#ef4444] hover:shadow-[0_6px_18px_rgba(239,68,68,0.15)]' 
                    : 'border-[#e6eef2] hover:border-[#0ea5a3]/30 hover:shadow-[0_6px_18px_rgba(3,15,31,0.06)]'
            }`}
            role="button"
            aria-label={`${title}: ${value}. ${ctaLabel}`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">{title}</span>
                <div className={`p-1.5 rounded-md ${variant === 'critical' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-[#0ea5a3]'}`} aria-hidden="true">
                    {icon}
                </div>
            </div>
            <div className={`text-[34px] font-bold leading-none ${variant === 'critical' ? 'text-[#ef4444]' : 'text-[#0f172a]'}`}>
                {value}
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-[#6b7280]">{microtext}</span>
                {updated && <span className="text-[#6b7280]/60">Updated {updated}</span>}
            </div>
            <div className={`mt-3 text-xs font-semibold ${
                variant === 'critical' ? 'text-[#ef4444]' : 'text-[#0ea5a3]'
            }`}>
                {ctaLabel} →
            </div>
        </button>
    )
}
