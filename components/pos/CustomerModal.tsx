'use client';

import { useState, useEffect } from 'react';
import { FiX, FiSearch, FiUser, FiPhone } from 'react-icons/fi';

const CustomerCardSkeleton = () => (
  <div className="p-3 border border-[#e2e8f0] rounded-lg animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
      </div>
    </div>
  </div>
)

export default function CustomerModal({ onSelect, onClose }: any) {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search patients from API with debounce
  useEffect(() => {
    const searchPatients = async () => {
      if (search.length < 2) {
        setCustomers([]);
        return;
      }

      setIsLoading(true);
      try {
        const { patientsApi } = await import('@/lib/api/patients');
        const response = await patientsApi.getPatients({
          search,
          limit: 10,
        });

        if (response.success) {
          setCustomers(response.data || []);
        }
      } catch (error) {
        console.error('Failed to search patients:', error);
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(searchPatients, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSelect = (customer: any) => {
    onSelect({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phoneNumber: customer.phoneNumber,
      email: customer.email,
    });
    onClose();
  };

  const handleSkip = () => {
    onSelect(null); // Proceed without customer
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
          <h3 className="text-lg font-bold text-[#0f172a]">Select Customer</h3>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#0f172a] p-1 rounded hover:bg-[#f8fafc]">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone (min 2 characters)..."
              className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              autoFocus
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isLoading ? (
              <>
                <CustomerCardSkeleton />
                <CustomerCardSkeleton />
                <CustomerCardSkeleton />
              </>
            ) : customers.length > 0 ? (
              customers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelect(customer)}
                  className="p-3 border border-[#e2e8f0] rounded-lg hover:border-[#0ea5a3] hover:bg-[#f0fdfa] cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-[#0f172a] flex items-center gap-2">
                        <FiUser className="w-4 h-4" />
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className="text-sm text-[#64748b] mt-1 flex items-center gap-2">
                        <FiPhone className="w-3 h-3" />
                        {customer.phoneNumber}
                      </div>
                      {customer.email && (
                        <div className="text-xs text-[#64748b] mt-1">{customer.email}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : search.length >= 2 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                No customers found. Try a different search or add new customer.
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 text-sm">
                Type at least 2 characters to search for customers
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSkip}
              disabled
              className="flex-1 py-2 border border-[#cbd5e1] rounded-lg text-sm text-[#94a3b8] bg-[#f8fafc] cursor-not-allowed opacity-50"
              title="Customer selection is required"
            >
              Skip (Disabled)
            </button>
            <button
              onClick={() => {/* TODO: Open add customer form */ }}
              className="flex-1 py-2 bg-[#0ea5a3] text-white rounded-lg text-sm hover:bg-[#0d9391]"
            >
              + Add New Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
