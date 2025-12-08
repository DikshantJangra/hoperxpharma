'use client';

import React, { useEffect, useState } from 'react';
import { usePOComposer } from '@/hooks/usePOComposer';
import { useAuthStore } from '@/lib/store/auth-store';
import SupplierSelect from './SupplierSelect';
import SuggestionsPanel from './SuggestionsPanel';
import LineItemTable from './LineItemTable';
import POSummary from './POSummary';
import DeliveryCard from './DeliveryCard';
import AttachmentUploader from './AttachmentUploader';
import { FiLayout, FiSave, FiSend, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface NewPOPageProps {
  storeId: string;
  poId?: string;
}

export default function NewPOPage({ storeId, poId }: NewPOPageProps) {
  const router = useRouter();
  const { primaryStore } = useAuthStore();
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isLoadingPO, setIsLoadingPO] = useState(!!poId);

  // Build store address from primaryStore
  const storeAddress = primaryStore ? [
    primaryStore.addressLine1,
    primaryStore.addressLine2,
    primaryStore.city,
    primaryStore.state,
    primaryStore.pinCode
  ].filter(Boolean).join(', ') : 'Loading store address...';

  const {
    po,
    suggestions,
    loading,
    validationResult,
    setSupplier,
    addLine,
    updateLine,
    removeLine,
    loadSuggestions,
    validate,
    saveDraft,
    requestApproval,
    sendPO,
    setPO,
    clearDraft
  } = usePOComposer(storeId);

  useEffect(() => {
    if (poId) {
      loadExistingPO(poId);
    } else {
      loadSuggestions();
    }
  }, [poId]);

  const loadExistingPO = async (id: string) => {
    setIsLoadingPO(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${apiBaseUrl}/purchase-orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const existingPO = result.data || result;

        // Transform backend data to frontend format
        setPO({
          poId: existingPO.id,
          status: existingPO.status,
          storeId: existingPO.storeId,
          supplier: existingPO.supplier ? {
            id: existingPO.supplier.id,
            name: existingPO.supplier.name,
            gstin: existingPO.supplier.gstin,
            defaultLeadTimeDays: 0, // Default if missing
            contact: {
              email: existingPO.supplier.email,
              phone: existingPO.supplier.phoneNumber,
              whatsapp: existingPO.supplier.whatsapp
            },
            paymentTerms: existingPO.supplier.paymentTerms
          } : undefined,
          deliveryAddress: { line1: '', city: '', pin: '' },
          currency: existingPO.currency || 'INR',
          lines: (existingPO.items || []).map((item: any) => ({
            lineId: item.id,
            drugId: item.drugId,
            description: item.drug?.name || item.drugId,
            packUnit: 'Strip',
            packSize: 10,
            qty: item.quantity,
            unit: 'strip',
            pricePerUnit: Number(item.unitPrice),
            discountPercent: Number(item.discountPercent || 0),
            gstPercent: Number(item.gstPercent),
            lineNet: Number(item.lineTotal),
          })),
          subtotal: Number(existingPO.subtotal),
          taxBreakdown: [],
          total: Number(existingPO.total),
          expectedDeliveryDate: existingPO.expectedDeliveryDate,
          paymentTerms: existingPO.paymentTerms,
          notes: existingPO.notes,
        });
        toast.success('Draft loaded successfully');
      } else {
        toast.error('Failed to load draft');
      }
    } catch (error) {
      console.error('Failed to load PO:', error);
      toast.error('Failed to load draft');
    } finally {
      setIsLoadingPO(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const result = await saveDraft();
      toast.success(`Draft saved successfully! PO #${result.poNumber || 'Draft'}`);

      // Update URL to include poId for persistence (prevents duplicate PO creation on subsequent saves)
      if (result.id && !poId) {
        router.push(`/orders/new-po?id=${result.id}`, { scroll: false });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save draft');
    }
  };

  const handleRequestApproval = async () => {
    const isValid = await validate();
    if (!isValid) {
      toast.error('Please fix validation errors before requesting approval');
      return;
    }

    try {
      if (!po.poId) {
        await saveDraft();
      }
      await requestApproval(['manager_01'], 'Please review this PO');
      toast.success('Approval request sent successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to request approval');
    }
  };

  const handleSendPO = async () => {
    console.log('handleSendPO called');
    console.log('po:', po);
    console.log('canSend:', po.supplier && po.lines.length > 0 && validationResult.errors.length === 0);
    console.log('validationResult:', validationResult);

    const isValid = await validate();
    console.log('Validation result:', isValid);

    if (!isValid) {
      toast.error('Please fix validation errors before sending');
      return;
    }

    // Removed confirm dialog as it was being auto-cancelled
    // TODO: Add a proper React-based confirmation modal later

    try {
      let poIdToSend = po.poId;

      if (!po.poId) {
        console.log('Saving draft first...');
        const savedPO = await saveDraft();
        poIdToSend = savedPO.id;
        console.log('Draft saved with ID:', poIdToSend);
      }

      console.log('Sending PO with ID:', poIdToSend);
      const result = await sendPO({ channel: 'email' }, poIdToSend);
      console.log('Send result:', result);
      toast.success(`PO sent successfully at ${new Date().toLocaleTimeString()}`);

      // Redirect to orders list
      setTimeout(() => {
        router.push('/orders');
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send PO');
    }
  };

  const handleClearDraft = () => {
    if (confirm('Are you sure you want to clear this draft? All unsaved changes will be lost.')) {
      clearDraft();
      toast.success('Draft cleared successfully');
      // If we're editing an existing PO, redirect to new PO page
      if (poId) {
        router.push('/orders/new-po');
      }
    }
  };

  const canSend = po.supplier && po.lines.length > 0 && validationResult.errors.length === 0;
  const needsApproval = po.total > (po.approvalThreshold || 50000);
  const formatCurrency = (amount: number | string) => `₹${Number(amount || 0).toFixed(2)}`;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <div className="flex-1 p-6 max-w-[1800px] mx-auto w-full pb-24">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Purchase Order</h1>
            <p className="text-sm text-gray-500 mt-1">Create and send orders to suppliers</p>
          </div>
          <div className="flex items-center gap-2">
            {(po.lines.length > 0 || po.supplier) && (
              <button
                onClick={handleClearDraft}
                className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                title="Clear Draft"
              >
                <FiTrash2 size={20} />
              </button>
            )}
            <SupplierSelect value={po.supplier} onChange={setSupplier} />
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className={`p-2.5 rounded-lg border transition-colors ${showSuggestions ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              title="Toggle Suggestions Panel"
            >
              <FiLayout size={20} />
            </button>
          </div>
        </div>

        {/* Validation Messages */}
        {validationResult.errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2 flex items-start gap-3">
            <FiAlertCircle className="text-red-600 mt-0.5 shrink-0" size={18} />
            <div>
              <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {validationResult.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex gap-6 items-start">
          {/* Main Content (Left) */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Line Items Table - Primary Focus */}
            <LineItemTable
              lines={po.lines}
              onAddLine={addLine}
              onUpdateLine={updateLine}
              onRemoveLine={removeLine}
              supplier={po.supplier}
            />

            {/* Secondary Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <DeliveryCard
                  storeAddress={storeAddress}
                  deliveryDate={po.expectedDeliveryDate || ''}
                  notes={po.notes || ''}
                  onDeliveryDateChange={(date) => setPO(prev => ({ ...prev, expectedDeliveryDate: date }))}
                  onNotesChange={(notes) => setPO(prev => ({ ...prev, notes }))}
                />
                <AttachmentUploader
                  poId={po.poId}
                  attachments={(po.attachments || []) as any}
                  onUpload={(attachment) => {
                    setPO(prev => ({
                      ...prev,
                      attachments: [...(prev.attachments || []), attachment as any]
                    } as any));
                  }}
                  onRemove={(attachmentId) => {
                    setPO(prev => ({
                      ...prev,
                      attachments: (prev.attachments || []).filter((att: any) => att.id !== attachmentId)
                    } as any));
                  }}
                />
              </div>
              <div>
                <POSummary po={po} />
              </div>
            </div>
          </div>

          {/* Suggestions Panel (Right) */}
          <div className={`transition-all duration-300 ease-in-out shrink-0 ${showSuggestions ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'
            }`}>
            <div className="w-80 sticky top-6">
              <SuggestionsPanel
                suggestions={suggestions}
                onAddItem={addLine}
                storeId={storeId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-sm text-gray-500">Total Amount</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(po.total)}</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-sm text-gray-500">
              {po.lines.length} items • {formatCurrency(po.subtotal)} subtotal
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              <FiSave size={16} />
              Save Draft
            </button>

            {needsApproval ? (
              <button
                onClick={handleRequestApproval}
                disabled={loading || !canSend}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all"
              >
                Request Approval
              </button>
            ) : (
              <button
                onClick={handleSendPO}
                disabled={loading || !canSend}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-all"
              >
                <FiSend size={16} />
                Send Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}