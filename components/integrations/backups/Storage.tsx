'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiCheckCircle, FiAlertCircle, FiCloud, FiHardDrive } from 'react-icons/fi';

const StorageCardSkeleton = () => (
    <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className='space-y-1'>
                    <div className="h-5 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-100 rounded w-24"></div>
                </div>
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-100 rounded"></div>
            <div className="h-4 bg-gray-100 rounded"></div>
        </div>
        <div className="flex gap-2">
            <div className="h-9 w-full bg-gray-200 rounded-lg"></div>
            <div className="h-9 w-full bg-gray-200 rounded-lg"></div>
        </div>
    </div>
)

export default function Storage() {
  const [storageLocations, setStorageLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setStorageLocations([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#0f172a]">Storage Locations</h2>
          <p className="text-sm text-[#64748b]">Configure where backups are stored</p>
        </div>
        <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm font-medium" disabled={isLoading}>
          <FiPlus className="w-4 h-4" />
          Add Storage
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {isLoading ? (
            <>
                <StorageCardSkeleton/>
                <StorageCardSkeleton/>
            </>
        ) : storageLocations.length > 0 ? (
            storageLocations.map(storage => (
                <div key={storage.id} className="bg-white rounded-lg border border-[#e2e8f0] p-6 hover:border-[#0ea5a3] transition-colors">
                    <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <storage.icon className="w-8 h-8 text-[#0ea5a3]" />
                        <div>
                        <h3 className="font-semibold text-[#0f172a]">{storage.name}</h3>
                        <p className="text-sm text-[#64748b]">{storage.provider}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        storage.status === 'connected' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'
                    }`}>
                        {storage.status === 'connected' ? <FiCheckCircle className="inline w-3 h-3 mr-1" /> : <FiAlertCircle className="inline w-3 h-3 mr-1" />}
                        {storage.status}
                    </span>
                    </div>
                    <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-[#64748b]">Encryption:</span>
                        <span className="font-medium text-[#10b981]">{storage.encrypted ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[#64748b]">Usage:</span>
                        <span className="font-medium text-[#0f172a]">{storage.usage}</span>
                    </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                    <button className="flex-1 px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] text-sm font-medium">
                        Test Connection
                    </button>
                    <button className="flex-1 px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] text-sm font-medium">
                        Configure
                    </button>
                    </div>
                </div>
            ))
        ) : (
            <div className="col-span-2 text-center py-10 text-gray-500">
                No storage locations configured.
            </div>
        )}
      </div>
    </div>
  );
}
