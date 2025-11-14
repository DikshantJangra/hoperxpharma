'use client';

export default function DeviceFilters({ filter, onFilterChange }: any) {
  const types = [
    { id: 'all', label: 'All Types' },
    { id: 'pos_terminal', label: 'POS Terminal' },
    { id: 'printer', label: 'Printer' },
    { id: 'scanner', label: 'Scanner' },
    { id: 'soundbox', label: 'UPI SoundBox' },
    { id: 'scale', label: 'Weighing Scale' }
  ];

  const statuses = [
    { id: 'all', label: 'All Status' },
    { id: 'online', label: 'Online' },
    { id: 'offline', label: 'Offline' },
    { id: 'warning', label: 'Warning' }
  ];

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-[#64748b]">Type:</label>
        <select value={filter.type} onChange={(e) => onFilterChange({ ...filter, type: e.target.value })} className="px-3 py-1.5 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]">
          {types.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-[#64748b]">Status:</label>
        <select value={filter.status} onChange={(e) => onFilterChange({ ...filter, status: e.target.value })} className="px-3 py-1.5 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]">
          {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );
}
