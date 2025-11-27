"use client";
import { useState, useEffect } from "react";
import { FiCheck, FiX, FiAlertTriangle } from "react-icons/fi";
import { rbacApi, Permission, Role } from "@/lib/api/rbac";

export default function GlobalPermissionMatrix() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [rolesResponse, permsResponse] = await Promise.all([
                    rbacApi.getRoles(),
                    rbacApi.getPermissions(),
                ]);

                if (rolesResponse.success) {
                    setRoles(rolesResponse.data);
                }

                if (permsResponse.success) {
                    setPermissions(permsResponse.data);
                }
            } catch (error) {
                console.error("Failed to fetch matrix data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const hasPermission = (role: Role, permissionId: string) => {
        return role.permissions.some((p) => p.permission.id === permissionId);
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto bg-white">
            <div className="min-w-max">
                {/* Header Row */}
                <div className="sticky top-0 z-20 bg-white border-b border-gray-200 flex">
                    <div className="sticky left-0 z-30 w-64 bg-white border-r border-gray-200 p-4 font-bold text-gray-900 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                        Permission / Role
                    </div>
                    {roles.map((role) => (
                        <div key={role.id} className="w-32 p-4 text-center border-r border-gray-100 bg-gray-50/50">
                            <div className="font-semibold text-gray-900 text-sm truncate" title={role.name}>{role.name}</div>
                            <div className={`text-[10px] uppercase tracking-wider font-bold mt-1 ${role.builtIn ? 'text-blue-600' : 'text-green-600'}`}>
                                {role.builtIn ? 'System' : 'Custom'}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Permission Rows */}
                <div className="divide-y divide-gray-100">
                    {Object.entries(permissions).map(([category, categoryPerms]) => (
                        <div key={category}>
                            {/* Category Header */}
                            <div className="sticky left-0 z-10 bg-gray-50 border-b border-gray-100 px-4 py-2 font-bold text-xs text-gray-500 uppercase tracking-wider">
                                {category}
                            </div>

                            {categoryPerms.map((perm) => (
                                <div key={perm.id} className="flex hover:bg-gray-50/50 transition-colors">
                                    <div className="sticky left-0 z-10 w-64 bg-white border-r border-gray-200 p-4 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                                        <div className="text-sm font-medium text-gray-900">{perm.name}</div>
                                        <div className="text-xs text-gray-400 mt-0.5 font-mono">{perm.code}</div>
                                    </div>
                                    {roles.map((role) => {
                                        const enabled = hasPermission(role, perm.id);
                                        return (
                                            <div key={`${role.id}-${perm.id}`} className="w-32 border-r border-gray-100 flex items-center justify-center">
                                                {enabled ? (
                                                    <div className="w-6 h-6 rounded bg-teal-50 text-teal-600 flex items-center justify-center">
                                                        <FiCheck size={14} />
                                                    </div>
                                                ) : (
                                                    <div className="w-6 h-6 rounded bg-gray-50 text-gray-300 flex items-center justify-center">
                                                        <FiX size={14} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
