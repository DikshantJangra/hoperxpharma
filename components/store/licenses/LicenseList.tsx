'use client';

import { useState, useEffect } from 'react';
import LicenseCard from './LicenseCard';

const LicenseCardSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 animate-pulse">
        <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/3"></div>
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-full"></div>
            <div className="h-3 bg-gray-100 rounded w-3/4"></div>
        </div>
    </div>
)

export default function LicenseList({ filter, searchQuery, onSelectLicense, isLoading: parentLoading }: any) {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setLicenses([]);
        setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [filter, searchQuery]);
  
  const filtered = licenses.filter(lic => {
    const matchesFilter = filter === 'all' || lic.status === filter || (filter === 'expiring' && lic.daysToExpiry < 60);
    const matchesSearch = lic.number.toLowerCase().includes(searchQuery.toLowerCase()) || lic.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const isLoadingCombined = isLoading || parentLoading;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-2 gap-4">
        {isLoadingCombined ? (
            <>
                <LicenseCardSkeleton/>
                <LicenseCardSkeleton/>
                <LicenseCardSkeleton/>
                <LicenseCardSkeleton/>
            </>
        ) : filtered.length > 0 ? (
            filtered.map(license => (
                <LicenseCard key={license.id} license={license} onClick={() => onSelectLicense(license)} />
            ))
        ) : (
            <div className="col-span-2 text-center py-10 text-gray-500">
                No licenses found.
            </div>
        )}
      </div>
    </div>
  );
}
