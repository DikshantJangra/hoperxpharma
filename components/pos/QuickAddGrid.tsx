'use client';

import { useState, useEffect, useRef } from 'react';
import { FiEdit2, FiX, FiPlus, FiSearch } from 'react-icons/fi';
import { toast } from 'sonner';
import { formatStockQuantity } from '@/lib/utils/stock-display';

interface QuickAddProduct {
  id: string;
  name: string;
  strength?: string;
  mrp: number;
  stock: number;
  batchId: string;
  batchNumber?: string;
  expiryDate?: string;
  gstRate: number;
  baseUnit?: string;
  displayUnit?: string;
  unitConfigurations?: any[];
  manufacturer?: string;
}

interface QuickAddGridProps {
  onAddProduct: (product: any) => void;
  storeId: string;
}

export default function QuickAddGrid({ onAddProduct, storeId }: QuickAddGridProps) {
  const [quickAddProducts, setQuickAddProducts] = useState<(QuickAddProduct | null)[]>([null, null, null, null]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Real-time stock refresh for slots
  useEffect(() => {
    const refreshStock = async () => {
      const activeProducts = quickAddProducts.filter(p => p !== null) as QuickAddProduct[];
      if (activeProducts.length === 0) return;

      try {
        const drugIds = activeProducts.map(p => p.id);
        const { apiClient } = await import('@/lib/api/client');
        const response = await apiClient.post('/inventory/pos/stock-refresh', { drugIds });

        if (response.success && response.data) {
          const stockMap = response.data;
          const updated = quickAddProducts.map(p => {
            if (p && stockMap[p.id]) {
              return {
                ...p,
                stock: stockMap[p.id].stock,
                totalStock: stockMap[p.id].totalStock,
                mrp: stockMap[p.id].mrp || p.mrp,
                baseUnit: stockMap[p.id].baseUnit || p.baseUnit,
                displayUnit: stockMap[p.id].displayUnit || p.displayUnit,
                unitConfigurations: stockMap[p.id].unitConfigurations || p.unitConfigurations
              };
            }
            return p;
          });

          // Only update if something changed to avoid re-renders
          if (JSON.stringify(updated) !== JSON.stringify(quickAddProducts)) {
            setQuickAddProducts(updated);
            // Also sync back to localStorage so the splash/loading screen shows newer data next time
            const storageKey = `quickAddProducts_${storeId}`;
            localStorage.setItem(storageKey, JSON.stringify(updated));
          }
        }
      } catch (error) {
        console.error('Failed to refresh quick add stock:', error);
      }
    };

    if (quickAddProducts.some(p => p !== null)) {
      refreshStock();
    }
  }, [quickAddProducts.length, storeId]);

  // Save to localStorage
  const saveProducts = (products: (QuickAddProduct | null)[]) => {
    const storageKey = `quickAddProducts_${storeId}`;
    localStorage.setItem(storageKey, JSON.stringify(products));
    setQuickAddProducts(products);
  };

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSelectedSlot(null);
      }
    };
    if (selectedSlot !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedSlot]);

  const handleSlotClick = async (index: number) => {
    if (isEditMode) {
      const updated = [...quickAddProducts];
      updated[index] = null;
      saveProducts(updated);
    } else if (quickAddProducts[index]) {
      // Fetch fresh batch data to avoid non-existing batch errors
      const product = quickAddProducts[index]!; // Assert not null since we checked condition
      try {
        const { inventoryApi } = await import('@/lib/api/inventory');

        // 1. If we have a stored Batch ID, try to fetch/refresh THAT specific batch
        if (product.batchId) {
          try {
            const batchResponse = await inventoryApi.getBatchById(product.batchId);
            // Check strictly for stock > 0
            if (batchResponse && Number(batchResponse.baseUnitQuantity) > 0) {
              // Batch is valid and has stock!
              onAddProduct({
                ...product,
                stock: batchResponse.baseUnitQuantity,
                totalStock: batchResponse.baseUnitQuantity,
                expiryDate: batchResponse.expiryDate,
                batchNumber: batchResponse.batchNumber
              });
              return;
            }
            // If batch not found or out of stock, fall through to finding a substitute batch
            toast.info(`Saved batch ${product.batchNumber || '...'} is out of stock. Finding best available batch...`);
          } catch (ignore) {
            // Batch likely deleted or not found
            console.warn('Saved batch not found:', product.batchId);
          }
        }

        // 2. Fallback: Find best available batch (FEFO)
        const batchesResponse = await inventoryApi.getBatchesWithSuppliers(product.id);
        if (batchesResponse.success && batchesResponse.data && batchesResponse.data.length > 0) {
          const latestBatch = batchesResponse.data[0];
          const enrichedProduct = {
            ...product, // product has aggregated stock from refresh!
            // Overwrite with specific batch details
            batchId: latestBatch.id,
            batchNumber: latestBatch.batchNumber,
            expiryDate: latestBatch.expiryDate,
            stock: latestBatch.baseUnitQuantity,
            totalStock: latestBatch.baseUnitQuantity
          };
          onAddProduct(enrichedProduct);
          toast.success(`Used batch ${latestBatch.batchNumber} (Best Available)`);
        } else {
          // No batches found at all
          toast.error("Product is out of stock!");
        }
      } catch (error) {
        console.error('Error fetching batch data:', error);
        // Last resort fallback
        onAddProduct(product);
      }
    } else {
      setSelectedSlot(index);
      setSearchQuery('');
      setSearchResults([]);
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
        batchNumber: product.batchNumber, // EXPLICITLY SAVE BATCH NUMBER
        expiryDate: product.expiryDate,
        gstRate: product.gstRate,
        baseUnit: product.baseUnit,
        displayUnit: product.displayUnit,
        unitConfigurations: product.unitConfigurations,
        manufacturer: product.manufacturer,
      };
      saveProducts(updated);
      setSelectedSlot(null);
      setSearchQuery('');
      setSearchResults([]);
      toast.success(`Slot ${selectedSlot + 1} updated`);
    }
  };

  // Search logic
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const { inventoryApi } = await import('@/lib/api/inventory');
        const response = await inventoryApi.searchForPOS(searchQuery);
        setSearchResults(response?.data || response || []);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(searchProducts, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedSlot !== null) {
      // Small delay to ensure input is rendered
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [selectedSlot]);

  return (
    <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Actions</div>
        <button
          onClick={() => {
            setIsEditMode(!isEditMode);
            setSelectedSlot(null); // Close any open search
          }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${isEditMode
            ? 'bg-red-500 text-white shadow-md'
            : 'bg-white border border-gray-200 text-gray-500 hover:border-emerald-500 hover:text-emerald-600'
            }`}
        >
          {isEditMode ? <><FiX className="w-3 h-3" /> Finish</> : <><FiEdit2 className="w-3 h-3" /> Edit Grid</>}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {quickAddProducts.map((product, index) => (
          <div key={index} className="relative">
            <button
              onClick={() => handleSlotClick(index)}
              disabled={isEditMode && !product}
              className={`group relative p-3 border-2 rounded-xl text-left transition-all duration-200 h-20 w-full flex flex-col justify-between overflow-hidden ${product
                ? isEditMode
                  ? 'border-red-100 bg-red-50 hover:border-red-300'
                  : 'bg-white border-white shadow-sm hover:shadow-md hover:border-emerald-500/30'
                : selectedSlot === index
                  ? 'border-[#0ea5a3] bg-white ring-2 ring-emerald-100'
                  : 'bg-gray-50/50 border-dashed border-gray-200 hover:bg-emerald-50 hover:border-emerald-200'
                }`}
            >
              {selectedSlot === index ? (
                <div className="flex items-center h-full w-full">
                  <FiSearch className="absolute left-2 text-emerald-500 w-3 h-3" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-6 pr-1 py-1 text-[11px] font-bold bg-transparent focus:outline-none placeholder:text-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ) : product ? (
                <>
                  <div className="text-[11px] font-bold text-gray-900 line-clamp-2 leading-tight">
                    {product.name}
                  </div>
                  <div className="flex items-end justify-between mt-1">
                    <div className="flex flex-col">
                      <div className="text-[10px] font-bold text-emerald-600">₹{Number(product.mrp).toFixed(0)}</div>
                      <div className={`text-[9px] font-bold ${Number(product.stock) <= 5 ? 'text-orange-500' : 'text-gray-400'}`}>
                        {formatStockQuantity({
                          baseUnitQuantity: product.stock,
                          baseUnit: product.baseUnit,
                          displayUnit: product.displayUnit,
                          unitConfigurations: product.unitConfigurations
                        }, { showUnit: true, preferDisplayUnit: true })} in stock
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-300 font-medium">#{index + 1}</div>
                  </div>
                  {isEditMode && (
                    <div className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg ring-2 ring-white z-10">
                      <FiX className="w-2 h-2" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-2 h-full w-full">
                  <FiPlus className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                  <div className="text-[10px] font-bold text-gray-300 group-hover:text-emerald-600 uppercase mt-1 tracking-tighter">Add</div>
                </div>
              )}
            </button>

            {/* In-place Search Results Dropdown */}
            {selectedSlot === index && (
              <div
                ref={dropdownRef}
                className="absolute left-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-2xl z-[100] max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
              >
                {isLoading ? (
                  <div className="p-3 text-center text-[10px] text-gray-400 animate-pulse">Searching...</div>
                ) : searchQuery.length >= 2 && searchResults.length === 0 ? (
                  <div className="p-3 text-center text-[10px] text-gray-400">No matches</div>
                ) : searchResults.length > 0 ? (
                  <div className="py-1">
                    {searchResults.map((p, idx) => (
                      <button
                        key={`${p.id}-${p.batchId}-${idx}`}
                        onClick={() => handleProductSelect(p)}
                        className="w-full px-3 py-2 text-left hover:bg-emerald-50 border-b last:border-0 border-gray-50 flex flex-col"
                      >
                        <div className="text-[11px] font-bold text-gray-900 truncate">{p.name}</div>
                        <div className="flex justify-between items-baseline mt-0.5">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{p.manufacturer || 'General'}</span>
                            <span className="text-[9px] text-[#0ea5a3] font-medium">Batch: {p.batchNumber} • Exp: {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] font-bold text-emerald-600">₹{Number(p.mrp).toFixed(2)}</div>
                            <div className="text-[9px] text-gray-400 font-bold">
                              Stock: {formatStockQuantity({
                                baseUnitQuantity: p.totalStock || 0,
                                baseUnit: p.baseUnit,
                                displayUnit: p.displayUnit || p.unit,
                                unitConfigurations: p.unitConfigurations
                              }, { showUnit: true, preferDisplayUnit: true })}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-[10px] text-gray-400 italic">Type to search...</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
