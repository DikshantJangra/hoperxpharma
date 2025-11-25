"use client";

import { useState, useEffect } from 'react';
import { DocArticle } from '@/types/docs';
import { FiClock, FiTag, FiUsers, FiArrowLeft, FiThumbsUp, FiThumbsDown, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { loadMarkdownArticle } from '@/lib/docs/markdown-loader';
import MarkdownContent from '@/components/docs/MarkdownContent';

interface DocArticleProps {
    article: DocArticle;
    onBack: () => void;
    isBookmarked: boolean;
    onToggleBookmark: () => void;
    onRelatedClick: (articleId: string) => void;
}

export default function DocArticleView({
    article,
    onBack,
    onRelatedClick,
}: DocArticleProps) {
    const difficultyConfig = {
        Beginner: {
            bg: 'from-emerald-50 to-teal-50',
            text: 'text-emerald-700',
            border: 'border-emerald-200',
        },
        Intermediate: {
            bg: 'from-blue-50 to-indigo-50',
            text: 'text-blue-700',
            border: 'border-blue-200',
        },
        Advanced: {
            bg: 'from-purple-50 to-pink-50',
            text: 'text-purple-700',
            border: 'border-purple-200',
        },
    };

    const config = difficultyConfig[article.difficulty];

    // Markdown loading state
    const [markdownContent, setMarkdownContent] = useState<string>('');
    const [isLoadingMarkdown, setIsLoadingMarkdown] = useState(false);

    // Load markdown content if markdownPath is provided
    useEffect(() => {
        if (article.markdownPath) {
            setIsLoadingMarkdown(true);
            loadMarkdownArticle(article.markdownPath)
                .then(({ content }) => {
                    setMarkdownContent(content);
                })
                .catch((error) => {
                    console.error('Failed to load markdown:', error);
                    setMarkdownContent(''); // Fall back to article.content
                })
                .finally(() => {
                    setIsLoadingMarkdown(false);
                });
        }
    }, [article.markdownPath]);

    // Use markdown content if available, otherwise use article.content
    const contentToRender = markdownContent || article.content;
    const hasMarkdown = !!markdownContent;

    return (
        <div className="w-full">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="group mb-6 flex items-center gap-2 text-gray-600 hover:text-emerald-700 transition-colors font-semibold px-4 py-2 hover:bg-white rounded-xl"
            >
                <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to articles</span>
            </button>

            {/* Article Container */}
            <div className="w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 relative overflow-hidden">
                {/* Decorative gradient overlay */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-bl-full pointer-events-none -z-0 opacity-60" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-3 leading-tight">
                            {article.title}
                        </h1>
                        <p className="text-base md:text-lg text-gray-600 leading-relaxed">{article.summary}</p>
                    </div>

                    {/* Metadata Pills */}
                    <div className="flex flex-wrap items-center gap-3 mb-8">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${config.border} bg-gradient-to-r ${config.bg}`}>
                            <FiTag className="w-4 h-4" />
                            <span className={`text-sm font-semibold ${config.text}`}>
                                {article.difficulty}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
                            <FiClock className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-semibold text-gray-700">{article.estimatedTime}</span>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
                            <FiUsers className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-semibold text-gray-700">{article.roles.join(', ')}</span>
                        </div>

                        <div className="ml-auto text-xs text-gray-500 font-medium">
                            Updated {new Date(article.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>

                    {/* Main Content */}
                    {isLoadingMarkdown ? (
                        <div className="prose prose-lg max-w-none mb-8">
                            <div className="text-gray-500 text-center py-8">
                                Loading article content...
                            </div>
                        </div>
                    ) : hasMarkdown ? (
                        <MarkdownContent content={contentToRender} className="mb-8" />
                    ) : (
                        <div className="prose prose-lg max-w-none mb-8">
                            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                                {article.content}
                            </div>
                        </div>
                    )}

                    {/* Steps Section */}
                    {article.steps.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500 shadow-sm border border-emerald-100/50">
                                    <FiCheckCircle size={24} />
                                </div>
                                <div className="flex-1 pt-1">
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-1">
                                        Step-by-Step Instructions
                                    </h2>
                                    <p className="text-sm text-gray-500">Follow these steps to complete the task</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {article.steps.map((step, idx) => (
                                    <div key={idx} className="flex gap-4 group">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                                {idx + 1}
                                            </div>
                                            {idx < article.steps.length - 1 && (
                                                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gradient-to-b from-emerald-200 to-transparent" />
                                            )}
                                        </div>
                                        <p className="text-sm md:text-base text-gray-700 pt-2 flex-1 leading-relaxed">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Troubleshooting Section */}
                    {article.troubleshooting.length > 0 && (
                        <div className="mb-8 p-6 md:p-8 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-100/50 to-transparent rounded-bl-full pointer-events-none opacity-60" />
                            <div className="relative z-10">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600 shadow-sm border border-amber-200/50">
                                        <FiAlertTriangle size={24} />
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <h2 className="text-xl md:text-2xl font-bold text-amber-900 tracking-tight mb-1">
                                            Troubleshooting
                                        </h2>
                                        <p className="text-sm text-amber-700">Common issues and how to resolve them</p>
                                    </div>
                                </div>
                                <ul className="space-y-3">
                                    {article.troubleshooting.map((item, idx) => (
                                        <li key={idx} className="flex gap-3 text-amber-900">
                                            <span className="text-amber-600 font-bold text-lg flex-shrink-0">•</span>
                                            <span className="flex-1 leading-relaxed text-sm md:text-base">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Related Articles */}
                    {article.relatedArticles.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-4">
                                Related Articles
                            </h2>
                            <div className="grid gap-3">
                                {article.relatedArticles.map((relatedId, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => onRelatedClick(relatedId)}
                                        className="group px-5 py-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl text-left hover:border-emerald-500 hover:shadow-lg transition-all duration-200 flex items-center justify-between hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        <span className="text-sm md:text-base text-gray-900 font-semibold group-hover:text-emerald-700 transition-colors">
                                            {relatedId.split('-').map(word =>
                                                word.charAt(0).toUpperCase() + word.slice(1)
                                            ).join(' ')}
                                        </span>
                                        <FiArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 rotate-180 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Feedback Widget */}
                    <div className="pt-8 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-4">Was this article helpful?</p>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-700 rounded-xl transition-all duration-200 font-semibold border border-emerald-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0">
                                <FiThumbsUp className="w-4 h-4" />
                                <span className="text-sm">Yes, helpful</span>
                            </button>
                            <button className="flex items-center gap-2 px-5 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all duration-200 font-semibold border border-gray-200 hover:shadow-sm">
                                <FiThumbsDown className="w-4 h-4" />
                                <span className="text-sm">Needs improvement</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
