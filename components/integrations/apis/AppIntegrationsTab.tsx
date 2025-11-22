"use client";

import { useState, useEffect } from "react";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

const AppCardSkeleton = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
        <div className="flex items-start justify-between mb-3">
            <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-100 rounded w-48"></div>
            </div>
            <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="flex items-center gap-4 mb-4">
            <div className="h-3 bg-gray-100 rounded w-16"></div>
            <div className="h-3 bg-gray-100 rounded w-16"></div>
        </div>
        <div className="h-9 w-full bg-gray-200 rounded-lg"></div>
    </div>
)

export default function AppIntegrationsTab() {
  const [apps, setApps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setApps([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {isLoading ? (
        <>
            <AppCardSkeleton/>
            <AppCardSkeleton/>
            <AppCardSkeleton/>
            <AppCardSkeleton/>
        </>
      ) : apps.length > 0 ? (
        apps.map((app, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div>
                <h3 className="font-semibold text-gray-900 mb-1">{app.name}</h3>
                <p className="text-sm text-gray-600">{app.desc}</p>
                </div>
                {app.status === "Connected" ? (
                <FiCheckCircle size={20} className="text-green-600 flex-shrink-0" />
                ) : (
                <FiXCircle size={20} className="text-gray-400 flex-shrink-0" />
                )}
            </div>
            <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
                <div>Sync: <span className="font-medium">{app.sync}</span></div>
                <div>Last: <span className="font-medium">{app.lastSync}</span></div>
            </div>
            <button className={`w-full px-4 py-2 rounded-lg text-sm font-medium ${
                app.status === "Connected"
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-teal-600 text-white hover:bg-teal-700"
            }`}>
                {app.status === "Connected" ? "Manage" : "Connect"}
            </button>
            </div>
        ))
      ) : (
        <div className="col-span-2 text-center py-10 text-gray-500">
            No app integrations found.
        </div>
      )}
    </div>
  );
}
