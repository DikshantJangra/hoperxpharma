"use client";

import React from "react";
import {
    FiAlertTriangle,
    FiAlertCircle,
    FiInfo,
    FiShield,
    FiX
} from "react-icons/fi";

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertType = "interaction" | "allergy" | "lasa" | "dosage" | "controlled";

export interface SafetyAlert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    recommendation?: string;
    canOverride?: boolean;
}

interface SafetyAlertsProps {
    alerts: SafetyAlert[];
    onDismiss?: (alertId: string) => void;
    onOverride?: (alertId: string) => void;
}

const SEVERITY_CONFIG = {
    critical: {
        icon: FiAlertTriangle,
        color: "red",
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-900",
        badge: "bg-red-100 text-red-800"
    },
    warning: {
        icon: FiAlertCircle,
        color: "amber",
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-900",
        badge: "bg-amber-100 text-amber-800"
    },
    info: {
        icon: FiInfo,
        color: "blue",
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-900",
        badge: "bg-blue-100 text-blue-800"
    }
};

const TYPE_LABELS = {
    interaction: "Drug Interaction",
    allergy: "Allergy Alert",
    lasa: "Look-Alike/Sound-Alike",
    dosage: "Dosage Warning",
    controlled: "Controlled Substance"
};

export default function SafetyAlerts({ alerts, onDismiss, onOverride }: SafetyAlertsProps) {
    if (alerts.length === 0) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <FiShield className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-green-900 mb-1">No Safety Alerts</h3>
                <p className="text-sm text-green-700">All safety checks passed</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FiAlertTriangle className="h-5 w-5 text-red-600" />
                    Safety Alerts ({alerts.length})
                </h3>
            </div>

            {alerts.map((alert) => {
                const config = SEVERITY_CONFIG[alert.severity];
                const Icon = config.icon;

                return (
                    <div
                        key={alert.id}
                        className={`${config.bg} border-2 ${config.border} rounded-xl p-5`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                                <Icon className={`h-6 w-6 text-${config.color}-600 mt-0.5 shrink-0`} />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`font-bold ${config.text}`}>{alert.title}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.badge}`}>
                                            {TYPE_LABELS[alert.type]}
                                        </span>
                                    </div>
                                    <p className={`text-sm ${config.text} leading-relaxed`}>
                                        {alert.message}
                                    </p>
                                </div>
                            </div>
                            {onDismiss && (
                                <button
                                    onClick={() => onDismiss(alert.id)}
                                    className={`p-1 rounded-lg hover:bg-${config.color}-100 transition-colors`}
                                >
                                    <FiX className={`h-4 w-4 text-${config.color}-600`} />
                                </button>
                            )}
                        </div>

                        {alert.recommendation && (
                            <div className={`mt-3 p-3 bg-white border border-${config.color}-200 rounded-lg`}>
                                <p className="text-sm font-medium text-gray-900 mb-1">Recommendation:</p>
                                <p className="text-sm text-gray-700">{alert.recommendation}</p>
                            </div>
                        )}

                        {alert.canOverride && onOverride && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <button
                                    onClick={() => onOverride(alert.id)}
                                    className={`px-4 py-2 bg-${config.color}-600 text-white rounded-lg text-sm font-medium hover:bg-${config.color}-700 transition-colors`}
                                >
                                    Override with Justification
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
