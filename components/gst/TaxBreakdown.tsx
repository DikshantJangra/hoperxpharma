"use client";

import React from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TaxBreakdownProps {
    data: {
        cgst: number;
        sgst: number;
        igst: number;
        taxableValue: number;
    };
    type?: "pie" | "bar";
}

export default function TaxBreakdown({ data, type = "pie" }: TaxBreakdownProps) {
    const { cgst, sgst, igst, taxableValue } = data;
    const totalTax = cgst + sgst + igst;

    const chartData = {
        labels: ["CGST", "SGST", "IGST"],
        datasets: [
            {
                label: "Tax Amount (₹)",
                data: [cgst, sgst, igst],
                backgroundColor: [
                    "rgba(59, 130, 246, 0.8)", // Blue for CGST
                    "rgba(16, 185, 129, 0.8)", // Green for SGST
                    "rgba(245, 158, 11, 0.8)"  // Amber for IGST
                ],
                borderColor: [
                    "rgba(59, 130, 246, 1)",
                    "rgba(16, 185, 129, 1)",
                    "rgba(245, 158, 11, 1)"
                ],
                borderWidth: 2
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom" as const,
                labels: {
                    padding: 15,
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const label = context.label || "";
                        const value = context.parsed || context.parsed.y || 0;
                        return `${label}: ₹${value.toLocaleString("en-IN")}`;
                    }
                }
            }
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-6">Tax Breakdown</h3>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Taxable Value</div>
                    <div className="text-2xl font-bold text-gray-900">
                        ₹{taxableValue.toLocaleString("en-IN")}
                    </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Total Tax</div>
                    <div className="text-2xl font-bold text-blue-900">
                        ₹{totalTax.toLocaleString("en-IN")}
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-600 rounded"></div>
                        <span className="font-semibold text-blue-900">CGST</span>
                    </div>
                    <span className="font-bold text-blue-900">
                        ₹{cgst.toLocaleString("en-IN")}
                    </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-green-600 rounded"></div>
                        <span className="font-semibold text-green-900">SGST</span>
                    </div>
                    <span className="font-bold text-green-900">
                        ₹{sgst.toLocaleString("en-IN")}
                    </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-amber-600 rounded"></div>
                        <span className="font-semibold text-amber-900">IGST</span>
                    </div>
                    <span className="font-bold text-amber-900">
                        ₹{igst.toLocaleString("en-IN")}
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="h-64">
                {type === "pie" ? (
                    <Pie data={chartData} options={options} />
                ) : (
                    <Bar data={chartData} options={options} />
                )}
            </div>
        </div>
    );
}
