import React, { useEffect, useState } from 'react';
import { rbacApi, Role, Permission } from '@/lib/api/rbac';
import { FaSave, FaTimes, FaCheck } from 'react-icons/fa';

interface RoleEditorProps {
    role?: Role; // If provided, we are editing. If null, creating.
    onSave: () => void;
    onCancel: () => void;
}

export const RoleEditor: React.FC<RoleEditorProps> = ({ role, onSave, onCancel }) => {
    const [name, setName] = useState(role?.name || '');
    const [description, setDescription] = useState(role?.description || '');
    const [category, setCategory] = useState(role?.category || 'administrative');
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
    const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchPermissions = async () => {
            setLoading(true);
            try {
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

        if (role) {
            const rolePerms = new Set(role.permissions.map(rp => rp.permission.code));
            setSelectedPermissions(rolePerms);
        }
    }, [role]);

    const handleTogglePermission = (code: string) => {
        if (role?.builtIn) return; // Cannot edit built-in roles permissions directly here (usually)

        const newSelected = new Set(selectedPermissions);
        if (newSelected.has(code)) {
            newSelected.delete(code);
        } else {
            newSelected.add(code);
        }
        setSelectedPermissions(newSelected);
    };

    const handleToggleCategory = (categoryName: string, categoryPermissions: Permission[]) => {
        if (role?.builtIn) return;

        const allSelected = categoryPermissions.every(p => selectedPermissions.has(p.code));
        const newSelected = new Set(selectedPermissions);

        if (allSelected) {
            // Deselect all
            categoryPermissions.forEach(p => newSelected.delete(p.code));
        } else {
            // Select all
            categoryPermissions.forEach(p => newSelected.add(p.code));
        }
        setSelectedPermissions(newSelected);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (role) {
                // Update existing role
                if (!role.builtIn) {
                    await rbacApi.updateRole(role.id, { name, description, category });

                    // Update permissions - simplified: remove all and add new (backend handles upsert usually, but here we might need a diff or just bulk set if API supports it)
                    // The API `addPermissionsToRole` adds, `removePermissionFromRole` removes.
                    // A better API would be `setRolePermissions`.
                    // Given current API, we might need to calculate diff or just use what we have.
                    // Let's assume we can't easily bulk replace via the current API client methods I wrote.
                    // Wait, I didn't write a `setPermissions` endpoint. I wrote `add` and `remove`.
                    // This is inefficient for editing.
                    // For now, I'll just update the basic info. 
                    // To properly update permissions, I should have added a `syncPermissions` endpoint.
                    // Let's assume for this MVP we just update details for now, or I'll implement a loop.

                    // Actually, let's look at the `createRole` - it takes `permissionIds`.
                    // For update, I should probably implement a bulk update on backend or loop here.
                    // Looping is bad.
                    // I'll stick to creating new roles with permissions for now, and maybe just basic info update for edit.
                    // OR, I can use the `addPermissionsToRole` which takes a list.
                    // But I need to remove the ones not in the list.

                    // Let's just update the basic info for now to avoid complexity, 
                    // unless I modify the backend to support bulk replace.
                    // I'll add a TODO comment.

                    // For the sake of the demo, let's try to update permissions by finding added/removed.
                    const currentPerms = new Set(role.permissions.map(rp => rp.permission.id));
                    // I need permission IDs, but I stored codes in state.
                    // I need to map codes back to IDs.
                    const codeToId: Record<string, string> = {};
                    Object.values(permissions).flat().forEach(p => codeToId[p.code] = p.id);

                    const selectedIds = Array.from(selectedPermissions).map(code => codeToId[code]).filter(Boolean);
                    const selectedIdSet = new Set(selectedIds);

                    const toAdd = selectedIds.filter(id => !currentPerms.has(id));
                    const toRemove = Array.from(currentPerms).filter(id => !selectedIdSet.has(id));

                    if (toAdd.length > 0) {
                        await rbacApi.addPermissionsToRole(role.id, toAdd);
                    }

                    // Remove one by one (inefficient but works with current API)
                    for (const id of toRemove) {
                        await rbacApi.removePermissionFromRole(role.id, id);
                    }
                }
            } else {
                // Create new role
                // Need to map codes to IDs
                const codeToId: Record<string, string> = {};
                Object.values(permissions).flat().forEach(p => codeToId[p.code] = p.id);

                const permissionIds = Array.from(selectedPermissions).map(code => codeToId[code]).filter(Boolean);

                await rbacApi.createRole({
                    name,
                    description,
                    category,
                    permissionIds,
                });
            }
            onSave();
        } catch (error) {
            console.error('Failed to save role:', error);
            alert('Failed to save role');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading permissions...</div>;

    const isReadOnly = role?.builtIn;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                    {role ? (isReadOnly ? 'View Role' : 'Edit Role') : 'Create New Role'}
                </h2>
                <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                    <FaTimes />
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isReadOnly}
                            className="w-full p-2 border rounded focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={isReadOnly}
                            className="w-full p-2 border rounded focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                        >
                            <option value="clinical">Clinical</option>
                            <option value="administrative">Administrative</option>
                            <option value="system">System</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isReadOnly}
                            className="w-full p-2 border rounded focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4">Permissions</h3>
                    <div className="space-y-6">
                        {Object.entries(permissions).map(([cat, perms]) => (
                            <div key={cat} className="border rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-semibold capitalize text-emerald-800">{cat}</h4>
                                    {!isReadOnly && (
                                        <button
                                            type="button"
                                            onClick={() => handleToggleCategory(cat, perms)}
                                            className="text-xs text-emerald-600 hover:text-emerald-800"
                                        >
                                            Toggle All
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {perms.map((perm) => (
                                        <label
                                            key={perm.id}
                                            className={`flex items-start p-2 rounded border cursor-pointer transition-colors ${selectedPermissions.has(perm.code)
                                                    ? 'bg-emerald-50 border-emerald-200'
                                                    : 'hover:bg-gray-50 border-gray-200'
                                                } ${isReadOnly ? 'cursor-default' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPermissions.has(perm.code)}
                                                onChange={() => handleTogglePermission(perm.code)}
                                                disabled={isReadOnly}
                                                className="mt-1 mr-3 text-emerald-600 focus:ring-emerald-500 rounded"
                                            />
                                            <div>
                                                <div className="font-medium text-sm">{perm.name}</div>
                                                <div className="text-xs text-gray-500">{perm.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    {!isReadOnly && (
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <FaSave /> {saving ? 'Saving...' : 'Save Role'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};
