import React from "react";
import { FiSearch, FiPlus, FiFilter, FiDownload, FiUpload } from "react-icons/fi";

interface PatientsHeaderProps {
  search: string;
  onSearch: (value: string) => void;
  onNew: () => void;
  onToggleFilters: () => void;
  showFilters: boolean;
}

export default function PatientsHeader({ search, onSearch, onNew, onToggleFilters, showFilters }: PatientsHeaderProps) {
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2">
              <FiUpload size={16} />
              Import
            </button>
            <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2">
              <FiDownload size={16} />
              Export
            </button>
            <button
              onClick={onNew}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <FiPlus size={16} />
              New Patient
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search patients by name, phone, MRN… (Press / to focus)"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={onToggleFilters}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              showFilters ? "bg-teal-50 text-teal-700 border border-teal-200" : "text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            <FiFilter size={16} />
            Filters
          </button>
        </div>
      </div>
    </div>
  );
}
