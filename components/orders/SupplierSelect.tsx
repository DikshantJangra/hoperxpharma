'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Supplier } from '@/types/po';
import { Supplier as ApiSupplier, supplierApi } from '@/lib/api/supplier';
import { HiOutlineChevronDown, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import SupplierForm from '@/components/suppliers/SupplierForm';
import { FiPlus, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface SupplierSelectProps {
  value?: Supplier;
  onChange: (supplier: Supplier) => void;
}

export default function SupplierSelect({ value, onChange }: SupplierSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [SupplierSelect] Fetching suppliers...');

      const response = await supplierApi.getSuppliers({
        page: 1,
        limit: 50,
        status: 'Active',
      });

      console.log('📦 [SupplierSelect] API Response:', response);

      let apiSuppliers: ApiSupplier[] = [];

      // Handle direct array response or wrapped response
      if (Array.isArray(response)) {
        apiSuppliers = response;
      } else if (response.success && response.data) {
        apiSuppliers = response.data;
      } else {
        console.warn('⚠️ [SupplierSelect] Unexpected response format:', response);
        apiSuppliers = [];
      }

      // Map API supplier format to PO supplier format
      const mappedSuppliers: Supplier[] = apiSuppliers.map((apiSupplier) => ({
        id: apiSupplier.id,
        name: apiSupplier.name,
        gstin: apiSupplier.gstin,
        defaultLeadTimeDays: 7, // Default value, can be enhanced later
        contact: {
          email: apiSupplier.email,
          phone: apiSupplier.phoneNumber,
          whatsapp: apiSupplier.whatsapp,
        },
        paymentTerms: apiSupplier.paymentTerms || 'Net 30',
      }));

      console.log('✅ [SupplierSelect] Mapped suppliers:', mappedSuppliers.length);
      setSuppliers(mappedSuppliers);
    } catch (err: any) {
      console.error('❌ [SupplierSelect] Failed to fetch suppliers:', err);
      setError(err.message || 'Failed to load suppliers');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(search.toLowerCase()) ||
    (supplier.gstin && supplier.gstin.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (supplier: Supplier) => {
    onChange(supplier);
    setIsOpen(false);
    setSearch('');
  };

  const handleAddNew = async (newSupplierData: any) => {
    try {
      console.log('💾 [SupplierSelect] Creating new supplier:', newSupplierData);

      // Create supplier via API
      const response = await supplierApi.createSupplier(newSupplierData);

      console.log('✅ [SupplierSelect] Supplier created:', response);

      let createdSupplier: ApiSupplier;
      if (response.success && response.data) {
        createdSupplier = response.data;
      } else if (response.id) {
        createdSupplier = response as ApiSupplier;
      } else {
        throw new Error('Invalid response from create supplier API');
      }

      // Map to PO supplier format
      const newSupplier: Supplier = {
        id: createdSupplier.id,
        name: createdSupplier.name,
        gstin: createdSupplier.gstin,
        defaultLeadTimeDays: 7,
        contact: {
          email: createdSupplier.email,
          phone: createdSupplier.phoneNumber,
          whatsapp: createdSupplier.whatsapp,
        },
        paymentTerms: createdSupplier.paymentTerms || 'Net 30',
      };

      // Add to local list
      setSuppliers(prev => [newSupplier, ...prev]);

      // Set as selected supplier
      onChange(newSupplier);

      // Close modals
      setIsAddModalOpen(false);
      setIsOpen(false);

      console.log('[SupplierSelect] Supplier created and selected:', newSupplier);
    } catch (err: any) {
      console.error('❌ [SupplierSelect] Failed to create supplier:', err);
      toast.error(err.message || 'Failed to create supplier. Please try again.', {
        icon: <FiAlertCircle className="text-red-500" size={20} />
      });
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-64 bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
      >
        <span className="block truncate">
          {value ? value.name : 'Search supplier name or GSTIN...'}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <HiOutlineChevronDown className="h-5 w-5 text-gray-400" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b space-y-2">
            <div className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md text-sm font-medium hover:bg-emerald-100 transition-colors"
            >
              <FiPlus /> Add New Supplier
            </button>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2 text-red-700 text-sm">
              <FiAlertCircle size={14} />
              <span>{error}</span>
              <button onClick={loadSuppliers} className="ml-auto text-xs underline">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading suppliers...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {search ? 'No suppliers found matching your search.' : 'No suppliers available. Click "Add New Supplier" to create one.'}
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <button
                key={supplier.id}
                onClick={() => handleSelect(supplier)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{supplier.name}</div>
                    {supplier.gstin && (
                      <div className="text-sm text-gray-500">GSTIN: {supplier.gstin}</div>
                    )}
                    <div className="text-xs text-gray-400">
                      Lead time: {supplier.defaultLeadTimeDays} days • {supplier.paymentTerms}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Add Supplier Modal Overlay */}
      {isAddModalOpen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <SupplierForm
              onSave={handleAddNew}
              onCancel={() => setIsAddModalOpen(false)}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}