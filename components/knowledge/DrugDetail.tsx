"use client";

import { useState } from "react";
import {
    FiAlertTriangle,
    FiShield,
    FiActivity,
    FiTruck,
    FiInfo,
    FiAlertOctagon,
    FiCheckCircle,
    FiShare2,
    FiPrinter,
    FiBookmark
} from "react-icons/fi";
import { TbPill } from "react-icons/tb";
import { BsThermometer } from "react-icons/bs";
import { FaBaby } from "react-icons/fa";

// Mock Data Interface (replace with actual types later)
interface DrugData {
    name: string;
    brand: string;
    category: string;
    type: "Rx" | "OTC";
    overview: string;
    indications: string[];
    dosage: {
        adult: string;
        pediatric: string;
        renal: string;
    };
    moa: string;
    sideEffects: {
        common: string[];
        serious: string[];
    };
    contraindications: string[];
    precautions: string[];
    pregnancy: string;
    storage: string;
    price: string;
    manufacturer: string;
}

export default function DrugDetail({ data }: { data: DrugData }) {
    const [activeTab, setActiveTab] = useState<"overview" | "clinical" | "safety" | "interactions" | "logistics">("overview");

    const tabs = [
        { id: "overview", label: "Overview", icon: FiInfo },
        { id: "clinical", label: "Clinical", icon: FiActivity },
        { id: "safety", label: "Safety", icon: FiShield },
        { id: "interactions", label: "Interactions", icon: FiAlertOctagon }, // Using FiAlertOctagon as a proxy for interactions
        { id: "logistics", label: "Logistics", icon: FiTruck },
    ] as const;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="h-16 w-16 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center text-blue-600">
                            <TbPill className="h-8 w-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-semibold text-gray-800">{data.name}</h1>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    data.type === "Rx" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                                }`}>
                                    {data.type}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 font-medium mb-1">{data.brand}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="bg-gray-100 px-2 py-0.5 rounded">{data.category}</span>
                                <span>•</span>
                                <span>{data.manufacturer}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-1">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Bookmark">
                            <FiBookmark className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Share">
                            <FiShare2 className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Print">
                            <FiPrinter className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 px-6">
                <nav className="flex gap-6 -mb-px">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="p-6 min-h-[400px]">
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <FiInfo className="h-4 w-4 text-blue-600" /> Medical Overview
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {data.overview}
                            </p>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <section className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                                <h3 className="text-sm font-semibold text-gray-800 mb-3">Primary Indications</h3>
                                <ul className="space-y-2">
                                    {data.indications.map((ind, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                            <FiCheckCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                            {ind}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Dosage Guide</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between pb-2 border-b border-gray-200">
                                        <span className="text-gray-600">Adults</span>
                                        <span className="font-medium text-gray-800">{data.dosage.adult}</span>
                                    </div>
                                    <div className="flex justify-between pb-2">
                                        <span className="text-gray-600">Pediatric</span>
                                        <span className="font-medium text-gray-800">{data.dosage.pediatric}</span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === "clinical" && (
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-base font-semibold text-gray-800 mb-2">Mechanism of Action</h3>
                            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">
                                {data.moa}
                            </p>
                        </section>

                        <section>
                            <h3 className="text-base font-semibold text-gray-800 mb-3">Detailed Dosage</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <span className="block text-xs font-semibold text-gray-500 uppercase mb-2">Adult Dose</span>
                                    <p className="text-sm text-gray-800 font-medium">{data.dosage.adult}</p>
                                </div>
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <span className="block text-xs font-semibold text-gray-500 uppercase mb-2">Pediatric Dose</span>
                                    <p className="text-sm text-gray-800 font-medium">{data.dosage.pediatric}</p>
                                </div>
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <span className="block text-xs font-semibold text-gray-500 uppercase mb-2">Renal Impairment</span>
                                    <p className="text-sm text-gray-800 font-medium">{data.dosage.renal}</p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === "safety" && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <section>
                                <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                                    <FiAlertTriangle className="h-4 w-4" /> Contraindications
                                </h3>
                                <ul className="space-y-2">
                                    {data.contraindications.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-red-800 text-xs">
                                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-sm font-semibold text-amber-600 mb-3 flex items-center gap-2">
                                    <FiAlertOctagon className="h-4 w-4" /> Precautions
                                </h3>
                                <ul className="space-y-2">
                                    {data.precautions.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-amber-800 text-xs">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>

                        <section>
                            <h3 className="text-sm font-semibold text-gray-800 mb-3">Side Effects</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Common</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {data.sideEffects.common.map((effect, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                                {effect}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-red-600 uppercase mb-2">Serious</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {data.sideEffects.serious.map((effect, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-red-50 text-red-700 rounded text-xs">
                                                {effect}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex items-start gap-3">
                            <FaBaby className="h-5 w-5 text-purple-600 shrink-0" />
                            <div>
                                <h3 className="text-sm font-semibold text-purple-900 mb-1">Pregnancy & Lactation</h3>
                                <p className="text-xs text-purple-800">{data.pregnancy}</p>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === "interactions" && (
                    <div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <div className="flex gap-3">
                                <FiAlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-yellow-800">Interaction Checker Available</h3>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        Use the dedicated Interaction Checker tool to verify safety with specific patient medications.
                                    </p>
                                </div>
                                <button className="text-xs font-semibold text-yellow-800 hover:underline whitespace-nowrap">
                                    Launch →
                                </button>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 italic text-center py-8">
                            Detailed interaction database integration pending...
                        </p>
                    </div>
                )}

                {activeTab === "logistics" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 border border-gray-200 rounded-lg">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                <BsThermometer className="h-4 w-4" /> Storage
                            </h3>
                            <p className="text-sm text-gray-800 font-medium">{data.storage}</p>
                        </div>
                        <div className="p-5 border border-gray-200 rounded-lg">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                <FiActivity className="h-4 w-4" /> Pricing (MRP)
                            </h3>
                            <p className="text-sm text-gray-800 font-medium">{data.price}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
