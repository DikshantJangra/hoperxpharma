'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiUpload, FiDownload, FiSearch } from 'react-icons/fi';
import LicenseFilters from '@/components/store/licenses/LicenseFilters';
import LicenseList from '@/components/store/licenses/LicenseList';
import AddLicenseModal from '@/components/store/licenses/AddLicenseModal';
import LicenseDetailDrawer from '@/components/store/licenses/LicenseDetailDrawer';

export default function LicensesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Licenses</h1>
            <p className="text-sm text-[#64748b]">Store › Licenses</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm font-medium" disabled={isLoading}>
              <FiUpload className="w-4 h-4" />
              Bulk Import
            </button>
            <button className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm font-medium" disabled={isLoading}>
              <FiDownload className="w-4 h-4" />
              Export
            </button>
            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm font-medium" disabled={isLoading}>
              <FiPlus className="w-4 h-4" />
              Add License
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by license no, authority, doc name, uploader..." className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]" disabled={isLoading} />
        </div>

        <LicenseFilters activeFilter={filter} onFilterChange={setFilter} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <LicenseList filter={filter} searchQuery={searchQuery} onSelectLicense={setSelectedLicense} isLoading={isLoading} />
        {selectedLicense && <LicenseDetailDrawer license={selectedLicense} onClose={() => setSelectedLicense(null)} />}
      </div>

      {showAddModal && <AddLicenseModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
