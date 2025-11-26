import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from 'react-icons/hi2';
import { FiUpload } from 'react-icons/fi';
import BulkAddModal from './BulkAddModal';

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

const ProductSearchBar = forwardRef(({ onSelect, supplier }: ProductSearchBarProps, ref) => {
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showBulkAdd, setShowBulkAdd] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
        blur: () => inputRef.current?.blur()
    }));

    useEffect(() => {
        if (query.length >= 2) {
            searchProducts(query);
        } else {
            setProducts([]);
        }
    }, [query]);

    const searchProducts = async (searchQuery: string) => {
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
            if (products[selectedIndex]) {
                handleSelect(products[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            setQuery('');
            setProducts([]);
            inputRef.current?.blur();
        }
    };

    const handleSelect = (product: Product) => {
        onSelect({
            drugId: product.id,
            qty: 1,
            pricePerUnit: product.lastPrice || 0,
            gstPercent: product.gstPercent,
            discountPercent: 0
        });
        setQuery('');
        setProducts([]);
        inputRef.current?.focus();
    };

    return (
        <div className="relative">
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

            {/* Search Results Dropdown */}
            {query.length >= 2 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-80 rounded-lg border border-gray-200 overflow-auto">
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
                </div>
            )}

            {/* Help Text */}
            {!query && (
                <div className="mt-2 text-xs text-gray-500">
                    Use ↑↓ to navigate, Enter to select, Esc to cancel
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
