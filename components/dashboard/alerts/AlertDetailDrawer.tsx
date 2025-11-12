import { Alert } from "./types"
import { FiX } from "react-icons/fi"
import { useEffect } from "react"

interface AlertDetailDrawerProps {
    alert: Alert
    onClose: () => void
}

export default function AlertDetailDrawer({ alert, onClose }: AlertDetailDrawerProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", handleEsc)
        return () => window.removeEventListener("keydown", handleEsc)
    }, [onClose])

    const severityColors = {
        critical: "bg-red-100 text-red-700 border-red-200",
        warning: "bg-amber-100 text-amber-700 border-amber-200",
        info: "bg-blue-100 text-blue-700 border-blue-200"
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
            <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded border ${severityColors[alert.severity]}`}>
                                {alert.severity.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">{alert.createdAt}</span>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">{alert.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                        <p className="text-sm text-gray-600">{alert.description}</p>
                    </div>

                    {alert.medicine && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Medicine</h3>
                            <p className="text-sm text-gray-900 font-medium">{alert.medicine}</p>
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Suggested Actions</h3>
                        <div className="space-y-2">
                            <button className="w-full px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                                {alert.type === "inventory" ? "Create Purchase Order" : "Mark as Resolved"}
                            </button>
                            <button className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                                Snooze for 1 hour
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Activity Log</h3>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900">Alert created</p>
                                    <p className="text-xs text-gray-500">{alert.createdAt} • {alert.source}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Comments</h3>
                        <textarea
                            placeholder="Add a note or @mention someone..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
                    <button className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                        Resolve (R)
                    </button>
                    <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        Snooze (S)
                    </button>
                    <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        Escalate
                    </button>
                </div>
            </div>
        </>
    )
}
