'use client';

import React from 'react';
import { Insight } from '@/lib/api/salesAnalytics';
import { HiOutlineArrowRight } from 'react-icons/hi2';

interface EnhancedInsightsPanelProps {
    insights: Insight[];
    onInsightClick?: (insight: Insight) => void;
}

export default function EnhancedInsightsPanel({ insights, onInsightClick }: EnhancedInsightsPanelProps) {
    if (!insights || insights.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights</h3>
                <div className="text-center text-gray-500 py-8">
                    <p>No insights available for this period</p>
                </div>
            </div>
        );
    }

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-900',
                    badge: 'bg-red-100 text-red-800'
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-900',
                    badge: 'bg-yellow-100 text-yellow-800'
                };
            case 'success':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    text: 'text-green-900',
                    badge: 'bg-green-100 text-green-800'
                };
            default:
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    text: 'text-blue-900',
                    badge: 'bg-blue-100 text-blue-800'
                };
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Insights</h3>
                <span className="text-sm text-gray-500">{insights.length} insights</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {insights.map((insight, index) => {
                    const styles = getSeverityStyles(insight.severity);

                    return (
                        <div
                            key={index}
                            className={`${styles.bg} border ${styles.border} rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer`}
                            onClick={() => onInsightClick?.(insight)}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{insight.icon}</span>
                                    <h4 className={`font-semibold ${styles.text}`}>{insight.title}</h4>
                                </div>
                                {insight.severity && (
                                    <span className={`text-xs px-2 py-1 rounded-full ${styles.badge} uppercase font-semibold`}>
                                        {insight.severity}
                                    </span>
                                )}
                            </div>

                            {/* Message */}
                            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                                {insight.message}
                            </p>

                            {/* Products list (if applicable) */}
                            {insight.products && insight.products.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs text-gray-600 mb-1 font-semibold">Affected products:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {insight.products.slice(0, 3).map((product, idx) => (
                                            <span
                                                key={idx}
                                                className="text-xs bg-white border border-gray-300 rounded px-2 py-1"
                                            >
                                                {product}
                                            </span>
                                        ))}
                                        {insight.products.length > 3 && (
                                            <span className="text-xs text-gray-500 px-2 py-1">
                                                +{insight.products.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action */}
                            {insight.action && (
                                <button
                                    className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onInsightClick?.(insight);
                                    }}
                                >
                                    <span>{insight.action.label}</span>
                                    <HiOutlineArrowRight className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
