'use client';

import React, { useState, useEffect } from 'react';
import { POLine, Supplier } from '@/types/po';
import LineItemRow from './LineItemRow';
import { normalizeGSTRate } from '@/utils/gst-utils';
import AddCustomItemInline from './AddCustomItemInline';
import MedicineCommandPalette from '@/components/search/MedicineCommandPalette';
import { MdSearch, MdShoppingCart, MdPostAdd } from 'react-icons/md';
import { FiPlus, FiTrash2, FiEdit2, FiPackage } from 'react-icons/fi';
import type { Medicine } from '@/types/medicine';

interface LineItemTableProps {
  lines: POLine[];
  onAddLine: (item: Partial<POLine>) => void;
  onUpdateLine: (lineId: string, updates: Partial<POLine>) => void;
  onRemoveLine: (lineId: string) => void;
  supplier?: Supplier;
}

export default function LineItemTable({
  lines,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  supplier
}: LineItemTableProps) {
  const [showCustomItemInline, setShowCustomItemInline] = useState(false);
  const [showMedicinePalette, setShowMedicinePalette] = useState(false);

  // Global keyboard shortcut for ⌘+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowMedicinePalette(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddProduct = (product: any) => {
    onAddLine({
      drugId: product.drugId || product.id,
      description: product.description || product.name,
      packUnit: product.packUnit || 'Strip',
      packSize: product.packSize || 10,
      qty: 1,
      unit: product.unit || (product.packUnit || 'strip').toLowerCase(),
      pricePerUnit: product.pricePerUnit || product.price || 0,
      gstPercent: normalizeGSTRate(product.gstPercent),
      lastPurchasePrice: product.lastPurchasePrice || product.lastPrice
    });
    // Don't close search automatically to allow adding multiple items
    // setShowSearch(false); 
  };

  const handleCustomItemAdd = (item: any) => {
    handleAddProduct(item);
    setShowCustomItemInline(false);
  };

  const handleMedicineSelect = (medicine: Medicine) => {
    // Medicine Master data structure:
    // - name, genericName, strength, form, manufacturerName, compositionText
    // - No packSize field, so we'll use form (e.g., "Tablet", "Capsule", "Syrup")

    const packUnit = medicine.form || 'Strip';
    const packSize = 10; // Default pack size

    // Build description from available fields
    const description = [
      medicine.name,
      medicine.strength,
      medicine.form,
      medicine.manufacturerName
    ].filter(Boolean).join(' - ');

    onAddLine({
      drugId: medicine.id, // Use medicine ID as drugId
      description: description,
      packUnit: packUnit,
      packSize: packSize,
      qty: 1,
      unit: packUnit.toLowerCase(),
      pricePerUnit: medicine.price || 0, // Will be 0, user needs to enter
      gstPercent: 5, // Default to 5% for catalog items (editable)
      discountPercent: 0
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <MdShoppingCart className="text-emerald-600" />
          Order Items
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
            {lines.length}
          </span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMedicinePalette(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <MdSearch className="h-4 w-4" />
            Search Catalog
            <kbd className="hidden sm:inline-flex ml-1 px-1.5 py-0.5 text-xs bg-emerald-700 rounded border border-emerald-500">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={() => setShowCustomItemInline(!showCustomItemInline)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors shadow-sm ${showCustomItemInline
              ? 'text-emerald-700 bg-emerald-100 border-emerald-300'
              : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
              }`}
          >
            <MdPostAdd className="h-4 w-4" />
            {showCustomItemInline ? 'Close Custom Item' : 'Add Custom Item'}
          </button>

        </div>
      </div>



      {showCustomItemInline && (
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 animate-in slide-in-from-top-2">
          <AddCustomItemInline
            onAdd={handleCustomItemAdd}
            onCancel={() => setShowCustomItemInline(false)}
          />
        </div>
      )}

      {lines.length === 0 ? (
        <div className="px-6 py-16 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <MdSearch className="h-8 w-8 text-gray-300" />
          </div>
          <h4 className="text-gray-900 font-medium mb-1">No items added yet</h4>
          <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
            Search for products above or use the suggestions panel to quickly build your order.
          </p>
          <button
            onClick={() => setShowMedicinePalette(true)}
            className="text-emerald-600 font-medium text-sm hover:text-emerald-700 hover:underline"
          >
            Search Product Catalog
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Details</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pack</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Estimated Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">GST</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {lines.map((line) => (
                <LineItemRow
                  key={line.lineId}
                  line={line}
                  onChange={(updates) => onUpdateLine(line.lineId, updates)}
                  onRemove={() => onRemoveLine(line.lineId)}
                  supplier={supplier}
                />
              ))}
            </tbody>
            <tfoot className="bg-gray-50/50 font-medium">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-right text-sm text-gray-600">Subtotal</td>
                <td className="px-4 py-3 text-sm text-gray-900">₹{lines.reduce((sum, line) => sum + line.lineNet, 0).toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Medicine Command Palette */}
      <MedicineCommandPalette
        isOpen={showMedicinePalette}
        onClose={() => setShowMedicinePalette(false)}
        onSelect={handleMedicineSelect}
      />
    </div>
  );
}