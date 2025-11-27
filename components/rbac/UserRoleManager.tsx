import React, { useEffect, useState } from 'react';
import { rbacApi, UserRole } from '@/lib/api/rbac';
import { FaUserShield, FaPlus, FaTimes } from 'react-icons/fa';

interface UserRoleManagerProps {
    userId: string;
    userName: string;
    onClose?: () => void;
}

export const UserRoleManager: React.FC<UserRoleManagerProps> = ({ userId, userName, onClose }) => {
    const [userRoles, setUserRoles] = useState<UserRole[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUserRoles = async () => {
        try {
            setLoading(true);
            const response = await rbacApi.getUserRoles(userId);
            if (response.success) {
                setUserRoles(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch user roles:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserRoles();
    }, [userId]);

    const handleRemoveRole = async (roleId: string, storeId?: string) => {
        if (!confirm('Remove this role from the user?')) return;

        try {
            await rbacApi.removeRole(userId, roleId, storeId);
            fetchUserRoles();
        } catch (error) {
            console.error('Failed to remove role:', error);
            alert('Failed to remove role');
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Loading user roles...</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FaUserShield className="text-emerald-600" />
                    Roles for {userName}
                </h3>
                {onClose && (
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FaTimes />
                    </button>
                )}
            </div>

            <div className="p-4">
                {userRoles.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No roles assigned</p>
                ) : (
                    <div className="space-y-3">
                        {userRoles.map((ur) => (
                            <div
                                key={ur.id}
                                className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                            >
                                <div>
                                    <div className="font-medium">{ur.role.name}</div>
                                    <div className="text-sm text-gray-500">
                                        {ur.store ? `Store: ${ur.store.name}` : 'Global Role'}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Assigned: {new Date(ur.assignedAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveRole(ur.roleId, ur.storeId || undefined)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    title="Remove Role"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
