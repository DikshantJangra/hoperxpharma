import React from 'react';
import { FiCheckCircle, FiCircle } from 'react-icons/fi';

interface StepIndicatorProps {
    currentStep: string;
    steps: { key: string; label: string; icon?: React.ReactNode }[];
    onStepClick?: (step: string) => void;
}

const StepIndicator = ({ currentStep, steps, onStepClick }: StepIndicatorProps) => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-full p-4 flex flex-col">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">Workflow</h3>

            <div className="space-y-1 relative">
                {/* Progress Line */}
                <div className="absolute left-3.5 top-2 bottom-6 w-0.5 bg-gray-100 -z-10"></div>
                <div
                    className="absolute left-3.5 top-2 w-0.5 bg-teal-500 -z-10 transition-all duration-300 ease-in-out"
                    style={{ height: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isActive = step.key === currentStep;

                    return (
                        <div
                            key={step.key}
                            onClick={() => onStepClick && isCompleted ? onStepClick(step.key) : null}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors relative ${isActive ? 'bg-teal-50 text-teal-800' :
                                    isCompleted ? 'text-gray-600 hover:bg-gray-50 cursor-pointer' : 'text-gray-400'
                                }`}
                        >
                            <div className={`relative z-10 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-teal-500 ring-4 ring-teal-100' :
                                    isCompleted ? 'bg-teal-500' : 'bg-gray-200'
                                }`}>
                                {isCompleted ? (
                                    <FiCheckCircle className="text-white w-3 h-3" />
                                ) : isActive ? (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                ) : (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                )}
                            </div>

                            <span className={`text-sm font-medium ${isActive ? 'text-teal-900' : ''}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-auto bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Next Step</p>
                <p className="text-sm font-semibold text-gray-800">
                    {steps[currentIndex + 1]?.label || 'Complete'}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                    Press <kbd className="font-mono bg-white border border-gray-300 rounded px-1">Enter</kbd> to continue
                </p>
            </div>
        </div>
    );
};

export default StepIndicator;
