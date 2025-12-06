'use client';

import { useState, useEffect } from 'react';
import { FiX, FiSearch, FiUser, FiPhone, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'sonner';

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    gender: 'MALE',
  });

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

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (formData.phoneNumber.length !== 10 || !/^\d+$/.test(formData.phoneNumber)) {
      toast.error('Phone number must be 10 digits');
      return;
    }

    setIsSubmitting(true);
    try {
      const { patientsApi } = await import('@/lib/api/patients');
      const response = await patientsApi.createPatient({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || undefined,
        phoneNumber: formData.phoneNumber,
        gender: formData.gender,
      });

      if (response.success || response.data) {
        const newCustomer = response.data || response;
        toast.success('Customer added successfully!');
        handleSelect(newCustomer);
      } else {
        toast.error('Failed to add customer');
      }
    } catch (error: any) {
      console.error('Failed to add customer:', error);
      toast.error(error.response?.data?.message || 'Failed to add customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showAddForm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="text-[#64748b] hover:text-[#0f172a] p-1 rounded hover:bg-[#f8fafc]"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-[#0f172a]">Add New Customer</h3>
            </div>
            <button onClick={onClose} className="text-[#64748b] hover:text-[#0f172a] p-1 rounded hover:bg-[#f8fafc]">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddCustomer} className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                  placeholder="John"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                placeholder="9876543210"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2 bg-[#0ea5a3] text-white rounded-lg text-sm hover:bg-[#0d9391] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding...' : 'Add Customer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
              onClick={() => setShowAddForm(true)}
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
