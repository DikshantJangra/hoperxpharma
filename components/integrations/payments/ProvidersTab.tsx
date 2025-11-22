"use client";
import { useState, useEffect } from "react";
import { FiCheckCircle, FiXCircle, FiSettings, FiTrendingUp } from "react-icons/fi";

const ProviderCardSkeleton = () => (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-5 animate-pulse">
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                    <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-4 bg-gray-100 rounded w-16"></div>
                </div>
            </div>
            <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-100 rounded"></div>
            <div className="h-4 bg-gray-100 rounded"></div>
            <div className="h-4 bg-gray-100 rounded"></div>
        </div>
        <div className="h-9 w-full bg-gray-200 rounded-lg"></div>
    </div>
);

export default function ProvidersTab() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setProviders([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {isLoading ? (
        <>
            <ProviderCardSkeleton/>
            <ProviderCardSkeleton/>
            <ProviderCardSkeleton/>
            <ProviderCardSkeleton/>
            <ProviderCardSkeleton/>
            <ProviderCardSkeleton/>
        </>
      ) : providers.length > 0 ? (
        providers.map((provider) => (
            <div
            key={provider.id}
            className={`bg-white border-2 rounded-lg p-5 hover:shadow-lg transition-all cursor-pointer ${
                provider.connected ? "border-green-200" : "border-gray-200"
            }`}
            onClick={() => setSelectedProvider(provider.id)}
            >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                <span className="text-3xl">{provider.logo}</span>
                <div>
                    <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                    <span className="text-xs text-gray-500">{provider.settlement}</span>
                </div>
                </div>
                {provider.connected ? (
                <FiCheckCircle size={20} className="text-green-600" />
                ) : (
                <FiXCircle size={20} className="text-gray-400" />
                )}
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fees</span>
                <span className="font-medium text-gray-900">{provider.fees}</span>
                </div>
                <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uptime</span>
                <span className="font-medium text-green-600">{provider.uptime}%</span>
                </div>
                <div className="flex justify-between text-sm">
                <span className="text-gray-600">Limit</span>
                <span className="font-medium text-gray-900">{provider.limit}</span>
                </div>
            </div>

            {provider.connected ? (
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                <FiSettings size={16} />
                Manage
                </button>
            ) : (
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">
                <FiTrendingUp size={16} />
                Connect
                </button>
            )}
            </div>
        ))
      ) : (
        <div className="col-span-full text-center py-10 text-gray-500">
            No payment providers available.
        </div>
      )}
    </div>
  );
}
