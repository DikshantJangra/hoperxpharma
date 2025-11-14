import React from "react";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { validateGstin } from "@/utils/validators";

interface GSTInputProps {
  value: string;
  verified?: boolean;
  onChange: (value: string) => void;
  error?: string;
}

export default function GSTInput({ value, verified, onChange, error }: GSTInputProps) {
  const [validating, setValidating] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleBlur = () => {
    if (value && !validateGstin(value)) {
      setLocalError("This GSTIN looks invalid — check the 15 character code and try again.");
    } else {
      setLocalError(null);
    }
  };

  const handleVerify = async () => {
    setValidating(true);
    // Simulate API call
    setTimeout(() => {
      setValidating(false);
    }, 1500);
  };

  const displayError = error || localError;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        GSTIN <span className="text-red-500">*</span>
      </label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onBlur={handleBlur}
          maxLength={15}
          className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono ${
            displayError ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="07ABCDE1234F1Z5"
        />
        {verified ? (
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <FiCheckCircle size={18} />
            <span>Verified</span>
          </div>
        ) : (
          <button
            onClick={handleVerify}
            disabled={!value || validating}
            className="px-3 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded-lg disabled:opacity-50"
          >
            {validating ? "Verifying..." : "Verify"}
          </button>
        )}
      </div>
      {displayError && (
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
          <FiAlertCircle size={12} />
          {displayError}
        </p>
      )}
      <p className="text-xs text-gray-500 mt-1">15-character GST Identification Number</p>
    </div>
  );
}
