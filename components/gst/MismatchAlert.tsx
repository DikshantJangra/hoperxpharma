"use client";

import React from "react";
import { FiAlertTriangle, FiAlertCircle, FiInfo, FiX, FiCheckCircle } from "react-icons/fi";

export type MismatchSeverity = "critical" | "warning" | "info";
export type MismatchType = "gstr1_vs_3b" | "itc_vs_2b" | "tax_rate" | "einvoice";

export interface Mismatch {
    id: string;
    type: MismatchType;
    severity: MismatchSeverity;
    title: string;
    description: string;
    expected: string | number;
    actual: string | number;
    suggestion?: string;
    canAutoFix?: boolean;
}

interface MismatchAlertProps {
    mismatch: Mismatch;
    onFix?: (id: string) => void;
    onDismiss?: (id: string) => void;
}

const SEVERITY_CONFIG = {
    critical: {
        icon: FiAlertTriangle,
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-900",
        badge: "bg-red-100 text-red-800",
        button: "bg-red-600 hover:bg-red-700"
    },
    warning: {
        icon: FiAlertCircle,
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-900",
        badge: "bg-amber-100 text-amber-800",
        button: "bg-amber-600 hover:bg-amber-700"
    },
    info: {
        icon: FiInfo,
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-900",
        badge: "bg-blue-100 text-blue-800",
        button: "bg-blue-600 hover:bg-blue-700"
    }
};

const TYPE_LABELS = {
    gstr1_vs_3b: "GSTR-1 vs GSTR-3B Mismatch",
    itc_vs_2b: "ITC vs GSTR-2B Discrepancy",
    tax_rate: "Tax Rate Error",
    einvoice: "E-Invoice Failure"
};

export default function MismatchAlert({ mismatch, onFix, onDismiss }: MismatchAlertProps) {
    const config = SEVERITY_CONFIG[mismatch.severity];
    const Icon = config.icon;

    return (
        <div className={`${config.bg} border-2 ${config.border} rounded-xl p-5`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                    <Icon className={`h-6 w-6 text-${mismatch.severity === "critical" ? "red" : mismatch.severity === "warning" ? "amber" : "blue"}-600 mt-0.5 shrink-0`} />
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-bold ${config.text}`}>{mismatch.title}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.badge}`}>
                                {TYPE_LABELS[mismatch.type]}
                            </span>
                        </div>
                        <p className={`text-sm ${config.text} leading-relaxed`}>
                            {mismatch.description}
                        </p>
                    </div>
                </div>
                {onDismiss && (
                    <button
                        onClick={() => onDismiss(mismatch.id)}
                        className="p-1 rounded-lg hover:bg-gray-200 transition-colors ml-2"
                    >
                        <FiX className="h-5 w-5 text-gray-600" />
                    </button>
                )}
            </div>

            {/* Expected vs Actual */}
            <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Expected</div>
                    <div className="text-lg font-bold text-gray-900">
                        {typeof mismatch.expected === "number"
                            ? `₹${mismatch.expected.toLocaleString("en-IN")}`
                            : mismatch.expected}
                    </div>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Actual</div>
                    <div className="text-lg font-bold text-red-700">
                        {typeof mismatch.actual === "number"
                            ? `₹${mismatch.actual.toLocaleString("en-IN")}`
                            : mismatch.actual}
                    </div>
                </div>
            </div>

            {/* Suggestion */}
            {mismatch.suggestion && (
                <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <FiCheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900 mb-1">Suggested Fix:</p>
                            <p className="text-sm text-gray-700">{mismatch.suggestion}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            {(mismatch.canAutoFix && onFix) && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <button
                        onClick={() => onFix(mismatch.id)}
                        className={`w-full px-4 py-2 text-white rounded-lg font-semibold transition-colors ${config.button}`}
                    >
                        Auto-Fix This Issue
                    </button>
                </div>
            )}
        </div>
    );
}
