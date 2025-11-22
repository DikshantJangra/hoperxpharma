"use client";

import React from "react";
import { FiTrendingUp, FiTrendingDown, FiAlertCircle } from "react-icons/fi";

interface GSTSummaryCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    status?: "success" | "warning" | "error" | "info";
    icon?: React.ReactNode;
    onClick?: () => void;
}

const STATUS_COLORS = {
    success: {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-900",
        subtext: "text-green-700",
        icon: "text-green-600"
    },
    warning: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-900",
        subtext: "text-amber-700",
        icon: "text-amber-600"
    },
    error: {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-900",
        subtext: "text-red-700",
        icon: "text-red-600"
    },
    info: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-900",
        subtext: "text-blue-700",
        icon: "text-blue-600"
    }
};

export default function GSTSummaryCard({
    title,
    value,
    subtitle,
    trend,
    status = "info",
    icon,
    onClick
}: GSTSummaryCardProps) {
    const colors = STATUS_COLORS[status];

    return (
        <div
            className={`${colors.bg} border-2 ${colors.border} rounded-xl p-6 ${onClick ? "cursor-pointer hover:shadow-lg transition-all" : ""
                }`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {title}
                </h3>
                {icon && <div className={colors.icon}>{icon}</div>}
            </div>

            <div className={`text-3xl font-bold ${colors.text} mb-2`}>
                {typeof value === "number" ? `₹${value.toLocaleString("en-IN")}` : value}
            </div>

            {subtitle && (
                <p className={`text-sm ${colors.subtext}`}>{subtitle}</p>
            )}

            {trend && (
                <div className="flex items-center gap-2 mt-3">
                    {trend.isPositive ? (
                        <FiTrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                        <FiTrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span
                        className={`text-sm font-semibold ${trend.isPositive ? "text-green-700" : "text-red-700"
                            }`}
                    >
                        {trend.isPositive ? "+" : ""}
                        {trend.value}%
                    </span>
                    <span className="text-xs text-gray-600">vs last period</span>
                </div>
            )}
        </div>
    );
}
