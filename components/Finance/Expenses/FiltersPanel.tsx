'use client';

import React from 'react';
import { ExpenseFilters, ExpenseStatus } from '@/types/expenses';
import { HiOutlinePlus, HiOutlineCloudArrowUp } from 'react-icons/hi2';

interface FiltersPanelProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
  onUploadClick: () => void;
  onCreateClick: () => void;
}

export default function FiltersPanel({ filters, onChange, onUploadClick, onCreateClick }: FiltersPanelProps) {
  return (
    <div className="bg-white border-r border-gray-200 p-4 space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={onUploadClick}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <HiOutlineCloudArrowUp className="h-4 w-4" />
            Upload Bill
          </button>
          <button
            onClick={onCreateClick}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Create Expense
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Filters</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Store</label>
            <select
              value={filters.storeId || ''}
              onChange={(e) => onChange({ ...filters, storeId: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Stores</option>
              <option value="store_01">Main Store</option>
              <option value="store_02">Branch 1</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Vendor</label>
            <select
              value={filters.vendorId || ''}
              onChange={(e) => onChange({ ...filters, vendorId: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Vendors</option>
              <option value="sup_001">ABC Supplies</option>
              <option value="sup_002">MediCore</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Category</label>
            <select
              value={filters.category || ''}
              onChange={(e) => onChange({ ...filters, category: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Categories</option>
              <option value="Consumables">Consumables</option>
              <option value="Rent">Rent</option>
              <option value="Utilities">Utilities</option>
              <option value="Salaries">Salaries</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => onChange({ ...filters, status: e.target.value as ExpenseStatus || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="DISPUTED">Disputed</option>
            </select>
          </div>

          <button
            onClick={() => onChange({ from: filters.from, to: filters.to })}
            className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Budgets</h3>
        <div className="space-y-2">
          <div className="text-xs text-gray-600">Consumables</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
          </div>
          <div className="text-xs text-gray-500">₹65,000 / ₹100,000</div>
        </div>
      </div>
    </div>
  );
}
