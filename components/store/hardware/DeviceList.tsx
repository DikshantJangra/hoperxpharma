'use client';

import { useState, useEffect } from 'react';
import DeviceCard from './DeviceCard';

const DeviceCardSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 animate-pulse">
        <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/3"></div>
            </div>
            <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-full"></div>
            <div className="h-3 bg-gray-100 rounded w-3/4"></div>
        </div>
    </div>
);

export default function DeviceList({ filter, searchQuery, onSelectDevice, isLoading: parentLoading }: any) {
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setDevices([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, [filter, searchQuery]);
  
  const filtered = devices.filter(dev => {
    const matchesType = filter.type === 'all' || dev.type === filter.type;
    const matchesStatus = filter.status === 'all' || dev.status === filter.status;
    const matchesSearch = dev.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         dev.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (dev.ip && dev.ip.includes(searchQuery));
    return matchesType && matchesStatus && matchesSearch;
  });

  const isLoadingCombined = isLoading || parentLoading;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-2 gap-4">
        {isLoadingCombined ? (
            <>
                <DeviceCardSkeleton/>
                <DeviceCardSkeleton/>
                <DeviceCardSkeleton/>
                <DeviceCardSkeleton/>
            </>
        ) : filtered.length > 0 ? (
            filtered.map(device => (
                <DeviceCard key={device.id} device={device} onClick={() => onSelectDevice(device)} />
            ))
        ) : (
            <div className="col-span-2 text-center py-10 text-gray-500">
                No devices match the current filters.
            </div>
        )}
      </div>
    </div>
  );
}
