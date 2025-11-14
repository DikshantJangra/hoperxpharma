'use client';

import { FiLock, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';

const MOCK_PERMISSIONS = [
  { id: '1', name: 'inventory.adjust', description: 'Modify stock quantities manually', category: 'inventory', severity: 'high', roles: 4, users: 7, lastChanged: '3 days ago', type: 'write' },
  { id: '2', name: 'sale.void', description: 'Void completed sales', category: 'sales', severity: 'critical', roles: 1, users: 2, lastChanged: '1 week ago', type: 'delete' },
  { id: '3', name: 'prescription.view', description: 'View prescription details', category: 'prescriptions', severity: 'low', roles: 8, users: 15, lastChanged: '2 months ago', type: 'read' },
  { id: '4', name: 'inventory.view', description: 'View inventory and stock levels', category: 'inventory', severity: 'low', roles: 10, users: 20, lastChanged: '1 month ago', type: 'read' },
  { id: '5', name: 'sale.refund', description: 'Process customer refunds', category: 'sales', severity: 'high', roles: 3, users: 5, lastChanged: '5 days ago', type: 'write' },
  { id: '6', name: 'user.delete', description: 'Delete user accounts', category: 'users', severity: 'critical', roles: 1, users: 1, lastChanged: '2 weeks ago', type: 'delete' },
];

export default function PermissionList({ searchQuery, selectedCategory, onSelectPermission }: any) {
  const filtered = MOCK_PERMISSIONS.filter(p => 
    (selectedCategory === 'all' || p.category === selectedCategory) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(permission => (
          <div key={permission.id} onClick={() => onSelectPermission(permission)} className="bg-white rounded-lg border border-[#e2e8f0] p-4 hover:border-[#0ea5a3] transition-colors cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {permission.type === 'read' && <FiEye className="w-4 h-4 text-[#64748b]" />}
                {permission.type === 'write' && <FiEdit className="w-4 h-4 text-[#f59e0b]" />}
                {permission.type === 'delete' && <FiTrash2 className="w-4 h-4 text-[#ef4444]" />}
                <h3 className="font-mono text-sm font-semibold text-[#0f172a]">{permission.name}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                permission.severity === 'critical' ? 'bg-[#fee2e2] text-[#991b1b]' :
                permission.severity === 'high' ? 'bg-[#fef3c7] text-[#92400e]' :
                permission.severity === 'medium' ? 'bg-[#dbeafe] text-[#1e40af]' :
                'bg-[#f1f5f9] text-[#64748b]'
              }`}>
                {permission.severity}
              </span>
            </div>
            <p className="text-sm text-[#64748b] mb-3">{permission.description}</p>
            <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
              <span>Roles: <span className="font-semibold text-[#0f172a]">{permission.roles}</span></span>
              <span>Users: <span className="font-semibold text-[#0f172a]">{permission.users}</span></span>
              <span>Changed: {permission.lastChanged}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
