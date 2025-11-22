"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiPackage, FiTool, FiZap, FiShield, FiExternalLink } from "react-icons/fi";

type UpdateType = "new" | "fix" | "improvement" | "security";

interface Update {
    id: string;
    version: string;
    date: string;
    type: UpdateType;
    title: string;
    description: string;
    linkTo?: string;
    isMajor: boolean;
}

const UpdateCardSkeleton = () => (
    <div className="p-4 bg-white border-2 border-gray-200 rounded-lg animate-pulse">
        <div className="flex items-start gap-4">
            <div className="p-2 bg-gray-100 rounded-lg">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
            </div>
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-5 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            </div>
        </div>
    </div>
)

const TYPE_CONFIG = {
    new: {
        label: "NEW",
        icon: FiPackage,
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-200"
    },
    fix: {
        label: "FIX",
        icon: FiTool,
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-200"
    },
    improvement: {
        label: "IMP",
        icon: FiZap,
        bg: "bg-amber-100",
        text: "text-amber-800",
        border: "border-amber-200"
    },
    security: {
        label: "SEC",
        icon: FiShield,
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-200"
    }
};

export default function UpdatesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedVersion, setSelectedVersion] = useState("all");
    const [updates, setUpdates] = useState<Update[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setUpdates([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, [selectedVersion, searchQuery]);

    const versions = ["all", ...Array.from(new Set(updates.map((u) => u.version)))];

    const filteredUpdates = updates.filter(
        (update) =>
            (selectedVersion === "all" || update.version === selectedVersion) &&
            (update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                update.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Group by date
    const groupedUpdates = filteredUpdates.reduce((acc, update) => {
        if (!acc[update.date]) acc[update.date] = [];
        acc[update.date].push(update);
        return acc;
    }, {} as Record<string, Update[]>);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Updates & Changelog</h1>
                    <p className="text-sm text-[#64748b] mb-4">Help › Updates</p>

                    <div className="flex gap-3">
                        {/* Version Selector */}
                        <select
                            value={selectedVersion}
                            onChange={(e) => setSelectedVersion(e.target.value)}
                            className="px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            disabled={isLoading}
                        >
                            {versions.map((version) => (
                                <option key={version} value={version}>
                                    {version === "all" ? "All Versions" : `Version ${version}`}
                                </option>
                            ))}
                        </select>

                        {/* Search */}
                        <div className="flex-1 relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search updates..."
                                className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {isLoading ? (
                    <>
                        <div className="mb-8 animate-pulse">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                                <div className="flex-1 h-px bg-gray-200"></div>
                            </div>
                            <UpdateCardSkeleton/>
                            <UpdateCardSkeleton/>
                        </div>
                    </>
                ) : Object.entries(groupedUpdates).length > 0 ? (
                    Object.entries(groupedUpdates).map(([date, updates]) => {
                        const majorUpdate = updates.find((u) => u.isMajor);

                        return (
                            <div key={date} className="mb-8">
                                {/* Date Header */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="text-sm font-semibold text-[#64748b]">
                                        {new Date(date).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric"
                                        })}
                                    </div>
                                    <div className="flex-1 h-px bg-[#e2e8f0]"></div>
                                </div>

                                {/* Major Release Banner */}
                                {majorUpdate && (
                                    <div className="mb-4 p-6 bg-gradient-to-r from-[#0ea5a3] to-[#0d9391] text-white rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FiPackage className="w-5 h-5" />
                                            <span className="text-sm font-semibold uppercase">Major Release</span>
                                        </div>
                                        <h2 className="text-2xl font-bold mb-2">HopeRx {majorUpdate.version}</h2>
                                        <p className="text-white/90">{majorUpdate.description}</p>
                                    </div>
                                )}

                                {/* Updates */}
                                <div className="space-y-3">
                                    {updates.map((update) => {
                                        const config = TYPE_CONFIG[update.type];
                                        const Icon = config.icon;

                                        return (
                                            <div
                                                key={update.id}
                                                className="p-4 bg-white border-2 border-[#e2e8f0] rounded-lg hover:border-[#0ea5a3] transition-all"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-2 ${config.bg} rounded-lg`}>
                                                        <Icon className={`w-5 h-5 ${config.text}`} />
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-0.5 ${config.bg} ${config.text} rounded text-xs font-bold`}>
                                                                {config.label}
                                                            </span>
                                                            <h3 className="font-semibold text-[#0f172a]">{update.title}</h3>
                                                        </div>
                                                        <p className="text-sm text-[#64748b] mb-2">{update.description}</p>

                                                        {update.linkTo && (
                                                            <button className="text-sm text-[#0ea5a3] font-medium hover:underline flex items-center gap-1">
                                                                Try this now
                                                                <FiExternalLink className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-10 text-gray-500">No updates found.</div>
                )}
            </div>
        </div>
    );
}
