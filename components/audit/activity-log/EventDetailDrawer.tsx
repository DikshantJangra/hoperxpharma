"use client";
import { useState } from "react";
import {
  FiX,
  FiCopy,
  FiDownload,
  FiMessageSquare,
  FiAlertTriangle,
  FiExternalLink,
  FiMapPin,
  FiShield,
  FiUser,
  FiClock,
} from "react-icons/fi";
import { MdHistory } from "react-icons/md";

interface EventDetailDrawerProps {
  eventId: string;
  onClose: () => void;
  onAnnotate: () => void;
  onRevert: () => void;
}

export default function EventDetailDrawer({
  eventId,
  onClose,
  onAnnotate,
  onRevert,
}: EventDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"details" | "payload" | "network" | "history">(
    "details"
  );

  const mockEvent = {
    id: "evt_20251113_0001",
    timestamp: "2025-11-13T10:12:34.567Z",
    severity: "high",
    actor: {
      id: "u_aman",
      name: "Aman Verma",
      role: "pharmacist",
      lastLogin: "2025-11-13T08:30:00Z",
      manager: "Priya Singh",
      mfaEnabled: true,
    },
    action: "inventory.adjust",
    resource: {
      type: "batch",
      id: "B2025-01",
      sku: "paracetamol_500",
      label: "Paracetamol 500mg",
    },
    payload: {
      oldQty: 120,
      newQty: 115,
      delta: -5,
      reason: "broken_vial",
      evidence: ["photo_001.jpg", "photo_002.jpg"],
      notes: "Found 5 broken vials during routine inspection",
    },
    store: "Pahalgam-01",
    network: {
      ip: "122.165.33.11",
      geo: { country: "IN", city: "Pahalgam", lat: 34.0, lon: 75.3 },
      asn: "AS9829 BSNL",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    },
    integrity: {
      hash: "sha256:a3f5b9c2d1e4f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
      prevHash: "sha256:b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5",
      storedAt: "2025-11-13T10:12:35.123Z",
      shard: "shard-03",
    },
    relatedObjects: [
      { type: "invoice", id: "INV-5677", label: "Invoice #5677" },
      { type: "prescription", id: "RX-1234", label: "Prescription #1234" },
    ],
    tags: ["controlled", "manual", "evidence-attached"],
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-[600px] bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded border border-orange-200">
                {mockEvent.severity}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-mono">{mockEvent.id}</span>
              <button
                onClick={() => copyToClipboard(mockEvent.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiCopy size={12} />
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAnnotate}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
          >
            <FiMessageSquare size={14} />
            Annotate
          </button>
          <button
            onClick={onRevert}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-sm"
          >
            <FiAlertTriangle size={14} />
            Request Revert
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
            <FiDownload size={14} />
            Export JSON
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
        {[
          { id: "details", label: "Details" },
          { id: "payload", label: "Payload" },
          { id: "network", label: "Network" },
          { id: "history", label: "History" },
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

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "details" && (
          <div className="space-y-6">
            {/* Actor */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <FiUser size={16} />
                Actor
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Name</span>
                  <span className="text-sm font-medium text-gray-900">{mockEvent.actor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded">
                    {mockEvent.actor.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">User ID</span>
                  <span className="text-sm font-mono text-gray-900">{mockEvent.actor.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">2FA Status</span>
                  <span className="text-sm text-green-600">
                    {mockEvent.actor.mfaEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <button className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1 mt-2">
                  <FiExternalLink size={12} />
                  View all events by this actor
                </button>
              </div>
            </div>

            {/* Event Info */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <FiClock size={16} />
                Event Information
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Timestamp (Local)</span>
                  <span className="text-sm font-medium text-gray-900">
                    Nov 13, 2025, 10:12:34 AM
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Timestamp (UTC)</span>
                  <span className="text-sm font-mono text-gray-900">{mockEvent.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Action</span>
                  <span className="text-sm font-mono text-gray-900">{mockEvent.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Store</span>
                  <span className="text-sm text-gray-900">{mockEvent.store}</span>
                </div>
              </div>
            </div>

            {/* Resource */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <FiExternalLink size={16} />
                Resource
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type</span>
                  <span className="text-sm text-gray-900">{mockEvent.resource.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ID</span>
                  <span className="text-sm font-medium text-teal-600">
                    {mockEvent.resource.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">SKU</span>
                  <span className="text-sm font-mono text-gray-900">{mockEvent.resource.sku}</span>
                </div>
              </div>
            </div>

            {/* Related Objects */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">Related Objects</div>
              <div className="space-y-2">
                {mockEvent.relatedObjects.map((obj, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{obj.type}</span>
                      <span className="text-teal-600 font-medium">{obj.id}</span>
                    </div>
                    <FiExternalLink size={14} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">Tags</div>
              <div className="flex flex-wrap gap-2">
                {mockEvent.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "payload" && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Old Quantity</span>
                  <span className="text-lg font-bold text-gray-900">{mockEvent.payload.oldQty}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">New Quantity</span>
                  <span className="text-lg font-bold text-teal-600">{mockEvent.payload.newQty}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Delta</span>
                  <span className="text-lg font-bold text-red-600">{mockEvent.payload.delta}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Reason</span>
                  <span className="text-sm text-gray-900">{mockEvent.payload.reason}</span>
                </div>
                <div className="pt-2">
                  <span className="text-sm font-medium text-gray-700 block mb-2">Notes</span>
                  <p className="text-sm text-gray-600">{mockEvent.payload.notes}</p>
                </div>
                <div className="pt-2">
                  <span className="text-sm font-medium text-gray-700 block mb-2">Evidence</span>
                  <div className="flex gap-2">
                    {mockEvent.payload.evidence.map((file, idx) => (
                      <button
                        key={idx}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100"
                      >
                        {file}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">Raw JSON</div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(mockEvent.payload, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === "network" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <FiMapPin size={16} />
                Location
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">IP Address</span>
                  <span className="text-sm font-mono text-gray-900">{mockEvent.network.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Country</span>
                  <span className="text-sm text-gray-900">{mockEvent.network.geo.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">City</span>
                  <span className="text-sm text-gray-900">{mockEvent.network.geo.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ASN / ISP</span>
                  <span className="text-sm text-gray-900">{mockEvent.network.asn}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">User Agent</div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-mono text-gray-700 break-all">
                  {mockEvent.network.userAgent}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <FiShield size={16} />
                Tamper-Proof Metadata
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div>
                  <span className="text-xs text-gray-600 block mb-1">Event Hash (SHA256)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-900 break-all">
                      {mockEvent.integrity.hash}
                    </span>
                    <button
                      onClick={() => copyToClipboard(mockEvent.integrity.hash)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiCopy size={12} />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-600 block mb-1">Previous Hash</span>
                  <span className="text-xs font-mono text-gray-900 break-all">
                    {mockEvent.integrity.prevHash}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-xs text-gray-600">Storage Shard</span>
                  <span className="text-xs font-mono text-gray-900">{mockEvent.integrity.shard}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Stored At</span>
                  <span className="text-xs text-gray-900">{mockEvent.integrity.storedAt}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <MdHistory size={16} />
                Annotations & Comments
              </div>
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Priya Singh</span>
                    <span className="text-xs text-blue-600">2 hours ago</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Verified with store manager. Breakage confirmed during morning stock check.
                  </p>
                </div>
                <button className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700">
                  + Add annotation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
