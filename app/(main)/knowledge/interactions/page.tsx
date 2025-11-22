import React from "react";
import Link from "next/link";
import { FiArrowLeft, FiActivity, FiAlertTriangle } from "react-icons/fi";
import InteractionChecker from "@/components/knowledge/InteractionChecker";

export default function InteractionsPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <Link
                            href="/knowledge"
                            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FiArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <FiActivity className="text-blue-600" /> Interaction Checker
                            </h1>
                            <p className="text-sm text-gray-500">
                                Screen for drug-drug, drug-food, and drug-condition interactions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Checker - Takes up 2/3 width */}
                    <div className="lg:col-span-2">
                        <InteractionChecker />
                    </div>

                    {/* Sidebar - Educational Content */}
                    <div className="space-y-6">
                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <FiAlertTriangle className="h-4 w-4" /> Why Check?
                            </h3>
                            <p className="text-sm text-blue-800 mb-4 leading-relaxed">
                                Drug interactions are a leading cause of preventable adverse drug events. Always check whenever adding a new medication to a patient's regimen.
                            </p>
                            <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                                Updated: Nov 2025
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Common High-Risk Pairs</h3>
                            <ul className="space-y-3">
                                <li className="text-sm">
                                    <span className="block font-medium text-gray-800">Warfarin + NSAIDs</span>
                                    <span className="text-gray-500 text-xs">Increased bleeding risk</span>
                                </li>
                                <li className="text-sm border-t border-gray-100 pt-3">
                                    <span className="block font-medium text-gray-800">ACE Inhibitors + Potassium</span>
                                    <span className="text-gray-500 text-xs">Hyperkalemia risk</span>
                                </li>
                                <li className="text-sm border-t border-gray-100 pt-3">
                                    <span className="block font-medium text-gray-800">Digoxin + Amiodarone</span>
                                    <span className="text-gray-500 text-xs">Digoxin toxicity</span>
                                </li>
                                <li className="text-sm border-t border-gray-100 pt-3">
                                    <span className="block font-medium text-gray-800">Sildenafil + Nitrates</span>
                                    <span className="text-gray-500 text-xs">Severe hypotension</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
