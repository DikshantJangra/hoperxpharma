'use client';

import { useState, useEffect } from 'react';
import { FiLock, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';

const PermissionCardSkeleton = () => (
    <div className="bg-white rounded-lg border border-[#e2e8f0] p-4 animate-pulse">
        <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-full"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
        </div>
    </div>
);

export default function PermissionList({ searchQuery, selectedCategory, onSelectPermission, isLoading: parentLoading }: any) {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setPermissions([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery])

  const filtered = permissions.filter(p => 
    (selectedCategory === 'all' || p.category === selectedCategory) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isLoadingCombined = isLoading || parentLoading;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-2 gap-4">
        {isLoadingCombined ? (
            <>
                <PermissionCardSkeleton/>
                <PermissionCardSkeleton/>
                <PermissionCardSkeleton/>
                <PermissionCardSkeleton/>
            </>
        ) : filtered.length > 0 ? (
            filtered.map(permission => (
            <div key={permission.id} onClick={() => onSelectPermission(permission)} className="bg-white rounded-lg border border-[#e2e8f0] p-4 hover:border-[#0ea5a3] transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    {permission.type === 'read' && <FiEye className="w-4 h-4 text-[#64748b]" />}
                    {permission.type === 'write' && <FiEdit className="w-4 h-4 text-[#f59e0b]" />}
                    {permission.type === 'delete' && <FiTrash2 className="w-4 h-4 text-[#ef4444]" />}
                    <h3 className="font-mono text-sm font-semibold text-[#0f172a]">{permission.name}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    permission.severity === 'critical' ? 'bg-[#fee2e2] text-[#991b1b]' :
                    permission.severity === 'high' ? 'bg-[#fef3c7] text-[#92400e]' :
                    permission.severity === 'medium' ? 'bg-[#dbeafe] text-[#1e40af]' :
                    'bg-[#f1f5f9] text-[#64748b]'
                }`}>
                    {permission.severity}
                </span>
                </div>
                <p className="text-sm text-[#64748b] mb-3">{permission.description}</p>
                <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
                <span>Roles: <span className="font-semibold text-[#0f172a]">{permission.roles}</span></span>
                <span>Users: <span className="font-semibold text-[#0f172a]">{permission.users}</span></span>
                <span>Changed: {permission.lastChanged}</span>
                </div>
            </div>
            ))
        ) : (
            <div className="col-span-2 text-center py-10 text-gray-500">
                No permissions found.
            </div>
        )}
      </div>
    </div>
  );
}
