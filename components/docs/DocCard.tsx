"use client";

import { DocArticle } from '@/types/docs';
import { FiBookmark, FiBook, FiClock, FiArrowRight, FiUsers } from 'react-icons/fi';

interface DocCardProps {
    article: DocArticle;
    onClick: () => void;
    isBookmarked: boolean;
    onToggleBookmark: (e: React.MouseEvent) => void;
}

export default function DocCard({
    article,
    onClick,
    isBookmarked,
    onToggleBookmark,
}: DocCardProps) {
    const difficultyConfig = {
        Beginner: {
            bg: 'from-emerald-50 to-teal-50',
            text: 'text-emerald-700',
            border: 'border-emerald-200',
            dot: 'bg-emerald-500',
        },
        Intermediate: {
            bg: 'from-blue-50 to-indigo-50',
            text: 'text-blue-700',
            border: 'border-blue-200',
            dot: 'bg-blue-500',
        },
        Advanced: {
            bg: 'from-purple-50 to-pink-50',
            text: 'text-purple-700',
            border: 'border-purple-200',
            dot: 'bg-purple-500',
        },
    };

    const config = difficultyConfig[article.difficulty];

    return (
        <div
            onClick={onClick}
            className="group relative bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
        >
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-bl-full pointer-events-none -z-0 opacity-60" />

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors pr-8 leading-tight tracking-tight">
                        {article.title}
                    </h3>
                    <button
                        onClick={onToggleBookmark}
                        className="p-2.5 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:scale-110 flex-shrink-0"
                        aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                    >
                        <FiBookmark
                            className={`w-5 h-5 transition-all duration-200 ${isBookmarked
                                    ? 'fill-emerald-600 text-emerald-600 scale-110'
                                    : 'text-gray-400 group-hover:text-emerald-500'
                                }`}
                        />
                    </button>
                </div>

                {/* Summary */}
                <p className="text-sm md:text-base text-gray-600 mb-5 line-clamp-2 leading-relaxed">
                    {article.summary}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-3 flex-wrap mb-5">
                    {/* Difficulty Badge */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${config.border} bg-gradient-to-r ${config.bg}`}>
                        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                        <span className={`text-xs font-semibold ${config.text}`}>
                            {article.difficulty}
                        </span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
                        <FiClock className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-semibold text-gray-700">{article.estimatedTime}</span>
                    </div>

                    {/* Steps */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
                        <FiBook className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-semibold text-gray-700">{article.steps.length} steps</span>
                    </div>

                    {/* Roles */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
                        <FiUsers className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-semibold text-gray-700">{article.roles.join(', ')}</span>
                    </div>
                </div>

                {/* Tags & Read More */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                        {article.tags.slice(0, 3).map((tag, idx) => (
                            <span
                                key={idx}
                                className="px-2.5 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>

                    {/* Read more indicator */}
                    <div className="flex items-center gap-2 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-xs font-bold">Read more</span>
                        <FiArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}
