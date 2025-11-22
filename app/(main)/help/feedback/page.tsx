"use client";

import { useState } from "react";
import { FiSend, FiPaperclip, FiCheckCircle } from "react-icons/fi";

type FeedbackType = "bug" | "feature" | "enhancement" | "ux" | "performance";
type Priority = "low" | "medium" | "high";

export default function FeedbackPage() {
    const [feedbackType, setFeedbackType] = useState<FeedbackType>("bug");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<Priority>("medium");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Collect metadata
        const metadata = {
            browser: navigator.userAgent,
            device: /Mobile/.test(navigator.userAgent) ? "Mobile" : "Desktop",
            currentPage: window.location.pathname,
            timestamp: new Date().toISOString()
        };

        console.log("Feedback submitted:", {
            type: feedbackType,
            title,
            description,
            priority,
            metadata
        });

        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setTitle("");
            setDescription("");
        }, 3000);
    };

    const feedbackTypes = [
        { id: "bug" as FeedbackType, label: "Bug", icon: "🐛", color: "red" },
        { id: "feature" as FeedbackType, label: "Feature Request", icon: "✨", color: "blue" },
        { id: "enhancement" as FeedbackType, label: "Enhancement", icon: "⚡", color: "amber" },
        { id: "ux" as FeedbackType, label: "UX Issue", icon: "🎨", color: "purple" },
        { id: "performance" as FeedbackType, label: "Performance", icon: "🚀", color: "green" }
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Share Feedback</h1>
                    <p className="text-sm text-[#64748b]">Help › Feedback</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8">
                {submitted ? (
                    <div className="p-8 bg-white border-2 border-green-200 rounded-xl text-center">
                        <FiCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-[#0f172a] mb-2">Thank you!</h2>
                        <p className="text-[#64748b] mb-4">Your feedback has been submitted successfully.</p>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                            <h3 className="font-semibold text-blue-900 mb-2">AI Acknowledgement</h3>
                            <p className="text-sm text-blue-800 mb-3">
                                We've received your feedback and our team will review it shortly. Based on your input, here are some resources that might help:
                            </p>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Check the documentation for related guides</li>
                                <li>• View similar reported issues</li>
                                <li>• Contact support for urgent matters</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        {/* Feedback Type */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-[#0f172a] mb-3">What would you like to share?</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {feedbackTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFeedbackType(type.id)}
                                        className={`p-4 border-2 rounded-lg transition-all ${feedbackType === type.id
                                                ? `border-${type.color}-500 bg-${type.color}-50`
                                                : "border-[#e2e8f0] hover:border-[#cbd5e1]"
                                            }`}
                                    >
                                        <div className="text-2xl mb-1">{type.icon}</div>
                                        <div className="text-xs font-medium text-[#475569]">{type.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Brief summary of your feedback"
                                required
                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                                Description *
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Provide detailed information about your feedback..."
                                required
                                rows={6}
                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] resize-none"
                            />
                        </div>

                        {/* Attachments */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                                Attachments (Optional)
                            </label>
                            <div className="border-2 border-dashed border-[#cbd5e1] rounded-lg p-6 text-center hover:border-[#0ea5a3] transition-colors cursor-pointer">
                                <FiPaperclip className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
                                <p className="text-sm text-[#64748b] mb-1">Click to upload screenshots or files</p>
                                <p className="text-xs text-[#94a3b8]">PNG, JPG, PDF up to 10MB</p>
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                                Priority
                            </label>
                            <div className="flex gap-3">
                                {(["low", "medium", "high"] as Priority[]).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`flex-1 px-4 py-2 border-2 rounded-lg font-medium transition-all ${priority === p
                                                ? p === "high"
                                                    ? "border-red-500 bg-red-50 text-red-700"
                                                    : p === "medium"
                                                        ? "border-amber-500 bg-amber-50 text-amber-700"
                                                        : "border-green-500 bg-green-50 text-green-700"
                                                : "border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1]"
                                            }`}
                                    >
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Auto Metadata Info */}
                        <div className="mb-6 p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                            <h4 className="text-sm font-semibold text-[#0f172a] mb-2">Automatically Included</h4>
                            <div className="text-xs text-[#64748b] space-y-1">
                                <div>• Browser: {navigator.userAgent.split(" ").slice(-2).join(" ")}</div>
                                <div>• Device: {/Mobile/.test(navigator.userAgent) ? "Mobile" : "Desktop"}</div>
                                <div>• Current Page: {typeof window !== "undefined" ? window.location.pathname : "N/A"}</div>
                                <div>• Timestamp: {new Date().toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="w-full px-6 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors flex items-center justify-center gap-2"
                        >
                            <FiSend className="w-5 h-5" />
                            Submit Feedback
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
