'use client';

import { useState, useEffect } from 'react';
import { FiEdit2, FiX, FiPlus } from 'react-icons/fi';

interface QuickAddProduct {
  id: string;
  name: string;
  strength?: string;
  mrp: number;
  stock: number;
  batchId: string;
  gstRate: number;
  baseUnit?: string;
  displayUnit?: string;
  unitConfigurations?: any[];
}

interface QuickAddGridProps {
  onAddProduct: (product: any) => void;
  storeId: string;
}

export default function QuickAddGrid({ onAddProduct, storeId }: QuickAddGridProps) {
  const [quickAddProducts, setQuickAddProducts] = useState<(QuickAddProduct | null)[]>([null, null, null, null]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storageKey = `quickAddProducts_${storeId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setQuickAddProducts(parsed);
      } catch (error) {
        console.error('Failed to load quick add products:', error);
      }
    }
  }, [storeId]);

  // Save to localStorage whenever products change
  const saveProducts = (products: (QuickAddProduct | null)[]) => {
    const storageKey = `quickAddProducts_${storeId}`;
    localStorage.setItem(storageKey, JSON.stringify(products));
    setQuickAddProducts(products);
  };

  const handleSlotClick = (index: number) => {
    if (isEditMode) {
      // In edit mode, remove product
      const updated = [...quickAddProducts];
      updated[index] = null;
      saveProducts(updated);
    } else if (quickAddProducts[index]) {
      // Add to cart
      onAddProduct(quickAddProducts[index]);
    } else {
      // Open product selector
      setSelectedSlot(index);
      setShowProductSelector(true);
    }
  };

  const handleProductSelect = (product: any) => {
    if (selectedSlot !== null) {
      const updated = [...quickAddProducts];
      updated[selectedSlot] = {
        id: product.id,
        name: product.name,
        strength: product.strength,
        mrp: product.mrp,
        stock: product.totalStock || product.stock,
        batchId: product.batchId,
        gstRate: product.gstRate,
        baseUnit: product.baseUnit,
        displayUnit: product.displayUnit,
        unitConfigurations: product.unitConfigurations,
      };
      saveProducts(updated);
      setShowProductSelector(false);
      setSelectedSlot(null);
    }
  };

  return (
    <>
      <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-[#64748b]">Quick Add</div>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`p-1.5 rounded-lg transition-colors ${isEditMode
              ? 'bg-[#0ea5a3] text-white'
              : 'text-[#64748b] hover:bg-[#e2e8f0]'
              }`}
            title={isEditMode ? 'Done editing' : 'Edit quick add products'}
          >
            {isEditMode ? <FiX className="w-4 h-4" /> : <FiEdit2 className="w-4 h-4" />}
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {quickAddProducts.map((product, index) => (
            <button
              key={index}
              onClick={() => handleSlotClick(index)}
              className={`p-2 border rounded-lg text-left transition-all ${product
                ? 'bg-white border-[#e2e8f0] hover:border-[#0ea5a3] hover:bg-[#f0fdfa]'
                : 'bg-white border-dashed border-[#cbd5e1] hover:border-[#0ea5a3] hover:bg-[#f0fdfa]'
                } ${isEditMode && product ? 'ring-2 ring-red-200' : ''}`}
            >
              {product ? (
                <>
                  <div className="text-xs font-medium text-[#0f172a] truncate">
                    {product.name}
                  </div>
                  <div className="text-xs text-[#64748b] mt-0.5">₹{product.mrp}</div>
                  {isEditMode && (
                    <div className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                      <FiX className="w-3 h-3" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-2">
                  <FiPlus className="w-5 h-5 text-[#94a3b8] mb-1" />
                  <div className="text-xs text-[#94a3b8]">Add</div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Product Selector Modal */}
      {showProductSelector && (
        <ProductSelectorModal
          onSelect={handleProductSelect}
          onClose={() => {
            setShowProductSelector(false);
            setSelectedSlot(null);
          }}
        />
      )}
    </>
  );
}

// Simple product selector modal
function ProductSelectorModal({ onSelect, onClose }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchProducts = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const { inventoryApi } = await import('@/lib/api/inventory');
        const response = await inventoryApi.searchForPOS(query);
        if (response.success) {
          setResults(response.data || []);
        }
      } catch (error) {
        console.error('Failed to search:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(searchProducts, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Select Product</h3>
        </div>
        <div className="p-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
            autoFocus
          />
          <div className="mt-4 max-h-64 overflow-y-auto">
            {isLoading && <div className="text-center text-gray-500">Searching...</div>}
            {!isLoading && results.length === 0 && query.length >= 2 && (
              <div className="text-center text-gray-500">No products found</div>
            )}
            {results.map((product) => (
              <button
                key={product.id}
                onClick={() => onSelect(product)}
                className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                <div className="font-medium text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-500">
                  ₹{product.mrp} • Stock: {product.totalStock}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
