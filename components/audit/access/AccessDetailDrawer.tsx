"use client";
import { useState } from "react";
import {
  FiX,
  FiUser,
  FiMonitor,
  FiMapPin,
  FiShield,
  FiAlertTriangle,
  FiClock,
  FiExternalLink,
} from "react-icons/fi";
import { MdBlock, MdLock, MdSecurity, MdHistory } from "react-icons/md";

interface AccessDetailDrawerProps {
  eventId: string;
  onClose: () => void;
}

export default function AccessDetailDrawer({ eventId, onClose }: AccessDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"details" | "device" | "network" | "session">("details");

  const mockEvent = {
    id: "acc_20251113_0002",
    timestamp: "2025-11-13T10:42:15.234Z",
    event: "login.failed",
    result: "failed",
    severity: "critical",
    user: {
      name: "Unknown",
      email: "hacker@test.com",
      status: "unknown",
      role: null,
      lastSuccess: null,
      totalSessions: 0,
    },
    device: {
      type: "desktop",
      browser: "Firefox 120.0",
      os: "Windows 11",
      fingerprint: "XY99KL12AB34CD56EF78",
      screenRes: "1920x1080",
      firstSeen: "2025-11-13T10:42:15Z",
      trusted: false,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
    },
    network: {
      ip: "203.45.67.89",
      geo: { country: "CN", city: "Unknown", lat: 39.9, lon: 116.4 },
      asn: "AS4134 Chinanet",
      reverseDns: null,
      riskFlags: ["suspicious_ip", "new_location", "high_risk_asn", "multiple_attempts"],
    },
    payload: {
      method: "password",
      failureReason: "invalid_password",
      attemptNumber: 5,
      rateLimited: true,
      mfaRequired: false,
      serverLatency: "45ms",
    },
    session: null,
    relatedEvents: [
      { id: "acc_001", event: "login.failed", time: "10:42:10", ip: "203.45.67.89" },
      { id: "acc_002", event: "login.failed", time: "10:42:12", ip: "203.45.67.89" },
      { id: "acc_003", event: "login.failed", time: "10:42:15", ip: "203.45.67.89" },
    ],
    integrity: {
      hash: "sha256:f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8",
      prevHash: "sha256:e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7",
    },
  };

  return (
    <div className="w-[600px] bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">Access Event</h3>
              <span className="px-2 py-1 bg-red-900 text-white text-xs font-medium rounded">
                {mockEvent.severity}
              </span>
            </div>
            <div className="text-sm text-gray-500 font-mono">{mockEvent.id}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <FiX size={20} />
          </button>
        </div>

        {/* Summary */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <FiAlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <div className="font-medium">Failed login attempt from suspicious IP</div>
              <div className="text-xs mt-1">
                5 consecutive failures • New location (China) • High-risk ASN
              </div>
            </div>
          </div>
        </div>

        {/* Security Actions */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
            <MdBlock size={14} />
            Block IP
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm">
            <MdLock size={14} />
            Lock User
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
            <MdSecurity size={14} />
            Investigate
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
        {[
          { id: "details", label: "Details" },
          { id: "device", label: "Device" },
          { id: "network", label: "Network" },
          { id: "session", label: "Session" },
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
            {/* User Info */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <FiUser size={16} />
                User Information
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-sm font-medium text-gray-900">{mockEvent.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                    {mockEvent.user.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Sessions</span>
                  <span className="text-sm text-gray-900">{mockEvent.user.totalSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Success</span>
                  <span className="text-sm text-gray-500">Never</span>
                </div>
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
                  <span className="text-sm text-gray-600">Event Type</span>
                  <span className="text-sm font-mono text-gray-900">{mockEvent.event}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Result</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">
                    {mockEvent.result}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Timestamp (Local)</span>
                  <span className="text-sm text-gray-900">Nov 13, 2025, 10:42:15 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Timestamp (UTC)</span>
                  <span className="text-sm font-mono text-gray-900">{mockEvent.timestamp}</span>
                </div>
              </div>
            </div>

            {/* Failure Details */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">Failure Details</div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-red-700">Reason</span>
                  <span className="text-sm font-medium text-red-900">
                    {mockEvent.payload.failureReason}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-red-700">Attempt Number</span>
                  <span className="text-sm font-bold text-red-900">
                    {mockEvent.payload.attemptNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-red-700">Rate Limited</span>
                  <span className="text-sm text-red-900">
                    {mockEvent.payload.rateLimited ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-red-700">Method</span>
                  <span className="text-sm text-red-900">{mockEvent.payload.method}</span>
                </div>
              </div>
            </div>

            {/* Related Events */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">Related Events (Same IP)</div>
              <div className="space-y-2">
                {mockEvent.relatedEvents.map((evt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-600">{evt.time}</span>
                      <span className="text-red-600">{evt.event}</span>
                    </div>
                    <button className="text-teal-600 hover:text-teal-700">
                      <FiExternalLink size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "device" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <FiMonitor size={16} />
                Device Details
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type</span>
                  <span className="text-sm text-gray-900">{mockEvent.device.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Browser</span>
                  <span className="text-sm text-gray-900">{mockEvent.device.browser}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">OS</span>
                  <span className="text-sm text-gray-900">{mockEvent.device.os}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Screen Resolution</span>
                  <span className="text-sm text-gray-900">{mockEvent.device.screenRes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">First Seen</span>
                  <span className="text-sm text-gray-900">Nov 13, 2025, 10:42 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Trusted</span>
                  <span className="text-sm text-red-600">
                    {mockEvent.device.trusted ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">Device Fingerprint</div>
              <div className="bg-gray-50 rounded-lg p-4">
                <span className="text-xs font-mono text-gray-700 break-all">
                  {mockEvent.device.fingerprint}
                </span>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">User Agent</div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-mono text-gray-700 break-all">
                  {mockEvent.device.userAgent}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "network" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <FiMapPin size={16} />
                Network & Location
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
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Reverse DNS</span>
                  <span className="text-sm text-gray-500">
                    {mockEvent.network.reverseDns || "Not available"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <FiAlertTriangle size={16} />
                Risk Flags
              </div>
              <div className="space-y-2">
                {mockEvent.network.riskFlags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <FiAlertTriangle size={14} className="text-red-600" />
                    <span className="text-sm text-red-800">{flag.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "session" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <FiShield size={16} />
                Session Context
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-center text-sm text-gray-500 py-8">
                  No session created (login failed)
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <MdHistory size={16} />
                Integrity & Hash
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-xs text-gray-600 block mb-1">Event Hash (SHA256)</span>
                  <span className="text-xs font-mono text-gray-900 break-all">
                    {mockEvent.integrity.hash}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-600 block mb-1">Previous Hash</span>
                  <span className="text-xs font-mono text-gray-900 break-all">
                    {mockEvent.integrity.prevHash}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
