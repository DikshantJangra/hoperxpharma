import React from "react";
import GSTInput from "./GSTInput";

interface TaxCardProps {
  profile: any;
  onChange: (field: string, value: any) => void;
  errors: any;
}

export default function TaxCard({ profile, onChange, errors }: TaxCardProps) {
  return (
    <section className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax & Legal</h2>

      <div className="space-y-4">
        {/* GSTIN */}
        <GSTInput
          value={profile?.gst?.gstin || ""}
          verified={profile?.gst?.verified}
          onChange={(val) => onChange("gst.gstin", val)}
          error={errors?.gstin}
        />

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
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
        </div>

        {/* Tax Preferences */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tax Preferences</label>
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
        </div>
      </div>
    </section>
  );
}
