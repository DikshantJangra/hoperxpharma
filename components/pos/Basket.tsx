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
import { FiMinus, FiPlus, FiX, FiTag, FiChevronDown, FiPercent, FiTrash, FiAlertCircle, FiPackage, FiRefreshCw } from 'react-icons/fi';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { usePremiumTheme } from '@/lib/hooks/usePremiumTheme';
import { formatUnitName, formatStockQuantity, renderStockQuantity } from '@/lib/utils/stock-display';
import { useAuthStore } from '@/lib/store/auth-store';
import SmartQuantityInput from '@/components/common/SmartQuantityInput';

export default function Basket({ items, onUpdateItem, onRemoveItem, onClear, onEditBatch, onFindSubstitute }: any) {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const { isPremium } = usePremiumTheme();
  const [availableUnits, setAvailableUnits] = useState<Record<string, any[]>>({});
  const [openBatchIndex, setOpenBatchIndex] = useState<number | null>(null);
  const [batchOptions, setBatchOptions] = useState<any[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [detailedStock, setDetailedStock] = useState<Record<number, boolean>>({});

  const handleBatchOpen = async (item: any, index: number) => {
    if (openBatchIndex === index) {
      setOpenBatchIndex(null);
      return;
    }
    setOpenBatchIndex(index);
    setBatchOptions([]);
    setIsLoadingBatches(true);
    try {
      const { inventoryApi } = await import('@/lib/api/inventory');
      const response = await inventoryApi.getBatches({ drugId: item.drugId || item.id, minQuantity: 0 });
      const data = response?.data || response || [];
      setBatchOptions(data);
    } catch (e) {
      toast.error("Failed to load batches");
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const selectBatch = (index: number, batch: any) => {
    onUpdateItem(index, {
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      mrp: batch.mrp,
      stock: batch.baseUnitQuantity,
      location: batch.location
    });
    setOpenBatchIndex(null);
  };

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
            // API returns { drugId, drugName, baseUnit, displayUnit, conversionFactor, units }
            const unitList = res?.units || [];
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

  // Calculate unit price (ALWAYS per base unit for calculation accuracy)
  const calculateUnitPrice = (item: any) => {
    const mrp = Number(item.mrp) || 0;
    // If conversion factor exists, price per base unit = MRP / factor
    if (item.conversionFactor && item.conversionFactor > 1) {
      return mrp / item.conversionFactor;
    }
    return mrp;
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

                      {/* Chemical Composition (Molecule) */}
                      {item.saltLinks && item.saltLinks.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.saltLinks.map((salt: any, i: number) => (
                            <span key={i} className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-medium rounded border border-blue-100">
                              {salt.salt?.name || salt.name} {salt.strengthValue || salt.strength || ''}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Premium Metadata Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {/* Batch Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => handleBatchOpen(item, index)}
                            className={`flex items-center gap-1 px-1.5 py-0.5 border rounded text-[10px] font-medium transition-colors hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 cursor-pointer ${!item.batchId ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-100 border-gray-200 text-gray-600'}`}
                            title="Click to change batch"
                          >
                            <span className="opacity-70">Batch:</span>
                            <span className="text-gray-900 font-bold">{item.batchNumber || (item.batchId ? '...' + item.batchId.slice(-4) : 'MISSING')}</span>
                            <FiChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openBatchIndex === index ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Quick Stock Badge - Total Stock Display */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailedStock(prev => ({ ...prev, [index]: !prev[index] }));
                            }}
                            className={`flex items-center gap-1 px-1.5 py-0.5 border rounded text-[10px] font-medium transition-all cursor-pointer hover:shadow-sm active:scale-95 ${(item.stock || item.totalStock) > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'}`}
                            title="Click to toggle detailed stock view"
                          >
                            <span className="opacity-70">Stock:</span>
                            <span className="font-bold">
                              {renderStockQuantity({
                                baseUnitQuantity: item.totalStock || item.stock || item.baseUnitQuantity || 0,
                                baseUnit: item.baseUnit,
                                displayUnit: detailedStock[index] ? (item.displayUnit || item.unit) : item.baseUnit,
                                drug: {
                                  baseUnit: item.baseUnit,
                                  displayUnit: detailedStock[index] ? (item.displayUnit || item.unit) : item.baseUnit,
                                  unitConfigurations: item.unitConfigurations
                                },
                                // When showing base unit, we force conversion factor to 1
                                tabletsPerStrip: detailedStock[index] ? (item.tabletsPerStrip || item.conversionFactor) : 1,
                                conversionFactor: detailedStock[index] ? (item.conversionFactor || item.tabletsPerStrip) : 1,
                                conversion: detailedStock[index] ? item.conversionFactor : 1
                              }, { forceBoth: !!detailedStock[index] })}
                            </span>
                          </div>

                          {openBatchIndex === index && (
                            <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                              {isLoadingBatches ? (
                                <div className="p-3 text-center text-xs text-gray-500 animate-pulse">Loading batches...</div>
                              ) : batchOptions.length === 0 ? (
                                <div className="p-3 text-center text-xs text-gray-500">No other batches found</div>
                              ) : (
                                <div className="py-1">
                                  {batchOptions.map((batch) => (
                                    <button
                                      key={batch.id}
                                      onClick={() => selectBatch(index, batch)}
                                      className={`w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 transition-colors border-b last:border-0 border-gray-100 ${batch.id === item.batchId ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-700'}`}
                                    >
                                      <div className="flex justify-between items-center">
                                        <span>{batch.batchNumber}</span>
                                        <span className="font-bold">₹{batch.mrp}</span>
                                      </div>
                                      <div className="flex justify-between items-center mt-0.5 opacity-70">
                                        <span>Exp: {new Date(batch.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' })}</span>
                                        <span>Stock: {batch.baseUnitQuantity}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

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
                      const stockVal = Number(item.stock) || Number(item.totalStock) || Number(item.baseUnitQuantity) || 0;
                      if (isNaN(stockVal) || stockVal <= 0) {
                        return (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                              <div className="flex-1">
                                <p className="text-[10px] font-bold text-red-700 uppercase">Out of Stock!</p>
                                <p className="text-[10px] text-red-600">Change batch or find substitute</p>
                              </div>
                            </div>
                            {onFindSubstitute && (
                              <button
                                onClick={() => onFindSubstitute(item, index)}
                                className="w-full py-1.5 bg-white border border-red-200 text-red-600 rounded text-[10px] font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <FiRefreshCw className="w-3 h-3" />
                                Find Alternative Molecule
                              </button>
                            )}
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
                      {/* Smart Quantity Input */}
                      <SmartQuantityInput
                        value={item.qty}
                        onChange={(newQty) => {
                          const maxQty = item.stock || item.totalStock || 999;
                          if (newQty > maxQty) {
                            toast.error(`Only ${formatStockQuantity(item)} available in stock!`);
                            return;
                          }
                          onUpdateItem(index, { qty: newQty });
                        }}
                        conversionFactor={item.conversionFactor}
                        baseUnitName={item.baseUnit || 'Unit'}
                        stripUnitName={selectedUnit}
                        maxQuantity={item.stock || item.totalStock}
                        compact={true}
                        disableUnitSwitch={true} // FORCE SIMPLE MODE
                      />
                    </div>

                    {/* Unit Selector Removed - SmartInput handles dual display */}
                    {/* Only show label if it's a simple unit (conversion <= 1) but SmartInput handles label mostly. 
                        Actually, SmartInput shows labels inside/below inputs.
                        So we can mostly empty this space or just keep the loading state if purely undefined. 
                    */}
                    {drugUnits === undefined && (
                      <span className="px-2 py-1 text-xs border border-gray-100 rounded bg-gray-50 text-gray-400 font-medium animate-pulse select-none" title="Loading alternatives...">
                        Loading...
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-[#64748b]">
                      {(() => {
                        const hasConversion = item.conversionFactor && item.conversionFactor > 1;
                        if (!hasConversion) {
                          return `₹${unitPrice.toFixed(2)} × ${item.qty} ${formatUnitName(item.baseUnit || 'Unit')}`;
                        }

                        // Show clear calculation: Total Tablets × Price/Tablet
                        return (
                          <div className="flex flex-col items-end">
                            <span>₹{unitPrice.toFixed(2)} / {formatUnitName(item.baseUnit || 'Tab')} × {item.qty}</span>
                            <span className="text-[10px] text-gray-400">
                              ({Number(item.mrp).toFixed(2)} / {formatUnitName(item.displayUnit || 'Strip')})
                            </span>
                          </div>
                        );
                      })()}
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
                      {/* Discount and GST Side by Side */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Item Discount */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#64748b]">Discount</span>
                            <div className="flex gap-0.5">
                              <button
                                onClick={() => onUpdateItem(index, { discountType: 'amount' })}
                                className={`px-1.5 py-0.5 text-[10px] rounded ${(item.discountType || 'percentage') === 'amount' ? 'bg-[#0ea5a3] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}
                              >
                                ₹
                              </button>
                              <button
                                onClick={() => onUpdateItem(index, { discountType: 'percentage' })}
                                className={`px-1.5 py-0.5 text-[10px] rounded ${(item.discountType || 'percentage') === 'percentage' ? 'bg-[#0ea5a3] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}
                              >
                                %
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
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

                                if (discountAmount > lineTotal) {
                                  toast.error('Discount cannot exceed item total');
                                  return;
                                }

                                onUpdateItem(index, {
                                  discountValue: value,
                                  discount: discountAmount
                                });
                              }}
                              className="w-full px-2 py-1.5 text-xs border border-[#cbd5e1] rounded focus:outline-none focus:ring-1 focus:ring-[#0ea5a3]"
                            />
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
                              className="w-full px-2 py-1.5 text-xs border border-[#cbd5e1] rounded focus:outline-none focus:ring-1 focus:ring-[#0ea5a3] bg-white"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Stock Info */}
                      <div className="bg-gray-50 px-3 py-2 rounded border border-gray-100 flex items-center justify-between w-full">
                        <span className="text-xs text-[#64748b]">In Stock</span>
                        <span className="text-xs font-semibold text-[#0f172a]">
                          {renderStockQuantity({
                            baseUnitQuantity: item.totalStock || item.stock || item.baseUnitQuantity || 0,
                            baseUnit: item.baseUnit,
                            displayUnit: item.displayUnit || item.unit,
                            drug: {
                              baseUnit: item.baseUnit,
                              displayUnit: item.displayUnit || item.unit,
                              unitConfigurations: item.unitConfigurations
                            },
                            conversion: item.conversionFactor
                          }, { forceBoth: true })}
                        </span>
                      </div>
                      {item.qty > (item.stock || item.totalStock || 0) && (
                        <div className="text-xs text-[#ef4444] mt-1">
                          ⚠️ Quantity exceeds available stock!
                        </div>
                      )}

                      {/* Find Substitute Button */}
                      {onFindSubstitute && (
                        <button
                          onClick={() => onFindSubstitute(item, index)}
                          className="w-full mt-2 py-2 text-sm font-medium text-[#0ea5a3] border border-[#0ea5a3] rounded-lg hover:bg-[#0ea5a3]/10 flex items-center justify-center gap-2 transition-colors"
                        >
                          <FiRefreshCw className="w-4 h-4" />
                          Find Substitute (Same Composition)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {items.length > 0 && (
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
      )}

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
