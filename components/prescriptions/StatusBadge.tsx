"use client";

import React from "react";
import {
    FiFileText,
    FiCheckCircle,
    FiPackage,
    FiArchive,
    FiPauseCircle,
    FiSmartphone
} from "react-icons/fi";

export type PrescriptionStatus = "new" | "verified" | "ready" | "completed" | "on-hold" | "e-rx";

interface StatusBadgeProps {
    status: PrescriptionStatus;
    size?: "sm" | "md" | "lg";
}

const statusConfig = {
    new: {
        label: "New",
        icon: FiFileText,
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
        badge: "bg-blue-100 text-blue-800"
    },
    verified: {
        label: "Verified",
        icon: FiCheckCircle,
        color: "text-green-700",
        bg: "bg-green-50",
        border: "border-green-200",
        badge: "bg-green-100 text-green-800"
    },
    ready: {
        label: "Ready",
        icon: FiPackage,
        color: "text-purple-700",
        bg: "bg-purple-50",
        border: "border-purple-200",
        badge: "bg-purple-100 text-purple-800"
    },
    completed: {
        label: "Completed",
        icon: FiArchive,
        color: "text-gray-700",
        bg: "bg-gray-50",
        border: "border-gray-200",
        badge: "bg-gray-100 text-gray-800"
    },
    "on-hold": {
        label: "On Hold",
        icon: FiPauseCircle,
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
        badge: "bg-amber-100 text-amber-800"
    },
    "e-rx": {
        label: "e-Rx",
        icon: FiSmartphone,
        color: "text-cyan-700",
        bg: "bg-cyan-50",
        border: "border-cyan-200",
        badge: "bg-cyan-100 text-cyan-800"
    }
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
    const config = statusConfig[status];
    const Icon = config.icon;

    const sizeClasses = {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
        lg: "px-3 py-1.5 text-base"
    };

    const iconSizes = {
        sm: 12,
        md: 14,
        lg: 16
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.badge} ${sizeClasses[size]}`}
            title={`Status: ${config.label}`}
        >
            <Icon size={iconSizes[size]} />
            {config.label}
        </span>
    );
}
