"use client";
import { useState } from "react";
import { FiKey, FiBook, FiCheckCircle, FiActivity } from "react-icons/fi";
import OverviewTab from "@/components/integrations/apis/OverviewTab";
import APIKeysTab from "@/components/integrations/apis/APIKeysTab";
import WebhooksTab from "@/components/integrations/apis/WebhooksTab";
import AppIntegrationsTab from "@/components/integrations/apis/AppIntegrationsTab";
import SandboxTab from "@/components/integrations/apis/SandboxTab";
import DocsTab from "@/components/integrations/apis/DocsTab";

export default function APIsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "keys" | "webhooks" | "apps" | "sandbox" | "docs">("overview");
  const [apiEnabled, setApiEnabled] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API Integrations</h1>
            <p className="text-sm text-gray-500 mt-1">
              Connect HopeRx with other software and automate your workflows
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <FiBook size={18} />
              View Docs
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              <FiKey size={18} />
              Generate API Key
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">API Access:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={apiEnabled}
                onChange={(e) => setApiEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
            <span className={`text-sm font-medium ${apiEnabled ? "text-green-600" : "text-gray-500"}`}>
              {apiEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Environment:</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Live</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Connected Apps:</span>
            <span className="text-sm font-medium text-gray-900">2</span>
          </div>
          <div className="flex items-center gap-2">
            <FiActivity size={16} className="text-gray-600" />
            <span className="text-sm text-gray-600">Usage Today:</span>
            <span className="text-sm font-medium text-gray-900">1,247 requests</span>
          </div>
          <div className="flex items-center gap-2">
            <FiCheckCircle size={16} className="text-green-600" />
            <span className="text-sm text-green-600">Rate Limits OK</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex-shrink-0">
        <div className="flex gap-1">
          {[
            { id: "overview", label: "Overview" },
            { id: "keys", label: "API Keys" },
            { id: "webhooks", label: "Webhooks" },
            { id: "apps", label: "App Integrations" },
            { id: "sandbox", label: "Sandbox / Test" },
            { id: "docs", label: "API Docs" },
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
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "keys" && <APIKeysTab />}
        {activeTab === "webhooks" && <WebhooksTab />}
        {activeTab === "apps" && <AppIntegrationsTab />}
        {activeTab === "sandbox" && <SandboxTab />}
        {activeTab === "docs" && <DocsTab />}
      </div>
    </div>
  );
}
