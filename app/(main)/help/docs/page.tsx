"use client";

import { useState } from "react";
import { FiSearch, FiBook, FiPlay, FiBookmark, FiExternalLink } from "react-icons/fi";

interface DocArticle {
    id: string;
    title: string;
    category: string;
    content: string;
    videoUrl?: string;
    steps: string[];
    troubleshooting: string[];
    relatedArticles: string[];
}

const CATEGORIES = [
    { id: "start", label: "Getting Started", icon: "🚀" },
    { id: "inventory", label: "Inventory", icon: "📦" },
    { id: "prescriptions", label: "Prescriptions", icon: "📋" },
    { id: "billing", label: "Billing & GST", icon: "💰" },
    { id: "integrations", label: "Integrations", icon: "🔗" },
    { id: "reports", label: "Reports", icon: "📊" }
];

const MOCK_ARTICLES: DocArticle[] = [
    {
        id: "1",
        title: "How to Create a New Sale",
        category: "billing",
        content: "Learn how to process a sale transaction in HopeRx POS system.",
        videoUrl: "https://example.com/video1",
        steps: [
            "Navigate to POS → New Sale",
            "Scan or search for medicines",
            "Add quantities and apply discounts",
            "Select payment method",
            "Generate invoice"
        ],
        troubleshooting: [
            "If barcode scanner not working, check USB connection",
            "For payment gateway errors, verify internet connection",
            "Invoice not printing? Check printer settings"
        ],
        relatedArticles: ["How to Process Refunds", "GST Invoice Requirements"]
    },
    {
        id: "2",
        title: "Stock Management Guide",
        category: "inventory",
        content: "Complete guide to managing your pharmacy inventory efficiently.",
        steps: [
            "Go to Inventory → Stock",
            "Use search to find medicines",
            "View stock levels and batches",
            "Set reorder points",
            "Track expiry dates"
        ],
        troubleshooting: [
            "Stock not updating? Sync with server",
            "Missing batches? Check import logs",
            "Expiry alerts not showing? Verify settings"
        ],
        relatedArticles: ["Batch Management", "Expiry Tracking", "Stock Adjustment"]
    }
];

const POPULAR_ARTICLES = [
    "How to Create a New Sale",
    "Stock Management Guide",
    "GST Return Filing",
    "WhatsApp Integration Setup"
];

