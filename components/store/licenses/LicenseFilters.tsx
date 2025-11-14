'use client';

export default function LicenseFilters({ activeFilter, onFilterChange }: any) {
  const filters = [
    { id: 'all', label: 'All', count: 12 },
    { id: 'active', label: 'Active', count: 8 },
    { id: 'expiring', label: 'Expiring Soon', count: 2 },
    { id: 'expired', label: 'Expired', count: 1 },
    { id: 'pending', label: 'Pending', count: 1 }
  ];

  return (
    <div className="flex items-center gap-2">
      {filters.map(filter => (
        <button key={filter.id} onClick={() => onFilterChange(filter.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === filter.id ? 'bg-[#0ea5a3] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
          }`}>
          {filter.label} ({filter.count})
        </button>
      ))}
    </div>
  );
}
