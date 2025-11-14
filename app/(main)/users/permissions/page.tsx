'use client';

import { useState } from 'react';
import { FiSearch, FiDownload, FiGrid } from 'react-icons/fi';
import CategorySidebar from '@/components/users/permissions/CategorySidebar';
import PermissionList from '@/components/users/permissions/PermissionList';
import PermissionDrawer from '@/components/users/permissions/PermissionDrawer';

export default function PermissionsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPermission, setSelectedPermission] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Permissions Directory</h1>
            <p className="text-sm text-[#64748b]">Users › Permissions</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm font-medium">
              <FiGrid className="w-4 h-4" />
              Matrix View
            </button>
            <button className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm font-medium">
              <FiDownload className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search permissions by name, description, category, role..." className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]" />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total', value: '153', color: 'bg-[#f8fafc]' },
            { label: 'Critical', value: '7', color: 'bg-[#fee2e2]' },
            { label: 'High-Risk', value: '14', color: 'bg-[#fef3c7]' },
            { label: 'Unused', value: '12', color: 'bg-[#f1f5f9]' },
            { label: 'Changed', value: '5', color: 'bg-[#f0fdfa]' }
          ].map(stat => (
            <div key={stat.label} className={`${stat.color} rounded-lg px-4 py-3 border border-[#e2e8f0]`}>
              <div className="text-xs text-[#64748b]">{stat.label}</div>
              <div className="text-2xl font-bold text-[#0f172a]">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <CategorySidebar selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        <PermissionList searchQuery={searchQuery} selectedCategory={selectedCategory} onSelectPermission={setSelectedPermission} />
        {selectedPermission && <PermissionDrawer permission={selectedPermission} onClose={() => setSelectedPermission(null)} />}
      </div>
    </div>
  );
}
