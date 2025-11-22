"use client";

import { useState, useEffect } from "react";
import { FiMessageSquare, FiStar, FiFilter, FiCheckCircle } from "react-icons/fi";
import { MdSentimentSatisfied, MdSentimentNeutral, MdSentimentDissatisfied } from "react-icons/md";

const StatCardSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 animate-pulse">
        <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded w-1/4"></div>
    </div>
);

const FeedbackCardSkeleton = () => (
    <div className="p-6 border border-[#e2e8f0] rounded-xl animate-pulse">
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
                <div className="h-5 w-24 bg-gray-200 rounded-full"></div>
                <div className="space-y-1">
                    <div className="h-5 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-100 rounded w-24"></div>
                </div>
            </div>
            <div className="h-6 w-20 bg-gray-100 rounded-full"></div>
        </div>
        <div className="h-4 bg-gray-100 rounded w-full mb-4"></div>
        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
    </div>
)

export default function FeedbackPage() {
    const [filterRating, setFilterRating] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");
    const [feedback, setFeedback] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setFeedback([]);
            setStats({
                avgRating: 0,
                npsScore: 0,
                total: 0,
                positive: 0,
                neutral: 0,
                negative: 0
            });
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer)
    }, [filterRating, filterStatus]);

    const filteredFeedback = feedback.filter(fb => {
        const matchesRating = filterRating === "All" || fb.rating.toString() === filterRating;
        const matchesStatus = filterStatus === "All" || fb.status === filterStatus;
        return matchesRating && matchesStatus;
    });

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return "text-green-600";
        if (rating === 3) return "text-amber-600";
        return "text-red-600";
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Customer Feedback</h1>
                    <p className="text-sm text-[#64748b]">Collect and analyze customer feedback</p>
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
                                    <span className="text-sm text-[#64748b]">Avg Rating</span>
                                    <FiStar className="w-5 h-5 text-amber-500" />
                                </div>
                                <div className="text-3xl font-bold text-amber-600">{stats.avgRating}/5</div>
                                <div className="flex gap-1 mt-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <FiStar key={star} className={`w-4 h-4 ${parseFloat(stats.avgRating) >= star ? "fill-amber-500 text-amber-500" : "text-gray-300"}`} />
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">NPS Score</span>
                                    <FiMessageSquare className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="text-3xl font-bold text-blue-600">{stats.npsScore}</div>
                                <div className="text-xs text-[#64748b] mt-1">Net Promoter Score</div>
                            </div>

                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Total Feedback</span>
                                    <FiCheckCircle className="w-5 h-5 text-[#0ea5a3]" />
                                </div>
                                <div className="text-3xl font-bold text-[#0ea5a3]">{stats.total}</div>
                            </div>

                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Sentiment</span>
                                    <MdSentimentSatisfied className="w-5 h-5 text-green-500" />
                                </div>
                                <div className="flex gap-2 text-sm mt-2">
                                    <span className="text-green-600">{stats.positive} 😊</span>
                                    <span className="text-amber-600">{stats.neutral} 😐</span>
                                    <span className="text-red-600">{stats.negative} 😞</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <div className="flex gap-4 mb-6">
                        <div className="flex gap-2">
                            <FiFilter className="w-5 h-5 text-[#64748b] mt-2" />
                            <div>
                                <label className="block text-sm font-medium text-[#64748b] mb-2">Rating</label>
                                <select
                                    value={filterRating}
                                    onChange={(e) => setFilterRating(e.target.value)}
                                    className="px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    disabled={isLoading}
                                >
                                    <option value="All">All Ratings</option>
                                    <option value="5">5 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="2">2 Stars</option>
                                    <option value="1">1 Star</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#64748b] mb-2">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                disabled={isLoading}
                            >
                                <option value="All">All Status</option>
                                <option value="New">New</option>
                                <option value="InProgress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <>
                                <FeedbackCardSkeleton/>
                                <FeedbackCardSkeleton/>
                            </>
                        ) : filteredFeedback.length > 0 ? (
                            filteredFeedback.map((fb) => (
                                <div key={fb.id} className="p-6 border border-[#e2e8f0] rounded-xl hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <FiStar key={star} className={`w-5 h-5 ${fb.rating >= star ? "fill-amber-500 text-amber-500" : "text-gray-300"}`} />
                                                ))}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-[#0f172a]">{fb.customerName}</h3>
                                                <p className="text-sm text-[#64748b]">{fb.type} • {new Date(fb.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${fb.status === "Resolved" ? "bg-green-100 text-green-700" :
                                                fb.status === "InProgress" ? "bg-amber-100 text-amber-700" :
                                                    "bg-blue-100 text-blue-700"
                                            }`}>
                                            {fb.status === "InProgress" ? "In Progress" : fb.status}
                                        </span>
                                    </div>

                                    <p className="text-[#0f172a] mb-4 italic">"{fb.feedback}"</p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-sm text-[#64748b]">
                                            <span>📞 {fb.phone}</span>
                                            <span>Would recommend: {fb.nps === "Yes" ? "✅ Yes" : "❌ No"}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {fb.status === "New" && (
                                                <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors text-sm">
                                                    Reply
                                                </button>
                                            )}
                                            {fb.status === "InProgress" && (
                                                <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm">
                                                    Mark Resolved
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500">No feedback found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
