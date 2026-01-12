/**
 * Enhanced Basket Component with Unit Selection
 * 
 * Adds support for unit-aware sales:
 * - Unit dropdown per item (tablet/strip/ml/bottle/etc.)
 * - Partial unit pricing recalculation
 * - Display of both display and base units
 */

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FiMinus, FiPlus, FiX, FiTag, FiChevronDown, FiPercent, FiTrash, FiAlertCircle, FiPackage } from 'react-icons/fi';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { usePremiumTheme } from '@/lib/hooks/usePremiumTheme';
import { formatUnitName, formatStockQuantity, renderStockQuantity } from '@/lib/utils/stock-display';
import { useAuthStore } from '@/lib/store/auth-store';

export default function Basket({ items, onUpdateItem, onRemoveItem, onClear, onEditBatch }: any) {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const { isPremium } = usePremiumTheme();
  const [availableUnits, setAvailableUnits] = useState<Record<string, any[]>>({});

  // Fetch available units for each drug
  useEffect(() => {
    const fetchUnitsForDrugs = async () => {
      // Use both drugId and id as fallback, as some search results use id for the drug ID
      const drugIds = items.map((item: any) => item.drugId || item.id).filter(Boolean);
      if (drugIds.length === 0) return;

      // 1. First, check if any items already have unitConfigurations (passed from ProductSearch)
      // This allows instant unit selection without waiting for the API
      const preloadedUnits: Record<string, any[]> = {};
      let needsFetch = false;

      items.forEach((item: any) => {
        const drugId = item.drugId || item.id;
        if (!drugId || availableUnits[drugId]) return;

        if (item.unitConfigurations && Array.isArray(item.unitConfigurations) && item.unitConfigurations.length > 0) {
          // Transform unitConfigurations to the format expected by the UI
          const transformedUnits = [
            {
              unit: item.displayUnit || 'Strip',
              isDefault: true,
              isBase: item.displayUnit === item.baseUnit,
              conversionFactor: 1
            }
          ];

          // Add configurations as additional units
          item.unitConfigurations.forEach((config: any) => {
            if (config.childUnit && config.childUnit !== item.displayUnit) {
              transformedUnits.push({
                unit: config.childUnit,
                isDefault: false,
                isBase: config.childUnit === item.baseUnit,
                conversionFactor: Number(config.conversion)
              });
            }
          });

          preloadedUnits[drugId] = transformedUnits;
        } else {
          needsFetch = true;
        }
      });

      if (Object.keys(preloadedUnits).length > 0) {
        setAvailableUnits(prev => ({ ...prev, ...preloadedUnits }));
      }

      if (!needsFetch) return;

      console.log('💊 Basket - Fetching units for remaining drugs...');

      try {
        const { inventoryApi } = await import('@/lib/api/inventory');
        const fetchedUnits: Record<string, any[]> = {};

        for (const drugId of drugIds) {
          if (availableUnits[drugId] || preloadedUnits[drugId]) continue; // Skip if already have it

          try {
            const res = await inventoryApi.getDrugUnits(drugId);
            const unitList = res.data?.units || res.units || [];
            fetchedUnits[drugId] = unitList;
          } catch (error) {
            console.error(`💊 Basket - Failed to load units for ${drugId}`, error);
          }
        }

        if (Object.keys(fetchedUnits).length > 0) {
          setAvailableUnits(prev => ({ ...prev, ...fetchedUnits }));
        }
      } catch (error) {
        console.error('Failed to fetch units:', error);
      }
    };

    fetchUnitsForDrugs();
  }, [items.length]);

  // Calculate unit price based on selected unit
  const calculateUnitPrice = (item: any) => {
    const selectedUnit = item.unit || item.displayUnit || 'unit';
    const mrp = item.mrp || 0;

    // If selling in same unit as MRP, use MRP directly
    if (!item.conversionFactor || selectedUnit === (item.displayUnit || 'unit')) {
      return mrp;
    }

    // Calculate per-unit price (e.g., tablet price from strip MRP)
    return mrp / item.conversionFactor;
  };

  const subtotal = items.reduce((sum: number, item: any) => {
    const unitPrice = calculateUnitPrice(item);
    const lineTotal = item.qty * unitPrice - (item.discount || 0);
    return sum + lineTotal;
  }, 0);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                <FiTag className="w-8 h-8 text-[#94a3b8]" />
              </div>
              <p className="text-[#64748b] text-sm">Basket is empty</p>
              <p className="text-[#94a3b8] text-xs mt-1">Scan or search products to add</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item: any, index: number) => {
              const unitPrice = calculateUnitPrice(item);
              const lineTotal = item.qty * unitPrice;
              const drugUnits = availableUnits[item.drugId || item.id];
              const selectedUnit = item.unit || item.displayUnit || 'unit';

              return (
                <div
                  key={index}
                  className={`border rounded-lg p-3 transition-all ${isPremium
                    ? 'bg-white/60 backdrop-blur-md border-emerald-500/10 shadow-sm hover:bg-white hover:border-emerald-500/30'
                    : 'bg-white border-[#e2e8f0]'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-[#0f172a]">{item.name}</div>
                        {item.type === 'RX' && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded border border-purple-200 uppercase tracking-wide">
                            <FiTag className="w-3 h-3" /> RX
                          </span>
                        )}
                      </div>

                      {/* Premium Metadata Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {/* Batch */}
                        <button
                          onClick={() => onEditBatch && onEditBatch(item, index)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 border rounded text-[10px] font-medium transition-colors hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 cursor-pointer ${!item.batchId ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-100 border-gray-200 text-gray-600'}`}
                          title="Click to change batch"
                        >
                          <span className="opacity-70">Batch:</span>
                          <span className="text-gray-900 font-bold">{item.batchNumber || (item.batchId ? '...' + item.batchId.slice(-4) : 'MISSING')}</span>
                          <FiChevronDown className="w-3 h-3 ml-0.5" />
                        </button>

                        {/* Location */}
                        {item.location && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded text-[10px] text-yellow-700 font-medium" title="Storage Location">
                            <span className="opacity-70">Loc:</span>
                            <span>{item.location}</span>
                          </div>
                        )}

                        {/* Expiry - Formatted MM/YYYY */}
                        {item.expiryDate && (
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 border rounded text-[10px] font-medium ${new Date(item.expiryDate) < new Date() ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-100 text-blue-700'
                            }`} title="Expiry Date">
                            <span className="opacity-70">Exp:</span>
                            <span>{new Date(item.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' })}</span>
                          </div>
                        )}

                        {/* GST */}
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 border rounded text-[10px] font-medium ${item.gstRate > 0 ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                          <span className="opacity-70">GST:</span>
                          <span>{item.gstRate || 0}%</span>
                        </div>
                      </div>
                    </div>

                    {/* OUT OF STOCK WARNING */}
                    {(() => {
                      const stockVal = Number(item.stock) || Number(item.totalStock) || 0;
                      if (isNaN(stockVal) || stockVal <= 0) {
                        return (
                          <div className="mt-2 p-2 bg-red-50 border border-red-300 rounded-lg flex items-center gap-2">
                            <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-red-700">Out of Stock!</p>
                              <p className="text-xs text-red-600">Please change the batch to continue</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <button
                      onClick={() => onRemoveItem(index)}
                      className="text-[#ef4444] hover:bg-[#fef2f2] p-1 rounded"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Mixed Unit Quantity Input */}
                      {item.conversionFactor && item.conversionFactor > 1 ? (
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded border border-gray-200">
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              min="0"
                              value={Math.floor(item.qty)}
                              onChange={(e) => {
                                const parentVal = Math.max(0, parseInt(e.target.value) || 0);
                                const childVal = Math.round((item.qty % 1) * (item.conversionFactor || 1));
                                const newTotal = parentVal + (childVal / (item.conversionFactor || 1));
                                const maxQty = (item.stock || item.totalStock || 999) / (item.conversionFactor || 1);
                                if (newTotal > maxQty) {
                                  toast.error(`Exceeds stock! Max: ${formatStockQuantity(item)}`);
                                  return;
                                }
                                onUpdateItem(index, { qty: newTotal });
                              }}
                              className="w-10 px-1 py-0.5 border border-transparent bg-white rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#0ea5a3]"
                            />
                            <span className="text-[9px] text-gray-400 uppercase font-bold leading-tight">{formatUnitName(selectedUnit)}</span>
                          </div>
                          <span className="text-gray-400 font-bold self-center">+</span>
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              min="0"
                              max={(item.conversionFactor || 1) - 1}
                              value={Math.round((item.qty % 1) * (item.conversionFactor || 1))}
                              onChange={(e) => {
                                const parentVal = Math.floor(item.qty);
                                const childVal = Math.max(0, parseInt(e.target.value) || 0);
                                const newTotal = parentVal + (childVal / (item.conversionFactor || 1));
                                const maxQty = (item.stock || item.totalStock || 999) / (item.conversionFactor || 1);
                                if (newTotal > maxQty) {
                                  toast.error(`Exceeds stock! Max: ${formatStockQuantity(item)}`);
                                  return;
                                }
                                onUpdateItem(index, { qty: newTotal });
                              }}
                              className="w-10 px-1 py-0.5 border border-transparent bg-white rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#0ea5a3]"
                            />
                            <span className="text-[9px] text-gray-400 uppercase font-bold leading-tight">{formatUnitName(item.baseUnit || 'Unit')}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateItem(index, { qty: Math.max(1, item.qty - 1) })}
                            className="w-7 h-7 flex items-center justify-center border border-[#cbd5e1] rounded hover:bg-[#f8fafc]"
                          >
                            <FiMinus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            step="any"
                            value={item.qty}
                            onChange={(e) => {
                              const newQty = Math.max(0, parseFloat(e.target.value) || 0);
                              const maxQty = item.stock || item.totalStock || 999;
                              if (newQty > maxQty) {
                                toast.error(`Only ${maxQty} ${formatUnitName(selectedUnit)}s available in stock!`);
                                return;
                              }
                              onUpdateItem(index, { qty: newQty });
                            }}
                            className="w-12 text-center border border-[#cbd5e1] rounded py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                          />
                          <button
                            onClick={() => {
                              const maxQty = item.stock || item.totalStock || 999;
                              if (item.qty + 1 > maxQty) {
                                toast.error(`Only ${maxQty} ${formatUnitName(selectedUnit)}s available in stock!`);
                                return;
                              }
                              onUpdateItem(index, { qty: item.qty + 1 });
                            }}
                            className="w-7 h-7 flex items-center justify-center border border-[#cbd5e1] rounded hover:bg-[#f8fafc]"
                            disabled={item.qty >= (item.stock || item.totalStock || 999)}
                          >
                            <FiPlus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* UNIT SELECTOR */}
                    {drugUnits === undefined ? (
                      <span className="px-2 py-1 text-xs border border-gray-100 rounded bg-gray-50 text-gray-400 font-medium animate-pulse select-none" title="Loading alternatives...">
                        {formatUnitName(selectedUnit)}
                      </span>
                    ) : drugUnits.length <= 1 ? (
                      <span className="px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 text-gray-600 font-medium" title="Only one unit available">
                        {formatUnitName(selectedUnit)}
                      </span>
                    ) : (
                      <select
                        value={selectedUnit}
                        onChange={(e) => {
                          const newUnit = e.target.value;
                          const unitConfig = drugUnits.find((u: any) => u.unit === newUnit);

                          // Check if changing to this unit makes it identical to ANOTHER item in the basket
                          const otherItemIndex = items.findIndex((other: any, oIndex: number) =>
                            oIndex !== index &&
                            (other.drugId || other.id) === (item.drugId || item.id) &&
                            other.batchId === item.batchId &&
                            (other.unit || other.displayUnit || 'unit') === newUnit
                          );

                          if (otherItemIndex >= 0) {
                            // Merge this item into the other item
                            const targetQty = items[otherItemIndex].qty + item.qty;
                            const targetMax = items[otherItemIndex].stock || items[otherItemIndex].totalStock || 999;

                            if (targetQty > targetMax) {
                              toast.error(`Merging these items would exceed available stock (${targetMax} ${newUnit}s)`);
                              return;
                            }

                            // Remove current item and update the other one
                            onRemoveItem(index);
                            onUpdateItem(otherItemIndex, { qty: targetQty });
                            toast.info(`Merged items under unit: ${formatUnitName(newUnit)}`);
                          } else {
                            onUpdateItem(index, {
                              unit: newUnit,
                              conversionFactor: unitConfig?.conversionFactor || 1
                            });
                          }
                        }}
                        className="px-2 py-1 text-xs border border-emerald-200 rounded bg-emerald-50 text-emerald-700 font-medium focus:outline-none focus:ring-2 focus focus:ring-emerald-300 cursor-pointer"
                        title="Select unit"
                      >
                        {drugUnits.map((unitOption: any) => (
                          <option key={unitOption.unit} value={unitOption.unit}>
                            {formatUnitName(unitOption.unit)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-[#64748b]">
                      ₹{unitPrice.toFixed(2)} × {item.qty}
                      {selectedUnit && <span className="ml-1 text-[10px] text-emerald-600">({selectedUnit})</span>}
                    </div>
                    <div className="font-semibold text-[#0f172a]">₹{lineTotal.toFixed(2)}</div>
                  </div>

                  {item.discount > 0 && (
                    <div className="mt-2 text-xs text-[#10b981]">
                      Discount: -₹{item.discount}
                    </div>
                  )}

                  <button
                    onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                    className="mt-2 text-xs text-[#0ea5a3] flex items-center gap-1 hover:underline"
                  >
                    <FiChevronDown className={`w-3 h-3 transition-transform ${expandedItem === index ? 'rotate-180' : ''}`} />
                    {expandedItem === index ? 'Less' : 'More'}
                  </button>

                  {expandedItem === index && (
                    <div className="mt-3 pt-3 border-t border-[#e2e8f0] space-y-2">
                      {/* Item Discount */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#64748b]">Item Discount</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => onUpdateItem(index, { discountType: 'amount' })}
                              className={`px-2 py-0.5 text-xs rounded ${(item.discountType || 'percentage') === 'amount' ? 'bg-[#0ea5a3] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}
                            >
                              ₹
                            </button>
                            <button
                              onClick={() => onUpdateItem(index, { discountType: 'percentage' })}
                              className={`px-2 py-0.5 text-xs rounded ${(item.discountType || 'percentage') === 'percentage' ? 'bg-[#0ea5a3] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}
                            >
                              %
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="0"
                            value={item.discountValue || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              const discountType = item.discountType || 'percentage';
                              const lineTotal = item.qty * unitPrice;

                              let discountAmount = 0;
                              if (discountType === 'percentage') {
                                discountAmount = (lineTotal * value) / 100;
                              } else {
                                discountAmount = value;
                              }

                              // Cap discount at line total
                              if (discountAmount > lineTotal) {
                                toast.error('Discount cannot exceed item total');
                                return;
                              }

                              onUpdateItem(index, {
                                discountValue: value,
                                discount: discountAmount
                              });
                            }}
                            className="flex-1 px-2 py-1.5 text-sm border border-[#cbd5e1] rounded focus:outline-none focus:ring-1 focus:ring-[#0ea5a3]"
                          />
                          <span className="text-sm font-medium text-[#ef4444] min-w-[60px] text-right">
                            -₹{(item.discount || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* GST Edit */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#64748b]">GST %</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={item.gstRate || 0}
                            onChange={(e) => onUpdateItem(index, { gstRate: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 text-sm border border-[#cbd5e1] rounded focus:outline-none focus:ring-1 focus:ring-[#0ea5a3] bg-white"
                          >
                            <option value="0">0% (Exempt)</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </div>
                      </div>

                      {/* Stock Info */}
                      <div className="flex items-center justify-between text-xs mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                        <span className="text-gray-500">Available Stock</span>
                        <span className={`font-bold ${item.qty > (item.stock || 0) ? 'text-red-600' : 'text-gray-700'}`}>
                          {item.stock !== undefined && item.stock !== null && !isNaN(item.stock) ? formatStockQuantity({ ...item, quantityInStock: item.stock }) : '0'}
                        </span>
                      </div>
                      {item.qty > (item.stock || item.totalStock || 0) && (
                        <div className="text-xs text-[#ef4444] mt-1">
                          ⚠️ Quantity exceeds available stock!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {
        items.length > 0 && (
          <div className={`shrink-0 border-t px-4 py-3 ${isPremium ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-[#e2e8f0]'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#64748b]">Subtotal ({items.length} items)</span>
              <span className={`font-semibold text-lg ${isPremium ? 'text-emerald-700' : 'text-[#0f172a]'}`}>₹{subtotal.toFixed(2)}</span>
            </div>

            <button
              onClick={() => setShowClearDialog(true)}
              className="w-full py-2 text-sm font-medium text-[#ef4444] border border-[#fecaca] rounded-lg hover:bg-[#fef2f2] flex items-center justify-center gap-1 transition-colors"
            >
              <FiTrash className="w-3.5 h-3.5" />
              <span>Clear Sale</span>
            </button>
          </div>
        )
      }

      <ConfirmDialog
        isOpen={showClearDialog}
        title="Clear Entire Sale?"
        message="This will remove all items from the basket, unselect the customer, and unlink any prescription. This action cannot be undone."
        confirmLabel="Yes, Clear All"
        type="danger"
        onConfirm={() => {
          onClear();
          setShowClearDialog(false);
          toast.success('Sale cleared successfully');
        }}
        onCancel={() => setShowClearDialog(false)}
      />
    </div>
  );
}
