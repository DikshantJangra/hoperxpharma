"use client";

import React, { useState, useEffect } from "react";
import { FiX, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import DrugMultiSearch from "./DrugMultiSearch";
import InteractionResult, { Interaction } from "./InteractionResult";

// Mock Interaction Database
const MOCK_INTERACTIONS: Interaction[] = [
    {
        id: "1",
        pair: ["Warfarin", "Aspirin"],
        severity: "Major",
        mechanism: "Pharmacodynamic synergism. Both agents inhibit platelet function and impair hemostasis.",
        guidance: "Avoid concurrent use if possible. If combination is necessary, monitor INR closely and watch for signs of bleeding.",
        description: "Concurrent use significantly increases the risk of major bleeding events, including gastrointestinal bleeding and intracranial hemorrhage."
    },
    {
        id: "2",
        pair: ["Metformin", "Alcohol"],
        severity: "Moderate",
        mechanism: "Additive effect on lactate metabolism.",
        guidance: "Limit alcohol consumption. Excessive intake increases risk of lactic acidosis.",
        description: "Alcohol potentiates the effect of metformin on lactate metabolism, increasing the risk of lactic acidosis, a rare but potentially fatal metabolic complication."
    },
    {
        id: "3",
        pair: ["Lisinopril", "Potassium"],
        severity: "Moderate",
        mechanism: "Additive potassium-sparing effect.",
        guidance: "Monitor serum potassium levels regularly.",
        description: "Concurrent use may result in hyperkalemia, especially in patients with renal impairment or diabetes."
    },
    {
        id: "4",
        pair: ["Atorvastatin", "Clarithromycin"],
        severity: "Major",
        mechanism: "CYP3A4 inhibition by Clarithromycin increases Atorvastatin exposure.",
        guidance: "Avoid combination or limit Atorvastatin dose to 20mg/day. Monitor for myopathy.",
        description: "Significantly increased risk of myopathy and rhabdomyolysis due to increased statin concentrations."
    }
];

export default function InteractionChecker() {
    const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
    const [results, setResults] = useState<Interaction[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    const addDrug = (drug: string) => {
        if (!selectedDrugs.includes(drug)) {
            setSelectedDrugs([...selectedDrugs, drug]);
        }
    };

    const removeDrug = (drug: string) => {
        setSelectedDrugs(selectedDrugs.filter(d => d !== drug));
    };

    const checkInteractions = () => {
        setIsChecking(true);

        // Simulate API delay
        setTimeout(() => {
            const foundInteractions: Interaction[] = [];

            // Check every pair
            for (let i = 0; i < selectedDrugs.length; i++) {
                for (let j = i + 1; j < selectedDrugs.length; j++) {
                    const drugA = selectedDrugs[i];
                    const drugB = selectedDrugs[j];

                    const match = MOCK_INTERACTIONS.find(interaction =>
                        (interaction.pair.includes(drugA) && interaction.pair.includes(drugB))
                    );

                    if (match) {
                        foundInteractions.push(match);
                    }
                }
            }

            setResults(foundInteractions);
            setIsChecking(false);
        }, 600);
    };

    // Auto-check when list changes (optional, but good UX)
    useEffect(() => {
        if (selectedDrugs.length >= 2) {
            checkInteractions();
        } else {
            setResults([]);
        }
    }, [selectedDrugs]);

    return (
        <div className="space-y-8">
            {/* Input Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Drugs & Conditions</h2>
                <div className="mb-6">
                    <DrugMultiSearch onAdd={addDrug} />
                </div>

                {/* Selected Tags */}
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {selectedDrugs.length === 0 && (
                        <span className="text-gray-400 text-sm italic py-2">No drugs selected yet...</span>
                    )}
                    {selectedDrugs.map(drug => (
                        <span key={drug} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100 animate-in zoom-in duration-200">
                            {drug}
                            <button
                                onClick={() => removeDrug(drug)}
                                className="ml-2 p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                            >
                                <FiX className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        Interaction Analysis
                        {selectedDrugs.length >= 2 && (
                            <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {results.length} found
                            </span>
                        )}
                    </h2>
                    {isChecking && (
                        <span className="text-sm text-blue-600 flex items-center gap-2 animate-pulse">
                            <FiRefreshCw className="h-4 w-4 animate-spin" /> Analyzing...
                        </span>
                    )}
                </div>

                {selectedDrugs.length < 2 ? (
                    <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 text-center">
                        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <FiAlertCircle className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 font-medium mb-1">Waiting for input</h3>
                        <p className="text-gray-500 text-sm">Add at least two drugs to check for interactions.</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-4">
                        {results.map(interaction => (
                            <InteractionResult key={interaction.id} interaction={interaction} />
                        ))}
                    </div>
                ) : (
                    !isChecking && (
                        <div className="bg-green-50 rounded-xl border border-green-200 p-8 text-center animate-in fade-in duration-300">
                            <h3 className="text-green-800 font-bold text-lg mb-2">No Interactions Found</h3>
                            <p className="text-green-700">
                                No known interactions between the selected drugs in our database.
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
