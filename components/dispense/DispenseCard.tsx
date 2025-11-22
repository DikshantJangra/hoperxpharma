"use client";

import React from "react";
import Link from "next/link";
import { FiUser, FiClock, FiAlertCircle, FiArrowRight } from "react-icons/fi";
import { DispenseStep } from "./StepIndicator";

interface DispenseCardProps {
    prescriptionId: string;
    patientName: string;
    currentStep: DispenseStep;
    assignedTo?: string;
    timeInQueue: number; // minutes
    priority: "normal" | "urgent";
    isControlled?: boolean;
    drugCount: number;
    onQuickAction?: () => void;
}

const STEP_LABELS: Record<DispenseStep, string> = {
    intake: "Intake",
    verify: "Verify",
    fill: "Fill",
    label: "Label",
    check: "Check",
    release: "Release"
};

const STEP_COLORS: Record<DispenseStep, string> = {
    intake: "blue",
    verify: "purple",
    fill: "cyan",
    label: "indigo",
    check: "green",
    release: "emerald"
};

export default function DispenseCard({
    prescriptionId,
    patientName,
    currentStep,
    assignedTo,
    timeInQueue,
    priority,
    isControlled = false,
    drugCount,
    onQuickAction
}: DispenseCardProps) {
    const stepColor = STEP_COLORS[currentStep];
    const stepLabel = STEP_LABELS[currentStep];

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    return (
        <div
            className={`bg-white border-2 rounded-xl p-5 hover:shadow-lg transition-all ${priority === "urgent" ? "border-red-200 bg-red-50/30" : "border-gray-200"
                }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-lg">{patientName}</h3>
                        {priority === "urgent" && (
                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
                                URGENT
                            </span>
                        )}
                        {isControlled && (
                            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">
                                CONTROLLED
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600">Rx #{prescriptionId}</p>
                </div>
                <div className={`px-3 py-1.5 bg-${stepColor}-100 text-${stepColor}-700 rounded-lg font-semibold text-sm`}>
                    {stepLabel}
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                    <div className="text-gray-500 mb-1">Drugs</div>
                    <div className="font-semibold text-gray-900">{drugCount} items</div>
                </div>
                <div>
                    <div className="text-gray-500 mb-1">Time in Queue</div>
                    <div className={`font-semibold ${timeInQueue > 60 ? "text-red-700" : "text-gray-900"}`}>
                        {formatTime(timeInQueue)}
                    </div>
                </div>
            </div>

            {assignedTo && (
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-700">
                    <FiUser className="h-4 w-4 text-gray-400" />
                    <span>Assigned to: <span className="font-medium">{assignedTo}</span></span>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <Link
                    href={`/dispense/${currentStep}/${prescriptionId}`}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center"
                >
                    View Details
                </Link>
                {onQuickAction && (
                    <button
                        onClick={onQuickAction}
                        className={`flex-1 px-4 py-2 bg-${stepColor}-600 text-white rounded-lg text-sm font-medium hover:bg-${stepColor}-700 transition-colors flex items-center justify-center gap-2`}
                    >
                        Process
                        <FiArrowRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
