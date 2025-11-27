import React, { useEffect, useState } from 'react';
import { rbacApi, Role } from '@/lib/api/rbac';
import { usePermissions } from '@/hooks/usePermissions';
import { FaEdit, FaTrash, FaPlus, FaShieldAlt } from 'react-icons/fa';
import { PermissionGate } from './PermissionGate';

interface RoleListProps {
    onEdit: (role: Role) => void;
    onCreate: () => void;
}

export const RoleList: React.FC<RoleListProps> = ({ onEdit, onCreate }) => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const { can } = usePermissions();

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await rbacApi.getRoles();
            if (response.success) {
                setRoles(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleDelete = async (roleId: string) => {
        if (!confirm('Are you sure you want to delete this role?')) return;

        try {
            await rbacApi.deleteRole(roleId);
            fetchRoles();
        } catch (error) {
            console.error('Failed to delete role:', error);
            alert('Failed to delete role');
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Loading roles...</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FaShieldAlt className="text-emerald-600" />
                    Roles & Permissions
                </h2>
                <PermissionGate permission="system.role.manage">
                    <button
                        onClick={onCreate}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors"
                    >
                        <FaPlus /> Create Role
                    </button>
                </PermissionGate>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                        <tr>
                            <th className="p-4">Role Name</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Users</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {roles.map((role) => (
                            <tr key={role.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-900">{role.name}</td>
                                <td className="p-4 text-gray-500">{role.description}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 uppercase">
                                        {role.category || 'General'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {role.builtIn ? (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                            Built-in
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                            Custom
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-gray-500">
                                    {role._count?.userRoles || 0}
                                </td>
                                <td className="p-4 text-right">
                                    <PermissionGate permission="system.role.manage">
                                        <div className="flex justify-end gap-2">
                                            {!role.builtIn && (
                                                <button
                                                    onClick={() => onEdit(role)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Edit Role"
                                                >
                                                    <FaEdit />
                                                </button>
                                            )}
                                            {!role.builtIn && (
                                                <button
                                                    onClick={() => handleDelete(role.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                    title="Delete Role"
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                            {role.builtIn && (
                                                <button
                                                    onClick={() => onEdit(role)}
                                                    className="p-2 text-gray-400 hover:bg-gray-50 rounded"
                                                    title="View Role"
                                                >
                                                    <FaEdit />
                                                </button>
                                            )}
                                        </div>
                                    </PermissionGate>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
