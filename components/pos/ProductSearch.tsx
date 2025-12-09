'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import { BsUpcScan } from 'react-icons/bs';

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

export default function ProductSearch({ onAddProduct, searchFocus, setSearchFocus }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isTypingRef = useRef(false);

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

        if (response.success) {
          console.log('🔍 Setting results:', response.data?.length || 0, 'items');
          setResults(response.data || []);
          setSelectedIndex(0);
        } else {
          console.log('🔍 Response not successful:', response);
          setResults([]);
        }
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
      // Explicitly pass batch info if available on the search result (flattened view)
      batchId: product.batchId,
      batchNumber: product.batchNumber
    });
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="p-4 bg-white border-b border-[#e2e8f0] relative">
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
          onFocus={() => setSearchFocus(true)}
          placeholder="Scan barcode or search product... (/)"
          className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none transition-all ${searchFocus && query.length === 0
            ? 'border-[#0ea5a3] ring-2 ring-[#0ea5a3]/20'
            : 'border-[#cbd5e1] focus:border-[#0ea5a3]'
            }`}
          disabled={isLoading}
        />
        <BsUpcScan className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
      </div>

      {isLoading && query.length >= 2 && (
        <div className="mt-2 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
          <ProductSkeleton />
          <ProductSkeleton />
          <ProductSkeleton />
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="mt-2 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
          {results.map((product, index) => (
            <div
              key={product.id}
              onClick={() => handleAddProduct(product)}
              className={`p-3 cursor-pointer border-b border-[#f1f5f9] last:border-0 ${index === selectedIndex ? 'bg-[#f0fdfa]' : 'hover:bg-[#f8fafc]'
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
                  <div className="text-sm text-[#64748b]">
                    Stock: {product.totalStock} {product.batchCount > 1 && `• ${product.batchCount} batches`}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddProduct(product);
                  }}
                  className="ml-3 px-3 py-1.5 bg-[#0ea5a3] text-white rounded-lg text-sm font-medium hover:bg-[#0d9391]"
                  disabled={isLoading}
                >
                  + Add
                </button>
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
