import { Alert } from "./types"
import { FiPackage, FiShield, FiFileText, FiServer } from "react-icons/fi"

interface AlertCardProps {
    alert: Alert
    onClick: () => void
}

export default function AlertCard({ alert, onClick }: AlertCardProps) {
    const severityStyles = {
        critical: "bg-red-50 border-l-red-500 border-l-4",
        warning: "bg-amber-50 border-l-amber-500 border-l-4",
        info: "bg-white border-l-blue-500 border-l-4"
    }

    const icons = {
        inventory: <FiPackage size={18} />,
        compliance: <FiShield size={18} />,
        workflow: <FiFileText size={18} />,
        system: <FiServer size={18} />
    }

    const iconColors = {
        critical: "text-red-600",
        warning: "text-amber-600",
        info: "text-blue-600"
    }

    const statusBadges = {
        new: <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">NEW</span>,
        snoozed: <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">Snoozed 30 min left</span>,
        resolved: <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">✓ Resolved</span>
    }

    return (
        <div
            onClick={onClick}
            className={`${severityStyles[alert.severity]} rounded-xl border border-gray-200 p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group relative`}
        >
            <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${iconColors[alert.severity]} bg-white/50`}>
                    {icons[alert.type]}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 leading-tight">{alert.title}</h3>
                        <div className="shrink-0">
                            {statusBadges[alert.status]}
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{alert.description}</p>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Created {alert.createdAt}</span>
                        <span className="text-gray-300">•</span>
                        <span>By {alert.source}</span>
                        <span className="text-gray-300">•</span>
                        <span>Priority: {alert.priority}</span>
                    </div>
                </div>
            </div>

            {/* Hover Actions - Absolutely positioned */}
            <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                {alert.severity === "critical" && (
                    <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        {alert.type === "inventory" ? "Create PO" : "Resolve"}
                    </button>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Snooze 1 hr
                </button>
            </div>
        </div>
    )
}
