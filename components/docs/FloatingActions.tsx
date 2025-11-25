"use client";

import { FiMaximize2, FiMinimize2, FiBookmark, FiPrinter, FiShare2 } from "react-icons/fi";

interface FloatingActionsProps {
    focusMode: boolean;
    onToggleFocus: () => void;
    isBookmarked: boolean;
    onToggleBookmark: () => void;
    onPrint?: () => void;
    onShare?: () => void;
    showInArticle?: boolean;
}

export default function FloatingActions({
    focusMode,
    onToggleFocus,
    isBookmarked,
    onToggleBookmark,
    onPrint,
    onShare,
    showInArticle = false,
}: FloatingActionsProps) {
    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
            {/* Focus Mode Toggle - Only in article view */}
            {showInArticle && (
                <button
                    onClick={onToggleFocus}
                    className="group relative w-14 h-14 rounded-2xl bg-white shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
                    title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                >
                    {focusMode ? (
                        <FiMinimize2 className="w-6 h-6 text-gray-700 group-hover:text-emerald-600 transition-colors" />
                    ) : (
                        <FiMaximize2 className="w-6 h-6 text-gray-700 group-hover:text-emerald-600 transition-colors" />
                    )}

                    {/* Tooltip */}
                    <div className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {focusMode ? "Exit Focus Mode" : "Focus Mode"}
                    </div>
                </button>
            )}

            {/* Bookmark - Only in article view */}
            {showInArticle && (
                <button
                    onClick={onToggleBookmark}
                    className="group relative w-14 h-14 rounded-2xl bg-white shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
                    title={isBookmarked ? "Remove Bookmark" : "Bookmark Article"}
                >
                    <FiBookmark
                        className={`w-6 h-6 transition-all duration-300 ${isBookmarked
                                ? "fill-emerald-600 text-emerald-600"
                                : "text-gray-700 group-hover:text-emerald-600"
                            }`}
                    />

                    {/* Tooltip */}
                    <div className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {isBookmarked ? "Remove Bookmark" : "Bookmark"}
                    </div>
                </button>
            )}

            {/* Print - Only in article view */}
            {showInArticle && onPrint && (
                <button
                    onClick={onPrint}
                    className="group relative w-14 h-14 rounded-2xl bg-white shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
                    title="Print Article"
                >
                    <FiPrinter className="w-6 h-6 text-gray-700 group-hover:text-emerald-600 transition-colors" />

                    {/* Tooltip */}
                    <div className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Print
                    </div>
                </button>
            )}

            {/* Share - Only in article view */}
            {showInArticle && onShare && (
                <button
                    onClick={onShare}
                    className="group relative w-14 h-14 rounded-2xl bg-white shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
                    title="Share Article"
                >
                    <FiShare2 className="w-6 h-6 text-gray-700 group-hover:text-emerald-600 transition-colors" />

                    {/* Tooltip */}
                    <div className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Share
                    </div>
                </button>
            )}
        </div>
    );
}
