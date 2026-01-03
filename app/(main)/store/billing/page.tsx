"use client";

import React from "react";
import PlanAndBilling from "@/components/store/profile/PlanAndBilling";

export default function StoreBillingPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Plan & Billing</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your pharmacy's subscription and billing details</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-8 py-8">
                <PlanAndBilling />
            </div>
        </div>
    );
}
