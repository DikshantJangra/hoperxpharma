"use client";

import React from "react";
import { FiAlertTriangle, FiAlertCircle, FiInfo, FiActivity, FiShield } from "react-icons/fi";

export interface Interaction {
    id: string;
    pair: [string, string];
    severity: "Major" | "Moderate" | "Minor";
    mechanism: string;
    guidance: string;
    description: string;
}

interface InteractionResultProps {
    interaction: Interaction;
}

export default function InteractionResult({ interaction }: InteractionResultProps) {
    const severityConfig = {
        Major: {
            color: "text-red-700",
            bg: "bg-red-50",
            border: "border-red-200",
            icon: FiAlertTriangle,
            badge: "bg-red-100 text-red-800"
        },
        Moderate: {
            color: "text-amber-700",
            bg: "bg-amber-50",
            border: "border-amber-200",
            icon: FiAlertCircle,
            badge: "bg-amber-100 text-amber-800"
        },
        Minor: {
            color: "text-yellow-700",
            bg: "bg-yellow-50",
            border: "border-yellow-200",
            icon: FiInfo,
            badge: "bg-yellow-100 text-yellow-800"
        }
    };

    const config = severityConfig[interaction.severity];
    const Icon = config.icon;

    return (
        <div className={`rounded-xl border ${config.border} ${config.bg} p-5 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-white/60 ${config.color} shrink-0`}>
                    <Icon className="h-6 w-6" />
                </div>

                <div className="flex-grow">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h3 className={`text-lg font-bold ${config.color}`}>
                            {interaction.pair[0]} + {interaction.pair[1]}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border border-transparent ${config.badge}`}>
                            {interaction.severity} Interaction
                        </span>
                    </div>

                    <p className="text-gray-700 mb-4 leading-relaxed">
                        {interaction.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-white/60 rounded-lg p-3 border border-black/5">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                                <FiActivity className="h-3 w-3" /> Mechanism
                            </h4>
                            <p className="text-sm text-gray-800 font-medium">
                                {interaction.mechanism}
                            </p>
                        </div>

                        <div className="bg-white/60 rounded-lg p-3 border border-black/5">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                                <FiShield className="h-3 w-3" /> Clinical Guidance
                            </h4>
                            <p className="text-sm text-gray-800 font-medium">
                                {interaction.guidance}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
