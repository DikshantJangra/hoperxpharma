'use client';

import React, { useEffect, useState } from 'react';
import { usePOComposer } from '@/hooks/usePOComposer';
import SupplierSelect from './SupplierSelect';
import SuggestionsPanel from './SuggestionsPanel';
import LineItemTable from './LineItemTable';
import POSummary from './POSummary';
import DeliveryCard from './DeliveryCard';
import AttachmentUploader from './AttachmentUploader';
import { FiLayout, FiSave, FiSend, FiAlertCircle } from 'react-icons/fi';

interface NewPOPageProps {
  storeId: string;
}

export default function NewPOPage({ storeId }: NewPOPageProps) {
  const [showSuggestions, setShowSuggestions] = useState(true);

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
    setPO
  } = usePOComposer(storeId);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      alert('Draft saved • PO will be available in Orders > Drafts');
    } catch (error) {
      alert('Failed to save draft');
    }
  };

  const handleRequestApproval = async () => {
    const isValid = await validate();
    if (!isValid) {
      alert('Please fix validation errors before requesting approval');
      return;
    }

    try {
      if (!po.poId) {
        await saveDraft();
      }
      await requestApproval(['manager_01'], 'Please review this PO');
      alert('Approval requested • awaiting approver');
    } catch (error) {
      alert('Failed to request approval');
    }
  };

  const handleSendPO = async () => {
    const isValid = await validate();
    if (!isValid) {
      alert('Please fix validation errors before sending');
      return;
    }

    if (!confirm(`Send PO to supplier? This will create a record and notify the supplier.`)) {
      return;
    }

    try {
      if (!po.poId) {
        await saveDraft();
      }
      const result = await sendPO({ channel: 'email' });
      alert(`PO sent via email • Sent at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      alert('Failed to send PO');
    }
  };

  const canSend = po.supplier && po.lines.length > 0 && validationResult.errors.length === 0;
  const needsApproval = po.total > (po.approvalThreshold || 50000);
  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <div className="flex-1 p-6 max-w-[1800px] mx-auto w-full pb-24">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Purchase Order</h1>
            <p className="text-sm text-gray-500 mt-1">Create and send orders to suppliers</p>
          </div>
          <div className="flex items-center gap-4">
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
                  value={po.deliveryAddress}
                  expectedDate={po.expectedDeliveryDate}
                  onChange={(address) => setPO(prev => ({ ...prev, deliveryAddress: address }))}
                  onDateChange={(date) => setPO(prev => ({ ...prev, expectedDeliveryDate: date }))}
                />
                <AttachmentUploader
                  poId={po.poId}
                  attachments={po.attachments || []}
                  onUpload={(attachment) => {
                    setPO(prev => ({
                      ...prev,
                      attachments: [...(prev.attachments || []), attachment]
                    }));
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
    </div>
  );
}