export default function DocsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("start");
    const [selectedArticle, setSelectedArticle] = useState<DocArticle | null>(null);
    const [bookmarked, setBookmarked] = useState<string[]>([]);

    const filteredArticles = MOCK_ARTICLES.filter(
        (article) =>
            (selectedCategory === "all" || article.category === selectedCategory) &&
            (article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                article.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const toggleBookmark = (id: string) => {
        setBookmarked((prev) =>
            prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
        );
    };

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Documentation</h1>
                    <p className="text-sm text-[#64748b] mb-4">Help › Docs</p>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search documentation... (try 'stock', 'invoice', 'GST')"
                            className="w-full pl-12 pr-4 py-3 border-2 border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-lg"
                        />
                    </div>

                    {/* Popular Articles */}
                    <div>
                        <h3 className="text-sm font-semibold text-[#64748b] uppercase mb-2">Popular Articles</h3>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR_ARTICLES.map((article, idx) => (
                                <button
                                    key={idx}
                                    className="px-3 py-1.5 bg-[#f1f5f9] text-[#475569] rounded-lg text-sm hover:bg-[#e2e8f0] transition-colors"
                                >
                                    {article}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Category Sidebar */}
                <div className="w-64 bg-white border-r border-[#e2e8f0] p-4 overflow-auto">
                    <h3 className="text-sm font-semibold text-[#64748b] uppercase mb-3">Categories</h3>
                    <div className="space-y-1">
                        {CATEGORIES.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`w-full px-4 py-3 rounded-lg text-left transition-all flex items-center gap-3 ${selectedCategory === category.id
                                        ? "bg-[#f0fdfa] border-2 border-[#0ea5a3] text-[#0f172a]"
                                        : "border-2 border-transparent hover:bg-[#f8fafc]"
                                    }`}
                            >
                                <span className="text-xl">{category.icon}</span>
                                <span className="font-medium text-sm">{category.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Article List or Content */}
                {!selectedArticle ? (
                    <div className="flex-1 overflow-auto p-6">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-xl font-bold text-[#0f172a] mb-4">
                                {CATEGORIES.find((c) => c.id === selectedCategory)?.label || "All Articles"}
                            </h2>
                            <div className="space-y-4">
                                {filteredArticles.map((article) => (
                                    <div
                                        key={article.id}
                                        onClick={() => setSelectedArticle(article)}
                                        className="p-6 bg-white border-2 border-[#e2e8f0] rounded-xl hover:border-[#0ea5a3] transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-lg font-bold text-[#0f172a]">{article.title}</h3>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleBookmark(article.id);
                                                }}
                                                className="p-2 hover:bg-[#f8fafc] rounded-lg transition-colors"
                                            >
                                                <FiBookmark
                                                    className={`w-5 h-5 ${bookmarked.includes(article.id) ? "fill-[#0ea5a3] text-[#0ea5a3]" : "text-[#94a3b8]"
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                        <p className="text-sm text-[#64748b] mb-3">{article.content}</p>
                                        <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
                                            {article.videoUrl && (
                                                <div className="flex items-center gap-1">
                                                    <FiPlay className="w-3 h-3" />
                                                    <span>Video included</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <FiBook className="w-3 h-3" />
                                                <span>{article.steps.length} steps</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto p-6">
                        <div className="max-w-4xl mx-auto">
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="mb-4 text-sm text-[#0ea5a3] hover:underline"
                            >
                                ← Back to articles
                            </button>

                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-8">
                                <h1 className="text-3xl font-bold text-[#0f172a] mb-4">{selectedArticle.title}</h1>

                                {/* Video */}
                                {selectedArticle.videoUrl && (
                                    <div className="mb-6 p-6 bg-[#f1f5f9] rounded-lg">
                                        <div className="flex items-center gap-3 mb-3">
                                            <FiPlay className="w-5 h-5 text-[#0ea5a3]" />
                                            <span className="font-semibold text-[#0f172a]">Video Tutorial</span>
                                        </div>
                                        <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                                            <span className="text-gray-500">Video Player Placeholder</span>
                                        </div>
                                    </div>
                                )}

                                {/* Steps */}
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-[#0f172a] mb-3">Step-by-Step Instructions</h2>
                                    <ol className="space-y-3">
                                        {selectedArticle.steps.map((step, idx) => (
                                            <li key={idx} className="flex gap-3">
                                                <div className="w-6 h-6 rounded-full bg-[#0ea5a3] text-white flex items-center justify-center text-sm font-bold shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <p className="text-[#475569] pt-0.5">{step}</p>
                                            </li>
                                        ))}
                                    </ol>
                                </div>

                                {/* Troubleshooting */}
                                <div className="mb-6 p-6 bg-amber-50 border-2 border-amber-200 rounded-lg">
                                    <h2 className="text-xl font-bold text-amber-900 mb-3">Troubleshooting</h2>
                                    <ul className="space-y-2">
                                        {selectedArticle.troubleshooting.map((item, idx) => (
                                            <li key={idx} className="flex gap-2 text-amber-800">
                                                <span>•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Related Articles */}
                                <div>
                                    <h2 className="text-xl font-bold text-[#0f172a] mb-3">Related Articles</h2>
                                    <div className="space-y-2">
                                        {selectedArticle.relatedArticles.map((article, idx) => (
                                            <button
                                                key={idx}
                                                className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-left hover:border-[#0ea5a3] transition-all flex items-center justify-between"
                                            >
                                                <span className="text-[#0f172a] font-medium">{article}</span>
                                                <FiExternalLink className="w-4 h-4 text-[#94a3b8]" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
