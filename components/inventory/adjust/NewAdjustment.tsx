'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiX } from 'react-icons/fi';
import AdjustmentTable from './AdjustmentTable';
import AdjustmentSummary from './AdjustmentSummary';
import ConfirmationModal from './ConfirmationModal';

const MOCK_ITEMS = [
  { id: '1', sku: 'PAR-500-10', name: 'Paracetamol 500mg', pack: '10 tabs', stock: 250, batches: 3 },
  { id: '2', sku: 'ATO-10-15', name: 'Atorvastatin 10mg', pack: '15 tabs', stock: 120, batches: 2 },
  { id: '3', sku: 'AMX-500-10', name: 'Amoxicillin 500mg', pack: '10 caps', stock: 180, batches: 4 },
];

export default function NewAdjustment() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [adjustmentItems, setAdjustmentItems] = useState<any[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.getElementById('adjust-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = MOCK_ITEMS.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const addItem = (item: any) => {
    setAdjustmentItems(prev => [...prev, {
      ...item,
      batchId: null,
      currentQty: 0,
      newQty: 0,
      delta: 0,
      reason: '',
      evidence: null,
    }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateItem = (index: number, updates: any) => {
    setAdjustmentItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, ...updates };
        if ('newQty' in updates || 'currentQty' in updates) {
          updated.delta = updated.newQty - updated.currentQty;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (index: number) => {
    setAdjustmentItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (adjustmentItems.length > 0 && adjustmentItems.every(item => item.reason)) {
      setShowConfirmation(true);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Search Section */}
        <div className="p-6 bg-white border-b border-[#e2e8f0]">
          <div className="max-w-2xl">
            <label className="text-sm font-medium text-[#64748b] mb-2 block">
              Search Item / SKU / Barcode / Batch ID
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
              <input
                id="adjust-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search... (/)"
                className="w-full pl-10 pr-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => addItem(item)}
                    className="p-3 hover:bg-[#f8fafc] cursor-pointer border-b border-[#f1f5f9] last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#0f172a]">{item.name}</div>
                        <div className="text-xs text-[#64748b] mt-0.5">
                          {item.pack} • SKU: {item.sku} • Stock: {item.stock} • {item.batches} batches
                        </div>
                      </div>
                      <button className="px-3 py-1.5 bg-[#0ea5a3] text-white rounded-lg text-sm hover:bg-[#0d9391] flex items-center gap-1">
                        <FiPlus className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Adjustment Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {adjustmentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mb-3">
                <FiSearch className="w-8 h-8 text-[#94a3b8]" />
              </div>
              <p className="text-[#64748b] text-sm">Search and add items to adjust</p>
              <p className="text-[#94a3b8] text-xs mt-1">Press / to focus search</p>
            </div>
          ) : (
            <AdjustmentTable
              items={adjustmentItems}
              onUpdate={updateItem}
              onRemove={removeItem}
            />
          )}
        </div>

        {/* Summary */}
        {adjustmentItems.length > 0 && (
          <AdjustmentSummary
            items={adjustmentItems}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {showConfirmation && (
        <ConfirmationModal
          items={adjustmentItems}
          onConfirm={() => {
            setShowConfirmation(false);
            setAdjustmentItems([]);
          }}
          onClose={() => setShowConfirmation(false)}
        />
      )}
    </>
  );
}
