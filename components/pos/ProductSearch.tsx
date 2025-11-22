'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import { BsUpcScan } from 'react-icons/bs';

interface Product {
  sku: string;
  name: string;
  strength?: string;
  packSize?: string;
  hsn: string;
  mrp: number;
  stock: number;
  batches: number;
  gstRate: number;
  batchId?: string;
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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setAllProducts([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (searchFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchFocus]);

  useEffect(() => {
    if (query.length > 0) {
      const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase()) ||
        p.hsn.includes(query)
      );
      setResults(filtered);
      setSelectedIndex(0);
    } else {
      setResults([]);
    }
  }, [query, allProducts]);

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
    }
  };

  const handleAddProduct = (product: Product) => {
    onAddProduct({ ...product, batchId: 'B2025-01' });
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
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          placeholder="Scan barcode or search product... (/)"
          className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none transition-all ${
            searchFocus && query.length === 0
              ? 'border-[#0ea5a3] ring-2 ring-[#0ea5a3]/20'
              : 'border-[#cbd5e1] focus:border-[#0ea5a3]'
          }`}
          disabled={isLoading}
        />
        <BsUpcScan className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
      </div>

      {isLoading ? (
        <div className="mt-2 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
            <ProductSkeleton/>
            <ProductSkeleton/>
            <ProductSkeleton/>
        </div>
      ) : results.length > 0 && (
        <div className="mt-2 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
          {results.map((product, index) => (
            <div
              key={product.sku}
              onClick={() => handleAddProduct(product)}
              className={`p-3 cursor-pointer border-b border-[#f1f5f9] last:border-0 ${
                index === selectedIndex ? 'bg-[#f0fdfa]' : 'hover:bg-[#f8fafc]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-[#0f172a]">
                    {product.name} {product.strength && `• ${product.strength}`} {product.packSize && `• ${product.packSize}`}
                  </div>
                  <div className="text-sm text-[#64748b] mt-0.5">
                    HSN: {product.hsn} • SKU: {product.sku}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold text-[#0f172a]">₹{product.mrp}</div>
                  <div className="text-sm text-[#64748b]">
                    Stock: {product.stock} {product.batches > 1 && `• ${product.batches} batches`}
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
    </div>
  );
}
