import React from "react";
import { FiX } from "react-icons/fi";

interface FiltersPanelProps {
  filters: any;
  onChange: (filters: any) => void;
}

export default function FiltersPanel({ filters, onChange }: FiltersPanelProps) {
  const updateFilter = (key: string, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-teal-600 hover:text-teal-700"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Age Range */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Age Range</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.ageMin || ""}
              onChange={(e) => updateFilter("ageMin", e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.ageMax || ""}
              onChange={(e) => updateFilter("ageMax", e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Sex */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Sex</label>
          <select
            value={filters.sex || ""}
            onChange={(e) => updateFilter("sex", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
        </div>

        {/* Has Allergies */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.hasAllergies || false}
              onChange={(e) => updateFilter("hasAllergies", e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Has allergies</span>
          </label>
        </div>

        {/* Pending Refills */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.pendingRefills || false}
              onChange={(e) => updateFilter("pendingRefills", e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Pending refills</span>
          </label>
        </div>

        {/* Last Visit */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Last Visit</label>
          <select
            value={filters.lastVisit || ""}
            onChange={(e) => updateFilter("lastVisit", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Any time</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {/* Lifecycle Stage - NEW */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Lifecycle Stage</label>
          <select
            value={filters.lifecycleStage || ""}
            onChange={(e) => updateFilter("lifecycleStage", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All</option>
            <option value="IDENTIFIED">Identified</option>
            <option value="ESTABLISHED">Established</option>
            <option value="TRUSTED">Trusted</option>
            <option value="CREDIT_ELIGIBLE">Credit-Eligible</option>
          </select>
        </div>

        {/* Risk Level - NEW */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Risk Level</label>
          <select
            value={filters.riskLevel || ""}
            onChange={(e) => updateFilter("riskLevel", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="ELEVATED">Elevated Risk</option>
          </select>
        </div>

        {/* Credit Status - NEW */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.creditEnabled || false}
              onChange={(e) => updateFilter("creditEnabled", e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Credit Enabled</span>
          </label>
        </div>

        {/* Consent Status */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Consent</label>
          <select
            value={filters.consent || ""}
            onChange={(e) => updateFilter("consent", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All</option>
            <option value="signed">Signed</option>
            <option value="missing">Missing</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Tags</label>
          <div className="space-y-2">
            {["chronic", "vip", "senior"].map((tag) => (
              <label key={tag} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.tags?.includes(tag) || false}
                  onChange={(e) => {
                    const currentTags = filters.tags || [];
                    const newTags = e.target.checked
                      ? [...currentTags, tag]
                      : currentTags.filter((t: string) => t !== tag);
                    updateFilter("tags", newTags);
                  }}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700 capitalize">{tag}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
