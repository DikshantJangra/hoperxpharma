"use client";

import { useState } from "react";
import { FiRefreshCw, FiBell } from "react-icons/fi";
import { alertsApi } from "@/lib/api/alerts";

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastFetch, setLastFetch] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchAlerts = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("🔄 Fetching alerts from API...");
            const data = await alertsApi.getAlerts({ limit: 50 });
            console.log("✅ Received alerts:", data);
            setAlerts(data);
            setLastFetch(new Date());
        } catch (err: any) {
            console.error("❌ Error fetching alerts:", err);
            setError(err.message || "Failed to fetch alerts");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <FiBell size={24} className="text-emerald-600" />
                        <h1 className="text-2xl font-bold text-gray-900">
                            Alerts & Notifications
                        </h1>
                    </div>

                    <button
                        onClick={fetchAlerts}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiRefreshCw
                            size={18}
                            className={loading ? "animate-spin" : ""}
                        />
                        {loading ? "Loading..." : "Refresh Alerts"}
                    </button>
                </div>

                {lastFetch && (
                    <p className="text-sm text-gray-500 mb-4">
                        Last updated: {lastFetch.toLocaleTimeString()}
                    </p>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-red-800 font-medium">Error</p>
                        <p className="text-red-600 text-sm mt-1">{error}</p>
                    </div>
                )}

                {alerts.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <FiBell size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No alerts yet</p>
                        <p className="text-gray-400 text-sm mt-2">
                            Click "Refresh Alerts" to check for new notifications
                        </p>
                    </div>
                )}

                {alerts.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">
                            {alerts.length} alert{alerts.length !== 1 ? "s" : ""} found
                        </p>

                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-semibold ${alert.priority === "CRITICAL"
                                                        ? "bg-red-100 text-red-800"
                                                        : alert.priority === "HIGH"
                                                            ? "bg-orange-100 text-orange-800"
                                                            : alert.priority === "MEDIUM"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-blue-100 text-blue-800"
                                                    }`}
                                            >
                                                {alert.priority}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {alert.category}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {alert.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            {alert.description}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>Status: {alert.status}</span>
                                            <span>
                                                Created:{" "}
                                                {new Date(alert.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                        🔍 Debug Info
                    </p>
                    <p className="text-xs text-blue-700">
                        Open browser DevTools (F12) → Network tab to see API requests
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                        Check console for detailed logs
                    </p>
                </div>
            </div>
        </div>
    );
}
