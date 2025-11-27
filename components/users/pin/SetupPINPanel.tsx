"use client";
import { useState } from "react";
import { FiKey, FiCheckCircle } from "react-icons/fi";
import { rbacApi } from "@/lib/api/rbac";

interface SetupPINPanelProps {
  status: "not_set" | "active" | "locked";
  onPinSetup?: () => void;
}

export default function SetupPINPanel({ status, onPinSetup }: SetupPINPanelProps) {
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (status === "not_set") {
        // Setup new PIN
        if (pin !== confirmPin) {
          setError("PINs do not match");
          setLoading(false);
          return;
        }
        if (pin.length < 6) {
          setError("PIN must be at least 6 digits");
          setLoading(false);
          return;
        }
        const response = await rbacApi.setupAdminPin(pin);
        if (response.success) {
          setStep(4);
          if (onPinSetup) onPinSetup();
        }
      } else {
        // Change existing PIN
        if (pin !== confirmPin) {
          setError("New PINs do not match");
          setLoading(false);
          return;
        }
        const response = await rbacApi.changeAdminPin(oldPin, pin);
        if (response.success) {
          setStep(4);
          if (onPinSetup) onPinSetup();
        }
      }
    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const getStrength = (p: string) => {
    if (p.length < 4) return { label: "Too Short", color: "text-red-600" };
    if (p.length < 6) return { label: "Weak", color: "text-orange-600" };
    return { label: "Strong", color: "text-green-600" };
  };

  const strength = getStrength(pin);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <FiKey size={20} className="text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {status === "not_set" ? "Set Up Your PIN" : "Change Your PIN"}
        </h3>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {status === "active" ? "Enter Current PIN" : "Create Your PIN"}
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="●●●●●●"
              maxLength={8}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
            />
            {pin && (
              <div className="flex items-center justify-between mt-2">
                <span className={`text-sm font-medium ${strength.color}`}>
                  Strength: {strength.label}
                </span>
                <span className="text-xs text-gray-500">
                  {pin.length} / 8 digits
                </span>
              </div>
            )}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-800">
              💡 6–8 digits recommended for security
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-xs text-red-800">{error}</div>
            </div>
          )}
          <button
            onClick={() => setStep(2)}
            disabled={pin.length < 6 || loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Processing..." : "Continue"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Your PIN
            </label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="●●●●●●"
              maxLength={8}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
            />
            {confirmPin && pin !== confirmPin && (
              <div className="text-sm text-red-600 mt-2">PINs do not match</div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!confirmPin || pin !== confirmPin}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verify with Password
            </label>
            <input
              type="password"
              placeholder="Enter your account password"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-xs text-orange-800">
              🔒 Setting your PIN will be logged in the Audit Log for security
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? "Processing..." : "Confirm"}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-8">
          <FiCheckCircle size={64} className="text-green-600 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-gray-900 mb-2">
            Your Approval PIN is Now Active
          </h4>
          <p className="text-sm text-gray-600 mb-6">
            You can now use your PIN to approve sensitive actions
          </p>
          <button
            onClick={() => setStep(1)}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
