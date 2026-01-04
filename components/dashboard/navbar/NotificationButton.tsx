"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { FiBell, FiAlertTriangle, FiPackage, FiClock, FiShield, FiInfo } from "react-icons/fi"
import { alertsApi, Alert } from "@/lib/api/alerts"
import { formatDistanceToNow } from "date-fns"

interface NotificationButtonProps {
    show: boolean
    setShow: (show: boolean) => void
}

export default function NotificationButton({ show, setShow }: NotificationButtonProps) {
    const notifRef = useRef<HTMLDivElement>(null)
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)

    // Fetch alerts
    const fetchAlerts = async () => {
        try {
            // Rate limit protection
            const lastError = localStorage.getItem('alerts_last_error');
            if (lastError) {
                const { time } = JSON.parse(lastError);
                if (Date.now() - time < 10000) { // 10s backoff
                    setLoading(false); // Ensure loading state is cleared even if we skip fetch
                    return;
                }
            }

            const data = await alertsApi.getAlerts({ limit: 10 });
            // API returns array directly based on previous code and error
            if (Array.isArray(data)) {
                setAlerts(data);
                const unread = data.filter((a: any) => a.status === 'NEW').length;
                setUnreadCount(unread);
            }
        } catch (error: any) {
            console.error("Failed to fetch alerts:", error);
            if (error.status === 429) {
                localStorage.setItem('alerts_last_error', JSON.stringify({ time: Date.now() }));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts()
        // Poll for new alerts every 30 seconds
        const interval = setInterval(fetchAlerts, 30000)
        return () => clearInterval(interval)
    }, [])

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShow(false)
            }
        }

        if (show) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [show, setShow])

    // Mark single alert as read
    const markAsRead = async (alertId: string) => {
        try {
            await alertsApi.acknowledgeAlert(alertId)
            // Refresh alerts
            fetchAlerts()
        } catch (error) {
            console.error("Failed to mark alert as read:", error)
        }
    }

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            // Acknowledge all NEW alerts
            const newAlerts = alerts.filter(a => a.status === 'NEW')
            await Promise.all(newAlerts.map(a => alertsApi.acknowledgeAlert(a.id)))
            // Refresh alerts
            fetchAlerts()
        } catch (error) {
            console.error("Failed to mark all as read:", error)
        }
    }

    const getIconForType = (type: string) => {
        const icons: Record<string, any> = {
            'inventory': FiPackage,
            'compliance': FiShield,
            'workflow': FiClock,
            'system': FiAlertTriangle
        }
        const IconComponent = icons[type] || FiInfo
        return IconComponent
    }

    const getSeverityColor = (severity: string) => {
        const colors: Record<string, string> = {
            'CRITICAL': 'bg-red-500',
            'HIGH': 'bg-orange-500',
            'MEDIUM': 'bg-yellow-500',
            'LOW': 'bg-blue-500',
            'INFO': 'bg-gray-400'
        }
        return colors[severity] || 'bg-gray-400'
    }

    return (
        <div className="relative" ref={notifRef}>
            <button
                onClick={() => setShow(!show)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
                <FiBell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-semibold border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            {show && (
                <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-16 sm:top-12 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 max-h-[70vh] sm:max-h-[500px] flex flex-col">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="px-4 py-8 text-center text-sm text-gray-500">
                                Loading notifications...
                            </div>
                        ) : alerts.length > 0 ? (
                            alerts.map((alert) => {
                                const IconComponent = getIconForType(alert.type)
                                const isUnread = alert.status === 'NEW'

                                return (
                                    <button
                                        key={alert.id}
                                        onClick={() => {
                                            if (isUnread) {
                                                markAsRead(alert.id)
                                            }
                                        }}
                                        className={`w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left ${isUnread ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getSeverityColor(alert.severity)}/10`}>
                                                <IconComponent className={`${getSeverityColor(alert.severity).replace('bg-', 'text-')}`} size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">{alert.title}</p>
                                                    {isUnread && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5"></div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{alert.description}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })
                        ) : (
                            <div className="px-4 py-8 text-center text-sm text-gray-500">
                                No notifications
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-100 mt-2 pt-2 px-4">
                        <Link
                            href="/dashboard/alerts"
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium block"
                            onClick={() => setShow(false)}
                        >
                            View all notifications →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
