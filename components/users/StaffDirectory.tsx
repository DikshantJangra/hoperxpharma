"use client";
import { useState, useEffect } from "react";
import { FiSearch, FiEdit2, FiPower, FiClock, FiDownload, FiMail, FiPhone, FiAlertTriangle, FiUsers } from "react-icons/fi";
import { userApi, UserProfile } from "@/lib/api/user";
import { rbacApi, Role } from "@/lib/api/rbac";
import EditUserDrawer from "./EditUserDrawer";

export default function StaffDirectory() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");
            const [usersRes, rolesRes] = await Promise.all([
                userApi.getAll(),
                rbacApi.getRoleSummary(),
            ]);

            if (usersRes.success) {
                setUsers(usersRes.data);
            }
            if (rolesRes.success) {
                setRoles(rolesRes.data);
            }
        } catch (error: any) {
            console.error("Failed to fetch data:", error);
            setError("Failed to load staff data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (user: UserProfile) => {
        try {
            const response = await userApi.toggleUserStatus(user.id);
            if (response.success) {
                fetchData();
            }
        } catch (error) {
            console.error("Failed to toggle status:", error);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" ? user.isActive : !user.isActive);

        return matchesSearch && matchesRole && matchesStatus;
    });

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <FiAlertTriangle className="text-red-500" size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Error Loading Data</h3>
                <p className="text-gray-500 max-w-md mb-6">{error}</p>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] bg-white text-sm"
                >
                    <option value="all">All Roles</option>
                    {roles.map(role => (
                        <option key={role.id} value={role.name}>{role.name}</option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] bg-white text-sm"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <button className="px-4 py-2.5 border border-[#cbd5e1] rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2">
                    <FiDownload size={16} />
                    Export
                </button>
            </div>

            {/* User List */}
            {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {[1, 2, 3, 4, 5].map(i => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                                            <div className="space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                                                <div className="h-3 bg-gray-200 rounded w-40"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : filteredUsers.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm border border-teal-100">
                                                {user.firstName[0]}{user.lastName[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {user.firstName} {user.lastName}
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                                    <FiMail size={12} />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <FiPhone size={12} />
                                            {user.phoneNumber || "No phone"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <FiClock size={14} />
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Never'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                title="Edit user"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(user)}
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                title={user.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                <FiPower size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiUsers className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Staff Found</h3>
                    <p className="text-gray-500">
                        {searchQuery ? `No users match "${searchQuery}"` : "Get started by adding a new staff member."}
                    </p>
                </div>
            )}

            {editingUser && (
                <EditUserDrawer
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={() => {
                        setEditingUser(null);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}
