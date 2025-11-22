"use client";

import React from "react";
import { FiCheck, FiCircle } from "react-icons/fi";

export type DispenseStep = "intake" | "verify" | "fill" | "label" | "check" | "release";

interface StepConfig {
    id: DispenseStep;
    label: string;
    shortLabel: string;
}

const STEPS: StepConfig[] = [
    { id: "intake", label: "Intake", shortLabel: "Intake" },
    { id: "verify", label: "Verify", shortLabel: "Verify" },
    { id: "fill", label: "Fill", shortLabel: "Fill" },
    { id: "label", label: "Label", shortLabel: "Label" },
    { id: "check", label: "Check", shortLabel: "Check" },
    { id: "release", label: "Release", shortLabel: "Release" }
];

interface StepIndicatorProps {
    currentStep: DispenseStep;
    completedSteps: DispenseStep[];
    compact?: boolean;
}

export default function StepIndicator({ currentStep, completedSteps, compact = false }: StepIndicatorProps) {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);

    return (
        <div className="w-full">
            {/* Desktop View */}
            <div className="hidden md:flex items-center justify-between">
                {STEPS.map((step, index) => {
                    const isCompleted = completedSteps.includes(step.id);
                    const isCurrent = step.id === currentStep;
                    const isPast = index < currentIndex;
                    const isFuture = index > currentIndex;

                    return (
                        <React.Fragment key={step.id}>
                            {/* Step Circle */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${isCompleted
                                            ? "bg-green-600 text-white"
                                            : isCurrent
                                                ? "bg-blue-600 text-white ring-4 ring-blue-100"
                                                : isPast
                                                    ? "bg-gray-400 text-white"
                                                    : "bg-gray-200 text-gray-500"
                                        }`}
                                >
                                    {isCompleted ? (
                                        <FiCheck className="h-5 w-5" />
                                    ) : (
                                        <span className="text-sm">{index + 1}</span>
                                    )}
                                </div>
                                <div
                                    className={`mt-2 text-sm font-medium ${isCurrent ? "text-blue-700" : isCompleted ? "text-green-700" : "text-gray-600"
                                        }`}
                                >
                                    {step.label}
                                </div>
                            </div>

                            {/* Connector Line */}
                            {index < STEPS.length - 1 && (
                                <div className="flex-1 h-1 mx-2 relative top-[-16px]">
                                    <div
                                        className={`h-full transition-all ${completedSteps.includes(STEPS[index + 1].id) || index < currentIndex
                                                ? "bg-green-600"
                                                : "bg-gray-200"
                                            }`}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Mobile View */}
            <div className="md:hidden">
                <div className="flex items-center gap-2 mb-2">
                    {STEPS.map((step, index) => {
                        const isCompleted = completedSteps.includes(step.id);
                        const isCurrent = step.id === currentStep;

                        return (
                            <div
                                key={step.id}
                                className={`flex-1 h-2 rounded-full transition-all ${isCompleted
                                        ? "bg-green-600"
                                        : isCurrent
                                            ? "bg-blue-600"
                                            : "bg-gray-200"
                                    }`}
                            />
                        );
                    })}
                </div>
                <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900">
                        Step {currentIndex + 1} of {STEPS.length}: {STEPS[currentIndex].label}
                    </div>
                </div>
            </div>
        </div>
    );
}
