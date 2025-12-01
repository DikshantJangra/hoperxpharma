"use client";
import { useState, useEffect } from "react";
import { FiX, FiCheck, FiUser } from "react-icons/fi";
import { userApi } from "@/lib/api/user";
import { rbacApi, Role } from "@/lib/api/rbac";

interface CreateUserDrawerProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateUserDrawer({ onClose, onSuccess }: CreateUserDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [loadingStores, setLoadingStores] = useState(true);
    const [error, setError] = useState("");
    const [enablePin, setEnablePin] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        roleId: "", // Use roleId instead of role name
        pin: "", // Optional PIN
        storeIds: [] as string[], // Selected store IDs
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch roles
                const rolesResponse = await rbacApi.getRoleSummary();
                if (rolesResponse.success) {
                    setRoles(rolesResponse.data);
                    // Set default role if available
                    if (rolesResponse.data.length > 0) {
                        setFormData(prev => ({ ...prev, roleId: rolesResponse.data[0].id }));
                    }
                }
                setLoadingRoles(false);

                // Fetch stores (admin's stores)
                const store = await userApi.getPrimaryStore();
                if (store) {
                    // For now, we'll use the primary store
                    // In a multi-store setup, you'd fetch all stores the admin has access to
                    setStores([store]);
                    // Auto-select the primary store
                    setFormData(prev => ({ ...prev, storeIds: [store.id] }));
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
        if (!formData.firstName || !formData.email) {
            setError("Please fill in all required fields (First Name and Email)");
            return;
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            setError("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character");
            return;
        }

        // Validate phone number if provided
        if (formData.phoneNumber && formData.phoneNumber.length !== 10) {
            setError("Phone number must be exactly 10 digits");
            return;
        }

        if (!formData.roleId) {
            setError("Please select a role");
            return;
        }

        // Validate store selection
        if (!formData.storeIds || formData.storeIds.length === 0) {
            setError("Please select at least one store");
            return;
        }

        // Validate PIN if enabled
        if (enablePin && (!formData.pin || formData.pin.length !== 4)) {
            setError("PIN must be exactly 4 digits");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await userApi.createUser(formData);

            if (response.success) {
                onSuccess();
                onClose();
            } else {
                setError("Failed to create user");
            }
        } catch (err: any) {
            console.error("Failed to create user:", err);
            if (err.message === "Failed to fetch" || err.name === "TypeError") {
                setError("Network error: Unable to connect to the server. Please ensure the backend is running.");
            } else {
                setError(err.message || "Failed to create user");
            }
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
                        <h3 className="text-lg font-bold text-gray-900">Create New User</h3>
                        <p className="text-sm text-gray-500 mt-1">Add a new user to the system</p>
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
                    <form id="create-user-form" onSubmit={handleSubmit} className="space-y-4">
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
                                    placeholder="John"
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
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                placeholder="john@example.com"
                            />
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


                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Initial Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                placeholder="Enter initial password"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Must be 8+ chars with uppercase, lowercase, number & special char
                            </p>
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role <span className="text-red-500">*</span>
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
                                    <option value="" disabled>Select a role</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name} ({role._count?.userRoles || 0} users)
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Store Assignment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assign to Store <span className="text-red-500">*</span>
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

                        {/* PIN Section */}
                        <div className="border-t border-gray-200 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    POS PIN
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEnablePin(!enablePin);
                                        if (enablePin) {
                                            setFormData(prev => ({ ...prev, pin: "" }));
                                        }
                                    }}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enablePin ? 'bg-teal-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enablePin ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                                Enable 4-digit PIN for quick authorization at point-of-sale
                            </p>
                            {enablePin && (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            name="pin"
                                            value={formData.pin}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                setFormData(prev => ({ ...prev, pin: value }));
                                            }}
                                            maxLength={4}
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-center text-lg tracking-widest"
                                            placeholder="••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
                                                setFormData(prev => ({ ...prev, pin: randomPin }));
                                            }}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                                        >
                                            Auto-generate
                                        </button>
                                    </div>
                                    {formData.pin && formData.pin.length === 4 && (
                                        <p className="text-xs text-green-600">✓ PIN set: {formData.pin}</p>
                                    )}
                                </div>
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
                        form="create-user-form"
                        disabled={loading || loadingRoles}
                        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm"
                    >
                        {loading ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <FiCheck size={18} />
                                Create User
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
