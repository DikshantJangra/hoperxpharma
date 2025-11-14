'use client';

import { useState } from 'react';
import { FiPlus, FiUpload, FiDownload, FiSearch } from 'react-icons/fi';
import DeviceFilters from '@/components/store/hardware/DeviceFilters';
import DeviceList from '@/components/store/hardware/DeviceList';
import AddDeviceModal from '@/components/store/hardware/AddDeviceModal';
import DeviceDetailDrawer from '@/components/store/hardware/DeviceDetailDrawer';

export default function HardwarePage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [filter, setFilter] = useState({ type: 'all', status: 'all' });
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Hardware</h1>
            <p className="text-sm text-[#64748b]">Store › Hardware</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm font-medium">
              <FiUpload className="w-4 h-4" />
              Bulk Import
            </button>
            <button className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm font-medium">
              <FiDownload className="w-4 h-4" />
              Export
            </button>
            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm font-medium">
              <FiPlus className="w-4 h-4" />
              Add Device
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, serial, IP, MAC..." className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]" />
        </div>

        <DeviceFilters filter={filter} onFilterChange={setFilter} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <DeviceList filter={filter} searchQuery={searchQuery} onSelectDevice={setSelectedDevice} />
        {selectedDevice && <DeviceDetailDrawer device={selectedDevice} onClose={() => setSelectedDevice(null)} />}
      </div>

      {showAddModal && <AddDeviceModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
