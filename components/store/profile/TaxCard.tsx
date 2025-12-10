import React from "react";
import GSTInput from "./GSTInput";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

interface TaxCardProps {
  profile: any;
  onChange: (field: string, value: any) => void;
  errors: any;
  isEditing: boolean;
}

export default function TaxCard({ profile, onChange, errors, isEditing }: TaxCardProps) {
  // Enable enhanced keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation();

  return (
    <section
      className="bg-white shadow-sm rounded-lg p-6"
      onKeyDown={handleKeyDown}
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax & Legal</h2>

      <div className="space-y-4">
        {/* GSTIN */}
        {isEditing ? (
          <GSTInput
            value={profile?.gst?.gstin || ""}
            verified={profile?.gst?.verified}
            onChange={(val) => onChange("gst.gstin", val)}
            error={errors?.gstin}
          />
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
            <div className="flex items-center gap-2">
              <p className="text-gray-900 font-mono">{profile?.gst?.gstin || "-"}</p>
              {profile?.gst?.verified && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  Verified
                </span>
              )}
            </div>
          </div>
        )}

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
          {isEditing ? (
            <select
              value={profile?.businessType || ""}
              onChange={(e) => onChange("businessType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select type</option>
              <option value="proprietorship">Proprietorship</option>
              <option value="partnership">Partnership</option>
              <option value="pvt_ltd">Private Limited</option>
              <option value="llp">LLP</option>
              <option value="pharmacy">Pharmacy</option>
            </select>
          ) : (
            <p className="text-gray-900 capitalize">{profile?.businessType?.replace("_", " ") || "-"}</p>
          )}
        </div>

        {/* Tax Preferences */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tax Preferences</label>
          {isEditing ? (
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="taxMode"
                  value="inclusive"
                  checked={profile?.taxMode === "inclusive"}
                  onChange={(e) => onChange("taxMode", e.target.value)}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Tax Inclusive</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="taxMode"
                  value="exclusive"
                  checked={profile?.taxMode === "exclusive"}
                  onChange={(e) => onChange("taxMode", e.target.value)}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Tax Exclusive</span>
              </label>
            </div>
          ) : (
            <p className="text-gray-900 capitalize">
              {profile?.taxMode ? `Tax ${profile.taxMode}` : "-"}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
