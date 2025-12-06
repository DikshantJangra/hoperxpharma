"use client";

import { useState, useEffect } from "react";
import { FiFilter, FiStar, FiBell, FiPlus, FiClock, FiTrash2 } from "react-icons/fi";
import { MdSecurity, MdInventory, MdReceipt, MdPeople } from "react-icons/md";
import { auditApi } from "@/lib/api/audit";
import { toast } from "react-hot-toast";
import CreateSavedFilterModal from "./CreateSavedFilterModal";

interface SavedFiltersProps {
  currentFilters?: any;
  onApplyFilter?: (filters: any) => void;
}

const FilterSkeleton = () => (
  <div className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 animate-pulse">
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 bg-gray-300 rounded"></div>
      <div className="h-4 w-32 bg-gray-200 rounded"></div>
    </div>
    <div className="h-4 w-8 bg-gray-200 rounded"></div>
  </div>
)

export default function SavedFilters({ currentFilters, onApplyFilter }: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchFilters = async () => {
    try {
      setIsLoading(true);
      const response = await auditApi.getSavedFilters();
      const allFilters = response.data;
      setSavedFilters(allFilters.filter((f: any) => f.type === 'filter'));
      setWatchlists(allFilters.filter((f: any) => f.type === 'watchlist'));
    } catch (error) {
      console.error('Failed to fetch saved filters:', error);
      toast.error('Failed to load saved filters');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this filter?')) return;

    try {
      await auditApi.deleteSavedFilter(id);
      toast.success('Filter deleted successfully');
      fetchFilters();
    } catch (error) {
      console.error('Failed to delete filter:', error);
      toast.error('Failed to delete filter');
    }
  };

  const handleApply = (filter: any) => {
    setActiveView(filter.id);
    if (onApplyFilter) {
      onApplyFilter(filter.filters);
    }
  };

  return (
    <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <FiFilter size={16} />
          Saved Filters
        </h3>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Saved Filters */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">My Filters</div>
          <div className="space-y-1">
            {isLoading ? (
              <>
                <FilterSkeleton />
                <FilterSkeleton />
                <FilterSkeleton />
              </>
            ) : savedFilters.length > 0 ? (
              savedFilters.map((filter, idx) => (
                <div
                  key={filter.id}
                  onClick={() => handleApply(filter)}
                  className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer ${activeView === filter.id
                      ? "bg-teal-100 text-teal-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FiFilter size={14} className="flex-shrink-0" />
                    <span className="truncate">{filter.name}</span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, filter.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 px-3 py-2 italic">No saved filters yet</p>
            )}
          </div>
        </div>

        {/* Watchlists */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-1">
            <FiBell size={12} />
            Watchlists
          </div>
          <div className="space-y-1">
            {isLoading ? (
              <>
                <FilterSkeleton />
                <FilterSkeleton />
              </>
            ) : watchlists.length > 0 ? (
              watchlists.map((watch, idx) => (
                <div
                  key={watch.id}
                  onClick={() => handleApply(watch)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer ${activeView === watch.id
                      ? "bg-teal-100 text-teal-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FiStar size={14} className={watch.alertEnabled ? "text-orange-500" : "text-gray-400"} />
                    <span className="truncate">{watch.name}</span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, watch.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 px-3 py-2 italic">No watchlists yet</p>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">Quick Links</div>
          <div className="space-y-1">
            <button
              onClick={() => handleApply({ filters: { severity: 'high' } })}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
            >
              Show only high severity
            </button>
            <button
              onClick={() => handleApply({ filters: { action: 'api' } })}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
            >
              Show API calls
            </button>
            <button
              onClick={() => handleApply({ filters: { entityType: 'system' } })}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
            >
              Show system changes
            </button>
          </div>
        </div>

        {/* Retention Status */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700 text-xs font-medium mb-2">
            <FiClock size={14} />
            Retention Policy
          </div>
          <div className="text-xs text-blue-600">
            <div>Financial: 7 years</div>
            <div>Auth logs: 1 year</div>
            <div className="mt-2 text-blue-500">Next archive: Jan 15, 2026</div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
          disabled={isLoading}
        >
          <FiPlus size={16} />
          Create Saved Query
        </button>
      </div>

      {showCreateModal && (
        <CreateSavedFilterModal
          currentFilters={currentFilters}
          onClose={() => setShowCreateModal(false)}
          onSave={fetchFilters}
        />
      )}
    </div>
  );
}
