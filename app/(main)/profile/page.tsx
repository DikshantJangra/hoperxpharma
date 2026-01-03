"use client";

import { useState, useEffect } from "react";
import { FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiCalendar, FiEdit2, FiSave, FiCamera, FiX, FiAward, FiClock, FiCheckCircle } from "react-icons/fi";
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

    // Avatar upload state
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);


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

    // Store edit state
    const [isEditingStore, setIsEditingStore] = useState(false);
    const [editedStoreData, setEditedStoreData] = useState({
        displayName: "",
        email: "",
        phoneNumber: "",
        gstin: "",
        dlNumber: "",
        pan: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pinCode: ""
    });

    // Helper to render subscription badge based on status
    const renderSubscriptionBadge = () => {
        const subscription = primaryStore?.subscription;
        const isPro = subscription?.status === 'ACTIVE' || subscription?.status === 'PAID';
        // Treat as Trial if status is TRIAL OR if no subscription but business type is set (Legacy/Implicit Trial)
        const isTrial = subscription?.status === 'TRIAL' || (!subscription && primaryStore?.businessType && primaryStore.businessType !== 'Free');

        if (isPro) {
            return (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                    <FiAward className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wide">Pro Member</span>
                </div>
            );
        }

        if (isTrial) {
            return (
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200" title="14 days remaining">
                        <FiClock className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold uppercase tracking-wide">Free Trial</span>
                    </div>
                    <button
                        onClick={() => router.push('/store/profile')}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                    >
                        Upgrade Now &rarr;
                    </button>
                </div>
            );
        }

        // Default: Free Plan / No Plan
        return null;
    };

    // Initialize store data when primaryStore loads
    useEffect(() => {
        if (primaryStore) {
            setEditedStoreData({
                displayName: primaryStore.displayName || "",
                email: primaryStore.email || "",
                phoneNumber: primaryStore.phoneNumber || "",
                gstin: primaryStore.gstin || "",
                dlNumber: primaryStore.dlNumber || "",
                pan: primaryStore.pan || "",
                addressLine1: primaryStore.addressLine1 || "",
                addressLine2: primaryStore.addressLine2 || "",
                city: primaryStore.city || "",
                state: primaryStore.state || "",
                pinCode: primaryStore.pinCode || ""
            });
        }
    }, [primaryStore]);

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

    const handleSaveStore = async () => {
        setIsSaving(true);
        try {
            // Call store update API
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const response = await fetch(`${apiBaseUrl}/stores/${primaryStore?.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify(editedStoreData)
            });

            if (!response.ok) {
                throw new Error('Failed to update store');
            }

            await refreshUserData();
            setIsEditingStore(false);
        } catch (error) {
            console.error('Failed to update store:', error);
            alert('Failed to update store. Please try again.');
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

    const handleCancelStore = () => {
        if (primaryStore) {
            setEditedStoreData({
                displayName: primaryStore.displayName || "",
                email: primaryStore.email || "",
                phoneNumber: primaryStore.phoneNumber || "",
                gstin: primaryStore.gstin || "",
                dlNumber: primaryStore.dlNumber || "",
                pan: primaryStore.pan || "",
                addressLine1: primaryStore.addressLine1 || "",
                addressLine2: primaryStore.addressLine2 || "",
                city: primaryStore.city || "",
                state: primaryStore.state || "",
                pinCode: primaryStore.pinCode || ""
            });
        }
        setIsEditingStore(false);
    };

    // Fetch user's avatar on mount
    useEffect(() => {
        const fetchAvatar = async () => {
            if (!user) return;

            try {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
                console.log('[Avatar] Fetching avatar for user:', user.id);

                const response = await fetch(`${apiBaseUrl}/avatar/me`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });

                console.log('[Avatar] Fetch response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('[Avatar] Fetch response data:', data);

                    if (data.success && data.avatarUrl) {
                        console.log('[Avatar] Setting avatar URL:', data.avatarUrl);
                        setAvatarUrl(data.avatarUrl);
                    } else {
                        console.log('[Avatar] No avatar found for user');
                    }
                } else if (response.status === 404) {
                    console.log('[Avatar] No avatar found (404)');
                } else {
                    console.error('[Avatar] Failed to fetch avatar:', response.status);
                }
            } catch (error) {
                console.error('[Avatar] Failed to fetch avatar:', error);
            }
        };

        fetchAvatar();
    }, [user]);

    // Handle avatar upload
    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        console.log('[Avatar Upload] Starting upload for file:', file.name, file.type, file.size);

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload a valid image file (JPEG, PNG, or WebP)');
            return;
        }

        // Validate file size (5 MB max)
        const maxSize = 5 * 1024 * 1024; // 5 MB
        if (file.size > maxSize) {
            alert('File size must be less than 5 MB');
            return;
        }

        setIsUploadingAvatar(true);

        try {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const token = localStorage.getItem('accessToken');

            console.log('[Avatar Upload] Step 1: Requesting presigned URL...');

            // Step 1: Request presigned URL
            const requestResponse = await fetch(`${apiBaseUrl}/avatar/request-upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!requestResponse.ok) {
                throw new Error('Failed to request upload URL');
            }

            const { data } = await requestResponse.json();
            const { uploadUrl, tempKey } = data;

            console.log('[Avatar Upload] Step 2: Uploading to R2...', tempKey);

            // Step 2: Upload file directly to R2
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });

            if (!uploadResponse.ok) {
                console.error('[Avatar Upload] R2 upload failed:', uploadResponse.status);
                throw new Error('Failed to upload file to storage');
            }

            console.log('[Avatar Upload] Step 3: Processing upload...');

            // Step 3: Complete upload processing
            const completeResponse = await fetch(`${apiBaseUrl}/avatar/complete-upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tempKey })
            });

            if (!completeResponse.ok) {
                const errorData = await completeResponse.json();
                console.error('[Avatar Upload] Processing failed:', errorData);
                throw new Error(errorData.error || 'Failed to process avatar');
            }

            const result = await completeResponse.json();
            console.log('[Avatar Upload] Upload complete! Result:', result);

            if (result.success && result.avatarUrl) {
                console.log('[Avatar Upload] Setting new avatar URL:', result.avatarUrl);
                setAvatarUrl(result.avatarUrl);
                // Optionally refresh user data
                await refreshUserData();
                console.log('[Avatar Upload] Avatar updated successfully!');
            }
        } catch (error) {
            console.error('[Avatar Upload] Upload failed:', error);
            alert(error instanceof Error ? error.message : 'Failed to upload avatar. Please try again.');
        } finally {
            setIsUploadingAvatar(false);
            // Reset file input
            event.target.value = '';
        }
    };

    if (!isAuthenticated) return null;

    const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "User";
    const initials = user ? getUserInitials(user) : "?";
    const joinDate = user ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : "-";
    const gstin = primaryStore ? getStoreGSTIN(primaryStore) : "-";
    const isAdmin = user?.role === "ADMIN";

    const isPro = primaryStore?.businessType && primaryStore.businessType !== 'Free';

    // Helper to render role badge
    const RoleBadge = ({ role }: { role: string }) => {
        const isAdmin = role === 'ADMIN';
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isAdmin ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                {isAdmin ? <FiCheckCircle className="w-3 h-3" /> : <FiUser className="w-3 h-3" />}
                {role}
            </span>
        );
    }

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
                    <div className="h-32 bg-gradient-to-r from-emerald-600 to-emerald-500"></div>

                    {/* Profile Info */}
                    <div className="px-8 pb-8">
                        <div className="flex items-end justify-between -mt-16 mb-6">
                            <div className="relative">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Profile avatar"
                                        className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-emerald-600">
                                        {isLoading ? "..." : initials}
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="avatar-upload"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                    disabled={isUploadingAvatar}
                                />
                                <label
                                    htmlFor="avatar-upload"
                                    className={`absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg border border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors cursor-pointer ${isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isUploadingAvatar ? (
                                        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <FiCamera className="w-4 h-4 text-[#64748b]" />
                                    )}
                                </label>
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
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
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
                                    <>
                                        <div className="grid grid-cols-2 gap-4 mb-2">
                                            <div>
                                                <label className="block text-sm font-semibold text-[#0f172a] mb-2">First Name</label>
                                                <input
                                                    type="text"
                                                    value={editedData.firstName}
                                                    onChange={(e) => setEditedData({ ...editedData, firstName: e.target.value })}
                                                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-[#0f172a] mb-2">Last Name</label>
                                                <input
                                                    type="text"
                                                    value={editedData.lastName}
                                                    onChange={(e) => setEditedData({ ...editedData, lastName: e.target.value })}
                                                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-2xl font-bold text-[#0f172a]">{isLoading ? "Loading..." : fullName}</h2>
                                            {renderSubscriptionBadge()}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-2xl font-bold text-[#0f172a]">{isLoading ? "Loading..." : fullName}</h2>
                                        {renderSubscriptionBadge()}
                                    </div>
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
                                            className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                                <HiOutlineShoppingBag className="w-5 h-5 text-emerald-600" />
                                Primary Pharmacy
                            </h3>
                            {isAdmin && (
                                <div className="flex gap-2">
                                    {isEditingStore && (
                                        <button
                                            onClick={handleCancelStore}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                                        >
                                            <FiX className="w-4 h-4" />
                                            Cancel
                                        </button>
                                    )}
                                    <button
                                        onClick={() => (isEditingStore ? handleSaveStore() : setIsEditingStore(true))}
                                        disabled={isSaving}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Saving...
                                            </>
                                        ) : isEditingStore ? (
                                            <>
                                                <FiSave className="w-4 h-4" />
                                                Save Changes
                                            </>
                                        ) : (
                                            <>
                                                <FiEdit2 className="w-4 h-4" />
                                                Edit Store
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Store Name</label>
                                <div className="flex items-center gap-2">
                                    {isEditingStore ? (
                                        <input
                                            type="text"
                                            value={editedStoreData.displayName}
                                            onChange={(e) => setEditedStoreData({ ...editedStoreData, displayName: e.target.value })}
                                            className="flex-1 px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    ) : (
                                        <>
                                            <p className="text-[#475569] font-medium">{primaryStore.displayName || primaryStore.name}</p>
                                            {primaryStore.businessType && (
                                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                                                    {primaryStore.businessType}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Phone</label>
                                {isEditingStore ? (
                                    <input
                                        type="tel"
                                        value={editedStoreData.phoneNumber}
                                        onChange={(e) => setEditedStoreData({ ...editedStoreData, phoneNumber: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                ) : (
                                    <p className="text-[#475569]">{primaryStore.phoneNumber}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Email</label>
                                {isEditingStore ? (
                                    <input
                                        type="email"
                                        value={editedStoreData.email}
                                        onChange={(e) => setEditedStoreData({ ...editedStoreData, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                ) : (
                                    <p className="text-[#475569]">{primaryStore.email}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 block">GSTIN</label>
                                {isEditingStore ? (
                                    <input
                                        type="text"
                                        value={editedStoreData.gstin}
                                        onChange={(e) => setEditedStoreData({ ...editedStoreData, gstin: e.target.value })}
                                        placeholder="Enter GSTIN"
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                    />
                                ) : (
                                    <p className="text-[#475569] font-mono">{gstin}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 block">DL Number</label>
                                {isEditingStore ? (
                                    <input
                                        type="text"
                                        value={editedStoreData.dlNumber}
                                        onChange={(e) => setEditedStoreData({ ...editedStoreData, dlNumber: e.target.value })}
                                        placeholder="Enter DL Number"
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                    />
                                ) : (
                                    <p className="text-[#475569] font-mono">{primaryStore.dlNumber || '-'}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 block">PAN</label>
                                {isEditingStore ? (
                                    <input
                                        type="text"
                                        value={editedStoreData.pan}
                                        onChange={(e) => setEditedStoreData({ ...editedStoreData, pan: e.target.value })}
                                        placeholder="Enter PAN"
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                    />
                                ) : (
                                    <p className="text-[#475569] font-mono">{primaryStore.pan || '-'}</p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 flex items-center gap-2">
                                    <FiMapPin className="w-4 h-4" />
                                    Address
                                </label>
                                {isEditingStore ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={editedStoreData.addressLine1}
                                            onChange={(e) => setEditedStoreData({ ...editedStoreData, addressLine1: e.target.value })}
                                            placeholder="Address Line 1"
                                            className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <input
                                            type="text"
                                            value={editedStoreData.addressLine2}
                                            onChange={(e) => setEditedStoreData({ ...editedStoreData, addressLine2: e.target.value })}
                                            placeholder="Address Line 2 (Optional)"
                                            className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <div className="grid grid-cols-3 gap-3">
                                            <input
                                                type="text"
                                                value={editedStoreData.city}
                                                onChange={(e) => setEditedStoreData({ ...editedStoreData, city: e.target.value })}
                                                placeholder="City"
                                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                            <input
                                                type="text"
                                                value={editedStoreData.state}
                                                onChange={(e) => setEditedStoreData({ ...editedStoreData, state: e.target.value })}
                                                placeholder="State"
                                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                            <input
                                                type="text"
                                                value={editedStoreData.pinCode}
                                                onChange={(e) => setEditedStoreData({ ...editedStoreData, pinCode: e.target.value })}
                                                placeholder="PIN Code"
                                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[#475569]">
                                        {primaryStore.addressLine1}
                                        {primaryStore.addressLine2 && `, ${primaryStore.addressLine2}`}
                                        <br />
                                        {primaryStore.city}, {primaryStore.state} - {primaryStore.pinCode}
                                    </p>
                                )}
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
                        <div className="text-3xl font-bold text-emerald-600 mb-1">0</div>
                        <div className="text-sm text-[#64748b]">Prescriptions Verified</div>
                    </div>
                    <div className="p-6 bg-white border border-[#e2e8f0] rounded-xl">
                        <div className="text-3xl font-bold text-emerald-600 mb-1">0%</div>
                        <div className="text-sm text-[#64748b]">Accuracy Rate</div>
                    </div>
                    <div className="p-6 bg-white border border-[#e2e8f0] rounded-xl">
                        <div className="text-3xl font-bold text-emerald-600 mb-1">
                            {user ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                        </div>
                        <div className="text-sm text-[#64748b]">Days Since Joining</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
