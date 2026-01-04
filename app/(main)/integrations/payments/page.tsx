"use client";
import { useState } from "react";
import { FiPlus, FiDollarSign, FiCheckCircle, FiCreditCard } from "react-icons/fi";
import { MdQrCode2 } from "react-icons/md";
import ProvidersTab from "@/components/integrations/payments/ProvidersTab";
import QRSetupTab from "@/components/integrations/payments/QRSetupTab";
import SettlementsTab from "@/components/integrations/payments/SettlementsTab";
import ReconciliationTab from "@/components/integrations/payments/ReconciliationTab";
import WebhooksTab from "@/components/integrations/payments/WebhooksTab";
import PaymentHealthTab from "@/components/integrations/payments/PaymentHealthTab";

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<"providers" | "qr" | "settlements" | "reconciliation" | "webhooks" | "health">("providers");

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Integrations</h1>
            <p className="text-sm text-gray-500 mt-1">
              Unified hub for all digital payment providers, UPI, POS, and settlements
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            <FiPlus size={18} />
            Add Provider
          </button>
        </div>

        {/* Connected Providers Summary */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-medium text-gray-700">Connected:</span>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
            No providers connected
          </span>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-700 text-xs font-medium">
              <FiDollarSign size={14} />
              Total Received
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-1">₹0</div>
            <div className="text-xs text-blue-600 mt-1">Today</div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 text-xs font-medium">
              <MdQrCode2 size={14} />
              UPI Collections
            </div>
            <div className="text-2xl font-bold text-green-900 mt-1">₹0</div>
            <div className="text-xs text-green-600 mt-1">-</div>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-purple-700 text-xs font-medium">
              <FiCreditCard size={14} />
              Card Payments
            </div>
            <div className="text-2xl font-bold text-purple-900 mt-1">₹0</div>
            <div className="text-xs text-purple-600 mt-1">-</div>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-orange-700 text-xs font-medium">
              <FiDollarSign size={14} />
              Refunds Issued
            </div>
            <div className="text-2xl font-bold text-orange-900 mt-1">₹0</div>
            <div className="text-xs text-orange-600 mt-1">0 transactions</div>
          </div>
          <div className="bg-teal-50 border border-teal-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-teal-700 text-xs font-medium">
              <FiCheckCircle size={14} />
              Settlement
            </div>
            <div className="text-2xl font-bold text-teal-900 mt-1">-</div>
            <div className="text-xs text-teal-600 mt-1">-</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex-shrink-0">
        <div className="flex gap-1">
          {[
            { id: "providers", label: "Providers" },
            { id: "qr", label: "QR / UPI Setup" },
            { id: "settlements", label: "Settlements" },
            { id: "reconciliation", label: "Reconciliation" },
            { id: "webhooks", label: "Webhooks & API" },
            { id: "health", label: "Payment Health" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "providers" && <ProvidersTab />}
        {activeTab === "qr" && <QRSetupTab />}
        {activeTab === "settlements" && <SettlementsTab />}
        {activeTab === "reconciliation" && <ReconciliationTab />}
        {activeTab === "webhooks" && <WebhooksTab />}
        {activeTab === "health" && <PaymentHealthTab />}
      </div>
    </div>
  );
}
