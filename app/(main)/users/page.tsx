"use client";
import { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiUser, FiMail, FiPhone, FiMoreVertical, FiAlertTriangle, FiFilter, FiEdit2, FiTrash2, FiPower, FiUsers, FiUserCheck, FiUserPlus } from "react-icons/fi";
import { userApi, UserProfile } from "@/lib/api/user";
import CreateUserDrawer from "@/components/users/CreateUserDrawer";
import EditUserDrawer from "@/components/users/EditUserDrawer";

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showCreateDrawer, setShowCreateDrawer] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await userApi.getAll();
            if (response.success) {
                setUsers(response.data);
            }
        } catch (error: any) {
            console.error("Failed to fetch users:", error);
            if (error.message === "Failed to fetch" || error.name === "TypeError") {
                setError("Network error: Unable to connect to the server.");
            } else {
                setError("Failed to load users. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const handleToggleStatus = async (user: UserProfile) => {
        try {
            const response = await userApi.toggleUserStatus(user.id);
            if (response.success) {
                fetchUsers();
            }
        } catch (error) {
            console.error("Failed to toggle status:", error);
        }
    };

    const handleDeleteUser = async (user: UserProfile) => {
        if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) return;

        try {
            const response = await userApi.deleteUser(user.id);
            if (response.success) {
                fetchUsers();
            }
        } catch (error) {
            console.error("Failed to delete user:", error);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" ? user.isActive : !user.isActive);

        return matchesSearch && matchesRole && matchesStatus;
    });

    // Stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const newUsers = users.filter(u => {
        const created = new Date(u.createdAt);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] px-8 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0f172a]">Users</h1>
                        <p className="text-sm text-[#64748b] mt-1">Manage system users and their access</p>
                    </div>
                    <button
                        onClick={() => setShowCreateDrawer(true)}
                        className="px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium shadow-sm transition-all flex items-center gap-2"
                    >
                        <FiPlus size={20} />
                        Create User
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <FiUsers size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Users</p>
                            <h3 className="text-2xl font-bold text-gray-900">{totalUsers}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                            <FiUserCheck size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Active Users</p>
                            <h3 className="text-2xl font-bold text-gray-900">{activeUsers}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                            <FiUserPlus size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">New This Month</p>
                            <h3 className="text-2xl font-bold text-gray-900">{newUsers}</h3>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative max-w-md">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users by name or email..."
                            className="w-full pl-10 pr-4 py-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] bg-white text-sm"
                        >
                            <option value="all">All Roles</option>
                            <option value="ADMIN">Admin</option>
                            <option value="PHARMACIST">Pharmacist</option>
                            <option value="STAFF">Staff</option>
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
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-8">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <FiAlertTriangle className="text-red-500" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Connection Error</h3>
                        <p className="text-gray-500 max-w-md mb-6">{error}</p>
                        <button
                            onClick={fetchUsers}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Retry Connection
                        </button>
                    </div>
                ) : loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-100 rounded w-full"></div>
                                    <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredUsers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map(user => (
                            <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group relative">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-lg font-bold border border-teal-100">
                                            {user.firstName[0]}{user.lastName[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{user.firstName} {user.lastName}</h3>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize mt-1">
                                                {user.role}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenu(activeMenu === user.id ? null : user.id);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 transition-colors"
                                        >
                                            <FiMoreVertical size={20} />
                                        </button>

                                        {activeMenu === user.id && (
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 animate-in fade-in zoom-in-95 duration-200">
                                                <button
                                                    onClick={() => setEditingUser(user)}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <FiEdit2 size={14} /> Edit Details
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <FiPower size={14} /> {user.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <FiTrash2 size={14} /> Delete User
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <FiMail className="text-gray-400" />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <FiPhone className="text-gray-400" />
                                        <span>{user.phoneNumber || "No phone number"}</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    <span className="text-xs font-medium text-gray-500">
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-auto">
                                        Added {new Date(user.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiUser className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No Users Found</h3>
                        <p className="text-gray-500">
                            {searchQuery ? `No users match "${searchQuery}"` : "Get started by creating a new user."}
                        </p>
                    </div>
                )}
            </div>

            {showCreateDrawer && (
                <CreateUserDrawer
                    onClose={() => setShowCreateDrawer(false)}
                    onSuccess={() => {
                        fetchUsers();
                        // Optional: Show success toast
                    }}
                />
            )}

            {editingUser && (
                <EditUserDrawer
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={() => {
                        fetchUsers();
                        setEditingUser(null);
                    }}
                />
            )}
        </div>
    );
}
