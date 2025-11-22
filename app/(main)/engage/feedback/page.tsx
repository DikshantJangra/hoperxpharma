"use client";

import { useState } from "react";
import { FiMessageSquare, FiStar, FiFilter, FiCheckCircle } from "react-icons/fi";
import { MdSentimentSatisfied, MdSentimentNeutral, MdSentimentDissatisfied } from "react-icons/md";

const mockFeedback = [
    { id: "1", customerName: "Ramesh Kumar", phone: "9876543210", rating: 5, type: "Service", feedback: "Excellent service! The pharmacist took time to explain my medication and answered all my questions.", date: "2024-11-21", status: "Resolved", nps: "Yes" },
    { id: "2", customerName: "Priya Sharma", phone: "9876543211", rating: 4, type: "Product", feedback: "Good quality products. Delivery was on time.", date: "2024-11-20", status: "New", nps: "Yes" },
    { id: "3", customerName: "Amit Patel", phone: "9876543212", rating: 2, type: "Delivery", feedback: "Delivery was delayed by 2 days. Not acceptable.", date: "2024-11-19", status: "InProgress", nps: "No" },
    { id: "4", customerName: "Sneha Reddy", phone: "9876543213", rating: 5, type: "Service", feedback: "Very professional staff. Always helpful and courteous.", date: "2024-11-18", status: "Resolved", nps: "Yes" },
    { id: "5", customerName: "Vikram Singh", phone: "9876543214", rating: 3, type: "Pricing", feedback: "Prices are slightly higher than other pharmacies.", date: "2024-11-17", status: "New", nps: "No" }
];

export default function FeedbackPage() {
    const [filterRating, setFilterRating] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");

    const filteredFeedback = mockFeedback.filter(fb => {
        const matchesRating = filterRating === "All" || fb.rating.toString() === filterRating;
        const matchesStatus = filterStatus === "All" || fb.status === filterStatus;
        return matchesRating && matchesStatus;
    });

    const avgRating = (mockFeedback.reduce((sum, fb) => sum + fb.rating, 0) / mockFeedback.length).toFixed(1);
    const npsScore = Math.round((mockFeedback.filter(fb => fb.nps === "Yes").length / mockFeedback.length) * 100);
    const positive = mockFeedback.filter(fb => fb.rating >= 4).length;
    const neutral = mockFeedback.filter(fb => fb.rating === 3).length;
    const negative = mockFeedback.filter(fb => fb.rating <= 2).length;

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
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Avg Rating</span>
                            <FiStar className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="text-3xl font-bold text-amber-600">{avgRating}/5</div>
                        <div className="flex gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <FiStar key={star} className={`w-4 h-4 ${parseFloat(avgRating) >= star ? "fill-amber-500 text-amber-500" : "text-gray-300"}`} />
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">NPS Score</span>
                            <FiMessageSquare className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold text-blue-600">{npsScore}</div>
                        <div className="text-xs text-[#64748b] mt-1">Net Promoter Score</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Total Feedback</span>
                            <FiCheckCircle className="w-5 h-5 text-[#0ea5a3]" />
                        </div>
                        <div className="text-3xl font-bold text-[#0ea5a3]">{mockFeedback.length}</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Sentiment</span>
                            <MdSentimentSatisfied className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="flex gap-2 text-sm mt-2">
                            <span className="text-green-600">{positive} 😊</span>
                            <span className="text-amber-600">{neutral} 😐</span>
                            <span className="text-red-600">{negative} 😞</span>
                        </div>
                    </div>
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
                            >
                                <option value="All">All Status</option>
                                <option value="New">New</option>
                                <option value="InProgress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredFeedback.map((fb) => (
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
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
