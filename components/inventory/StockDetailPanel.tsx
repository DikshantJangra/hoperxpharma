'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiX, FiShoppingCart, FiEdit, FiSend, FiClock, FiPackage, FiAlertCircle, FiCheck, FiTrash2, FiEdit2, FiPlus } from 'react-icons/fi';
import { BsSnow, BsQrCode } from 'react-icons/bs';
import { toast } from 'sonner';
import AdjustStockModal from './AdjustStockModal';
import AddBatchModal from './AddBatchModal';
import DeleteInventoryModal from './DeleteInventoryModal';
import EditDrugModal from './EditDrugModal';
import { mapDrugToDetailPanel } from '@/lib/utils/drugMapper';

export default function StockDetailPanel({ item, onClose, onUpdate }: any) {
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showEditDrugModal, setShowEditDrugModal] = useState(false);
  const [batchesWithSuppliers, setBatchesWithSuppliers] = useState<any[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [locationValue, setLocationValue] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ type: 'drug' | 'batch', item: any } | null>(null);
  const router = useRouter();

  // Map the drug data to expected format
  const mappedItem = mapDrugToDetailPanel(item);

  useEffect(() => {
    if (mappedItem && mappedItem.id) {
      // Use inventory data that's already in the item object
      if (item.inventory && Array.isArray(item.inventory)) {
        fetchSupplierInfo(item.inventory);
      } else {
        // Fallback: fetch from API if inventory is not in item
        fetchBatchesWithSuppliers();
      }
    }
  }, [mappedItem?.id, item]);

  const fetchSupplierInfo = async (batches: any[]) => {
    try {
      setIsLoadingBatches(true);

      // Fetch supplier info for each batch that has a supplierId
      const batchesWithSuppliers = await Promise.all(
        batches.map(async (batch) => {
          if (batch.supplierId) {
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/suppliers/${batch.supplierId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                  }
                }
              );
              if (response.ok) {
                const result = await response.json();
                const supplier = result.data || result;
                return { ...batch, supplier };
              }
            } catch (error) {
              console.error(`Failed to fetch supplier for batch ${batch.id}:`, error);
            }
          }
          return { ...batch, supplier: null };
        })
      );

      setBatchesWithSuppliers(batchesWithSuppliers);
    } catch (error) {
      console.error('Failed to fetch supplier info:', error);
      // Still show batches even if supplier fetch fails
      setBatchesWithSuppliers(batches.map(b => ({ ...b, supplier: null })));
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const fetchBatchesWithSuppliers = async () => {
    if (!mappedItem) return;

    try {
      setIsLoadingBatches(true);
      const { inventoryApi } = await import('@/lib/api/inventory');
      const response = await inventoryApi.getBatchesWithSuppliers(mappedItem.id);

      if (response.success) {
        setBatchesWithSuppliers(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch batches with suppliers:', error);
      toast.error('Failed to load batch details');
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const handleLocationEdit = (batchId: string, currentLocation: string) => {
    setEditingLocation(batchId);
    setLocationValue(currentLocation || '');
  };

  const handleLocationSave = async (batchId: string) => {
    try {
      const { inventoryApi } = await import('@/lib/api/inventory');
      await inventoryApi.updateBatchLocation(batchId, locationValue);
      toast.success('Location updated successfully');
      setEditingLocation(null);
      fetchBatchesWithSuppliers(); // Refresh data
    } catch (error) {
      console.error('Failed to update location:', error);
      toast.error('Failed to update location');
    }
  };

  const handleDeleteBatch = (batch: any) => {
    setDeleteModal({ type: 'batch', item: batch });
  };

  const handleDeleteDrug = () => {
    setDeleteModal({ type: 'drug', item: mappedItem });
  };

  const formatMovementType = (type: string) => {
    const types: any = {
      'IN': { label: 'Received', color: 'text-green-600' },
      'OUT': { label: 'Sold', color: 'text-blue-600' },
      'ADJUSTMENT': { label: 'Adjusted', color: 'text-orange-600' },
      'RETURN': { label: 'Returned', color: 'text-purple-600' },
    };
    return types[type] || { label: type, color: 'text-gray-600' };
  };

  if (!mappedItem) {
    return null;
  }

  const handleCreatePO = () => {
    const queryParams = new URLSearchParams({
      drugId: mappedItem.id,
      drugName: mappedItem.name,
      suggestedQty: String(mappedItem.reorderPoint * 2)
    });
    router.push(`/orders/new-po?${queryParams.toString()}`);
  };

  // Get primary supplier from first batch with supplier
  const primarySupplier = batchesWithSuppliers.find(b => b.supplier)?.supplier;

  return (
    <>
      <div className="w-[35%] bg-white border-l border-[#e2e8f0] flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-[#e2e8f0] flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-[#0f172a]">{mappedItem.name}</h2>
              {mappedItem.coldChain && <BsSnow className="w-4 h-4 text-[#3b82f6]" title="Cold chain" />}
            </div>
            <p className="text-sm text-[#64748b]">{mappedItem.generic}</p>
            <p className="text-xs text-[#94a3b8] mt-1">SKU: {mappedItem.sku} • HSN: {mappedItem.hsn}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#f8fafc] rounded-lg">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Summary */}
          <div className="bg-[#f8fafc] rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[#64748b] mb-1">On-hand</p>
                <p className="text-2xl font-bold text-[#0f172a]">{mappedItem.onHand}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b] mb-1">Available</p>
                <p className="text-2xl font-bold text-[#0ea5a3]">{mappedItem.available}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b] mb-1">Reorder Point</p>
                <p className={`text-lg font-semibold ${mappedItem.available < mappedItem.reorderPoint ? 'text-[#ef4444]' : 'text-[#0f172a]'}`}>
                  {mappedItem.reorderPoint}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#64748b] mb-1">Avg Usage/mo</p>
                <p className="text-lg font-semibold text-[#0f172a]">{mappedItem.avgUsage}</p>
              </div>
            </div>
          </div>

          {/* AI Suggestion */}
          {mappedItem.available < mappedItem.reorderPoint && (
            <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FiAlertCircle className="w-4 h-4 text-[#f59e0b] mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#92400e] mb-1">Reorder Suggested</p>
                  <p className="text-xs text-[#92400e] mb-2">
                    Reorder {mappedItem.reorderPoint * 2} units • Lead time: 5 days
                  </p>
                  <button onClick={handleCreatePO} className="px-3 py-1.5 bg-[#f59e0b] text-white text-xs rounded-lg hover:bg-[#d97706]">
                    Create PO
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Supplier */}
          <div>
            <h3 className="text-sm font-semibold text-[#64748b] mb-2">Primary Supplier</h3>
            <div className="bg-white border border-[#e2e8f0] rounded-lg p-3">
              {primarySupplier ? (
                <>
                  <p className="text-sm font-medium text-[#0f172a]">{primarySupplier.name}</p>
                  <p className="text-xs text-[#64748b] mt-1">
                    Contact: {primarySupplier.contactName} • {primarySupplier.phoneNumber}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[#94a3b8]">No supplier assigned</p>
              )}
            </div>
          </div>

          {/* Batches */}
          <div>
            <h3 className="text-sm font-semibold text-[#64748b] mb-2">
              Batches ({isLoadingBatches ? '...' : batchesWithSuppliers.length})
            </h3>
            <div className="space-y-2">
              {isLoadingBatches ? (
                <div className="bg-white border border-[#e2e8f0] rounded-lg p-3 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              ) : batchesWithSuppliers.length > 0 ? (
                batchesWithSuppliers.map((batch: any) => {
                  const daysToExpiry = Math.floor(
                    (new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div key={batch.id} className="bg-white border border-[#e2e8f0] rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#0f172a]">{batch.batchNumber}</span>
                            {daysToExpiry < 30 && (
                              <span className="px-2 py-0.5 bg-[#fee2e2] text-[#991b1b] text-xs rounded">
                                {daysToExpiry}d
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#64748b] mt-1">
                            Expiry: {(() => {
                              const date = new Date(batch.expiryDate);
                              return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                            })()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#64748b]">Location:</span>
                            {editingLocation === batch.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={locationValue}
                                  onChange={(e) => setLocationValue(e.target.value)}
                                  className="px-2 py-0.5 text-xs border border-[#cbd5e1] rounded w-24"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleLocationSave(batch.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                >
                                  <FiCheck className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingLocation(null)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <FiX className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleLocationEdit(batch.id, batch.location)}
                                className="text-xs text-[#0ea5a3] hover:underline"
                              >
                                {batch.location || 'Set location'}
                              </button>
                            )}
                          </div>
                        </div>
                        <BsQrCode className="w-5 h-5 text-[#64748b] cursor-pointer hover:text-[#0f172a]" />
                      </div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-[#64748b]">Qty: {batch.quantityInStock}</span>
                        <span className="text-[#64748b]">Cost: ₹{Number(batch.purchasePrice).toFixed(2)} • MRP: ₹{Number(batch.mrp).toFixed(2)}</span>
                      </div>
                      {batch.supplier && (
                        <p className="text-xs text-[#64748b] mb-2">
                          Supplier: {batch.supplier.name}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAdjustModal(true)}
                          className="flex-1 px-2 py-1 text-xs border border-[#cbd5e1] rounded hover:bg-[#f8fafc]"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(batch)}
                          className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50"
                          title="Delete batch"
                        >
                          <FiTrash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Stock Movements */}
                      {batch.movements && batch.movements.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#e2e8f0]">
                          <p className="text-xs font-semibold text-[#64748b] mb-2">Recent Movements</p>
                          <div className="space-y-1">
                            {batch.movements.slice(0, 3).map((movement: any) => {
                              const typeInfo = formatMovementType(movement.movementType);
                              return (
                                <div key={movement.id} className="flex items-center justify-between text-xs">
                                  <span className={typeInfo.color}>{typeInfo.label}</span>
                                  <span className="text-[#64748b]">
                                    {movement.quantity > 0 ? '+' : ''}{movement.quantity} • {new Date(movement.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-[#94a3b8] text-center py-4">No batches available</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-[#e2e8f0] p-4 space-y-2">
          <button onClick={handleCreatePO} className="w-full py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center justify-center gap-2">
            <FiShoppingCart className="w-4 h-4" />
            Create PO
          </button>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setShowEditDrugModal(true)}
              className="py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 flex items-center justify-center gap-2 text-sm"
              title="Edit drug information"
            >
              <FiEdit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setShowAdjustModal(true)}
              className="py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center justify-center gap-2 text-sm"
            >
              <FiEdit className="w-4 h-4" />
              Adjust
            </button>
            <button
              onClick={() => setShowAddBatchModal(true)}
              className="py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center justify-center gap-2 text-sm"
              title="Add new batch directly"
            >
              <FiPlus className="w-4 h-4" />
              Add Stock
            </button>
            <button className="py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center justify-center gap-2 text-sm">
              <FiSend className="w-4 h-4" />
              Transfer
            </button>
            <button
              onClick={handleDeleteDrug}
              className="py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2 text-sm"
              title="Delete drug and all batches"
            >
              <FiTrash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {showAdjustModal && (
        <AdjustStockModal
          item={mappedItem}
          onClose={() => setShowAdjustModal(false)}
          onSuccess={() => {
            if (onUpdate) onUpdate();
            fetchBatchesWithSuppliers();
            router.refresh();
          }}
        />
      )}

      {deleteModal && (
        <DeleteInventoryModal
          type={deleteModal.type}
          item={deleteModal.item}
          onClose={() => setDeleteModal(null)}
          onSuccess={() => {
            fetchBatchesWithSuppliers();
            if (deleteModal.type === 'drug') {
              onClose(); // Close the detail panel if drug is deleted
            }
          }}
        />
      )}

      {showEditDrugModal && (
        <EditDrugModal
          drugId={mappedItem.id}
          isOpen={showEditDrugModal}
          onClose={() => setShowEditDrugModal(false)}
          onSuccess={() => {
            if (onUpdate) onUpdate();
            fetchSupplierInfo(item.inventory || []);
            toast.success('Drug information updated');
          }}
        />
      )}

      {showAddBatchModal && (
        <AddBatchModal
          drugId={mappedItem.id}
          drugName={mappedItem.name}
          onClose={() => setShowAddBatchModal(false)}
          onSuccess={() => {
            if (onUpdate) onUpdate();
            fetchBatchesWithSuppliers();
            toast.success('Batch added successfully');
          }}
        />
      )}
    </>
  );
}
