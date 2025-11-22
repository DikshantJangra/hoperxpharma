"use client";

import { useState } from "react";
import { FiUsers, FiTrendingUp, FiAward, FiDownload, FiPlus, FiEdit, FiSearch } from "react-icons/fi";
import { MdStars } from "react-icons/md";

const mockMembers = [
    { id: "1", name: "Rajesh Kumar", phone: "9876543210", membershipId: "HRX-2024-001", tier: "Gold", points: 2450, lifetimeSpend: 28500, joinDate: "2024-01-15", lastActivity: "2024-11-20", status: "Active" },
    { id: "2", name: "Priya Sharma", phone: "9876543211", membershipId: "HRX-2024-002", tier: "Silver", points: 1200, lifetimeSpend: 15000, joinDate: "2024-03-10", lastActivity: "2024-11-18", status: "Active" },
    { id: "3", name: "Amit Patel", phone: "9876543212", membershipId: "HRX-2024-003", tier: "Platinum", points: 5800, lifetimeSpend: 65000, joinDate: "2023-11-05", lastActivity: "2024-11-21", status: "Active" },
    { id: "4", name: "Sneha Reddy", phone: "9876543213", membershipId: "HRX-2024-004", tier: "Bronze", points: 450, lifetimeSpend: 5200, joinDate: "2024-09-20", lastActivity: "2024-11-15", status: "Active" }
];

const tierColors = {
    Bronze: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
    Silver: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
    Gold: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
    Platinum: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" }
};

export default function LoyaltyPage() {
    const [activeTab, setActiveTab] = useState("members");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTier, setFilterTier] = useState("All");

    const filteredMembers = mockMembers.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.phone.includes(searchTerm) ||
            member.membershipId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTier = filterTier === "All" || member.tier === filterTier;
        return matchesSearch && matchesTier;
    });

    const totalMembers = mockMembers.length;
    const activeMembers = mockMembers.filter(m => m.status === "Active").length;
    const totalPoints = mockMembers.reduce((sum, m) => sum + m.points, 0);
    const avgPoints = Math.round(totalPoints / totalMembers);

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
                        <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2">
                            <FiPlus className="w-4 h-4" />
                            Enroll Member
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Total Members</span>
                            <FiUsers className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold text-blue-600">{totalMembers}</div>
                        <div className="text-xs text-green-600 mt-1">+12% this month</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Active Members</span>
                            <FiTrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-3xl font-bold text-green-600">{activeMembers}</div>
                        <div className="text-xs text-[#64748b] mt-1">{Math.round((activeMembers / totalMembers) * 100)}% active rate</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Total Points</span>
                            <MdStars className="w-5 h-5 text-[#0ea5a3]" />
                        </div>
                        <div className="text-3xl font-bold text-[#0ea5a3]">{totalPoints.toLocaleString()}</div>
                        <div className="text-xs text-[#64748b] mt-1">Issued this month</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Avg Points</span>
                            <FiAward className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="text-3xl font-bold text-amber-600">{avgPoints}</div>
                        <div className="text-xs text-[#64748b] mt-1">Per member</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl mb-6">
                    <div className="flex border-b border-[#e2e8f0]">
                        <button
                            onClick={() => setActiveTab("members")}
                            className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "members" ? "text-[#0ea5a3] border-b-2 border-[#0ea5a3]" : "text-[#64748b] hover:text-[#0f172a]"
                                }`}
                        >
                            Members
                        </button>
                        <button
                            onClick={() => setActiveTab("tiers")}
                            className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "tiers" ? "text-[#0ea5a3] border-b-2 border-[#0ea5a3]" : "text-[#64748b] hover:text-[#0f172a]"
                                }`}
                        >
                            Tiers
                        </button>
                        <button
                            onClick={() => setActiveTab("rules")}
                            className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "rules" ? "text-[#0ea5a3] border-b-2 border-[#0ea5a3]" : "text-[#64748b] hover:text-[#0f172a]"
                                }`}
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
                                        />
                                    </div>
                                    <select
                                        value={filterTier}
                                        onChange={(e) => setFilterTier(e.target.value)}
                                        className="px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
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
                                    {filteredMembers.map((member) => {
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
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === "tiers" && (
                            <div className="space-y-6">
                                {["Bronze", "Silver", "Gold", "Platinum"].map((tier, idx) => {
                                    const tierStyle = tierColors[tier as keyof typeof tierColors];
                                    const thresholds = [0, 10000, 25000, 50000];
                                    const multipliers = [1, 1.5, 2, 3];
                                    return (
                                        <div key={tier} className={`p-6 border-2 rounded-xl ${tierStyle.border}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-full ${tierStyle.bg} flex items-center justify-center`}>
                                                        <MdStars className={`w-6 h-6 ${tierStyle.text}`} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-[#0f172a]">{tier}</h3>
                                                        <p className="text-sm text-[#64748b]">Spend ₹{thresholds[idx].toLocaleString()}+ to qualify</p>
                                                    </div>
                                                </div>
                                                <span className={`px-4 py-2 rounded-lg text-sm font-medium ${tierStyle.bg} ${tierStyle.text}`}>
                                                    {multipliers[idx]}x Points
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <div className="text-[#64748b] mb-1">Benefits</div>
                                                    <ul className="space-y-1">
                                                        <li className="flex items-center gap-2">
                                                            <FiAward className={`w-4 h-4 ${tierStyle.text}`} />
                                                            <span>Points on every purchase</span>
                                                        </li>
                                                        {idx >= 1 && <li className="flex items-center gap-2"><FiAward className={`w-4 h-4 ${tierStyle.text}`} /><span>Birthday bonus</span></li>}
                                                        {idx >= 2 && <li className="flex items-center gap-2"><FiAward className={`w-4 h-4 ${tierStyle.text}`} /><span>Free delivery</span></li>}
                                                        {idx >= 3 && <li className="flex items-center gap-2"><FiAward className={`w-4 h-4 ${tierStyle.text}`} /><span>Personal pharmacist</span></li>}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <div className="text-[#64748b] mb-1">Members</div>
                                                    <div className="text-2xl font-bold text-[#0f172a]">
                                                        {mockMembers.filter(m => m.tier === tier).length}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === "rules" && (
                            <div className="space-y-6">
                                <div className="p-6 bg-[#f8fafc] rounded-lg">
                                    <h3 className="font-semibold text-[#0f172a] mb-4">Earning Rules</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                            <span className="text-[#0f172a]">Points per ₹100 spent</span>
                                            <span className="font-semibold text-[#0ea5a3]">1 point</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                            <span className="text-[#0f172a]">Birthday bonus</span>
                                            <span className="font-semibold text-[#0ea5a3]">100 points</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                            <span className="text-[#0f172a]">Referral bonus</span>
                                            <span className="font-semibold text-[#0ea5a3]">200 points</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-[#f8fafc] rounded-lg">
                                    <h3 className="font-semibold text-[#0f172a] mb-4">Redemption Rules</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                            <span className="text-[#0f172a]">Points to currency ratio</span>
                                            <span className="font-semibold text-[#0ea5a3]">100 points = ₹10</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                            <span className="text-[#0f172a]">Minimum redemption</span>
                                            <span className="font-semibold text-[#0ea5a3]">500 points</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                            <span className="text-[#0f172a]">Points expiry</span>
                                            <span className="font-semibold text-[#0ea5a3]">12 months</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
