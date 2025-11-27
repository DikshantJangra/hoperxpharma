import React from "react";
import { FiCreditCard, FiExternalLink } from "react-icons/fi";

interface BankCardProps {
  profile: any;
  onChange: (field: string, value: any) => void;
  isEditing: boolean;
}

export default function BankCard({ profile, onChange, isEditing }: BankCardProps) {
  return (
    <section className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Banking & Settlement</h2>
        <button className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
          Manage <FiExternalLink size={14} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Bank Account */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <FiCreditCard className="text-gray-400" size={24} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Bank Account •••• {profile?.bank?.last4 || "4321"}
            </p>
            <p className="text-xs text-gray-500">IFSC: {profile?.bank?.ifsc || "HDFC0001234"}</p>
          </div>
          {isEditing && (
            <button className="text-sm text-teal-600 hover:text-teal-700">Change</button>
          )}
        </div>

        {/* Settlement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Frequency</label>
          {isEditing ? (
            <select
              value={profile?.bank?.settlement || "T+1"}
              onChange={(e) => onChange("bank.settlement", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="T+0">Same Day (T+0)</option>
              <option value="T+1">Next Day (T+1)</option>
              <option value="T+2">2 Days (T+2)</option>
              <option value="weekly">Weekly</option>
            </select>
          ) : (
            <p className="text-gray-900">{profile?.bank?.settlement || "T+1"}</p>
          )}
        </div>
      </div>
    </section>
  );
}
