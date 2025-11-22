"use client";

import { useState } from "react";
import { FiMessageSquare, FiMail, FiSmartphone, FiEdit, FiTrash2, FiCopy } from "react-icons/fi";
import { MdWhatsapp } from "react-icons/md";

const mockTemplates = [
    {
        id: "TPL001",
        name: "Prescription Ready",
        channel: "whatsapp",
        category: "Notifications",
        content: "Hello {{name}}, your prescription is ready for pickup at {{store}}. Order ID: {{orderId}}",
        variables: ["name", "store", "orderId"],
        usageCount: 1245
    },
    {
        id: "TPL002",
        name: "Refill Reminder",
        channel: "sms",
        category: "Reminders",
        content: "Hi {{name}}, your {{medication}} refill is due on {{date}}. Call us at {{phone}} to schedule.",
        variables: ["name", "medication", "date", "phone"],
        usageCount: 892
    },
    {
        id: "TPL003",
        name: "Order Confirmation",
        channel: "email",
        category: "Transactional",
        content: "Dear {{name}}, your order #{{orderId}} for ₹{{amount}} has been confirmed. Expected delivery: {{deliveryDate}}",
        variables: ["name", "orderId", "amount", "deliveryDate"],
        usageCount: 2103
    }
];

export default function MessageTemplatesPage() {
    const [filter, setFilter] = useState("all");

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case "whatsapp": return <MdWhatsapp className="w-5 h-5 text-green-600" />;
            case "sms": return <FiSmartphone className="w-5 h-5 text-blue-600" />;
            case "email": return <FiMail className="w-5 h-5 text-purple-600" />;
            default: return <FiMessageSquare className="w-5 h-5 text-gray-600" />;
        }
    };

    const filteredTemplates = filter === "all"
        ? mockTemplates
        : mockTemplates.filter(t => t.channel === filter);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Message Templates</h1>
                            <p className="text-sm text-[#64748b]">Manage reusable message templates</p>
                        </div>
                        <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors">
                            New Template
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "all" ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter("whatsapp")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "whatsapp" ? "bg-green-500 text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                }`}
                        >
                            WhatsApp
                        </button>
                        <button
                            onClick={() => setFilter("sms")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "sms" ? "bg-blue-500 text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                }`}
                        >
                            SMS
                        </button>
                        <button
                            onClick={() => setFilter("email")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "email" ? "bg-purple-500 text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                }`}
                        >
                            Email
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredTemplates.map((template) => (
                        <div key={template.id} className="bg-white border border-[#e2e8f0] rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="flex-shrink-0 mt-1">
                                        {getChannelIcon(template.channel)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-[#0f172a]">{template.name}</h3>
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                {template.category}
                                            </span>
                                        </div>
                                        <div className="text-sm text-[#64748b] mb-3">
                                            Template ID: {template.id} • Used {template.usageCount} times
                                        </div>
                                        <div className="p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] font-mono text-sm text-[#0f172a]">
                                            {template.content}
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {template.variables.map((variable) => (
                                                <span key={variable} className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                                    {`{{${variable}}}`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <button className="p-2 border border-[#cbd5e1] text-[#475569] rounded-lg hover:bg-[#f8fafc] transition-colors">
                                        <FiCopy className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 border border-[#cbd5e1] text-[#475569] rounded-lg hover:bg-[#f8fafc] transition-colors">
                                        <FiEdit className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
