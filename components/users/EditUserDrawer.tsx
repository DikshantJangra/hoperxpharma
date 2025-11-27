"use client";
import { useState, useEffect } from "react";
import { FiX, FiCheck } from "react-icons/fi";
import { userApi, UserProfile } from "@/lib/api/user";
import { rbacApi, Role } from "@/lib/api/rbac";

interface EditUserDrawerProps {
    user: UserProfile;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditUserDrawer({ user, onClose, onSuccess }: EditUserDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        role: "",
    });

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await rbacApi.getRoles();
                if (response.success) {
                    setRoles(response.data);
                }
            } catch (err) {
                console.error("Failed to fetch roles:", err);
            } finally {
                setLoadingRoles(false);
            }
        };
        fetchRoles();
    }, []);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber || "",
                role: user.role,
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName || !formData.lastName) {
            setError("Please fill in all required fields");
            return;
        }

        if (!formData.role) {
            setError("Please select a role");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await userApi.updateUser(user.id, formData);

            if (response.success) {
                onSuccess();
                onClose();
            } else {
                setError("Failed to update user");
            }
        } catch (err: any) {
            console.error("Failed to update user:", err);
            setError(err.message || "Failed to update user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-end z-50 transition-opacity">
            <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Edit User</h3>
                        <p className="text-sm text-gray-500 mt-1">Update user details</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role <span className="text-red-500">*</span>
                            </label>
                            {loadingRoles ? (
                                <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
                            ) : (
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
                                >
                                    <option value="" disabled>Select a role</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.name}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </form>

                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2">
                            <div className="text-red-500 mt-0.5">
                                <FiX size={16} />
                            </div>
                            <div className="text-sm text-red-800">{error}</div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-user-form"
                        disabled={loading || loadingRoles}
                        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm"
                    >
                        {loading ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <FiCheck size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
