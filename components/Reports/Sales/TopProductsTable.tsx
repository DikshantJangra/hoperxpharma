'use client';

import React from 'react';
import { TopProduct } from '@/lib/api/salesAnalytics';
import { HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown, HiOutlineExclamationTriangle } from 'react-icons/hi2';

interface TopProductsTableProps {
    products: TopProduct[];
    onProductClick?: (product: TopProduct) => void;
}

export default function TopProductsTable({ products, onProductClick }: TopProductsTableProps) {
    if (!products || products.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
                <div className="text-center text-gray-500 py-8">
                    <p>No product data available</p>
                </div>
            </div>
        );
    }

    const getTrendIcon = (trend: string) => {
        if (trend === 'up') return <HiOutlineArrowTrendingUp className="h-4 w-4 text-green-600" />;
        if (trend === 'down') return <HiOutlineArrowTrendingDown className="h-4 w-4 text-red-600" />;
        return <span className="text-gray-400">→</span>;
    };

    const getStockStatus = (stock: number) => {
        if (stock === 0) {
            return { label: 'Out of Stock', color: 'text-red-600 bg-red-50 border-red-200' };
        } else if (stock < 10) {
            return { label: 'Low Stock', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
        }
        return { label: `${stock} units`, color: 'text-gray-600 bg-gray-50 border-gray-200' };
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Product
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Revenue
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Orders
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Avg Price
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Stock
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Trend
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product, index) => {
                            const stockStatus = getStockStatus(product.stockLeft);

                            return (
                                <tr
                                    key={product.drugId}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => onProductClick?.(product)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">{product.drugName}</div>
                                                <div className="text-sm text-gray-500">{product.manufacturer}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{product.category}</div>
                                            </div>
                                            {product.stockLeft === 0 && (
                                                <HiOutlineExclamationTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-semibold text-gray-900 tabular-nums">
                                            ₹{product.revenue.toLocaleString('en-IN')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-gray-900 tabular-nums">
                                            {product.orders}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-gray-900 tabular-nums">
                                            ₹{product.avgPrice.toLocaleString('en-IN')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border ${stockStatus.color} font-medium`}>
                                                {stockStatus.label}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            {getTrendIcon(product.trend)}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
