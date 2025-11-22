'use client';

import React, { useState, useEffect } from 'react';
import { Supplier } from '@/types/po';
import { HiOutlineChevronDown, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import SupplierForm from '@/components/inventory/suppliers/SupplierForm';
import { FiPlus } from 'react-icons/fi';

interface SupplierSelectProps {
  value?: Supplier;
  onChange: (supplier: Supplier) => void;
}

export default function SupplierSelect({ value, onChange }: SupplierSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // New state for modal
  const [search, setSearch] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    // ... (keep existing loadSuppliers logic)
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockSuppliers: Supplier[] = [
        {
          id: 'sup_001',
          name: 'ABC Pharma Distributors',
          gstin: '07AAXPS1234J1Z',
          defaultLeadTimeDays: 5,
          contact: {
            email: 'sales@abcpharma.com',
            phone: '+919812345678',
            whatsapp: '+919812345678'
          },
          paymentTerms: '30 days'
        },
        {
          id: 'sup_002',
          name: 'MediCore Supplies',
          gstin: '27BBXPS5678K2A',
          defaultLeadTimeDays: 3,
          contact: {
            email: 'orders@medicore.com',
            phone: '+919876543210'
          },
          paymentTerms: '15 days'
        },
        {
          id: 'sup_003',
          name: 'HealthFirst Distributors',
          defaultLeadTimeDays: 7,
          contact: {
            email: 'procurement@healthfirst.com',
            phone: '+919123456789'
          },
          paymentTerms: '45 days'
        }
      ];
      setSuppliers(mockSuppliers);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
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

  const handleAddNew = (newSupplierData: any) => {
    // In a real app, you'd save to DB first, then add to list
    const newSupplier: Supplier = {
      id: `sup_${Date.now()}`,
      name: newSupplierData.name,
      defaultLeadTimeDays: 7, // Default
      contact: {
        email: newSupplierData.contact?.email,
        phone: newSupplierData.contact?.phone
      },
      paymentTerms: newSupplierData.paymentTerms
    };

    setSuppliers(prev => [...prev, newSupplier]);
    onChange(newSupplier);
    setIsAddModalOpen(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-64 bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full pl-9 pr-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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

          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading suppliers...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No suppliers found</div>
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
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <SupplierForm
              onSave={handleAddNew}
              onCancel={() => setIsAddModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}