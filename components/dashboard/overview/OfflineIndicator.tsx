"use client"
import { useEffect, useState } from "react"
import { FiWifiOff, FiRefreshCw } from "react-icons/fi"

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        setIsOnline(navigator.onLine)

        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    if (isOnline) return null

    return (
        <div className="fixed top-20 right-6 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-sm">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                    <FiWifiOff className="text-red-600" size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-900 mb-1">You're offline</h3>
                    <p className="text-xs text-red-700 mb-3">Showing last cached data. Changes won't sync until you're back online.</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                        <FiRefreshCw size={14} />
                        Retry connection
                    </button>
                </div>
            </div>
        </div>
    )
}
