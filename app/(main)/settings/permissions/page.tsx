'use client';

import React, { useEffect, useState } from 'react';
import { rbacApi, Permission } from '@/lib/api/rbac';
import { FaShieldAlt, FaSearch } from 'react-icons/fa';

export default function PermissionsPage() {
    const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                setLoading(true);
                const response = await rbacApi.getPermissions();
                if (response.success) {
                    setPermissions(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch permissions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, []);

    const filteredPermissions = Object.entries(permissions).reduce((acc, [category, perms]) => {
        const filtered = perms.filter(
            (p) =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) {
            acc[category] = filtered;
        }
        return acc;
    }, {} as Record<string, Permission[]>);

    if (loading) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="text-center">Loading permissions...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <FaShieldAlt className="text-emerald-600" />
                    Permissions Reference
                </h1>
                <p className="text-gray-600 mt-2">
                    Complete list of all system permissions organized by category
                </p>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search permissions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
            </div>

            <div className="space-y-6">
                {Object.entries(filteredPermissions).map(([category, perms]) => (
                    <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
                            <h2 className="text-xl font-semibold text-emerald-900 capitalize">
                                {category} ({perms.length})
                            </h2>
                        </div>
                        <div className="divide-y">
                            {perms.map((perm) => (
                                <div key={perm.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium text-gray-900">{perm.name}</h3>
                                            <code className="text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded mt-1 inline-block">
                                                {perm.code}
                                            </code>
                                            {perm.description && (
                                                <p className="text-gray-600 mt-2">{perm.description}</p>
                                            )}
                                            {perm.resource && (
                                                <div className="mt-2">
                                                    <span className="text-xs text-gray-500">Resource: </span>
                                                    <span className="text-xs font-medium text-gray-700">{perm.resource}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {Object.keys(filteredPermissions).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No permissions found matching "{searchTerm}"
                </div>
            )}
        </div>
    );
}
