"use client";

import { useState, useEffect } from "react";
import { FiSend, FiUsers, FiTrendingUp, FiPlus, FiEdit, FiPause, FiPlay } from "react-icons/fi";
import { MdWhatsapp, MdEmail } from "react-icons/md";
import { TbMessageCircle } from "react-icons/tb";

const StatCardSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 animate-pulse">
        <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded w-1/4"></div>
    </div>
);

const CampaignCardSkeleton = () => (
    <div className="p-6 border border-[#e2e8f0] rounded-xl animate-pulse">
        <div className="flex items-start justify-between mb-4">
            <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-5 gap-4">
            <div className="h-8 bg-gray-100 rounded"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
        </div>
    </div>
);


export default function CampaignsPage() {
    const [filter, setFilter] = useState("All");
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setCampaigns([]);
            setStats({
                totalSent: 0,
                openRate: 0,
                totalRevenue: 0,
                active: 0,
            });
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, [filter]);

    const filteredCampaigns = campaigns.filter(campaign =>
        filter === "All" || campaign.status === filter
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Marketing Campaigns</h1>
                            <p className="text-sm text-[#64748b]">Create and manage multi-channel campaigns</p>
                        </div>
                        <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2" disabled={isLoading}>
                            <FiPlus className="w-4 h-4" />
                            New Campaign
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
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
                                    <span className="text-sm text-[#64748b]">Total Sent</span>
                                    <FiSend className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="text-3xl font-bold text-blue-600">{stats.totalSent.toLocaleString()}</div>
                            </div>

                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Open Rate</span>
                                    <FiUsers className="w-5 h-5 text-green-500" />
                                </div>
                                <div className="text-3xl font-bold text-green-600">{stats.openRate}%</div>
                            </div>

                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Revenue</span>
                                    <FiTrendingUp className="w-5 h-5 text-[#0ea5a3]" />
                                </div>
                                <div className="text-3xl font-bold text-[#0ea5a3]">₹{(stats.totalRevenue / 1000).toFixed(0)}K</div>
                            </div>

                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Active</span>
                                    <TbMessageCircle className="w-5 h-5 text-amber-500" />
                                </div>
                                <div className="text-3xl font-bold text-amber-600">{stats.active}</div>
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <div className="flex gap-2 mb-6">
                        {["All", "Running", "Scheduled", "Completed"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                                disabled={isLoading}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <>
                                <CampaignCardSkeleton/>
                                <CampaignCardSkeleton/>
                            </>
                        ) : filteredCampaigns.length > 0 ? (
                            filteredCampaigns.map((campaign) => (
                                <div key={campaign.id} className="p-6 border border-[#e2e8f0] rounded-xl hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-[#0f172a]">{campaign.name}</h3>
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                    {campaign.type}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${campaign.status === "Running" ? "bg-green-100 text-green-700" :
                                                    campaign.status === "Scheduled" ? "bg-blue-100 text-blue-700" :
                                                        "bg-gray-100 text-gray-700"
                                                    }`}>
                                                    {campaign.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-[#64748b]">
                                                {campaign.channels.map((channel: any) => (
                                                    <div key={channel} className="flex items-center gap-1">
                                                        {channel === "WhatsApp" && <MdWhatsapp className="w-4 h-4 text-green-600" />}
                                                        {channel === "SMS" && <TbMessageCircle className="w-4 h-4 text-blue-600" />}
                                                        {channel === "Email" && <MdEmail className="w-4 h-4 text-purple-600" />}
                                                        <span>{channel}</span>
                                                    </div>
                                                ))}
                                                <span>•</span>
                                                <span>{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button className="p-2 border border-[#cbd5e1] text-[#475569] rounded-lg hover:bg-[#f8fafc] transition-colors">
                                                <FiEdit className="w-4 h-4" />
                                            </button>
                                            {campaign.status === "Running" ? (
                                                <button className="p-2 border border-amber-300 text-amber-600 rounded-lg hover:bg-amber-50 transition-colors">
                                                    <FiPause className="w-4 h-4" />
                                                </button>
                                            ) : campaign.status === "Scheduled" ? (
                                                <button className="p-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition-colors">
                                                    <FiPlay className="w-4 h-4" />
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>

                                    {campaign.sent > 0 && (
                                        <div className="grid grid-cols-5 gap-4 text-sm">
                                            <div>
                                                <div className="text-[#64748b]">Sent</div>
                                                <div className="font-semibold text-[#0f172a]">{campaign.sent.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-[#64748b]">Opened</div>
                                                <div className="font-semibold text-green-600">{campaign.opened.toLocaleString()} ({Math.round((campaign.opened / campaign.sent) * 100)}%)</div>
                                            </div>
                                            <div>
                                                <div className="text-[#64748b]">Clicked</div>
                                                <div className="font-semibold text-blue-600">{campaign.clicked.toLocaleString()} ({Math.round((campaign.clicked / campaign.sent) * 100)}%)</div>
                                            </div>
                                            <div>
                                                <div className="text-[#64748b]">Converted</div>
                                                <div className="font-semibold text-purple-600">{campaign.converted.toLocaleString()} ({Math.round((campaign.converted / campaign.sent) * 100)}%)</div>
                                            </div>
                                            <div>
                                                <div className="text-[#64748b]">Revenue</div>
                                                <div className="font-semibold text-[#0ea5a3]">₹{campaign.revenue.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                No campaigns found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
