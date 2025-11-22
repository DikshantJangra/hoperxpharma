"use client";

import { useState, useEffect } from "react";
import { FiUsers, FiTrendingUp, FiAward, FiDownload, FiPlus, FiEdit, FiSearch } from "react-icons/fi";
import { MdStars } from "react-icons/md";

const tierColors = {
    Bronze: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
    Silver: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
    Gold: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
    Platinum: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" }
};

const StatCardSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 animate-pulse">
        <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded w-1/4"></div>
        <div className="h-3 bg-gray-100 rounded w-1/2 mt-1"></div>
    </div>
);

const MemberCardSkeleton = () => (
    <div className="p-6 border border-[#e2e8f0] rounded-xl animate-pulse">
        <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-100 rounded-full w-1/4"></div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    <div className="h-8 bg-gray-100 rounded"></div>
                    <div className="h-8 bg-gray-100 rounded"></div>
                    <div className="h-8 bg-gray-100 rounded"></div>
                    <div className="h-8 bg-gray-100 rounded"></div>
                </div>
            </div>
            <div className="flex gap-2 ml-4">
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
            </div>
        </div>
    </div>
)

export default function LoyaltyPage() {
    const [activeTab, setActiveTab] = useState("members");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTier, setFilterTier] = useState("All");
    const [members, setMembers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setMembers([]);
            setStats({
                totalMembers: 0,
                activeMembers: 0,
                totalPoints: 0,
                avgPoints: 0
            });
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, [filterTier]);


    const filteredMembers = members.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.phone.includes(searchTerm) ||
            member.membershipId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTier = filterTier === "All" || member.tier === filterTier;
        return matchesSearch && matchesTier;
    });

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Loyalty Program</h1>
                            <p className="text-sm text-[#64748b]">Manage customer loyalty and rewards</p>
                        </div>
                        <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2" disabled={isLoading}>
                            <FiPlus className="w-4 h-4" />
                            Enroll Member
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {isLoading ? (
                        <>
                           <StatCardSkeleton/>
                           <StatCardSkeleton/>
                           <StatCardSkeleton/>
                           <StatCardSkeleton/>
                        </>
                    ) : (
                        <>
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Total Members</span>
                                    <FiUsers className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="text-3xl font-bold text-blue-600">{stats.totalMembers}</div>
                                <div className="text-xs text-green-600 mt-1">+12% this month</div>
                            </div>

                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Active Members</span>
                                    <FiTrendingUp className="w-5 h-5 text-green-500" />
                                </div>
                                <div className="text-3xl font-bold text-green-600">{stats.activeMembers}</div>
                                <div className="text-xs text-[#64748b] mt-1">{stats.totalMembers > 0 ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0}% active rate</div>
                            </div>

                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Total Points</span>
                                    <MdStars className="w-5 h-5 text-[#0ea5a3]" />
                                </div>
                                <div className="text-3xl font-bold text-[#0ea5a3]">{stats.totalPoints.toLocaleString()}</div>
                                <div className="text-xs text-[#64748b] mt-1">Issued this month</div>
                            </div>

                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Avg Points</span>
                                    <FiAward className="w-5 h-5 text-amber-500" />
                                </div>
                                <div className="text-3xl font-bold text-amber-600">{stats.avgPoints}</div>
                                <div className="text-xs text-[#64748b] mt-1">Per member</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Tabs */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl mb-6">
                    <div className="flex border-b border-[#e2e8f0]">
                        <button
                            onClick={() => setActiveTab("members")}
                            className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "members" ? "text-[#0ea5a3] border-b-2 border-[#0ea5a3]" : "text-[#64748b] hover:text-[#0f172a]"
                                }`}
                                disabled={isLoading}
                        >
                            Members
                        </button>
                        <button
                            onClick={() => setActiveTab("tiers")}
                            className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "tiers" ? "text-[#0ea5a3] border-b-2 border-[#0ea5a3]" : "text-[#64748b] hover:text-[#0f172a]"
                                }`}
                                disabled={isLoading}
                        >
                            Tiers
                        </button>
                        <button
                            onClick={() => setActiveTab("rules")}
                            className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "rules" ? "text-[#0ea5a3] border-b-2 border-[#0ea5a3]" : "text-[#64748b] hover:text-[#0f172a]"
                                }`}
                                disabled={isLoading}
                        >
                            Points Rules
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === "members" && (
                            <div>
                                {/* Search and Filter */}
                                <div className="flex gap-4 mb-6">
                                    <div className="flex-1 relative">
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search by name, phone, or membership ID..."
                                            className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <select
                                        value={filterTier}
                                        onChange={(e) => setFilterTier(e.target.value)}
                                        className="px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                        disabled={isLoading}
                                    >
                                        <option value="All">All Tiers</option>
                                        <option value="Bronze">Bronze</option>
                                        <option value="Silver">Silver</option>
                                        <option value="Gold">Gold</option>
                                        <option value="Platinum">Platinum</option>
                                    </select>
                                </div>

                                {/* Members List */}
                                <div className="space-y-4">
                                    {isLoading ? (
                                        <>
                                            <MemberCardSkeleton/>
                                            <MemberCardSkeleton/>
                                        </>
                                    ) : filteredMembers.length > 0 ? (
                                        filteredMembers.map((member) => {
                                            const tierStyle = tierColors[member.tier as keyof typeof tierColors];
                                            return (
                                                <div key={member.id} className="p-6 border border-[#e2e8f0] rounded-xl hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h3 className="text-lg font-semibold text-[#0f172a]">{member.name}</h3>
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border} border`}>
                                                                    {member.tier}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                                <div>
                                                                    <div className="text-[#64748b]">Member ID</div>
                                                                    <div className="font-medium text-[#0f172a]">{member.membershipId}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-[#64748b]">Phone</div>
                                                                    <div className="font-medium text-[#0f172a]">{member.phone}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-[#64748b]">Points Balance</div>
                                                                    <div className="font-medium text-[#0ea5a3]">{member.points.toLocaleString()}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-[#64748b]">Lifetime Spend</div>
                                                                    <div className="font-medium text-[#0f172a]">₹{member.lifetimeSpend.toLocaleString()}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 ml-4">
                                                            <button className="p-2 border border-[#cbd5e1] text-[#475569] rounded-lg hover:bg-[#f8fafc] transition-colors">
                                                                <FiEdit className="w-4 h-4" />
                                                            </button>
                                                            <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors text-sm">
                                                                View Details
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-10 text-gray-500">No members found.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
