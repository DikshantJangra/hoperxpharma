"use client";

import React from "react";
import { FiInbox, FiCheckCircle, FiPackage, FiTag, FiShield, FiSend } from "react-icons/fi";

export type DispenseStep = "intake" | "verify" | "fill" | "label" | "check" | "release";

interface QueueCount {
    total: number;
    urgent: number;
}

interface QueueTabsProps {
    activeStep: DispenseStep;
    onStepChange: (step: DispenseStep) => void;
    counts: Record<DispenseStep, QueueCount>;
    isLoading: boolean;
}

const STEP_CONFIG: Record<DispenseStep, { label: string; icon: any; color: string; shortcut: string }> = {
    intake: { label: "Intake", icon: FiInbox, color: "blue", shortcut: "1" },
    verify: { label: "Verify", icon: FiCheckCircle, color: "purple", shortcut: "2" },
    fill: { label: "Fill", icon: FiPackage, color: "cyan", shortcut: "3" },
    label: { label: "Label", icon: FiTag, color: "indigo", shortcut: "4" },
    check: { label: "Check", icon: FiShield, color: "green", shortcut: "5" },
    release: { label: "Release", icon: FiSend, color: "emerald", shortcut: "6" }
};

export default function QueueTabs({ activeStep, onStepChange, counts, isLoading }: QueueTabsProps) {
    return (
        <div className="h-full bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Workflow Steps</h2>
                <p className="text-xs text-gray-500 mt-1">Press 1-6 to switch</p>
            </div>

            {/* Tabs */}
            <div className={`flex-1 overflow-y-auto ${isLoading ? 'animate-pulse' : ''}`}>
                {(Object.keys(STEP_CONFIG) as DispenseStep[]).map((step) => {
                    const config = STEP_CONFIG[step];
                    const Icon = config.icon;
                    const count = counts[step];
                    const isActive = activeStep === step;

                    return (
                        <button
                            key={step}
                            onClick={() => onStepChange(step)}
                            className={`w-full px-4 py-4 flex items-center gap-3 border-l-4 transition-all ${isActive
                                    ? `border-${config.color}-600 bg-${config.color}-50`
                                    : "border-transparent hover:bg-gray-50"
                                }`}
                            disabled={isLoading}
                        >
                            <div
                                className={`p-2 rounded-lg ${isActive ? `bg-${config.color}-100` : "bg-gray-100"
                                    }`}
                            >
                                <Icon
                                    className={`h-5 w-5 ${isActive ? `text-${config.color}-700` : "text-gray-600"
                                        }`}
                                />
                            </div>

                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`font-semibold text-sm ${isActive ? `text-${config.color}-900` : "text-gray-700"
                                            }`}
                                    >
                                        {config.label}
                                    </span>
                                    <span className="text-xs text-gray-400 font-mono">
                                        [{config.shortcut}]
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    {isLoading ? (
                                        <span className="text-xs font-semibold h-4 bg-gray-200 rounded-md w-8"></span>
                                    ) : (
                                        <span
                                            className={`text-xs font-semibold ${isActive ? `text-${config.color}-700` : "text-gray-600"
                                                }`}
                                        >
                                            {count.total}
                                        </span>
                                    )}
                                    
                                    {isLoading ? (
                                        <span className="h-4 bg-gray-200 rounded-md w-16"></span>
                                    ) : (
                                        count.urgent > 0 && (
                                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
                                                {count.urgent} urgent
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="text-xs text-gray-600 space-y-1">
                    <div className="font-semibold mb-2">Quick Keys</div>
                    <div className="flex items-center justify-between">
                        <span>Select item</span>
                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">
                            ↑↓
                        </kbd>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Complete step</span>
                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">
                            ⌘↵
                        </kbd>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Show all</span>
                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">
                            ⌘/
                        </kbd>
                    </div>
                </div>
            </div>
        </div>
    );
}
