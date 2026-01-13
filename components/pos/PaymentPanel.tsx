'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FiUser, FiCreditCard, FiSmartphone, FiDollarSign, FiUserPlus, FiClock, FiSearch, FiX, FiCheck } from 'react-icons/fi';
import { BsWallet2 } from 'react-icons/bs';
import ProcessingLoader from './animations/ProcessingLoader';
import ExposeMarginEstimate from './ExposeMarginEstimate';

export default function PaymentPanel({
  basketItems,
  customer,
  onCustomerChange,
  onFinalize,
  onOpenCustomer,
  onOpenLedger,
  onSplitPayment,
  onClear,
  onApplyDiscount,
  totals,
  dispenseFor,
  onDispenseForChange,
  onSaveDraft
}: any) {
  const [invoiceType, setInvoiceType] = useState<'GST_INVOICE' | 'ESTIMATE'>('GST_INVOICE');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'wallet' | 'credit'>('cash');
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('percentage');

  // Action states for buttons
  const [actionState, setActionState] = useState<{ name: string | null, status: 'idle' | 'loading' | 'success' }>({ name: null, status: 'idle' });

  const triggerAction = async (name: string, fn: () => Promise<any>) => {
    if (actionState.status !== 'idle') return;
    setActionState({ name, status: 'loading' });
    try {
      await fn();
      setActionState({ name, status: 'success' });
      setTimeout(() => setActionState({ name: null, status: 'idle' }), 2000);
    } catch (e: any) {
      console.error(Object.keys(e as any).length === 0 ? "Action failed" : e);
      toast.error(e.message || "Action failed");
      // Don't show success if failed, just reset
      setActionState({ name: null, status: 'idle' });
    }
  };

  const [relations, setRelations] = useState<any[]>([]);
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingLoading, setIsSearchingLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const [showAddRelation, setShowAddRelation] = useState(false);
  const [newRelationData, setNewRelationData] = useState({ firstName: '', lastName: '', phoneNumber: '', relationType: 'CHILD' });
  const [isCreatingRelation, setIsCreatingRelation] = useState(false);

  const [relationSearchQuery, setRelationSearchQuery] = useState('');
  const [relationSearchResults, setRelationSearchResults] = useState<any[]>([]);
  const [isSearchingRelation, setIsSearchingRelation] = useState(false);
  const [showRelationSearch, setShowRelationSearch] = useState(false);

  const [enableSearch, setEnableSearch] = useState(false);

  const searchCustomers = async (query: string) => {
    if (query.length < 2) return;

    setIsSearchingLoading(true);
    try {
      const { patientsApi } = await import('@/lib/api/patients');
      const response = await patientsApi.getPatients({
        search: query,
        limit: 5
      });
      if (response.success) {
        setSearchResults(response.data || []);
      }
    } catch (err) {
      console.error("Error searching customers:", err);
    } finally {
      setIsSearchingLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchCustomers(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  const safeTotals = totals || {
    totalMrp: 0,
    totalDiscount: 0,
    taxableValue: 0,
    taxAmount: 0,
    roundOff: 0,
    total: 0
  };

  useEffect(() => {
    if (customer) {
      fetchRelations(customer.id);
    } else {
      setRelations([]);
    }
  }, [customer]);

  const fetchRelations = async (customerId: string) => {
    setIsLoadingRelations(true);
    try {
      const { apiClient } = await import('@/lib/api/client');
      const response = await apiClient.get(`/patients/${customerId}/relations`);
      if (response.success) setRelations(response.data);
    } catch (err) {
      console.error("Failed to fetch relations", err);
    } finally {
      setIsLoadingRelations(false);
    }
  };

  const handleCreateCustomer = async () => {
    // Validation
    if (!newCustomerData.firstName.trim()) {
      toast.error("First Name is required");
      return;
    }

    if (!newCustomerData.phoneNumber.trim()) {
      toast.error("Phone Number is required");
      return;
    }

    // Phone validation: must be 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(newCustomerData.phoneNumber)) {
      toast.error("Phone Number must be exactly 10 digits");
      return;
    }

    setIsCreatingCustomer(true);
    try {
      const { patientsApi } = await import('@/lib/api/patients');

      try {
        const response = await patientsApi.createPatient({
          ...newCustomerData,
          gender: 'Male',
          dateOfBirth: new Date().toISOString()
        });

        const responseData = response.data || response;
        const createdCustomer = responseData.data || responseData;

        if (createdCustomer && createdCustomer.id) {
          toast.success("Customer created successfully!");
          onCustomerChange(createdCustomer);
          setShowAddCustomer(false);
          setNewCustomerData({ firstName: '', lastName: '', phoneNumber: '' });
          setEnableSearch(false);
        } else {
          toast.error("Failed to create customer");
        }
      } catch (createError: any) {
        // Handle patient creation error specifically
        const errorMessage = createError?.message || String(createError);

        if (errorMessage.includes('already exists') || errorMessage.includes('409')) {
          toast.error("Customer with this phone number already exists! Try searching instead.");
        } else {
          toast.error(errorMessage || "Failed to create customer");
        }
        // Don't re-throw - error is already handled
      }
    } catch (err: any) {
      // Outer catch for unexpected errors only
      console.error("Unexpected error in handleCreateCustomer", err);
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const searchRelations = async (query: string) => {
    if (query.length < 2) return;

    setIsSearchingRelation(true);
    try {
      const { patientsApi } = await import('@/lib/api/patients');
      const response = await patientsApi.getPatients({
        search: query,
        limit: 5
      });
      if (response.success) {
        setRelationSearchResults(response.data || []);
      }
    } catch (err) {
      console.error("Error searching relations:", err);
    } finally {
      setIsSearchingRelation(false);
    }
  };

  const handleLinkExistingRelation = async (patient: any) => {
    if (!customer) return;

    try {
      const { apiClient } = await import('@/lib/api/client');
      await apiClient.post(`/patients/${customer.id}/relations`, {
        relatedPatientId: patient.id,
        relationType: newRelationData.relationType
      });

      toast.success(`${newRelationData.relationType.toLowerCase()} linked successfully!`);
      await fetchRelations(customer.id);
      onDispenseForChange(patient);
      setShowAddRelation(false);
      setShowRelationSearch(false);
      setRelationSearchQuery('');
      setNewRelationData({ firstName: '', lastName: '', phoneNumber: '', relationType: 'CHILD' });
    } catch (err) {
      toast.error("Failed to link family member");
    }
  };

  const handleCreateRelation = async () => {
    if (!customer) return;

    if (!newRelationData.firstName.trim()) {
      toast.error("First Name is required");
      return;
    }

    if (!newRelationData.phoneNumber.trim()) {
      toast.error("Phone Number is required");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(newRelationData.phoneNumber)) {
      toast.error("Phone Number must be exactly 10 digits");
      return;
    }

    setIsCreatingRelation(true);
    try {
      const { patientsApi } = await import('@/lib/api/patients');

      try {
        const response = await patientsApi.createPatient({
          ...newRelationData,
          gender: 'Male',
          dateOfBirth: new Date().toISOString()
        });

        const responseData = response.data || response;
        const createdRelation = responseData.data || responseData;

        if (createdRelation && createdRelation.id) {
          // Link as relation
          const { apiClient } = await import('@/lib/api/client');
          await apiClient.post(`/patients/${customer.id}/relations`, {
            relatedPatientId: createdRelation.id,
            relationType: newRelationData.relationType
          });

          toast.success(`${newRelationData.relationType.toLowerCase()} added successfully!`);
          await fetchRelations(customer.id);
          onDispenseForChange(createdRelation);
          setShowAddRelation(false);
          setNewRelationData({ firstName: '', lastName: '', phoneNumber: '', relationType: 'CHILD' });
        } else {
          toast.error("Failed to create family member");
        }
      } catch (createError: any) {
        // Handle patient creation error specifically
        console.log('🔴 Caught error in handleCreateRelation:', createError);
        const errorMessage = createError?.message || String(createError);
        console.log('🔴 Error message:', errorMessage);

        if (errorMessage.includes('already exists') || errorMessage.includes('409')) {
          console.log('🔴 Showing duplicate error toast');
          toast.error("Patient with this phone number already exists! Try searching instead.", { duration: 5000 });
        } else {
          console.log('🔴 Showing generic error toast');
          toast.error(errorMessage || "Failed to create family member", { duration: 5000 });
        }
        // Don't re-throw - error is already handled
      }
    } catch (err: any) {
      // Outer catch for unexpected errors only
      console.error("Unexpected error in handleCreateRelation", err);
    } finally {
      setIsCreatingRelation(false);
    }
  };

  // Add check for out-of-stock items
  const hasOutOfStockItems = basketItems.some((item: any) => {
    const stock = Number(item.stock) || Number(item.totalStock) || 0;
    return isNaN(stock) || stock <= 0;
  });

  const handleFinalize = () => {
    if (basketItems.length === 0) {
      toast.error('Cannot complete sale with empty basket!');
      return;
    }

    // Customer is REQUIRED only for Credit/Pay Later
    if (paymentMethod === 'credit' && !customer) {
      toast.error('Customer Details Required for Credit/Pay Later!');
      toast.info("Please search or add a customer");
      return;
    }

    const stockIssues = basketItems.filter((item: any) =>
      item.qty > (item.stock || item.totalStock || 0)
    );

    if (stockIssues.length > 0) {
      const itemNames = stockIssues.map((item: any) => item.name).join(', ');
      toast.error(`Stock issue: ${itemNames}. Quantity exceeds available stock.`);
      return;
    }

    setShowFinalizeModal(true);
  };

  const confirmFinalize = async () => {
    await triggerAction('complete_sale', async () => {
      await onFinalize(paymentMethod.toUpperCase(), undefined, invoiceType);
      setShowFinalizeModal(false); // Close on success? Or wait? 
      // Ideally close after success. If onFinalize throws, we stay open.
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#f0f9ff]/30">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
        <div className="grid grid-cols-2 gap-3">
          <div className={`col-span-2 rounded-lg p-3 border transition-colors ${customer ? 'bg-white border-indigo-200' : 'bg-white border-gray-200 hover:border-indigo-300'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</span>
              {customer && <button onClick={() => onCustomerChange(null)} className="text-xs text-red-400 hover:text-red-600">Clear</button>}
            </div>

            {customer ? (
              <div className="flex items-center gap-3 p-1">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 ring-2 ring-white shadow-sm">
                  {customer.firstName[0]}
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-gray-900 truncate text-sm">{customer.firstName} {customer.lastName}</div>
                    {Number(customer.currentBalance) > 0 && (
                      <div className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                        Due: ₹{Number(customer.currentBalance).toFixed(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="text-xs text-gray-500">{customer.phoneNumber}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenLedger(); }}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${Number(customer.currentBalance) > 0
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100'
                        }`}
                    >
                      {Number(customer.currentBalance) > 0 ? 'Pay Dues' : 'History'}
                    </button>
                  </div>

                  <div className="mt-2 pt-2 border-t border-indigo-50" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Dispensing For</span>
                      <span className="text-xs font-semibold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
                        {dispenseFor ? (dispenseFor.id === customer.id ? 'Self' : dispenseFor.firstName) : 'Self'}
                      </span>
                    </div>

                    {showAddRelation ? (
                      <div className="bg-gray-50 rounded-lg p-2 border border-indigo-100 mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-indigo-700">Add Family Member</span>
                          <button onClick={() => { setShowAddRelation(false); setShowRelationSearch(false); }} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                        </div>

                        {showRelationSearch ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Search by name or phone..."
                              className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 outline-none"
                              value={relationSearchQuery}
                              onChange={e => {
                                setRelationSearchQuery(e.target.value);
                                if (e.target.value.length >= 2) searchRelations(e.target.value);
                              }}
                              autoFocus
                            />
                            {isSearchingRelation ? (
                              <div className="text-xs text-gray-500 text-center py-2">Searching...</div>
                            ) : relationSearchResults.length > 0 ? (
                              <div className="max-h-32 overflow-y-auto space-y-1">
                                {relationSearchResults.map(p => (
                                  <div
                                    key={p.id}
                                    onClick={() => handleLinkExistingRelation(p)}
                                    className="flex items-center gap-2 p-1.5 hover:bg-indigo-50 rounded cursor-pointer border border-gray-200"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                                      {p.firstName[0]}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-xs font-medium">{p.firstName} {p.lastName}</div>
                                      <div className="text-[10px] text-gray-500">{p.phoneNumber}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : relationSearchQuery.length >= 2 ? (
                              <div className="text-xs text-gray-500 text-center py-2">No results</div>
                            ) : null}
                            <button
                              onClick={() => setShowRelationSearch(false)}
                              className="w-full text-xs text-indigo-600 hover:text-indigo-800 py-1"
                            >
                              Or create new
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <select
                              className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 outline-none"
                              value={newRelationData.relationType}
                              onChange={e => setNewRelationData({ ...newRelationData, relationType: e.target.value })}
                            >
                              <option value="FAMILY">Family Member</option>
                              <option value="PARENT">Parent</option>
                              <option value="CHILD">Child</option>
                              <option value="SPOUSE">Spouse</option>
                              <option value="BROTHER">Brother</option>
                              <option value="SISTER">Sister</option>
                              <option value="SIBLING">Sibling</option>
                              <option value="GRANDPARENT">Grandparent</option>
                              <option value="GRANDCHILD">Grandchild</option>
                              <option value="FRIEND">Friend</option>
                              <option value="CAREGIVER">Caregiver</option>
                              <option value="OTHER">Other</option>
                            </select>
                            <div className="grid grid-cols-2 gap-1">
                              <input
                                type="text"
                                placeholder="First Name"
                                className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 outline-none"
                                value={newRelationData.firstName}
                                onChange={e => setNewRelationData({ ...newRelationData, firstName: e.target.value })}
                              />
                              <input
                                type="text"
                                placeholder="Last Name"
                                className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 outline-none"
                                value={newRelationData.lastName}
                                onChange={e => setNewRelationData({ ...newRelationData, lastName: e.target.value })}
                              />
                            </div>
                            <input
                              type="tel"
                              placeholder="Phone (10 digits)"
                              className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 outline-none"
                              value={newRelationData.phoneNumber}
                              onChange={e => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setNewRelationData({ ...newRelationData, phoneNumber: value });
                              }}
                              maxLength={10}
                            />
                            <button
                              onClick={handleCreateRelation}
                              disabled={isCreatingRelation}
                              className="w-full bg-indigo-600 text-white text-xs font-bold py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {isCreatingRelation ? 'Adding...' : 'Add & Select'}
                            </button>
                            <button
                              onClick={() => setShowRelationSearch(true)}
                              className="w-full text-xs text-indigo-600 hover:text-indigo-800 py-1 border-t border-gray-200 mt-1 pt-1"
                            >
                              Search existing patient
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => onDispenseForChange(customer)}
                          className={`text-[10px] px-2 py-1 rounded border ${dispenseFor?.id === customer.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}
                        >
                          Self
                        </button>
                        {relations.map(rel => (
                          <button
                            key={rel.id}
                            onClick={() => onDispenseForChange(rel)}
                            className={`text-[10px] px-2 py-1 rounded border ${dispenseFor?.id === rel.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}
                          >
                            {rel.firstName} ({rel.relationType})
                          </button>
                        ))}
                        <button
                          onClick={() => setShowAddRelation(true)}
                          className="text-[10px] px-2 py-1 rounded border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                        >
                          + Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                {!enableSearch ? (
                  <div
                    onClick={() => setEnableSearch(true)}
                    className="group cursor-pointer flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 ring-4 ring-teal-50/50 group-hover:bg-teal-100 group-hover:scale-105 transition-all duration-200">
                        <FiUser className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">Walk-in Customer</span>
                        <span className="text-[11px] text-gray-400 font-medium">Standard Retail / OTC</span>
                      </div>
                    </div>
                    <button className="text-xs font-semibold bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-md group-hover:border-indigo-200 group-hover:text-indigo-600 shadow-sm transition-all">
                      Select Customer
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    {showAddCustomer ? (
                      <div className="bg-gray-50 rounded-lg p-3 border border-indigo-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-indigo-700">New Customer</span>
                          <div className="flex gap-2">
                            <button onClick={() => setShowAddCustomer(false)} className="text-xs text-gray-500 hover:text-gray-700">Back</button>
                            <button onClick={() => { setShowAddCustomer(false); setEnableSearch(false); }} className="text-xs text-red-400 hover:text-red-500">Close</button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="First Name"
                              className="w-full text-xs p-2 border border-gray-300 rounded focus:border-indigo-500 outline-none"
                              value={newCustomerData.firstName}
                              onChange={e => setNewCustomerData({ ...newCustomerData, firstName: e.target.value })}
                              autoFocus
                            />
                            <input
                              type="text"
                              placeholder="Last Name"
                              className="w-full text-xs p-2 border border-gray-300 rounded focus:border-indigo-500 outline-none"
                              value={newCustomerData.lastName}
                              onChange={e => setNewCustomerData({ ...newCustomerData, lastName: e.target.value })}
                            />
                          </div>
                          <input
                            type="tel"
                            placeholder="Phone Number (10 digits)"
                            className="w-full text-xs p-2 border border-gray-300 rounded focus:border-indigo-500 outline-none"
                            value={newCustomerData.phoneNumber}
                            onChange={e => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setNewCustomerData({ ...newCustomerData, phoneNumber: value });
                            }}
                            maxLength={10}
                            pattern="[0-9]{10}"
                          />
                          <button
                            onClick={handleCreateCustomer}
                            disabled={isCreatingCustomer}
                            className="w-full bg-indigo-600 text-white text-xs font-bold py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {isCreatingCustomer ? 'Creating...' : 'Create & Select'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <FiSearch className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Search customer by name or phone..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => {
                            setIsSearching(true);
                            if (searchQuery.length >= 2) searchCustomers(searchQuery);
                          }}
                          onBlur={() => setTimeout(() => setIsSearching(false), 200)}
                          onKeyDown={(e) => {
                            if (!isSearching || searchResults.length === 0) return;

                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setSelectedIndex(prev => Math.max(prev - 1, 0));
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              if (searchResults[selectedIndex]) {
                                onCustomerChange(searchResults[selectedIndex]);
                                setSearchQuery('');
                                setIsSearching(false);
                                setEnableSearch(false);
                              }
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => setEnableSearch(false)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 cursor-pointer"
                          title="Close search"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                        {isSearching && searchQuery.length >= 2 && (
                          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                            {isSearchingLoading ? (
                              <div className="p-3 text-center text-xs text-gray-500">Searching...</div>
                            ) : searchResults.length > 0 ? (
                              searchResults.map((c: any, idx: number) => (
                                <div
                                  key={c.id}
                                  className={`p-2 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors ${idx === selectedIndex ? 'bg-indigo-100' : 'hover:bg-indigo-50'
                                    }`}
                                  onClick={() => {
                                    onCustomerChange(c);
                                    setSearchQuery('');
                                    setIsSearching(false);
                                    setEnableSearch(false);
                                  }}
                                  onMouseEnter={() => setSelectedIndex(idx)}
                                >
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                    {c.firstName[0]}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{c.firstName} {c.lastName}</div>
                                    <div className="text-xs text-gray-500">{c.phoneNumber}</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-center">
                                <p className="text-xs text-gray-500 mb-2">No customers found</p>
                                <button
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Pre-fill name from search query if it looks like a name
                                    const nameParts = searchQuery.trim().split(' ');
                                    if (nameParts.length > 0 && !/^[0-9]+$/.test(searchQuery)) {
                                      setNewCustomerData({
                                        firstName: nameParts[0] || '',
                                        lastName: nameParts.slice(1).join(' ') || '',
                                        phoneNumber: ''
                                      });
                                    }
                                    setShowAddCustomer(true);
                                    setIsSearching(false);
                                  }}
                                >
                                  + Add New Customer
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="col-span-2 bg-white rounded-lg p-3 border border-gray-200">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Invoice Type</span>
            <select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-1.5"
            >
              <option value="GST_INVOICE">Tax Invoice (GST)</option>
              <option value="ESTIMATE">Estimate / Quote</option>
            </select>

            <div className="mt-1.5 text-[10px] leading-tight text-gray-500 px-1">
              {invoiceType === 'GST_INVOICE' && <span className="text-green-600">Official sale with GST. Deducts stock & records revenue.</span>}
              {invoiceType === 'ESTIMATE' && <span className="text-blue-600">Quotation only. Does NOT deduct stock.</span>}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total MRP</span>
              <span className="font-medium text-gray-900">₹{safeTotals.totalMrp.toFixed(2)}</span>
            </div>

            <div className="bg-green-50 rounded-lg p-2 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-green-700 uppercase">Apply Discount</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setDiscountType('amount')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${discountType === 'amount' ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-green-600 border border-green-200'}`}
                  >
                    ₹
                  </button>
                  <button
                    onClick={() => setDiscountType('percentage')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${discountType === 'percentage' ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-green-600 border border-green-200'}`}
                  >
                    %
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={overallDiscount || ''}
                  onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                  placeholder={discountType === 'percentage' ? 'Ex: 10%' : 'Ex: 500'}
                  className="flex-1 px-2 py-1.5 text-sm rounded border border-green-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onApplyDiscount(discountType, overallDiscount);
                    }
                  }}
                />
                <button
                  onClick={() => onApplyDiscount(discountType, overallDiscount)}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total Discount</span>
              <span className="font-medium text-green-600">-₹{safeTotals.totalDiscount.toFixed(2)}</span>
            </div>

            <div className="h-px bg-gray-100 my-2"></div>

            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>Taxable Value</span>
              <span>₹{safeTotals.taxableValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>GST (Included)</span>
              <span>₹{safeTotals.taxAmount.toFixed(2)}</span>
            </div>

            <div className="h-px bg-gray-100 my-2"></div>

            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">Net Payable</span>
              <span className="text-2xl font-bold text-teal-600">₹{safeTotals.total}</span>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-2 text-xs text-center text-gray-500 border-t border-gray-100">
            {safeTotals.roundOff !== 0 && `Rounded off by ₹${safeTotals.roundOff.toFixed(2)}`}
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Payment Mode</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'cash', icon: FiDollarSign, label: 'Cash' },
              { id: 'upi', icon: FiSmartphone, label: 'UPI' },
              { id: 'card', icon: FiCreditCard, label: 'Card' },
              { id: 'wallet', icon: BsWallet2, label: 'Wallet' }
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as any)}
                className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${paymentMethod === method.id
                  ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-md'
                  : 'border-transparent bg-white text-gray-600 hover:bg-gray-50'
                  } active:scale-95 text-center`}
              >
                <style jsx>{`
                  @keyframes pop {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.5); }
                    100% { transform: scale(1); }
                  }
                  .animate-pop {
                    animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                  }
                `}</style>
                <div className={paymentMethod === method.id ? 'animate-pop' : ''}>
                  <method.icon className="w-5 h-5 mx-auto" />
                </div>
                <span className="text-xs font-semibold">{method.label}</span>
              </button>
            ))}
          </div>
          {/* Provisional Profit Check (Owner Only) - Hidden below scroll (Confidential) */}
          <ExposeMarginEstimate items={basketItems} />
        </div>
      </div>

      <div className="border-t border-gray-200 p-4 bg-white space-y-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-[1fr,1fr] gap-3">
          <button
            onClick={async () => {
              if (!customer) {
                toast.error('Customer Required for Pay Later!');
                toast.info("Please search or add a customer");
                return;
              }
              await triggerAction('pay_later', () => onFinalize('CREDIT', undefined, invoiceType));
            }}
            disabled={basketItems.length === 0 || actionState.status !== 'idle' || hasOutOfStockItems}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${actionState.name === 'pay_later' && actionState.status === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200 active:scale-[0.98]'
              }`}
          >
            {actionState.name === 'pay_later' && actionState.status === 'loading' ? (
              <ProcessingLoader size="sm" color="blue" />
            ) : actionState.name === 'pay_later' && actionState.status === 'success' ? (
              <FiCheck className="w-5 h-5" />
            ) : (
              <FiClock className="w-5 h-5" />
            )}
            <span>
              {actionState.name === 'pay_later' ? (
                actionState.status === 'loading' ? 'Processing...' : (actionState.status === 'success' ? 'Success' : 'Pay Later')
              ) : 'Pay Later'}
            </span>
          </button>

          <button
            onClick={handleFinalize} // Opens modal
            disabled={basketItems.length === 0 || actionState.status !== 'idle' || hasOutOfStockItems}
            className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold text-lg hover:bg-teal-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2"
          >
            <span>Collect</span>
            <span>₹{safeTotals.total}</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              if (basketItems.length === 0) {
                toast.error('Cannot split payment with empty basket!');
                return;
              }
              triggerAction('split', async () => {
                onSplitPayment();
              });
            }}
            disabled={basketItems.length === 0 || actionState.status !== 'idle'}
            className={`py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${actionState.name === 'split' && actionState.status === 'loading'
              ? 'bg-gray-100 text-gray-700 border border-gray-300'
              : 'text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
          >
            {actionState.name === 'split' && actionState.status === 'loading' && <ProcessingLoader size="sm" color="gray" />}
            <span>Split (F9)</span>
          </button>
          <button
            onClick={() => {
              // F2 triggers the shortcut logic in parent, effectively calling saveDraft
              // But we want to show feedback here. Ideally we call onSaveDraft directly.
              if (onSaveDraft) {
                triggerAction('draft', async () => await onSaveDraft());
              } else {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2' }));
              }
            }}
            disabled={basketItems.length === 0 || actionState.status !== 'idle'}
            className={`py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${actionState.name === 'draft' && actionState.status === 'success'
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
          >
            {actionState.name === 'draft' && actionState.status === 'loading' && <ProcessingLoader size="sm" color="teal" />}
            {actionState.name === 'draft' && actionState.status === 'success' && <FiCheck className="w-4 h-4" />}
            <span>Draft (F2)</span>
          </button>
        </div>
      </div>

      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Confirm Sale</h3>

            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500 text-sm">Customer</span>
                  <span className="font-medium text-gray-900">{customer ? `${customer.firstName} ${customer.lastName}` : 'Guest (Walk-in)'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Total Items</span>
                  <span className="font-medium text-gray-900">{basketItems.length}</span>
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Payable</div>
                <div className="text-4xl font-black text-teal-600">₹{safeTotals.total}</div>
                <div className="text-sm text-gray-400 mt-1 capitalize">via {paymentMethod}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 transition-all duration-300">
              {/* Hide Cancel button when processing or success */}
              {actionState.status === 'idle' && (
                <button
                  onClick={() => setShowFinalizeModal(false)}
                  className="py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              )}

              <button
                onClick={confirmFinalize}
                disabled={actionState.status !== 'idle'}
                className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 
                  ${actionState.status !== 'idle' ? 'col-span-2 scale-105' : ''} 
                  ${actionState.name === 'complete_sale' && actionState.status === 'success'
                    ? 'bg-green-600 text-white shadow-green-600/20'
                    : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-600/20'
                  }`}
              >
                {actionState.name === 'complete_sale' && actionState.status === 'loading' ? (
                  <ProcessingLoader size="sm" color="white" />
                ) : actionState.name === 'complete_sale' && actionState.status === 'success' ? (
                  <FiCheck className="w-5 h-5 animate-bounce" />
                ) : null}
                <span>{actionState.name === 'complete_sale' && actionState.status === 'success' ? 'Sale Completed!' : (actionState.status === 'loading' ? 'Processing...' : 'Complete Sale')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}