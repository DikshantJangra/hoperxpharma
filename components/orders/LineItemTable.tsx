'use client';

import React, { useState, useEffect } from 'react';
import { POLine, Supplier } from '@/types/po';
import LineItemRow from './LineItemRow';
import ProductSearchBar from './ProductSearchBar';
import AddCustomItemInline from './AddCustomItemInline';
import MedicineCommandPalette from '@/components/search/MedicineCommandPalette';
import { MdAdd, MdSearch, MdShoppingCart, MdPostAdd } from 'react-icons/md';
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
  const [showSearch, setShowSearch] = useState(false);
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
      gstPercent: product.gstPercent || 12,
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
    // Extract pack unit and size from packSize string (e.g., "strip of 10 tablets")
    const packSizeMatch = medicine.packSize.match(/(\w+)\s+of\s+(\d+)/);
    const packUnit = packSizeMatch ? packSizeMatch[1] : 'Strip';
    const packSize = packSizeMatch ? parseInt(packSizeMatch[2]) : 10;

    onAddLine({
      drugId: medicine.id, // Use medicine ID as drugId
      description: `${medicine.name} - ${medicine.composition}`,
      packUnit: packUnit,
      packSize: packSize,
      qty: 1,
      unit: packUnit.toLowerCase(),
      pricePerUnit: medicine.price || 0,
      gstPercent: 12, // Default GST
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
            onClick={() => {
              setShowCustomItemInline(!showCustomItemInline);
              setShowSearch(false); // Close search if open
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors shadow-sm ${showCustomItemInline
              ? 'text-emerald-700 bg-emerald-100 border-emerald-300'
              : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
              }`}
          >
            <MdPostAdd className="h-4 w-4" />
            {showCustomItemInline ? 'Close Custom Item' : 'Add Custom Item'}
          </button>
          <button
            onClick={() => {
              setShowSearch(!showSearch);
              setShowCustomItemInline(false); // Close custom item if open
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <MdAdd className="h-4 w-4" />
            {showSearch ? 'Close Search' : 'Add Item'}
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 animate-in slide-in-from-top-2">
          <ProductSearchBar
            onSelect={handleAddProduct}
            supplier={supplier}
          />
        </div>
      )}

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
            onClick={() => setShowSearch(true)}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">GST</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Disc %</th>
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
                <td colSpan={6} className="px-4 py-3 text-right text-sm text-gray-600">Subtotal</td>
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