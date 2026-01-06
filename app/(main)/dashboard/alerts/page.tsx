"use client"
import { useState } from "react"
import { FiAlertTriangle, FiPackage, FiClock, FiShield, FiInfo, FiCheck, FiX, FiFilter } from "react-icons/fi"
import { useAlerts } from "@/contexts/AlertContext"
import { formatDistanceToNow } from "date-fns"

export default function AlertsPage() {
    const {
        alerts,
        isLoading,
        unreadCount,
        markAsSeen,
        markAllAsSeen,
        dismissAlert
    } = useAlerts()

    // Local filter state
    const [filter, setFilter] = useState<'all' | 'unread'>('all')
    const [severityFilter, setSeverityFilter] = useState<string>('all')

    const getIconForType = (type: string) => {
        const icons: Record<string, any> = {
            'inventory': FiPackage,
            'INVENTORY': FiPackage,
            'compliance': FiShield,
            'SECURITY': FiShield,
            'workflow': FiClock,
            'system': FiAlertTriangle,
            'SYSTEM': FiAlertTriangle
        }
        return icons[type] || FiInfo
    }

    const getSeverityColor = (severity: string) => {
        const colors: Record<string, { bg: string, text: string, border: string }> = {
            'CRITICAL': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
            'HIGH': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
            'MEDIUM': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
            'LOW': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
            'INFO': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
        }
        return colors[severity] || colors['INFO']
    }

    const filteredAlerts = alerts.filter(alert => {
        if (filter === 'unread' && alert.status !== 'NEW') return false
        if (severityFilter !== 'all' && (alert.severity || alert.priority) !== severityFilter) return false
        return true
    })

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Notifications & Alerts</h1>
                <p className="text-sm text-gray-500 mt-1">Stay updated with important alerts and notifications</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <FiFilter size={16} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Filter:</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                All ({alerts.length})
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'unread'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Unread ({unreadCount})
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="all">All Severities</option>
                                <option value="CRITICAL">Critical</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                                <option value="INFO">Info</option>
                            </select>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsSeen}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-4">Loading alerts...</p>
                    </div>
                ) : filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert) => {
                        const IconComponent = getIconForType(alert.category || alert.type || '')
                        const colors = getSeverityColor(alert.priority || alert.severity || 'INFO')
                        const isUnread = alert.status === 'NEW'

                        return (
                            <div
                                key={alert.id}
                                className={`bg-white rounded-lg border ${colors.border} p-4 transition-all hover:shadow-md ${isUnread ? colors.bg : ''
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.bg}`}>
                                        <IconComponent className={colors.text} size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-semibold text-gray-900">{alert.title}</h3>
                                                    {isUnread && (
                                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className={`text-xs font-medium px-2 py-1 rounded ${colors.bg} ${colors.text}`}>
                                                        {alert.priority || alert.severity}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                                                    </span>
                                                    <span className="text-xs text-gray-400 capitalize">
                                                        {(alert.category || alert.type || '').replace('_', ' ').toLowerCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isUnread && (
                                                    <button
                                                        onClick={() => markAsSeen(alert.id)}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <FiCheck size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => dismissAlert(alert.id)}
                                                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Dismiss"
                                                >
                                                    <FiX size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <FiCheck size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
                        <p className="text-sm text-gray-500">
                            {filter === 'unread' ? 'No unread notifications' : 'No notifications to display'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
