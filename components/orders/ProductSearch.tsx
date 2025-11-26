'use client';

import React, { useState, useEffect } from 'react';
import { Supplier } from '@/types/po';
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from 'react-icons/hi2';

interface Product {
  id: string;
  name: string;
  sku: string;
  packUnit: string;
  packSize: number;
  unit: string;
  price: number;
  gstPercent: number;
  lastPrice?: number;
  currentStock: number;
  moq?: number;
}

interface ProductSearchProps {
  onSelect: (product: Product) => void;
  onCancel: () => void;
  supplier?: Supplier;
}

export default function ProductSearch({ onSelect, onCancel, supplier }: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (query.length >= 2) {
      searchProducts(query);
    } else {
      setProducts([]);
    }
  }, [query, supplier]);

  const searchProducts = async (searchQuery: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '10'
      });

      if (supplier?.id) {
        params.append('supplierId', supplier.id);
      }

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${apiBaseUrl}/drugs/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      const drugs = data.data || data || [];

      // Map drug data to Product format
      const mappedProducts: Product[] = drugs.map((drug: any) => ({
        id: drug.id,
        name: `${drug.name}${drug.strength ? ` ${drug.strength}` : ''}${drug.form ? ` ${drug.form}` : ''}`,
        sku: drug.id, // Using ID as SKU for now
        packUnit: drug.defaultUnit || 'Strip',
        packSize: 10, // Default pack size
        unit: drug.defaultUnit?.toLowerCase() || 'strip',
        price: 0, // Will be filled by user
        gstPercent: drug.gstRate || 12,
        lastPrice: undefined,
        currentStock: 0, // Will be fetched from inventory if needed
        moq: undefined
      }));

      setProducts(mappedProducts);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search failed:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, products.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (products[selectedIndex]) {
        onSelect(products[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Scan barcode or search product name / SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <HiOutlineXMark className="h-5 w-5" />
        </button>
      </div>

      {query.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-64 rounded-md border border-gray-200 overflow-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          ) : products.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No products found for "{query}"
            </div>
          ) : (
            products.map((product, index) => (
              <button
                key={product.id}
                onClick={() => onSelect(product)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {product.packUnit} of {product.packSize} • Stock: {product.currentStock}
                      {product.moq && ` • MOQ: ${product.moq}`}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(product.price)}
                    </div>
                    {product.lastPrice && (
                      <div className="text-xs text-gray-500">
                        Last: {formatCurrency(product.lastPrice)}
                      </div>
                    )}
                    <div className="text-xs text-gray-400">
                      GST: {product.gstPercent}%
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        Use ↑↓ to navigate, Enter to select, Esc to cancel
      </div>
    </div>
  );
}