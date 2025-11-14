'use client';

import { FiDatabase, FiShoppingCart, FiUsers, FiSettings, FiAlertTriangle } from 'react-icons/fi';

const CATEGORIES = [
  { id: 'all', label: 'All Permissions', count: 153, icon: FiSettings },
  { id: 'inventory', label: 'Inventory', count: 12, icon: FiDatabase },
  { id: 'sales', label: 'Sales / POS', count: 18, icon: FiShoppingCart },
  { id: 'prescriptions', label: 'Prescriptions', count: 15, icon: FiDatabase },
  { id: 'customers', label: 'Customers', count: 10, icon: FiUsers },
  { id: 'reports', label: 'Reports', count: 14, icon: FiDatabase },
  { id: 'integrations', label: 'Integrations', count: 9, icon: FiSettings },
  { id: 'users', label: 'Users & Roles', count: 11, icon: FiUsers },
  { id: 'sensitive', label: 'Sensitive Actions', count: 7, icon: FiAlertTriangle, highlight: true },
];

export default function CategorySidebar({ selectedCategory, onSelectCategory }: any) {
  return (
    <div className="w-64 bg-white border-r border-[#e2e8f0] p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-[#64748b] mb-3 uppercase">Categories</h3>
      <div className="space-y-1">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => onSelectCategory(cat.id)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === cat.id ? 'bg-[#0ea5a3] text-white' : cat.highlight ? 'bg-[#fef3c7] text-[#92400e] hover:bg-[#fde68a]' : 'text-[#64748b] hover:bg-[#f8fafc]'
            }`}>
            <div className="flex items-center gap-2">
              <cat.icon className="w-4 h-4" />
              <span className="font-medium">{cat.label}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              selectedCategory === cat.id ? 'bg-white/20' : 'bg-[#f1f5f9] text-[#64748b]'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
