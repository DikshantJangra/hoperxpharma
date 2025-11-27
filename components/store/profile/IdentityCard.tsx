import React from "react";
import LogoUploader from "./LogoUploader";
import { FiInfo } from "react-icons/fi";

interface IdentityCardProps {
  profile: any;
  onChange: (field: string, value: any) => void;
  errors: any;
  isEditing: boolean;
}

export default function IdentityCard({ profile, onChange, errors, isEditing }: IdentityCardProps) {
  return (
    <section className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Store Identity</h2>

      <div className="flex items-start gap-6">
        {/* Logo */}
        <div className="w-28 flex-shrink-0">
          {isEditing ? (
            <LogoUploader
              src={profile?.logoUrl}
              onUpload={(url) => onChange("logoUrl", url)}
            />
          ) : (
            <div className="w-28 h-28 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
              {profile?.logoUrl ? (
                <img src={profile.logoUrl} alt="Store logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-gray-300">{profile?.name?.charAt(0)}</span>
              )}
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="flex-1 space-y-4">
          {/* Store Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Name {isEditing && <span className="text-red-500">*</span>}
            </label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={profile?.name || ""}
                  onChange={(e) => onChange("name", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${errors?.name ? "border-red-500" : "border-gray-300"
                    }`}
                  placeholder="HopeRx Pharmacy"
                />
                {errors?.name ? (
                  <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Will appear on receipts and invoices. Keep it short & recognizable.
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-900 font-medium">{profile?.name || "-"}</p>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={profile?.displayName || ""}
                  onChange={(e) => onChange("displayName", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="HopeRx - Pahalgam"
                />
                <p className="text-xs text-gray-500 mt-1">Optional shorter name for receipts</p>
              </>
            ) : (
              <p className="text-gray-900">{profile?.displayName || "-"}</p>
            )}
          </div>

          {/* Store Code (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Code
            </label>
            <p className="text-gray-500 font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg inline-block">
              {profile?.code || "-"}
            </p>
          </div>

          {/* Brand Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Color
            </label>
            {isEditing ? (
              <>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={profile?.brandColor || "#2563EB"}
                    onChange={(e) => onChange("brandColor", e.target.value)}
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={profile?.brandColor || "#2563EB"}
                    onChange={(e) => onChange("brandColor", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="#2563EB"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Used in invoices and receipts</p>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: profile?.brandColor || "#2563EB" }}
                />
                <span className="text-gray-900 uppercase">{profile?.brandColor || "#2563EB"}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
