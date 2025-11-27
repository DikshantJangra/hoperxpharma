"use client";
import { useState, useEffect } from "react";
import { FiX, FiSearch, FiUserPlus, FiCheck } from "react-icons/fi";
import { rbacApi } from "@/lib/api/rbac";
import { userApi } from "@/lib/api/user";

interface UserAssignmentModalProps {
    roleId: string;
    roleName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UserAssignmentModal({ roleId, roleName, onClose, onSuccess }: UserAssignmentModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        const searchUsers = async () => {
            if (!searchQuery.trim()) {
                setUsers([]);
                return;
            }

            try {
                setLoading(true);
                // Assuming userApi has a search method or we use getAll and filter
                // For now, let's assume we can fetch all users and filter client-side if no search API
                const response = await userApi.getAll();
                if (response.success) {
                    const filtered = response.data.filter((u: any) =>
                        u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    setUsers(filtered);
                }
            } catch (error) {
                console.error("Failed to search users:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleAssign = async () => {
        if (selectedUsers.size === 0) return;

        try {
            setAssigning(true);
            await rbacApi.bulkAssignRole(roleId, Array.from(selectedUsers));
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to assign users:", error);
            alert("Failed to assign users to role");
        } finally {
            setAssigning(false);
        }
    };

    const toggleUser = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Assign Users</h3>
                        <p className="text-sm text-gray-500">Add users to the <span className="font-medium text-gray-900">{roleName}</span> role</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg bg-gray-50/50">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                            </div>
                        ) : users.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {users.map((user) => (
                                    <label key={user.id} className="flex items-center gap-3 p-3 hover:bg-white transition-colors cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.has(user.id)}
                                            onChange={() => toggleUser(user.id)}
                                            className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : searchQuery ? (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                No users found matching "{searchQuery}"
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                Type to search for users...
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={assigning || selectedUsers.size === 0}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm"
                    >
                        {assigning ? "Assigning..." : (
                            <>
                                <FiUserPlus />
                                Assign {selectedUsers.size > 0 ? `${selectedUsers.size} Users` : "Users"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
