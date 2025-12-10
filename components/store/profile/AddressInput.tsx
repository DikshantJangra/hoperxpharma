import React from "react";
import { FiMapPin } from "react-icons/fi";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

interface AddressInputProps {
  address: any;
  onChange: (address: any) => void;
}

export default function AddressInput({ address, onChange }: AddressInputProps) {
  const [showMap, setShowMap] = React.useState(false);

  // Enable enhanced keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation();

  const updateField = (field: string, value: string) => {
    onChange({ ...address, [field]: value });
  };

  return (
    <div
      className="space-y-3"
      onKeyDown={handleKeyDown}
    >
      <label className="block text-sm font-medium text-gray-700">Address</label>

      <input
        type="text"
        value={address?.line1 || ""}
        onChange={(e) => updateField("line1", e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
        placeholder="Address Line 1"
      />

      <input
        type="text"
        value={address?.line2 || ""}
        onChange={(e) => updateField("line2", e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
        placeholder="Address Line 2 (optional)"
      />

      <input
        type="text"
        value={address?.landmark || ""}
        onChange={(e) => updateField("landmark", e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
        placeholder="Landmark (optional)"
      />

      <div className="grid grid-cols-3 gap-3">
        <input
          type="text"
          value={address?.city || ""}
          onChange={(e) => updateField("city", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          placeholder="City"
        />
        <input
          type="text"
          value={address?.state || ""}
          onChange={(e) => updateField("state", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          placeholder="State"
        />
        <input
          type="text"
          value={address?.postalCode || ""}
          onChange={(e) => updateField("postalCode", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          placeholder="Postal Code"
        />
      </div>

      <button
        onClick={() => setShowMap(true)}
        className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-2"
      >
        <FiMapPin size={16} />
        View on Map
      </button>
    </div>
  );
}
