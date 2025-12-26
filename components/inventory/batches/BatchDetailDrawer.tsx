'use client';

import { useState } from 'react';
import { FiX, FiShoppingCart, FiEdit, FiSend, FiAlertTriangle, FiAlertOctagon, FiPrinter, FiClock, FiCheck } from 'react-icons/fi';
import { BsQrCode, BsThermometer } from 'react-icons/bs';
import { toast } from 'sonner';
import QuarantineModal from './QuarantineModal';
import AdjustBatchModal from './AdjustBatchModal';

import { useRouter } from 'next/navigation';

export default function BatchDetailDrawer({ batch, onClose }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'summary' | 'movement' | 'temp'>('summary');
  const [showQuarantine, setShowQuarantine] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationValue, setLocationValue] = useState(batch.location || '');

  const handleLocationSave = async () => {
    try {
      const { inventoryApi } = await import('@/lib/api/inventory');
      await inventoryApi.updateBatchLocation(batch.id, locationValue);
      toast.success('Location updated successfully');
      setIsEditingLocation(false);
      // Update the batch object
      batch.location = locationValue;
    } catch (error) {
      console.error('Failed to update location:', error);
      toast.error('Failed to update location');
    }
  };

  return (
    <>
      <div className="w-[50%] bg-white border-l border-[#e2e8f0] flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-[#e2e8f0] flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-[#0f172a]">{batch.id}</h2>
              <span className={`px-2 py-1 text-xs font-medium rounded border ${batch.status === 'Quarantine' ? 'border-[#ef4444] text-[#ef4444] bg-[#fef2f2]' : 'border-[#10b981] text-[#10b981] bg-[#d1fae5]'
                }`}>
                {batch.status}
              </span>
            </div>
            <p className="text-sm text-[#64748b]">{batch.itemName}</p>
            <p className="text-xs text-[#94a3b8] mt-1">SKU: {batch.sku}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#f8fafc] rounded-lg">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-[#e2e8f0] flex gap-2">
          <button className="flex-1 px-3 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center justify-center gap-2 text-sm">
            <FiShoppingCart className="w-4 h-4" />
            Pick
          </button>
          <button
            onClick={() => setShowAdjust(true)}
            className="flex-1 px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center justify-center gap-2 text-sm"
          >
            <FiEdit className="w-4 h-4" />
            Adjust
          </button>
          <button className="flex-1 px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center justify-center gap-2 text-sm">
            <FiSend className="w-4 h-4" />
            Transfer
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#e2e8f0] flex">
          {[
            { id: 'summary', label: 'Summary' },
            { id: 'movement', label: 'Movement' },
            { id: 'temp', label: 'Temperature' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-[#0ea5a3] text-[#0ea5a3]'
                : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'summary' && (
            <>
              {/* Expiry Warning */}
              {batch.daysToExpiry < 30 && (
                <div className="bg-[#fee2e2] border border-[#fecaca] rounded-lg p-3 flex items-start gap-2">
                  <FiAlertTriangle className="w-4 h-4 text-[#ef4444] mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#991b1b]">Expires in {batch.daysToExpiry} days</p>
                    <p className="text-xs text-[#991b1b] mt-1">Consider discount or return to supplier</p>
                  </div>
                </div>
              )}

              {/* Quantities */}
              <div className="bg-[#f8fafc] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#64748b] mb-3">Quantities</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-[#64748b] mb-1">On-hand</p>
                    <p className="text-2xl font-bold text-[#0f172a]">{batch.qtyOnHand || batch.quantityInStock || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b] mb-1">Available</p>
                    <p className="text-2xl font-bold text-[#0ea5a3]">{batch.qtyAvailable || batch.quantityInStock || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b] mb-1">Reserved</p>
                    <p className="text-lg font-semibold text-[#0f172a]">
                      {((batch.qtyOnHand || batch.quantityInStock || 0) - (batch.qtyAvailable || batch.quantityInStock || 0)) || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b] mb-1">Location</p>
                    {isEditingLocation ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={locationValue}
                          onChange={(e) => setLocationValue(e.target.value)}
                          className="px-2 py-1 text-sm border border-[#cbd5e1] rounded w-full"
                          placeholder="e.g., Shelf A-12"
                          autoFocus
                        />
                        <button
                          onClick={handleLocationSave}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Save"
                        >
                          <FiCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingLocation(false);
                            setLocationValue(batch.location || '');
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Cancel"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingLocation(true)}
                        className="text-lg font-semibold text-[#0ea5a3] hover:underline text-left"
                      >
                        {batch.location || 'Set location'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Expiry Date</span>
                  <span className="text-[#0f172a] font-medium">
                    {batch.expiryDate ? (() => {
                      const date = new Date(batch.expiryDate);
                      return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                    })() : (batch.expiry || 'N/A')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Last Received</span>
                  <span className="font-medium text-[#0f172a]">
                    {batch.createdAt ? new Date(batch.createdAt).toLocaleDateString() : (batch.lastReceived || 'N/A')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Supplier</span>
                  <span className="font-medium text-[#0f172a]">
                    {batch.supplier?.name || batch.supplier || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Unit Cost</span>
                  <span className="font-medium text-[#0f172a]">
                    ₹{batch.purchasePrice ? Number(batch.purchasePrice).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">MRP</span>
                  <span className="font-medium text-[#0f172a]">
                    ₹{batch.mrp ? Number(batch.mrp).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex items-center justify-center p-4 bg-[#f8fafc] rounded-lg">
                <div className="text-center">
                  <BsQrCode className="w-24 h-24 mx-auto text-[#0f172a] mb-2" />
                  <p className="text-xs text-[#64748b]">Batch QR Code</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'movement' && (
            <div className="space-y-3">
              {batch.movements && batch.movements.length > 0 ? (
                batch.movements.map((movement: any, idx: number) => {
                  const typeLabels: any = {
                    'IN': { label: 'Received', color: 'text-green-600' },
                    'OUT': { label: 'Sold', color: 'text-blue-600' },
                    'ADJUSTMENT': { label: 'Adjusted', color: 'text-orange-600' },
                    'RETURN': { label: 'Returned', color: 'text-purple-600' },
                  };
                  const typeInfo = typeLabels[movement.movementType] || { label: movement.movementType, color: 'text-gray-600' };

                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-[#f8fafc] rounded-lg">
                      <FiClock className="w-4 h-4 text-[#64748b] mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${typeInfo.color}`}>
                          {typeInfo.label} {movement.quantity > 0 ? '+' : ''}{movement.quantity} units
                        </p>
                        <p className="text-xs text-[#64748b] mt-1">
                          {new Date(movement.createdAt).toLocaleString()}
                          {movement.reason && ` • ${movement.reason}`}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <FiClock className="w-12 h-12 text-[#cbd5e1] mx-auto mb-3" />
                  <p className="text-[#64748b]">No movements recorded</p>
                  <p className="text-sm text-[#94a3b8] mt-1">Stock movements will appear here</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'temp' && (
            <>
              {batch.tempBreach ? (
                <div className="bg-[#fee2e2] border border-[#fecaca] rounded-lg p-3 flex items-start gap-2">
                  <BsThermometer className="w-4 h-4 text-[#ef4444] mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#991b1b]">Temperature Breach Detected</p>
                    <p className="text-xs text-[#991b1b] mt-1">Last breach: 2 hours ago • 12°C (limit: 8°C)</p>
                    <button
                      onClick={() => setShowQuarantine(true)}
                      className="mt-2 px-3 py-1.5 bg-[#ef4444] text-white text-xs rounded-lg hover:bg-[#dc2626]"
                    >
                      Quarantine Batch
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#d1fae5] border border-[#a7f3d0] rounded-lg p-3 flex items-start gap-2">
                  <BsThermometer className="w-4 h-4 text-[#10b981] mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#065f46]">Temperature Normal</p>
                    <p className="text-xs text-[#065f46] mt-1">Current: 4°C • Range: 2-8°C</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-[#e2e8f0] p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowQuarantine(true)}
              className="py-2 border border-[#ef4444] text-[#ef4444] rounded-lg hover:bg-[#fef2f2] flex items-center justify-center gap-2 text-sm"
            >
              <FiAlertOctagon className="w-4 h-4" />
              Quarantine
            </button>
            <button className="py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center justify-center gap-2 text-sm">
              <FiPrinter className="w-4 h-4" />
              Print Label
            </button>
          </div>
        </div>
      </div>

      {showQuarantine && (
        <QuarantineModal
          batch={batch}
          onClose={() => setShowQuarantine(false)}
        />
      )}

      {showAdjust && (
        <AdjustBatchModal
          batch={batch}
          onClose={() => setShowAdjust(false)}
          onSuccess={() => {
            router.refresh();
            // If the parent provided an onSuccess prop, we could call it here too
          }}
        />
      )}
    </>
  );
}
