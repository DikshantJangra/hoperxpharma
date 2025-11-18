'use client';

import React, { useEffect } from 'react';
import { usePOComposer } from '@/hooks/usePOComposer';
import SupplierSelect from './SupplierSelect';
import SuggestionsPanel from './SuggestionsPanel';
import LineItemTable from './LineItemTable';
import POSummary from './POSummary';
import DeliveryCard from './DeliveryCard';
import AttachmentUploader from './AttachmentUploader';


interface NewPOPageProps {
  storeId: string;
}

export default function NewPOPage({ storeId }: NewPOPageProps) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-gray-900">New Purchase Order</h1>
            <SupplierSelect value={po.supplier} onChange={setSupplier} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Save Draft
            </button>
            {needsApproval ? (
              <button
                onClick={handleRequestApproval}
                disabled={loading || !canSend}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Request Approval
              </button>
            ) : (
              <button
                onClick={handleSendPO}
                disabled={loading || !canSend}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Send PO
              </button>
            )}
          </div>
        </div>

        {/* Validation Messages */}
        {validationResult.errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-sm font-medium text-red-800">Errors:</h3>
            <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
              {validationResult.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {validationResult.warnings.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800">Warnings:</h3>
            <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
              {validationResult.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Suggestions */}
          <div className="col-span-3">
            <SuggestionsPanel 
              suggestions={suggestions}
              onAddItem={addLine}
              storeId={storeId}
            />
          </div>

          {/* Center Panel - PO Composer */}
          <div className="col-span-6 space-y-6">
            <DeliveryCard 
              value={po.deliveryAddress}
              expectedDate={po.expectedDeliveryDate}
              onChange={(address) => setPO(prev => ({ ...prev, deliveryAddress: address }))}
              onDateChange={(date) => setPO(prev => ({ ...prev, expectedDeliveryDate: date }))}
            />

            <LineItemTable
              lines={po.lines}
              onAddLine={addLine}
              onUpdateLine={updateLine}
              onRemoveLine={removeLine}
              supplier={po.supplier}
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

          {/* Right Panel - Summary */}
          <div className="col-span-3">
            <POSummary po={po} />
          </div>
        </div>
      </div>
    </div>
  );
}