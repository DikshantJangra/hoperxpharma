"use client";

import { useState, useEffect, useMemo } from "react";
import { FiSearch, FiStar, FiTrendingUp, FiLayers, FiZap, FiAward } from "react-icons/fi";
import { DOC_CATEGORIES, getCategoryLabel, getCategoryIcon } from "@/lib/docs/categories";
import { ARTICLES, getArticleById, getArticlesByCategory, getPopularArticles } from "@/lib/docs/articles";
import { searchArticles, getPopularSearches } from "@/lib/docs/search";
import { useAuthStore } from "@/lib/store/auth-store";
import DocCard from "@/components/docs/DocCard";
import DocArticleView from "@/components/docs/DocArticleView";
import FloatingActions from "@/components/docs/FloatingActions";
import { DocArticle } from "@/types/docs";

export default function DocsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("getting-started");
    const [selectedArticle, setSelectedArticle] = useState<DocArticle | null>(null);
    const [bookmarked, setBookmarked] = useState<string[]>([]);
    const [focusMode, setFocusMode] = useState(false);
    const { user } = useAuthStore();

    // Load bookmarks from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('doc-bookmarks');
        if (saved) {
            try {
                setBookmarked(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load bookmarks:', e);
            }
        }
    }, []);

    // Save bookmarks to localStorage
    useEffect(() => {
        localStorage.setItem('doc-bookmarks', JSON.stringify(bookmarked));
    }, [bookmarked]);

    // Reset focus mode when article changes
    useEffect(() => {
        if (!selectedArticle) {
            setFocusMode(false);
        }
    }, [selectedArticle]);

    // Get user role for filtering
    const userRole = user?.role?.toLowerCase() || 'all';

    // Filter articles based on search and category
    const filteredArticles = useMemo(() => {
        if (searchQuery.trim()) {
            const results = searchArticles(searchQuery, {
                category: selectedCategory === 'all' ? undefined : selectedCategory,
                role: userRole,
            });
            return results.map(r => r.article);
        } else {
            let articles = selectedCategory === 'all'
                ? ARTICLES
                : getArticlesByCategory(selectedCategory);

            articles = articles.filter(article =>
                article.roles.includes(userRole) ||
                article.roles.includes('all') ||
                userRole === 'admin' ||
                userRole === 'owner'
            );

            return articles;
        }
    }, [searchQuery, selectedCategory, userRole]);

    const popularArticles = getPopularArticles(5);
    const popularSearches = getPopularSearches();

    const toggleBookmark = (id: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        setBookmarked((prev) =>
            prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
        );
    };

    const handleArticleClick = (article: DocArticle) => {
        setSelectedArticle(article);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRelatedClick = (articleId: string) => {
        const article = getArticleById(articleId);
        if (article) {
            setSelectedArticle(article);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePopularClick = (searchTerm: string) => {
        setSearchQuery(searchTerm);
        setSelectedArticle(null);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        if (navigator.share && selectedArticle) {
            navigator.share({
                title: selectedArticle.title,
                text: selectedArticle.summary,
                url: window.location.href,
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 relative overflow-x-hidden">
            {/* Premium Mesh Background */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-3xl" />
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-3xl" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[30%] rounded-full bg-emerald-500/3 blur-3xl" />
            </div>

            {/* Premium Header - Hidden in Focus Mode */}
            {!focusMode && (
                <div className="relative bg-white/80 backdrop-blur-md border-b border-gray-100 z-10">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        {/* Title Section */}
                        <div className="flex items-start gap-6 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500 shadow-sm border border-emerald-100/50">
                                <FiStar size={28} />
                            </div>
                            <div className="flex-1 pt-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                                    Documentation
                                </h1>
                                <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                                    Help › Docs › Everything you need to know about HopeRxPharma
                                </p>
                            </div>
                        </div>

                        {/* Premium Search Bar */}
                        <div className="group mb-6">
                            <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                    <FiSearch size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search documentation... Try 'create sale', 'inventory', 'prescription'"
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm md:text-base text-gray-900 placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Quick Access Pills */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FiZap className="w-4 h-4 text-emerald-600" />
                                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    {searchQuery ? 'Popular Searches' : 'Quick Access'}
                                </h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {!searchQuery && popularArticles.map((article) => (
                                    <button
                                        key={article.id}
                                        onClick={() => handleArticleClick(article)}
                                        className="group px-4 py-2.5 bg-white border border-gray-200 hover:border-emerald-500 rounded-xl text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                                    >
                                        <FiAward className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                                        {article.title}
                                    </button>
                                ))}
                                {searchQuery && popularSearches.map((search, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handlePopularClick(search)}
                                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-sm"
                                    >
                                        {search}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Actions */}
            <FloatingActions
                focusMode={focusMode}
                onToggleFocus={() => setFocusMode(!focusMode)}
                isBookmarked={selectedArticle ? bookmarked.includes(selectedArticle.id) : false}
                onToggleBookmark={() => selectedArticle && toggleBookmark(selectedArticle.id)}
                onPrint={handlePrint}
                onShare={handleShare}
                showInArticle={!!selectedArticle}
            />

            {/* Content Area */}
            <div className="relative z-10 flex transition-all duration-300">
                {/* Premium Sidebar - Hidden in Focus Mode */}
                {!focusMode && (
                    <div className="w-80 flex-shrink-0 px-6 py-8">
                        <div className="sticky top-8">
                            <div className="flex items-center gap-2 mb-4 px-1">
                                <FiLayers className="w-4 h-4 text-emerald-600" />
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Categories
                                </h3>
                            </div>
                            <div className="space-y-2">
                                {DOC_CATEGORIES.map((category) => {
                                    const categoryArticles = getArticlesByCategory(category.id);
                                    const count = categoryArticles.length;
                                    const IconComponent = getCategoryIcon(category.icon);
                                    const isActive = selectedCategory === category.id;

                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => {
                                                setSelectedCategory(category.id);
                                                setSelectedArticle(null);
                                            }}
                                            className={`w-full group relative overflow-hidden rounded-2xl transition-all duration-300 ${isActive
                                                ? 'bg-white shadow-lg scale-[1.02]'
                                                : 'bg-white/60 hover:bg-white hover:shadow-md hover:-translate-y-0.5'
                                                }`}
                                        >
                                            <div className="relative px-4 py-4 flex items-center gap-3">
                                                {/* Icon with gradient background */}
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-sm ${isActive ? 'shadow-md' : 'group-hover:shadow-md'
                                                    } transition-shadow`}>
                                                    <IconComponent className="w-6 h-6 text-white" />
                                                </div>

                                                <div className="flex-1 text-left">
                                                    <span className={`font-semibold text-sm block ${isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                                                        }`}>
                                                        {category.label}
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        {count} {count === 1 ? 'article' : 'articles'}
                                                    </span>
                                                </div>

                                                {/* Active indicator */}
                                                {isActive && (
                                                    <div className="w-1 h-10 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full absolute right-0" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Bookmarks Section */}
                            {bookmarked.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <div className="flex items-center gap-2 mb-4 px-1">
                                        <FiStar className="w-4 h-4 text-amber-500" />
                                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Bookmarked ({bookmarked.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-1">
                                        {bookmarked.slice(0, 5).map((id) => {
                                            const article = getArticleById(id);
                                            if (!article) return null;
                                            return (
                                                <button
                                                    key={id}
                                                    onClick={() => handleArticleClick(article)}
                                                    className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-white hover:text-emerald-700 rounded-xl transition-all duration-200 font-medium hover:shadow-sm"
                                                >
                                                    {article.title}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 px-6 py-8 max-w-5xl">
                    {!selectedArticle ? (
                        <>
                            {/* Header */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                                    {searchQuery
                                        ? `Search results for "${searchQuery}"`
                                        : getCategoryLabel(selectedCategory)}
                                </h2>
                                <p className="text-sm text-gray-600 font-medium">
                                    {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'} found
                                </p>
                            </div>

                            {/* Articles Grid */}
                            {filteredArticles.length > 0 ? (
                                <div className="grid gap-4">
                                    {filteredArticles.map((article) => (
                                        <DocCard
                                            key={article.id}
                                            article={article}
                                            onClick={() => handleArticleClick(article)}
                                            isBookmarked={bookmarked.includes(article.id)}
                                            onToggleBookmark={(e) => toggleBookmark(article.id, e)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                        <FiSearch className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
                                        No articles found
                                    </h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                                        {searchQuery
                                            ? `No results for "${searchQuery}". Try different keywords or browse categories.`
                                            : 'No articles available in this category yet.'}
                                    </p>
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="px-6 py-3.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all duration-200 font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 active:translate-y-0"
                                        >
                                            Clear search
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <DocArticleView
                            article={selectedArticle}
                            onBack={() => setSelectedArticle(null)}
                            isBookmarked={bookmarked.includes(selectedArticle.id)}
                            onToggleBookmark={() => toggleBookmark(selectedArticle.id)}
                            onRelatedClick={handleRelatedClick}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
