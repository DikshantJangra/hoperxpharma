import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlinePlus } from 'react-icons/hi2';
import { FiUpload } from 'react-icons/fi';
import BulkAddModal from './BulkAddModal';
import AddCustomItemInline from './AddCustomItemInline';

interface Product {
    id: string;
    name: string;
    gstPercent: number;
    lastPrice?: number;
    currentStock: number;
}

interface ProductSearchBarProps {
    onSelect: (product: any) => void;
    supplier?: any;
}

// Simple cache for search results
const searchCache = new Map<string, Product[]>();
const MAX_CACHE_SIZE = 50;

const ProductSearchBar = forwardRef(({ onSelect, supplier }: ProductSearchBarProps, ref) => {
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showBulkAdd, setShowBulkAdd] = useState(false);
    const [showCustomItemInline, setShowCustomItemInline] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
        blur: () => inputRef.current?.blur()
    }));

    // Debounced search function
    const debouncedSearch = useCallback((searchQuery: string) => {
        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(() => {
            searchProducts(searchQuery);
        }, 300); // 300ms debounce
    }, []);

    useEffect(() => {
        if (query.length >= 2) {
            debouncedSearch(query);
        } else {
            setProducts([]);
        }

        // Cleanup on unmount
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [query, debouncedSearch]);

    const searchProducts = async (searchQuery: string) => {
        // Check cache first
        if (searchCache.has(searchQuery)) {
            setProducts(searchCache.get(searchQuery) || []);
            setSelectedIndex(0);
            return;
        }

        setLoading(true);
        try {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const response = await fetch(`${apiBaseUrl}/drugs/search?q=${searchQuery}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const drugs = data.data || data || [];

                const mappedProducts: Product[] = drugs.map((drug: any) => ({
                    id: drug.id,
                    name: `${drug.name}${drug.strength ? ` ${drug.strength}` : ''}${drug.form ? ` ${drug.form}` : ''}`,
                    gstPercent: drug.gstRate || 12,
                    lastPrice: undefined,
                    currentStock: 0
                }));

                // Update cache
                if (searchCache.size >= MAX_CACHE_SIZE) {
                    // Remove oldest entry
                    const firstKey = searchCache.keys().next().value;
                    if (firstKey) searchCache.delete(firstKey);
                }
                searchCache.set(searchQuery, mappedProducts);

                setProducts(mappedProducts);
                setSelectedIndex(0);
            }
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
            if (products.length > 0 && products[selectedIndex]) {
                handleSelect(products[selectedIndex]);
            } else if (query.trim().length > 0) {
                // If no products found or selected, show inline form
                setShowCustomItemInline(true);
            }
        } else if (e.key === 'Escape') {
            setQuery('');
            setProducts([]);
            setShowCustomItemInline(false);
            inputRef.current?.blur();
        }
    };

    const handleSelect = (product: Product) => {
        onSelect({
            drugId: product.id,
            qty: 1,
            pricePerUnit: product.lastPrice || 0,
            gstPercent: product.gstPercent,
            discountPercent: 0,
            description: product.name
        });
        setQuery('');
        setProducts([]);
        inputRef.current?.focus();
    };

    const handleCustomItemAdd = (item: any) => {
        onSelect(item);
        setQuery('');
        setProducts([]);
        setShowCustomItemInline(false);
        inputRef.current?.focus();
    };

    return (
        <div className="relative space-y-2">
            <div className="flex items-center gap-2">
                {/* Search Input */}
                <div className="relative flex-1">
                    <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search products or scan barcode... (Press / to focus)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        autoFocus
                    />
                    {query && (
                        <button
                            onClick={() => {
                                setQuery('');
                                setProducts([]);
                            }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <HiOutlineXMark className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Bulk Add Button */}
                <button
                    onClick={() => setShowBulkAdd(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Bulk Add Items"
                >
                    <FiUpload size={16} />
                    Bulk Add
                </button>
            </div>

            {/* Inline Custom Item Form */}
            {showCustomItemInline && (
                <AddCustomItemInline
                    onAdd={handleCustomItemAdd}
                    onCancel={() => setShowCustomItemInline(false)}
                    initialName={query}
                />
            )}

            {/* Search Results Dropdown */}
            {query.length >= 2 && !showCustomItemInline && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-96 rounded-lg border border-gray-200 overflow-auto">
                    {loading ? (
                        <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                    ) : (
                        <>
                            {products.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 border-b border-gray-100">
                                    No products found for "{query}"
                                </div>
                            ) : (
                                products.map((product, index) => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleSelect(product)}
                                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${index === selectedIndex ? 'bg-emerald-50' : ''
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">{product.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Stock: {product.currentStock} • GST: {product.gstPercent}%
                                                    {product.lastPrice && ` • Last: ₹${product.lastPrice}`}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}

                            {/* Add Custom Item Option */}
                            <button
                                onClick={() => setShowCustomItemInline(true)}
                                className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-emerald-600 font-medium flex items-center gap-2 border-t border-gray-100"
                            >
                                <HiOutlinePlus className="h-4 w-4" />
                                Add "{query}" as custom item
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Help Text */}
            {!query && !showCustomItemInline && (
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>Use ↑↓ to navigate, Enter to select, Esc to cancel</span>
                    <button
                        onClick={() => setShowCustomItemInline(true)}
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                        + Add Custom Item
                    </button>
                </div>
            )}

            {/* Bulk Add Modal */}
            <BulkAddModal
                isOpen={showBulkAdd}
                onClose={() => setShowBulkAdd(false)}
                onAdd={(items) => {
                    items.forEach(item => onSelect(item));
                    setShowBulkAdd(false);
                }}
                supplier={supplier}
            />
        </div>
    );
});

ProductSearchBar.displayName = 'ProductSearchBar';

export default ProductSearchBar;
