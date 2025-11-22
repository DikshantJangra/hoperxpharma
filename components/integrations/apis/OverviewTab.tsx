"use client";
import { useState, useEffect } from "react";
import { FiCheckCircle, FiSettings } from "react-icons/fi";

const StatCardSkeleton = () => (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
        <div className="h-7 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-100 rounded w-1/2 mt-1"></div>
    </div>
)

const AppCardSkeleton = () => (
    <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="flex items-center justify-between mb-3">
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            <div className="h-5 bg-gray-100 rounded w-1/4"></div>
        </div>
        <div className="h-3 bg-gray-100 rounded w-2/3 mb-3"></div>
        <div className="h-9 w-full bg-gray-100 rounded"></div>
    </div>
)

export default function OverviewTab() {
  const [apiHealth, setApiHealth] = useState<any>(null);
  const [connectedApps, setConnectedApps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setApiHealth(null);
        setConnectedApps([]);
        setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-6xl space-y-6">
      {/* What APIs Can Do */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What can APIs do?</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            "Connect with accounting software (Zoho, Tally, QuickBooks)",
            "Sync customers & invoices automatically",
            "Automate daily/weekly reports",
            "Connect to custom pharmacy websites",
            "Enable app-to-app integration (WhatsApp bots, mobile apps)",
            "Integrate inventory scanners and POS machines",
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <FiCheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* API Health */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Health</h3>
        <div className="grid grid-cols-4 gap-4">
            {isLoading ? (
                <>
                    <StatCardSkeleton/>
                    <StatCardSkeleton/>
                    <StatCardSkeleton/>
                    <StatCardSkeleton/>
                </>
            ) : apiHealth ? (
                <>
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                        <div className="text-sm text-green-700 mb-1">Uptime</div>
                        <div className="text-2xl font-bold text-green-900">{apiHealth.uptime}%</div>
                        <div className="text-xs text-green-600 mt-1">Last 30 days</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="text-sm text-blue-700 mb-1">Usage Today</div>
                        <div className="text-2xl font-bold text-blue-900">{apiHealth.usageToday}</div>
                        <div className="text-xs text-blue-600 mt-1">API requests</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                        <div className="text-sm text-purple-700 mb-1">Rate Limit</div>
                        <div className="text-2xl font-bold text-purple-900">{apiHealth.rateLimitStatus}</div>
                        <div className="text-xs text-purple-600 mt-1">{apiHealth.rateLimit}/min available</div>
                    </div>
                    <div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
                        <div className="text-sm text-teal-700 mb-1">Webhooks</div>
                        <div className="text-2xl font-bold text-teal-900">{apiHealth.webhooksSuccess}%</div>
                        <div className="text-xs text-teal-600 mt-1">Delivery success</div>
                    </div>
                </>
            ) : (
                <div className="col-span-4 text-center py-4 text-gray-500 text-sm">No API health data available.</div>
            )}
        </div>
      </div>

      {/* Connected Apps */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Apps</h3>
        <div className="grid grid-cols-3 gap-4">
            {isLoading ? (
                <>
                    <AppCardSkeleton/>
                    <AppCardSkeleton/>
                    <AppCardSkeleton/>
                </>
            ) : connectedApps.length > 0 ? (
                connectedApps.map((app, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{app.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                        app.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}>
                        {app.status}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-3">Last sync: {app.lastSync}</div>
                    <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
                        <FiSettings size={14} />
                        Manage
                    </button>
                    </div>
                ))
            ) : (
                <div className="col-span-3 text-center py-4 text-gray-500 text-sm">No connected apps found.</div>
            )}
        </div>
      </div>
    </div>
  );
}
