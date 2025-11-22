"use client";

import { useState } from "react";
import { FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiCalendar, FiEdit2, FiSave, FiCamera } from "react-icons/fi";

export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState({
        name: "Krishan Kumar",
        email: "krishan@hoperx.com",
        phone: "+91 98765 43210",
        role: "Admin Pharmacist",
        license: "DL-PH-2024-12345",
        joinDate: "January 2024",
        address: "123 Medical Street, Mumbai, Maharashtra 400001",
        bio: "Experienced pharmacist with 10+ years in retail pharmacy management."
    });

    const handleSave = () => {
        setIsEditing(false);
        // In production, save to backend
    };

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
                                    {profile.name.split(" ").map((n) => n[0]).join("")}
                                </div>
                                <button className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg border border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors">
                                    <FiCamera className="w-4 h-4 text-[#64748b]" />
                                </button>
                            </div>

                            <button
                                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                                className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                            >
                                {isEditing ? (
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

                        <div className="space-y-6">
                            {/* Name & Role */}
                            <div>
                                <h2 className="text-2xl font-bold text-[#0f172a] mb-1">{profile.name}</h2>
                                <p className="text-[#64748b]">{profile.role}</p>
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-semibold text-[#0f172a] mb-2">Bio</label>
                                {isEditing ? (
                                    <textarea
                                        value={profile.bio}
                                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    />
                                ) : (
                                    <p className="text-[#475569]">{profile.bio}</p>
                                )}
                            </div>

                            {/* Contact Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
                                        <FiMail className="w-4 h-4" />
                                        Email
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={profile.email}
                                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                        />
                                    ) : (
                                        <p className="text-[#475569]">{profile.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
                                        <FiPhone className="w-4 h-4" />
                                        Phone
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            value={profile.phone}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                        />
                                    ) : (
                                        <p className="text-[#475569]">{profile.phone}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
                                        <FiBriefcase className="w-4 h-4" />
                                        License Number
                                    </label>
                                    <p className="text-[#475569] font-mono">{profile.license}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
                                        <FiCalendar className="w-4 h-4" />
                                        Joined
                                    </label>
                                    <p className="text-[#475569]">{profile.joinDate}</p>
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-sm font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
                                    <FiMapPin className="w-4 h-4" />
                                    Address
                                </label>
                                {isEditing ? (
                                    <textarea
                                        value={profile.address}
                                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    />
                                ) : (
                                    <p className="text-[#475569]">{profile.address}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-white border border-[#e2e8f0] rounded-xl">
                        <div className="text-3xl font-bold text-[#0ea5a3] mb-1">1,247</div>
                        <div className="text-sm text-[#64748b]">Prescriptions Verified</div>
                    </div>
                    <div className="p-6 bg-white border border-[#e2e8f0] rounded-xl">
                        <div className="text-3xl font-bold text-[#0ea5a3] mb-1">98.5%</div>
                        <div className="text-sm text-[#64748b]">Accuracy Rate</div>
                    </div>
                    <div className="p-6 bg-white border border-[#e2e8f0] rounded-xl">
                        <div className="text-3xl font-bold text-[#0ea5a3] mb-1">245</div>
                        <div className="text-sm text-[#64748b]">Days Active</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
