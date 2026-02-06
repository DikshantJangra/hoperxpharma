import React from "react";
import { FiSearch, FiPlus, FiFilter, FiDownload, FiUpload, FiUsers } from "react-icons/fi";
import { motion } from "framer-motion";

interface PatientsHeaderProps {
  search: string;
  onSearch: (value: string) => void;
  onNew: () => void;
  onToggleFilters: () => void;
  showFilters: boolean;
  totalCount?: number;
}

export default function PatientsHeader({
  search,
  onSearch,
  onNew,
  onToggleFilters,
  showFilters,
  totalCount = 0
}: PatientsHeaderProps) {
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
    <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-teal-500/10 p-2 rounded-xl">
                <FiUsers className="text-teal-600 w-5 h-5" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Patients</h1>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-11">
              Manage your pharmacy relationships
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button className="px-4 py-2 text-[10px] font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest flex items-center gap-2">
                <FiUpload size={14} />
                Import
              </button>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <button className="px-4 py-2 text-[10px] font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest flex items-center gap-2">
                <FiDownload size={14} />
                Export
              </button>
            </div>
            <button
              onClick={onNew}
              className="px-6 py-2.5 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-teal-100 flex items-center gap-3"
            >
              <div className="w-5 h-5 bg-white/10 rounded-lg flex items-center justify-center">
                <FiPlus size={14} />
              </div>
              New Patient
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors">
              <FiSearch size={20} />
            </div>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search patients by name, phone, MRN… (Press / to focus)"
              className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-[24px] text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => onSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-widest"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={onToggleFilters}
            className={`px-6 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all ${showFilters
              ? "bg-teal-600 text-white shadow-xl shadow-teal-100 ring-4 ring-teal-500/10"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100 shadow-sm"
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
