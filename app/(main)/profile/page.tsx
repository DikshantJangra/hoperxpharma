"use client";

import { useState, useEffect } from "react";
import { FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiCalendar, FiEdit2, FiSave, FiCamera, FiX } from "react-icons/fi";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { useAuthStore } from "@/lib/store/auth-store";
import { userApi, getUserInitials, getStoreGSTIN } from "@/lib/api/user";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const router = useRouter();
    const { user, primaryStore, isAuthenticated, isLoading, refreshUserData } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editedData, setEditedData] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: ""
    });

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Initialize edited data when user loads
    useEffect(() => {
        if (user) {
            setEditedData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phoneNumber: user.phoneNumber || ""
            });
        }
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await userApi.updateUserProfile(editedData);
            await refreshUserData();
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            setEditedData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phoneNumber: user.phoneNumber || ""
            });
        }
        setIsEditing(false);
    };

    if (!isAuthenticated) return null;

    const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "User";
    const initials = user ? getUserInitials(user) : "?";
    const joinDate = user ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : "-";
    const gstin = primaryStore ? getStoreGSTIN(primaryStore) : "-";

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">My Profile</h1>
                    <p className="text-sm text-[#64748b]">Manage your personal information and preferences</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Profile Card */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden mb-6">
                    {/* Cover */}
                    <div className="h-32 bg-gradient-to-r from-[#0ea5a3] to-[#0d9391]"></div>

                    {/* Profile Info */}
                    <div className="px-8 pb-8">
                        <div className="flex items-end justify-between -mt-16 mb-6">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-[#0ea5a3]">
                                    {isLoading ? "..." : initials}
                                </div>
                                <button className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg border border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors">
                                    <FiCamera className="w-4 h-4 text-[#64748b]" />
                                </button>
                            </div>

                            <div className="flex gap-2">
                                {isEditing && (
                                    <button
                                        onClick={handleCancel}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                                    >
                                        <FiX className="w-4 h-4" />
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Saving...
                                        </>
                                    ) : isEditing ? (
                                        <>
                                            <FiSave className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    ) : (
                                        <>
                                            <FiEdit2 className="w-4 h-4" />
                                            Edit Profile
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Name & Role */}
                            <div>
                                {isEditing ? (
                                    <div className="grid grid-cols-2 gap-4 mb-2">
                                        <div>
                                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">First Name</label>
                                            <input
                                                type="text"
                                                value={editedData.firstName}
                                                onChange={(e) => setEditedData({ ...editedData, firstName: e.target.value })}
                                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                value={editedData.lastName}
                                                onChange={(e) => setEditedData({ ...editedData, lastName: e.target.value })}
                                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <h2 className="text-2xl font-bold text-[#0f172a] mb-1">{isLoading ? "Loading..." : fullName}</h2>
                                )}
                                <p className="text-[#64748b]">{user?.role || "-"}</p>
                            </div>

                            {/* Contact Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
                                        <FiMail className="w-4 h-4" />
                                        Email
                                    </label>
                                    <p className="text-[#475569]">{user?.email || "-"}</p>
                                    <p className="text-xs text-[#94a3b8] mt-1">Email cannot be changed</p>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
                                        <FiPhone className="w-4 h-4" />
                                        Phone
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            value={editedData.phoneNumber}
                                            onChange={(e) => setEditedData({ ...editedData, phoneNumber: e.target.value })}
                                            className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                        />
                                    ) : (
                                        <p className="text-[#475569]">{user?.phoneNumber || "-"}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
                                        <FiCalendar className="w-4 h-4" />
                                        Joined
                                    </label>
                                    <p className="text-[#475569]">{joinDate}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
                                        <FiUser className="w-4 h-4" />
                                        User ID
                                    </label>
                                    <p className="text-[#475569] font-mono text-sm">{user?.id.substring(0, 12)}...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Primary Store Information */}
                {primaryStore && (
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-bold text-[#0f172a] mb-4 flex items-center gap-2">
                            <HiOutlineShoppingBag className="w-5 h-5 text-[#0ea5a3]" />
                            Primary Pharmacy
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Store Name</label>
                                <p className="text-[#475569]">{primaryStore.displayName || primaryStore.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Phone</label>
                                <p className="text-[#475569]">{primaryStore.phoneNumber}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Email</label>
                                <p className="text-[#475569]">{primaryStore.email}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 block">GSTIN</label>
                                <p className="text-[#475569] font-mono">{gstin}</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 flex items-center gap-2">
                                    <FiMapPin className="w-4 h-4" />
                                    Address
                                </label>
                                <p className="text-[#475569]">
                                    {primaryStore.addressLine1}
                                    {primaryStore.addressLine2 && `, ${primaryStore.addressLine2}`}
                                    <br />
                                    {primaryStore.city}, {primaryStore.state} - {primaryStore.pinCode}
                                </p>
                            </div>
                            <div className="md:col-span-2 flex gap-4">
                                {primaryStore.is24x7 && (
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                                        ✓ 24x7 Service
                                    </span>
                                )}
                                {primaryStore.homeDelivery && (
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                        ✓ Home Delivery
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Activity Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-white border border-[#e2e8f0] rounded-xl">
                        <div className="text-3xl font-bold text-[#0ea5a3] mb-1">0</div>
                        <div className="text-sm text-[#64748b]">Prescriptions Verified</div>
                    </div>
                    <div className="p-6 bg-white border border-[#e2e8f0] rounded-xl">
                        <div className="text-3xl font-bold text-[#0ea5a3] mb-1">0%</div>
                        <div className="text-sm text-[#64748b]">Accuracy Rate</div>
                    </div>
                    <div className="p-6 bg-white border border-[#e2e8f0] rounded-xl">
                        <div className="text-3xl font-bold text-[#0ea5a3] mb-1">
                            {user ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                        </div>
                        <div className="text-sm text-[#64748b]">Days Since Joining</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
