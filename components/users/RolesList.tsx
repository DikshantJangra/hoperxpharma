"use client";
import { useState, useEffect } from "react";
import { FiShield, FiUsers, FiCopy, FiEdit2, FiTrash2, FiPlus, FiAlertTriangle } from "react-icons/fi";
import { rbacApi, Role } from "@/lib/api/rbac";
import CreateRoleDrawer from "./roles/CreateRoleDrawer";

export default function RolesList() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateDrawer, setShowCreateDrawer] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await rbacApi.getRoles();
            if (response.success) {
                setRoles(response.data);
            }
        } catch (error: any) {
            console.error("Failed to fetch roles:", error);
            setError("Failed to load roles. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCloneRole = async (role: Role) => {
        const newName = prompt(`Enter name for cloned role:`, `${role.name} (Copy)`);
        if (!newName) return;

        try {
            const response = await rbacApi.cloneRole(role.id, newName);
            if (response.success) {
                fetchRoles();
            }
        } catch (error) {
            console.error("Failed to clone role:", error);
            alert("Failed to clone role");
        }
    };

    const handleDeleteRole = async (role: Role) => {
        if (role.builtIn) {
            alert("Cannot delete built-in roles");
            return;
        }

        const userCount = role._count?.userRoles || 0;
        if (userCount > 0) {
            alert(`Cannot delete role. It is assigned to ${userCount} user(s).`);
            return;
        }

        if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) return;

        try {
            const response = await rbacApi.deleteRole(role.id);
            if (response.success) {
                fetchRoles();
            }
        } catch (error) {
            console.error("Failed to delete role:", error);
            alert("Failed to delete role");
        }
    };

    const handleEditRole = (role: Role) => {
        setEditingRole(role);
        setShowCreateDrawer(true);
    };

    const handleDrawerClose = () => {
        setShowCreateDrawer(false);
        setEditingRole(null);
    };

    const handleRoleSaved = () => {
        fetchRoles();
        handleDrawerClose();
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <FiAlertTriangle className="text-red-500" size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Error Loading Roles</h3>
                <p className="text-gray-500 max-w-md mb-6">{error}</p>
                <button
                    onClick={fetchRoles}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Roles & Permissions</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage access control for your team</p>
                </div>
                <button
                    onClick={() => setShowCreateDrawer(true)}
                    className="px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium shadow-sm transition-all flex items-center gap-2"
                >
                    <FiPlus size={18} />
                    Create Role
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                            <div className="h-4 bg-gray-100 rounded w-3/4 mb-4"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map(role => (
                        <div
                            key={role.id}
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${role.builtIn
                                        ? 'bg-purple-100 text-purple-600'
                                        : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        <FiShield size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{role.name}</h3>
                                        {role.builtIn && (
                                            <span className="text-xs text-purple-600 font-medium">Built-in</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                {role.description || "No description"}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                <div className="flex items-center gap-1">
                                    <FiUsers size={14} />
                                    <span>{role._count?.userRoles || 0} users</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <FiShield size={14} />
                                    <span>{role.permissions?.length || 0} permissions</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => handleCloneRole(role)}
                                    className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <FiCopy size={14} />
                                    Clone
                                </button>
                                <button
                                    onClick={() => handleEditRole(role)}
                                    className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <FiEdit2 size={14} />
                                    {role.builtIn ? 'Permissions' : 'Edit'}
                                </button>
                                {!role.builtIn && (
                                    <button
                                        onClick={() => handleDeleteRole(role)}
                                        className="px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        disabled={role._count?.userRoles > 0}
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Role Drawer */}
            {showCreateDrawer && (
                <CreateRoleDrawer
                    onClose={handleDrawerClose}
                    onSuccess={handleRoleSaved}
                    editRole={editingRole}
                />
            )}
        </div>
    );
}
