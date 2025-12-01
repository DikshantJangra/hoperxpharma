"use client";
import { useState, useEffect } from "react";
import { FiX, FiCheck, FiKey } from "react-icons/fi";
import { userApi, UserProfile } from "@/lib/api/user";
import { rbacApi, Role } from "@/lib/api/rbac";

interface EditUserDrawerProps {
    user: UserProfile;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditUserDrawer({ user, onClose, onSuccess }: EditUserDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [loadingStores, setLoadingStores] = useState(true);
    const [error, setError] = useState("");
    const [resetPin, setResetPin] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        roleId: "",
        pin: "",
        isActive: true,
        storeIds: [] as string[],
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch roles
                const rolesResponse = await rbacApi.getRoleSummary();
                if (rolesResponse.success) {
                    setRoles(rolesResponse.data);
                }
                setLoadingRoles(false);

                // Fetch stores
                const store = await userApi.getPrimaryStore();
                if (store) {
                    setStores([store]);
                }
                setLoadingStores(false);
            } catch (err) {
                console.error("Failed to fetch data:", err);
                setLoadingRoles(false);
                setLoadingStores(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber || "",
                roleId: "", // Will be set from user roles if available
                pin: "",
                isActive: user.isActive,
                storeIds: user.storeUsers?.map((su: any) => su.storeId) || [],
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers and limit to 10 digits
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setFormData((prev) => ({ ...prev, phoneNumber: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields (lastName is optional)
        if (!formData.firstName) {
            setError("First name is required");
            return;
        }

        // Validate phone number if provided
        if (formData.phoneNumber && formData.phoneNumber.length !== 10) {
            setError("Phone number must be exactly 10 digits");
            return;
        }

        // Validate store selection
        if (!formData.storeIds || formData.storeIds.length === 0) {
            setError("User must be assigned to at least one store");
            return;
        }

        // Validate PIN if resetting
        if (resetPin && (!formData.pin || formData.pin.length !== 4)) {
            setError("PIN must be exactly 4 digits");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const updateData: any = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phoneNumber,
                isActive: formData.isActive,
                storeIds: formData.storeIds,
            };

            if (formData.roleId) {
                updateData.roleId = formData.roleId;
            }

            if (resetPin && formData.pin) {
                updateData.pin = formData.pin;
            }

            const response = await userApi.updateUser(user.id, updateData);

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

    const handleDelete = async () => {
        try {
            setDeleting(true);
            setError("");

            await userApi.deleteUser(user.id);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Failed to delete user:", err);
            setError(err.message || "Failed to delete user");
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-end z-50 transition-opacity">
            <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 relative">
                {/* Delete Confirmation Overlay */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="w-full max-w-sm text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiX className="text-red-600 text-2xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete User?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Are you sure you want to delete <strong>{user.firstName} {user.lastName}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    disabled={deleting}
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                                    Last Name <span className="text-gray-400 text-xs">(Optional)</span>
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
                                Phone Number <span className="text-gray-400 text-xs">(10 digits)</span>
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handlePhoneChange}
                                maxLength={10}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                placeholder="9876543210"
                            />
                            {formData.phoneNumber && formData.phoneNumber.length < 10 && (
                                <p className="text-xs text-gray-500 mt-1">{formData.phoneNumber.length}/10 digits</p>
                            )}
                        </div>

                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>

                        {/* Store Assignment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assigned Store <span className="text-red-500">*</span>
                            </label>
                            {loadingStores ? (
                                <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
                            ) : (
                                <select
                                    value={formData.storeIds[0] || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, storeIds: [e.target.value] }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
                                >
                                    <option value="" disabled>Select a store</option>
                                    {stores.map((store) => (
                                        <option key={store.id} value={store.id}>
                                            {store.displayName || store.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <p className="text-xs text-gray-500 mt-1">User will have access to this store</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role
                            </label>
                            {loadingRoles ? (
                                <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
                            ) : (
                                <select
                                    name="roleId"
                                    value={formData.roleId}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
                                >
                                    <option value="">Keep current role</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name} ({role._count?.userRoles || 0} users)
                                        </option>
                                    ))}
                                </select>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Leave empty to keep current role</p>
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Active Account
                                </label>
                                <p className="text-xs text-gray-500">Disable to prevent user login</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? 'bg-teal-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* PIN Reset Section */}
                        <div className="border-t border-gray-200 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Reset POS PIN
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setResetPin(!resetPin);
                                        if (resetPin) {
                                            setFormData(prev => ({ ...prev, pin: "" }));
                                        }
                                    }}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${resetPin ? 'bg-teal-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${resetPin ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                                Enable to set a new 4-digit PIN for point-of-sale authorization
                            </p>
                            {resetPin && (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        name="pin"
                                        value={formData.pin}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                            setFormData(prev => ({ ...prev, pin: value }));
                                        }}
                                        maxLength={4}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-center text-lg tracking-widest"
                                        placeholder="••••"
                                    />
                                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                        <FiKey size={12} />
                                        <span>This will replace the user's existing PIN</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Danger Zone */}
                        <div className="border-t border-gray-200 pt-6">
                            <h4 className="text-sm font-medium text-red-600 mb-3">Danger Zone</h4>
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full flex items-center justify-center px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                            >
                                Delete User
                            </button>
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
