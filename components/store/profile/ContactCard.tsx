import React from "react";
import { FiPhone, FiMail, FiGlobe, FiMapPin, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import AddressInput from "./AddressInput";

interface ContactCardProps {
  profile: any;
  onChange: (field: string, value: any) => void;
  errors: any;
}

export default function ContactCard({ profile, onChange, errors }: ContactCardProps) {
  const [showOtpModal, setShowOtpModal] = React.useState(false);

  return (
    <section className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact & Location</h2>

      <div className="space-y-4">
        {/* Primary Contact */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <input
              type="text"
              value={profile?.primaryContact?.name || ""}
              onChange={(e) => onChange("primaryContact.name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Aman Verma"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              value={profile?.primaryContact?.role || ""}
              onChange={(e) => onChange("primaryContact.role", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Owner"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="tel"
              value={profile?.primaryContact?.phone || ""}
              onChange={(e) => onChange("primaryContact.phone", e.target.value)}
              className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
                errors?.phone ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="+91 98123 45678"
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
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={profile?.primaryContact?.email || ""}
              onChange={(e) => onChange("primaryContact.email", e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="aman@hope.com"
            />
            {profile?.primaryContact?.emailVerified && (
              <FiCheckCircle className="text-green-600" size={20} />
            )}
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            type="url"
            value={profile?.website || ""}
            onChange={(e) => onChange("website", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            placeholder="https://hoperx.com"
          />
        </div>

        {/* Address */}
        <AddressInput
          address={profile?.address}
          onChange={(addr) => onChange("address", addr)}
        />
      </div>
    </section>
  );
}
