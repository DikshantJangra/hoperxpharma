'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useEfficientPOComposer } from '@/hooks/useEfficientPOComposer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import TopToolbar from './TopToolbar';
import ProductSearchBar from './ProductSearchBar';
import LineItemsTable from './LineItemsTable';
import ValidationSummary from './ValidationSummary';
import SuggestionsPanel from './SuggestionsPanel';
import SupplierChip from './SupplierChip';
import SaveTemplateModal from './SaveTemplateModal';
import LoadTemplateModal from './LoadTemplateModal';
import { Toaster } from 'react-hot-toast';

interface EfficientPOComposerProps {
    storeId: string;
    poId?: string;
}

/**
 * Efficient PO Composer - Main Component
 * Single-screen, keyboard-first purchase order creation
 */
export default function EfficientPOComposer({ storeId, poId }: EfficientPOComposerProps) {
    const {
        po,
        setPO,
        suggestions,
        validation,
        saveStatus,
        loading,
        setSupplier,
        addLine,
        updateLine,
        removeLine,
        saveDraft,
        sendPO,
        requestApproval,
        saveAsTemplate,
        loadTemplate
    } = useEfficientPOComposer(storeId, poId);

    const { registerShortcut } = useKeyboardShortcuts();
    const searchBarRef = useRef<any>(null);
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [showLoadTemplate, setShowLoadTemplate] = useState(false);

    // Register keyboard shortcuts
    useEffect(() => {
        registerShortcut('ctrl+s', saveDraft);
        registerShortcut('ctrl+enter', sendPO);
        registerShortcut('ctrl+shift+enter', requestApproval);
        registerShortcut('/', () => searchBarRef.current?.focus());
        registerShortcut('esc', () => searchBarRef.current?.blur());
        registerShortcut('ctrl+t', () => setShowSaveTemplate(true));
        registerShortcut('ctrl+l', () => setShowLoadTemplate(true));
    }, [saveDraft, sendPO, requestApproval, registerShortcut]);

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Top Toolbar */}
            <TopToolbar
                poNumber={po.poNumber}
                status={po.status}
                saveStatus={saveStatus}
                loading={loading}
                onSave={saveDraft}
                onSend={sendPO}
                onRequestApproval={requestApproval}
                total={po.total}
                needsApproval={po.total > 50000}
            />

            {/* Three-Zone Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Zone: PO Core (25%) */}
                <div className="w-1/4 border-r border-gray-200 bg-white overflow-y-auto">
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Supplier *
                            </label>
                            <SupplierChip
                                value={po.supplier}
                                onChange={setSupplier}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Terms
                            </label>
                            <input
                                type="text"
                                value={po.paymentTerms || ''}
                                onChange={(e) => setPO(prev => ({ ...prev, paymentTerms: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="e.g., Net 30"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expected Delivery
                            </label>
                            <input
                                type="date"
                                value={po.expectedDeliveryDate || ''}
                                onChange={(e) => setPO(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes
                            </label>
                            <textarea
                                value={po.notes || ''}
                                onChange={(e) => setPO(prev => ({ ...prev, notes: e.target.value }))}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Add any notes..."
                            />
                        </div>

                        {/* Validation Summary */}
                        <ValidationSummary
                            errors={validation.errors}
                            warnings={validation.warnings}
                        />
                    </div>
                </div>

                {/* Center Zone: Line Items (50%) */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="border-b border-gray-200 p-4">
                        <ProductSearchBar
                            ref={searchBarRef}
                            onSelect={addLine}
                            supplier={po.supplier}
                        />
                    </div>

                    <div className="flex-1 overflow-auto">
                        <LineItemsTable
                            lines={po.lines}
                            onUpdate={updateLine}
                            onRemove={removeLine}
                            validation={validation}
                        />
                    </div>

                    {/* Summary Footer */}
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                {po.lines.length} item{po.lines.length !== 1 ? 's' : ''}
                            </div>
                            <div className="space-y-1 text-right">
                                <div className="text-sm text-gray-600">
                                    Subtotal: ₹{po.subtotal.toFixed(2)}
                                </div>
                                {po.taxBreakdown.map((tax, i) => (
                                    <div key={i} className="text-xs text-gray-500">
                                        GST {tax.gstPercent}%: ₹{tax.tax.toFixed(2)}
                                    </div>
                                ))}
                                <div className="text-lg font-bold text-gray-900">
                                    Total: ₹{po.total.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Zone: Suggestions (25%) */}
                <div className="w-1/4 border-l border-gray-200 bg-white overflow-y-auto">
                    <SuggestionsPanel
                        suggestions={suggestions}
                        onAddItem={addLine}
                        storeId={storeId}
                    />
                </div>
            </div>

            {/* Template Modals */}
            <SaveTemplateModal
                isOpen={showSaveTemplate}
                onClose={() => setShowSaveTemplate(false)}
                onSave={saveAsTemplate}
                currentPO={po}
            />

            <LoadTemplateModal
                isOpen={showLoadTemplate}
                onClose={() => setShowLoadTemplate(false)}
                onLoad={loadTemplate}
                storeId={storeId}
            />

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
