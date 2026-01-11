'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import { BsUpcScan } from 'react-icons/bs';
import dynamic from 'next/dynamic';

// Dynamic import for the scanner to avoid SSR issues with html5-qrcode
const BarcodeScannerModal = dynamic(() => import('./BarcodeScannerModal'), { ssr: false });
const SaltAlternativesPanel = dynamic(() => import('./SaltAlternativesPanel'), { ssr: false });
import { usePremiumTheme } from '@/lib/hooks/usePremiumTheme';
import { formatStockQuantity, renderStockQuantity } from '@/lib/utils/stock-display';

interface Product {
  id: string;
  name: string;
  strength?: string;
  form?: string;
  manufacturer?: string;
  mrp: number;
  totalStock: number;
  batchCount: number;
  gstRate: number;
  batchId?: string;
  batchNumber?: string;
  expiryDate?: string;
  requiresPrescription?: boolean;
  baseUnit?: string;
  displayUnit?: string;
  unitConfigurations?: any[];
}

const ProductSkeleton = () => (
  <div className="p-3 animate-pulse border-b border-[#f1f5f9] last:border-0">
    <div className="flex items-center justify-between">
      <div className='flex-1 space-y-2'>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
      <div className='text-right ml-4 space-y-2'>
        <div className="h-4 bg-gray-200 rounded w-12"></div>
        <div className="h-3 bg-gray-100 rounded w-16"></div>
      </div>
      <div className="ml-3 h-9 w-20 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
)

