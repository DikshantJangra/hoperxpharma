'use client';

import React, { useState } from 'react';
import { RoleList } from '@/components/rbac/RoleList';
import { RoleEditor } from '@/components/rbac/RoleEditor';
import { Role } from '@/lib/api/rbac';
import { PermissionGate } from '@/components/rbac/PermissionGate';

export default function RolesPage() {
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setIsCreating(false);
    };

    const handleCreate = () => {
        setEditingRole(null);
        setIsCreating(true);
    };

    const handleSave = () => {
        setEditingRole(null);
        setIsCreating(false);
        setRefreshKey(prev => prev + 1); // Force refresh
    };

    const handleCancel = () => {
        setEditingRole(null);
        setIsCreating(false);
    };

    return (
        <PermissionGate
            permission="system.role.manage"
            fallback={
                <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
                    <p className="text-gray-600">You don't have permission to manage roles.</p>
                </div>
            }
        >
            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions Management</h1>
                    <p className="text-gray-600 mt-2">
                        Manage system roles and their associated permissions
                    </p>
                </div>

                {(editingRole || isCreating) ? (
                    <RoleEditor
                        role={editingRole || undefined}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                ) : (
                    <RoleList
                        key={refreshKey}
                        onEdit={handleEdit}
                        onCreate={handleCreate}
                    />
                )}
            </div>
        </PermissionGate>
    );
}
