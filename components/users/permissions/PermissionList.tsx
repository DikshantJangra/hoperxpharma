'use client';

import { useState, useEffect } from 'react';
import { FiLock, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
import { rbacApi, Permission } from '@/lib/api/rbac';

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
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPermissions = async () => {
            setIsLoading(true);
            try {
                const response = await rbacApi.getPermissions();
                if (response.success) {
                    // Flatten the grouped permissions into a single array
                    const allPermissions = Object.values(response.data).flat() as Permission[];
                    setPermissions(allPermissions);
                }
            } catch (error) {
                console.error("Failed to fetch permissions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPermissions();
    }, []);

    const filtered = permissions.filter(p =>
        (selectedCategory === 'all' || p.category === selectedCategory) &&
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    const isLoadingCombined = isLoading || parentLoading;

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4">
                {isLoadingCombined ? (
                    <>
                        <PermissionCardSkeleton />
                        <PermissionCardSkeleton />
                        <PermissionCardSkeleton />
                        <PermissionCardSkeleton />
                    </>
                ) : filtered.length > 0 ? (
                    filtered.map(permission => (
                        <div
                            key={permission.id}
                            onClick={() => onSelectPermission(permission)}
                            className="bg-white rounded-lg border border-[#e2e8f0] p-4 hover:border-[#0ea5a3] transition-colors cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <FiLock className="w-4 h-4 text-[#64748b]" />
                                    <h3 className="font-mono text-sm font-semibold text-[#0f172a]">{permission.code}</h3>
                                </div>
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#dbeafe] text-[#1e40af] capitalize">
                                    {permission.category}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-2">{permission.name}</p>
                            <p className="text-sm text-[#64748b] mb-3">{permission.description || "No description"}</p>
                            {permission.resource && (
                                <div className="text-xs text-[#94a3b8]">
                                    <span>Resource: <span className="font-semibold text-[#0f172a]">{permission.resource}</span></span>
                                </div>
                            )}
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
