import React from "react";
import { FiClock, FiGlobe } from "react-icons/fi";

interface BusinessCardProps {
  profile: any;
  onChange: (field: string, value: any) => void;
  isEditing: boolean;
}

export default function BusinessCard({ profile, onChange, isEditing }: BusinessCardProps) {
  return (
    <section className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Metadata</h2>

      <div className="space-y-4">
        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          {isEditing ? (
            <select
              value={profile?.timezone || "Asia/Kolkata"}
              onChange={(e) => onChange("timezone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          ) : (
            <p className="text-gray-900">{profile?.timezone || "Asia/Kolkata"}</p>
          )}
        </div>

        {/* Currency & Locale */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            {isEditing ? (
              <select
                value={profile?.currency || "INR"}
                onChange={(e) => onChange("currency", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            ) : (
              <p className="text-gray-900">{profile?.currency || "INR"}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Locale</label>
            {isEditing ? (
              <select
                value={profile?.locale || "en-IN"}
                onChange={(e) => onChange("locale", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="en-IN">English (India)</option>
                <option value="en-US">English (US)</option>
                <option value="hi-IN">Hindi (India)</option>
              </select>
            ) : (
              <p className="text-gray-900">{profile?.locale || "en-IN"}</p>
            )}
          </div>
        </div>

        {/* Public Profile */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">Public Profile</p>
            <p className="text-xs text-gray-500">Make store discoverable on marketplace</p>
          </div>
          {isEditing ? (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile?.publicProfile || false}
                onChange={(e) => onChange("publicProfile", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          ) : (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${profile?.publicProfile ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
              {profile?.publicProfile ? "Enabled" : "Disabled"}
            </span>
          )}
        </div>

        {/* Operations Settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">24x7 Operations</p>
              <p className="text-xs text-gray-500">Store is open 24 hours a day</p>
            </div>
            {isEditing ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile?.operations?.is24x7 || false}
                  onChange={(e) => onChange("operations.is24x7", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            ) : (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${profile?.operations?.is24x7 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                {profile?.operations?.is24x7 ? "Yes" : "No"}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Home Delivery</p>
              <p className="text-xs text-gray-500">Enable home delivery services</p>
            </div>
            {isEditing ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile?.operations?.homeDelivery || false}
                  onChange={(e) => onChange("operations.homeDelivery", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            ) : (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${profile?.operations?.homeDelivery ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                {profile?.operations?.homeDelivery ? "Yes" : "No"}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
