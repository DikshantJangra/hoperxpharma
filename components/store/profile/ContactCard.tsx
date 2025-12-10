import React from "react";
import { FiPhone, FiMail, FiGlobe, FiMapPin, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import AddressInput from "./AddressInput";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

interface ContactCardProps {
  profile: any;
  onChange: (field: string, value: any) => void;
  errors: any;
  isEditing: boolean;
}

export default function ContactCard({ profile, onChange, errors, isEditing }: ContactCardProps) {
  const [showOtpModal, setShowOtpModal] = React.useState(false);

  // Enable enhanced keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation();

  return (
    <section
      className="bg-white shadow-sm rounded-lg p-6"
      onKeyDown={handleKeyDown}
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact & Location</h2>

      <div className="space-y-4">
        {/* Primary Contact */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            {isEditing ? (
              <input
                type="text"
                value={profile?.primaryContact?.name || ""}
                onChange={(e) => onChange("primaryContact.name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="Enter contact person name"
              />
            ) : (
              <p className="text-gray-900">{profile?.primaryContact?.name || "-"}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            {isEditing ? (
              <input
                type="text"
                value={profile?.primaryContact?.role || ""}
                onChange={(e) => onChange("primaryContact.role", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="Owner"
              />
            ) : (
              <p className="text-gray-900">{profile?.primaryContact?.role || "-"}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone {isEditing && <span className="text-red-500">*</span>}
          </label>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="tel"
                value={profile?.primaryContact?.phone || ""}
                onChange={(e) => onChange("primaryContact.phone", e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${errors?.phone ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Enter phone number"
              />
              {profile?.primaryContact?.phoneVerified ? (
                <FiCheckCircle className="text-green-600" size={20} />
              ) : (
                <button
                  onClick={() => setShowOtpModal(true)}
                  className="px-3 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded-lg"
                >
                  Verify
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-gray-900">{profile?.primaryContact?.phone || "-"}</p>
              {profile?.primaryContact?.phoneVerified && (
                <FiCheckCircle className="text-green-600" size={16} />
              )}
            </div>
          )}
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={profile?.primaryContact?.whatsapp || ""}
              onChange={(e) => onChange("primaryContact.whatsapp", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Enter WhatsApp number"
            />
          ) : (
            <p className="text-gray-900">{profile?.primaryContact?.whatsapp || "-"}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={profile?.primaryContact?.email || ""}
                onChange={(e) => onChange("primaryContact.email", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="Enter email address"
              />
              {profile?.primaryContact?.emailVerified && (
                <FiCheckCircle className="text-green-600" size={20} />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-gray-900">{profile?.primaryContact?.email || "-"}</p>
              {profile?.primaryContact?.emailVerified && (
                <FiCheckCircle className="text-green-600" size={16} />
              )}
            </div>
          )}
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          {isEditing ? (
            <input
              type="url"
              value={profile?.website || ""}
              onChange={(e) => onChange("website", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="https://hoperx.com"
            />
          ) : (
            <a
              href={profile?.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:underline flex items-center gap-1"
            >
              {profile?.website || "-"} <FiGlobe size={14} />
            </a>
          )}
        </div>

        {/* Address */}
        {isEditing ? (
          <AddressInput
            address={profile?.address}
            onChange={(addr) => onChange("address", addr)}
          />
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <div className="flex items-start gap-2 text-gray-900">
              <FiMapPin className="mt-1 text-gray-400" size={16} />
              <div>
                <p>{profile?.address?.line1}</p>
                {profile?.address?.line2 && <p>{profile.address.line2}</p>}
                {profile?.address?.landmark && <p className="text-sm text-gray-500">Near {profile.address.landmark}</p>}
                <p>{profile?.address?.city}, {profile?.address?.state} - {profile?.address?.postalCode}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
