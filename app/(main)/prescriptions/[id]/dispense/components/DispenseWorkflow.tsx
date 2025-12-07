'use client';

import React, { useState } from 'react';
import StepIndicator from './StepIndicator';
import IntakeStep from './steps/IntakeStep';
import VerifyStep from './steps/VerifyStep';
import FillStep from './steps/FillStep';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiCheckCircle } from 'react-icons/fi';

interface DispenseWorkflowProps {
    prescription: any;
}

const STEPS = [
    { key: 'intake', label: 'Intake' },
    { key: 'verify', label: 'Verify' },
    { key: 'fill', label: 'Pick & Count' },
    { key: 'label', label: 'Label' },
    { key: 'check', label: 'Final Check' },
    { key: 'release', label: 'Release' }
];

const DispenseWorkflow = ({ prescription }: DispenseWorkflowProps) => {
    const [currentStep, setCurrentStep] = useState('intake');
    const router = useRouter();

    const handleNext = () => {
        const currentIndex = STEPS.findIndex(s => s.key === currentStep);
        if (currentIndex < STEPS.length - 1) {
            setCurrentStep(STEPS[currentIndex + 1].key);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        toast.success('Dispense workflow completed!');
        router.push('/prescriptions/queue');
    };

    const renderStep = () => {
        switch (currentStep) {
            case 'intake':
                return <IntakeStep prescription={prescription} onComplete={handleNext} />;
            case 'verify':
                return <VerifyStep prescription={prescription} onComplete={handleNext} />;
            case 'fill':
                return <FillStep prescription={prescription} onComplete={handleNext} />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <FiCheckCircle className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400">Step In Development</h3>
                        <p className="text-gray-400 mt-2">The {STEPS.find(s => s.key === currentStep)?.label} step is coming soon.</p>
                        <button
                            onClick={handleNext}
                            className="mt-6 text-teal-600 hover:text-teal-700 font-medium"
                        >
                            Skip to next step &rarr;
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <StepIndicator
                currentStep={currentStep}
                steps={STEPS}
            />

            <div className="flex-1 overflow-y-auto p-8">
                {renderStep()}
            </div>
        </div>
    );
};

export default DispenseWorkflow;