export default function ProductSearch({ onAddProduct, searchFocus, setSearchFocus, onManualScan }: {
  onAddProduct: (product: any) => void;
  searchFocus?: boolean;
  setSearchFocus?: (focus: boolean) => void;
  onManualScan?: (barcode: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedForAlternatives, setSelectedForAlternatives] = useState<Product | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isPremium } = usePremiumTheme();

  const isTypingRef = useRef(false);

  // Global "/" shortcut to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not already typing in an input/textarea
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    // Only focus if explicitly requested AND user is not currently typing
    if (searchFocus && inputRef.current && document.activeElement !== inputRef.current && !isTypingRef.current) {
      inputRef.current.focus();
    }
  }, [searchFocus]);

  // Search drugs from API with debounce
  useEffect(() => {
    console.log('🔍 ProductSearch - Query changed:', query, 'Length:', query.length);

    const searchDrugs = async () => {
      if (query.length < 2) {
        console.log('🔍 Query too short, clearing results');
        setResults([]);
        return;
      }

      console.log('🔍 Starting search for:', query);
      setIsLoading(true);
      try {
        const { inventoryApi } = await import('@/lib/api/inventory');
        console.log('🔍 Calling API...');
        const response = await inventoryApi.searchForPOS(query);
        console.log('🔍 API Response:', response);
        console.log('🔍 Response type:', typeof response);
        console.log('🔍 Response is array?:', Array.isArray(response));

        // Handle both response formats:
        // 1. Direct array from backend: [{ id, name, ... }]
        // 2. Wrapped object: { success: true, data: [...] }
        let resultsData: Product[] = [];

        if (Array.isArray(response)) {
          // Direct array response
          console.log('🔍 Direct array response, using as-is');
          resultsData = response;
        } else if (response && typeof response === 'object' && response.success) {
          // Wrapped response
          console.log('🔍 Wrapped response, extracting data');
          resultsData = response.data || [];
        } else {
          console.log('🔍 Unknown response format:', response);
        }

        console.log('🔍 Setting results:', resultsData.length, 'items');
        setResults(resultsData);
        setSelectedIndex(0);
      } catch (error) {
        console.error('🔍 Failed to search drugs:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(searchDrugs, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleAddProduct(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setQuery('');
      setResults([]);
    }
  };

  const handleAddProduct = (product: Product) => {
    onAddProduct({
      ...product,
      stock: product.totalStock,
      batches: product.batchCount,
      baseUnit: product.baseUnit,
      displayUnit: product.displayUnit,
      batchId: product.batchId,
      batchNumber: product.batchNumber,
      type: product.requiresPrescription ? 'RX' : 'OTC',
      unitConfigurations: (product as any).unitConfigurations
    });
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className={`p-4 border-b relative transition-colors ${isPremium ? 'bg-white/40 border-white/20' : 'bg-white border-[#e2e8f0]'}`}>
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            isTypingRef.current = true;
            setQuery(e.target.value);
            setTimeout(() => { isTypingRef.current = false; }, 500);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setSearchFocus?.(true)}
          placeholder="Scan barcode or search product... (/)"
          className={`w-full pl-10 pr-10 py-3 border-2 rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none transition-all 
            ${isPremium
              ? 'bg-white/80 shadow-inner border-white/40 focus:bg-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400'
              : searchFocus && query.length === 0 ? 'border-[#0ea5a3] ring-2 ring-[#0ea5a3]/20' : 'border-[#cbd5e1] focus:border-[#0ea5a3]'
            }`}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            // If text is present, treat as manual submission
            if (query) {
              if (onManualScan) {
                onManualScan(query);
                setQuery('');
              }
            } else {
              // If empty, open Camera Scanner
              setShowScanner(true);
            }
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors"
          title={query ? "Submit Code" : "Open Camera Scanner"}
        >
          <BsUpcScan className={`w-5 h-5 ${query ? 'text-blue-600' : 'text-[#94a3b8] hover:text-[#0ea5a3]'}`} />
        </button>
      </div>

      {showScanner && onManualScan && (
        <BarcodeScannerModal
          onClose={() => setShowScanner(false)}
          onScan={(code) => {
            onManualScan(code);
            setShowScanner(false);
          }}
        />
      )}

      {selectedForAlternatives && (
        <SaltAlternativesPanel
          originalDrug={selectedForAlternatives}
          storeId="default"
          onSelectAlternative={(alt) => {
            handleAddProduct(alt);
            setSelectedForAlternatives(null);
          }}
          onClose={() => setSelectedForAlternatives(null)}
        />
      )}

      {isLoading && query.length >= 2 && (
        <div className="mt-2 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
          <ProductSkeleton />
          <ProductSkeleton />
          <ProductSkeleton />
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className={`mt-2 rounded-lg shadow-lg max-h-[300px] overflow-y-auto border ${isPremium ? 'bg-white/95 backdrop-blur-xl border-emerald-500/20 shadow-emerald-900/5' : 'bg-white border-[#e2e8f0]'}`}>
          {results.map((product, index) => (
            <div
              key={product.id}
              onClick={() => {
                if (product.totalStock > 0) {
                  handleAddProduct(product);
                } else {
                  setSelectedForAlternatives(product);
                }
              }}
              className={`p-3 cursor-pointer border-b last:border-0 transition-colors ${index === selectedIndex
                ? isPremium ? 'bg-emerald-50/80 border-emerald-100' : 'bg-[#f0fdfa] border-[#f1f5f9]'
                : isPremium ? 'hover:bg-emerald-50/50 border-gray-100/50' : 'hover:bg-[#f8fafc] border-[#f1f5f9]'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-[#0f172a]">
                    {product.name} {product.strength && `• ${product.strength}`} {product.form && `• ${product.form}`}
                  </div>
                  <div className="text-sm text-[#64748b] mt-0.5">
                    {product.manufacturer} • Batch: {product.batchNumber}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold text-[#0f172a]">₹{Number(product.mrp).toFixed(2)}</div>
                  <div className={`mt-1 ${product.totalStock > 0 ? 'text-[#64748b]' : 'text-red-500 font-medium'}`}>
                    {product.totalStock > 0 ? (
                      <div className="flex flex-col items-end">
                        {renderStockQuantity({ totalStock: product.totalStock, drug: product }, { className: "text-sm font-semibold" })}
                        <span className="text-[10px] text-[#64748b]">{product.batchCount} batches</span>
                      </div>
                    ) : (
                      <span className="text-sm">Out of Stock</span>
                    )}
                  </div>
                </div>
                <div className="ml-3">
                  {product.totalStock > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddProduct(product);
                      }}
                      className="px-3 py-1.5 bg-[#0ea5a3] text-white rounded-lg text-sm font-medium hover:bg-[#0d9391]"
                      disabled={isLoading}
                    >
                      + Add
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedForAlternatives(product);
                      }}
                      className="px-3 py-1.5 bg-white border border-emerald-500 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 flex items-center gap-1 shadow-sm"
                      disabled={isLoading}
                    >
                      <FiSearch className="w-3 h-3" /> Find Substitute
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && query.length >= 2 && results.length === 0 && (
        <div className="mt-2 bg-white border border-[#e2e8f0] rounded-lg shadow-lg p-4 text-center text-[#64748b]">
          No products found matching "{query}"
        </div>
      )}
    </div>
  );
}
