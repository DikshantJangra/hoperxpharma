"use client";
import { FiShield, FiLock, FiKey } from "react-icons/fi";
import PINStatusCard from "@/components/users/pin/PINStatusCard";
import SetupPINPanel from "@/components/users/pin/SetupPINPanel";
import RecoveryOptions from "@/components/users/pin/RecoveryOptions";
import BackupCodes from "@/components/users/pin/BackupCodes";
import AuditLogSnippet from "@/components/users/pin/AuditLogSnippet";

export default function PINSetupPage() {
  const pinStatus: "not_set" | "active" | "locked" = "active" as any;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FiShield size={24} className="text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Approval PIN</h1>
              </div>
              <p className="text-sm text-gray-600">
                Secure your sensitive actions with a personal PIN
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Account</div>
              <div className="font-medium text-gray-900">-</div>
              <div className="text-xs text-gray-500">-</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">PIN Status:</span>
            {pinStatus === "active" && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Active
              </span>
            )}
            {pinStatus === "not_set" && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                Not Set
              </span>
            )}
            {pinStatus === "locked" && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                Locked
              </span>
            )}
          </div>
        </div>

        {/* PIN Status Card */}
        <PINStatusCard status={pinStatus} />

        {/* Setup/Change PIN Panel */}
        <SetupPINPanel status={pinStatus} />

        {/* Recovery Options */}
        <RecoveryOptions />

        {/* Backup Codes */}
        <BackupCodes />

        {/* Audit Log Snippet */}
        <AuditLogSnippet />

        {/* Security Policy */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiLock size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-2">Security Policy</div>
              <div className="space-y-1 text-xs">
                <div>• Minimum 6 digits required</div>
                <div>• Maximum 5 failed attempts before lock</div>
                <div>• 10-minute cooldown after lock</div>
                <div>• PIN stored using salted hashing & HSM</div>
                <div>• Reset requires full identity verification</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
