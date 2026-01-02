"use client";

import React, { useState, useEffect } from "react";
import { FiCommand, FiArrowRight } from "react-icons/fi";
import { toast } from 'react-hot-toast';
import QueueTabs, { DispenseStep } from "@/components/dispense/QueueTabs";
import QueueList from "@/components/dispense/QueueList";
import DispenseDetailPanel from "@/components/dispense/DispenseDetailPanel";
import DispenseContextDrawer from "@/components/dispense/DispenseContextDrawer";

const initialCounts = {
    intake: { total: 0, urgent: 0 },
    verify: { total: 0, urgent: 0 },
    fill: { total: 0, urgent: 0 },
    label: { total: 0, urgent: 0 },
    check: { total: 0, urgent: 0 },
    release: { total: 0, urgent: 0 }
};

export default function DispensePage() {
    const [activeStep, setActiveStep] = useState<DispenseStep>("intake");
    const [selectedId, setSelectedId] = useState<string | undefined>();
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
    const [showShortcuts, setShowShortcuts] = useState(false);

    const [prescriptions, setPrescriptions] = useState<Record<DispenseStep, any[]>>({ intake: [], verify: [], fill: [], label: [], check: [], release: [] });
    const [queueCounts, setQueueCounts] = useState(initialCounts);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Simulate fetching data for all queues
        const timer = setTimeout(() => {
            setPrescriptions({ intake: [], verify: [], fill: [], label: [], check: [], release: [] });
            setQueueCounts(initialCounts);
            setIsLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const currentQueue = prescriptions[activeStep] || [];
    const selectedPrescription = currentQueue.find(p => p.id === selectedId);

    // Auto-select first item when changing steps or after loading
    useEffect(() => {
        if (!isLoading && currentQueue.length > 0 && !currentQueue.some(p => p.id === selectedId)) {
            setSelectedId(currentQueue[0].id);
        } else if (!isLoading && currentQueue.length === 0) {
            setSelectedId(undefined);
        }
    }, [activeStep, currentQueue, selectedId, isLoading]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isLoading) return; // Disable shortcuts while loading

            if (e.key >= "1" && e.key <= "6" && !e.metaKey && !e.ctrlKey) {
                const steps: DispenseStep[] = ["intake", "verify", "fill", "label", "check", "release"];
                setActiveStep(steps[parseInt(e.key) - 1]);
                return;
            }

            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                const currentIndex = currentQueue.findIndex(p => p.id === selectedId);
                if (e.key === "ArrowUp" && currentIndex > 0) {
                    setSelectedId(currentQueue[currentIndex - 1].id);
                } else if (e.key === "ArrowDown" && currentIndex < currentQueue.length - 1) {
                    setSelectedId(currentQueue[currentIndex + 1].id);
                }
                return;
            }

            if ((e.metaKey || e.ctrlKey) && e.key === "/") {
                e.preventDefault();
                setShowShortcuts(!showShortcuts);
                return;
            }

            if ((e.metaKey || e.ctrlKey) && e.key === "d") {
                e.preventDefault();
                setIsDrawerOpen(!isDrawerOpen);
                return;
            }

            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleAction("primary");
                return;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeStep, selectedId, currentQueue, showShortcuts, isDrawerOpen, isLoading]);

    const handleAction = (action: string, data?: any) => {
        console.log(`Action: ${action}`, data);
        if (action === "primary") {
            toast.success("Moving prescription to next step...", {
                icon: <FiArrowRight className="text-white" size={20} />,
                duration: 2000
            });
            const currentIndex = currentQueue.findIndex(p => p.id === selectedId);
            if (currentIndex < currentQueue.length - 1) {
                setSelectedId(currentQueue[currentIndex + 1].id);
            }
        }
    };

    const totalCount = Object.values(queueCounts).reduce((sum, c) => sum + c.total, 0);
    const urgentCount = Object.values(queueCounts).reduce((sum, c) => sum + c.urgent, 0);

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dispense Workflow</h1>
                        <p className="text-sm text-gray-500">Unified prescription processing pipeline</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Stats */}
                        <div className="flex items-center gap-3 text-sm">
                            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg min-w-[100px] text-center">
                                <span className="text-gray-600">Total:</span>
                                {isLoading ? <span className="ml-2 font-bold text-blue-700 animate-pulse">...</span> : <span className="ml-2 font-bold text-blue-700">{totalCount}</span>}
                            </div>
                            <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg min-w-[100px] text-center">
                                <span className="text-gray-600">Urgent:</span>
                                {isLoading ? <span className="ml-2 font-bold text-red-700 animate-pulse">...</span> : <span className="ml-2 font-bold text-red-700">{urgentCount}</span>}
                            </div>
                        </div>

                        {/* Shortcuts Button */}
                        <button
                            onClick={() => setShowShortcuts(!showShortcuts)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            <FiCommand className="h-4 w-4" />
                            Shortcuts
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Queue Tabs */}
                <div className="w-64 shrink-0">
                    <QueueTabs
                        activeStep={activeStep}
                        onStepChange={(step) => {
                            setActiveStep(step);
                        }}
                        counts={queueCounts}
                        isLoading={isLoading}
                    />
                </div>

                {/* Left-Center: Queue List */}
                <div className="w-80 shrink-0 border-r border-gray-200 bg-white">
                    <QueueList
                        step={activeStep}
                        items={currentQueue}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        isLoading={isLoading}
                    />
                </div>

                {/* Center: Detail Panel */}
                <div className="flex-1 overflow-hidden">
                    <DispenseDetailPanel
                        step={activeStep}
                        prescription={selectedPrescription || null}
                        onAction={handleAction}
                        isLoading={isLoading && !selectedPrescription}
                    />
                </div>

                {/* Right: Context Drawer */}
                {isDrawerOpen && (
                    <DispenseContextDrawer
                        prescription={selectedPrescription}
                        step={activeStep}
                        isOpen={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        isLoading={isLoading && !selectedPrescription}
                    />
                )}
            </div>

            {/* Keyboard Shortcuts Modal */}
            {showShortcuts && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setShowShortcuts(false)}
                >
                    <div
                        className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Keyboard Shortcuts</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Navigation</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span>Switch to Intake</span>
                                        <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded font-mono">1</kbd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Switch to Verify</span>
                                        <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded font-mono">2</kbd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Switch to Fill</span>
                                        <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded font-mono">3</kbd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Navigate queue</span>
                                        <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded font-mono">↑↓</kbd>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span>Complete step</span>
                                        <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded font-mono">⌘↵</kbd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Toggle drawer</span>
                                        <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded font-mono">⌘D</kbd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Show shortcuts</span>
                                        <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded font-mono">⌘/</kbd>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowShortcuts(false)}
                            className="mt-6 w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
