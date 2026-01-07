import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FiRefreshCw, FiShoppingCart, FiCheck, FiX, FiPlus, FiAlertCircle, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { inventoryApi } from '@/lib/api/inventory';
import { format } from 'date-fns';

interface RefillsTabProps {
  prescription: any;
  onUpdate: () => void;
}

export default function RefillsTab({ prescription, onUpdate }: RefillsTabProps) {
  const router = useRouter();
  const [showCreateRefill, setShowCreateRefill] = useState(false);
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);

  // Stock information cache
  const [stockInfo, setStockInfo] = useState<Record<string, {
    totalStock: number;
    expiry: string | null;
    location: string | null;
    loading: boolean;
    batchNumber: string | null;
    isSpecificBatch?: boolean;
    error?: boolean;
  }>>({});

  const refreshData = () => {
    toast.promise(
      new Promise((resolve) => {
        router.refresh();
        setTimeout(resolve, 1000); // Fake delay for UX
      }),
      {
        loading: 'Refreshing prescription data...',
        success: 'Data updated',
        error: 'Failed to refresh'
      }
    );
  };



  // Filter refills that have been dispensed (have RefillItems with dispensedAt)
  const validRefills = prescription?.refills?.filter((refill: any) => {
    // Show refills that are PARTIALLY_USED or FULLY_USED (have been dispensed)
    if (refill.status === 'PARTIALLY_USED' || refill.status === 'FULLY_USED') {
      return true;
    }
    // Or show refills with any dispensed items
    if (refill.items?.some((item: any) => item.dispensedAt)) {
      return true;
    }
    return false;
  }) || [];

  const totalRefills = prescription?.totalRefills || 0;
  const remainingRefills = Math.max(0, totalRefills - validRefills.length);

  // Get medications from latest version
  const medications = prescription?.versions?.[0]?.items || prescription?.items || [];

  // Filter medications that have refills allowed
  const refillableMeds = medications.filter((med: any) =>
    (med.refillsAllowed || 0) > 0
  );

  // Correct canRefill: ACTIVE prescriptions are the primary ones being refilled
  const isExpired = prescription.expiryDate && new Date(prescription.expiryDate) < new Date();
  const canRefill = !isExpired && ['VERIFIED', 'ACTIVE', 'COMPLETED', 'ON_HOLD'].includes(prescription.status);

  // Check if any medication has refills left, even if global totalRefills seems exhausted
  const anyItemHasRefillsLeft = refillableMeds.some((item: any) => {
    const med = item.drug;
    const allowed = item.refillsAllowed || 0;
    const used = (prescription.refills || []).filter((refill: any) =>
      refill.items?.some((ri: any) => {
        const drugId = ri.prescriptionItem?.drugId || ri.prescriptionItem?.drug?.id;
        return drugId === med.id && ri.dispensedAt;
      })
    ).length || 0;
    return allowed > used;
  });

  const showDispenseButton = (remainingRefills > 0 || anyItemHasRefillsLeft) && canRefill;

  // Fetch stock info IMMEDIATELY when tab opens
  useEffect(() => {
    if (refillableMeds.length > 0) {
      const fetchStock = async () => {
        console.log('🚀 [RefillsTab] Starting auto-fetch stock for', refillableMeds.length, 'items');

        // 1. Initialize all items to loading state immediately (if not already loaded)
        setStockInfo(prev => {
          const next = { ...prev };
          let needsUpdate = false;
          refillableMeds.forEach((item: any) => {
            if (!next[item.id]) {
              next[item.id] = { loading: true, totalStock: 0, expiry: null, location: null, batchNumber: null };
              needsUpdate = true;
            }
          });
          return needsUpdate ? next : prev;
        });

        // 2. Fetch each item individually - Promise.all ensures all complete
        try {
          await Promise.all(refillableMeds.map(async (item: any) => {
            // Handle both item.drug.id and item.drugId (Prisma include quirk)
            const drugId = item.drug?.id || item.drugId;

            if (!drugId) return;

            // Skip if already loaded and not forcing (optional optimization)
            // if (stockInfo[item.id]?.loading === false) return;

            try {
              let batches: any[] = [];
              let bestBatch = null;

              // Step A: Specific Batch
              if (item.batchId) {
                try {
                  const res = await inventoryApi.getBatchById(item.batchId);
                  const batch = res?.data || res;
                  if (batch && !Array.isArray(batch)) {
                    batches = [batch];
                    bestBatch = batch;
                  }
                } catch (e) {
                  // Ignore
                }
              }

              // Step B: Fallback to General Drug Stock
              if (batches.length === 0) {
                try {
                  const res = await inventoryApi.getBatches({ drugId: drugId, minQuantity: 0 });
                  batches = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (res?.batches || []));

                  if (Array.isArray(batches) && batches.length > 0) {
                    const sortedBatches = [...batches].sort((a: any, b: any) =>
                      new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
                    );
                    bestBatch = sortedBatches.find((b: any) => Number(b.quantityInStock) > 0) || sortedBatches[0];
                  }
                } catch (e) {
                  console.error("Stock fetch error", e);
                }
              }

              // Step C: Update state for this specific item
              const totalStock = batches.reduce((sum: number, b: any) => sum + (Number(b.quantityInStock) || 0), 0);

              setStockInfo(prev => ({
                ...prev,
                [item.id]: {
                  loading: false,
                  totalStock,
                  expiry: bestBatch ? bestBatch.expiryDate : null,
                  location: bestBatch ? bestBatch.location : null,
                  batchNumber: bestBatch ? bestBatch.batchNumber : null,
                  isSpecificBatch: !!item.batchId
                }
              }));

            } catch (err) {
              setStockInfo(prev => ({
                ...prev,
                [item.id]: { loading: false, totalStock: 0, expiry: null, location: null, error: true }
              }));
            }
          }));
        } catch (err) {
          console.error('💥 [RefillsTab] Stock fetch failed:', err);
        }
      };

      fetchStock();
    }
  }, [prescription.id]); // Only re-run if prescription ID changes, or maybe status? Keep it stable.

  const toggleMedication = (medId: string) => {
    // Validation: Ensure medication has refills left
    const item = refillableMeds.find((m: any) => m.id === medId);
    if (item) {
      const med = item.drug;
      const refillsUsed = prescription.refills?.filter((refill: any) =>
        refill.items?.some((ri: any) => {
          const match = (ri.prescriptionItem?.drugId === med.id) || (ri.prescriptionItem?.drug?.id === med.id);
          return match && ri.dispensedAt;
        })
      ).length || 0;
      const refillsRemaining = Math.max(0, (item.refillsAllowed || 0) - refillsUsed);

      if (refillsRemaining <= 0) {
        toast.error('No refills remaining for this medication');
        return;
      }
    }

    // Warn if stock is 0
    if (!selectedMedications.includes(medId)) { // If we are ADDING it
      const stock = stockInfo[medId];
      if (stock && !stock.loading && stock.totalStock <= 0) {
        toast('Warning: System shows 0 stock for this item', { icon: '⚠️' });
      }
    }

    setSelectedMedications(prev =>
      prev.includes(medId) ? prev.filter(id => id !== medId) : [...prev, medId]
    );
  };

  const handleDispenseRefill = async () => {
    if (selectedMedications.length === 0) {
      toast.error('Select at least one medication to refill');
      return;
    }

    console.log('🔍 [RefillsTab] Selected IDs:', selectedMedications);
    console.log('🔍 [RefillsTab] All refillable:', refillableMeds.map((m: any) => ({
      id: m.id, drugId: m.drug?.id || m.drugId, name: m.drug?.name
    })));

    // Navigate to POS with createRefill flag
    // Convert selected item IDs to drug IDs for POS filtering
    const selectedDrugIds = refillableMeds
      .filter((item: any) => {
        if (!selectedMedications.includes(item.id)) return false;

        // Double check refill limit
        const med = item.drug;
        const refillsUsed = prescription.refills?.filter((refill: any) =>
          refill.items?.some((ri: any) => {
            const match = (ri.prescriptionItem?.drugId === med.id) || (ri.prescriptionItem?.drug?.id === med.id);
            return match && ri.dispensedAt;
          })
        ).length || 0;
        const remaining = Math.max(0, (item.refillsAllowed || 0) - refillsUsed);
        return remaining > 0;
      })
      .map((item: any) => item.drug?.id || item.drugId)
      .filter(Boolean); // Remove any undefined values

    if (selectedDrugIds.length === 0) {
      toast.error('No valid medications selected for refill');
      return;
    }

    console.log('🛒 [RefillsTab] Navigating to POS with drugIds:', selectedDrugIds);
    const medicationIdsParam = selectedDrugIds.join(',');
    const url = `/pos/new-sale?prescriptionId=${prescription.id}&medicationIds=${medicationIdsParam}&createRefill=true`;

    toast.success('Redirecting to POS...', { duration: 800 });

    setTimeout(() => {
      router.push(url);
    }, 800);
  };

  // If in "create refill" mode, show medication selection UI
  if (showCreateRefill) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FiRefreshCw className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Select Medications to Refill</h3>
              </div>

              <div className="flex items-center gap-2">
                {selectedMedications.length > 0 && (
                  <Button
                    onClick={handleDispenseRefill}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <FiShoppingCart className="h-4 w-4 mr-2" />
                    Dispense Selected ({selectedMedications.length})
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateRefill(false);
                    setSelectedMedications([]);
                  }}
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>

            {refillableMeds.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No medications available for refill</p>
              </div>
            ) : (
              <div className="space-y-3">
                {refillableMeds.map((item: any) => {
                  const med = item.drug;
                  // Count how many times this medication has been dispensed in refills
                  const refillsUsed = prescription.refills?.filter((refill: any) =>
                    refill.items?.some((ri: any) => {
                      const match = (ri.prescriptionItem?.drugId === med.id) || (ri.prescriptionItem?.drug?.id === med.id);
                      if (!match && ri.prescriptionItem) {
                        console.log('⚠️ Refill Mismatch:', {
                          medId: med.id,
                          medName: med.name,
                          refillItemId: ri.id,
                          riDrugId: ri.prescriptionItem?.drugId,
                          riDrugName: ri.prescriptionItem?.drug?.name
                        });
                      }
                      return match && ri.dispensedAt;
                    })
                  ).length || 0;
                  const refillsRemaining = Math.max(0, (item.refillsAllowed || 0) - refillsUsed);
                  // Use item.id (unique) for selection, not drug.id
                  const isSelected = selectedMedications.includes(item.id);
                  const stock = stockInfo[item.id];
                  const isDisabled = refillsRemaining <= 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border transition-all ${isDisabled
                        ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                        : 'cursor-pointer ' + (isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-white hover:border-blue-300')
                        }`}
                      onClick={() => !isDisabled && toggleMedication(item.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-1.5 rounded-full ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                            {isSelected ? <FiCheck className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className={`font-medium ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>{med.name}</p>
                            <p className="text-sm text-gray-500">{item.dosage || 'No dosage info'} • {item.frequency || 'No frequency'}</p>

                            {/* Stock Details Badge */}
                            <div className="mt-2 flex items-center gap-2 text-xs h-5">
                              {(!stock || stock.loading) ? (
                                <div className="flex items-center gap-2 w-full animate-pulse">
                                  <div className="h-4 w-20 bg-gray-100 rounded" />
                                  <div className="h-4 w-12 bg-gray-100 rounded" />
                                </div>
                              ) : (
                                <>
                                  <span className={`font-medium ${stock?.totalStock > 0 ? 'text-green-600' : 'text-red-600 flex items-center gap-1'}`}>
                                    {stock.isSpecificBatch ? 'Batch Stock: ' : 'Total Stock: '}
                                    {stock?.totalStock > 0
                                      ? stock.totalStock
                                      : 'Out of Stock'
                                    }
                                  </span>
                                  {stock?.batchNumber && (
                                    <span className="text-blue-600 px-1 border-l border-gray-300 font-semibold">
                                      Batch: {stock.batchNumber}
                                    </span>
                                  )}
                                  {stock?.location && (
                                    <span className="text-gray-400 px-1 border-l border-gray-300">Loc: {stock.location}</span>
                                  )}
                                  {stock?.expiry && (
                                    <span className={`px-1 border-l border-gray-300 ${new Date(stock.expiry) < new Date() ? 'text-red-500' : 'text-gray-500'}`}>
                                      Exp: {format(new Date(stock.expiry), 'MMM yyyy')}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <Badge variant="outline" className={refillsRemaining > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                            {refillsRemaining} Refills Left
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div >
    );
  }

  // Default view: Refill Summary
  return (
    <div className="space-y-6">
      {/* Refill Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiRefreshCw className="h-5 w-5 text-blue-600 cursor-pointer hover:rotate-180 transition-all duration-500" onClick={refreshData} />
              </div>
              <h3 className="text-lg font-semibold">Refill Status</h3>
              <Button variant="ghost" size="sm" onClick={refreshData} className="text-xs text-blue-600 h-6 px-2">
                Refresh
              </Button>
            </div>

            {showDispenseButton && (
              <Button
                size="sm"
                onClick={() => setShowCreateRefill(true)}
              >
                <FiPlus className="h-4 w-4 mr-2" />
                Dispense Refill
              </Button>
            )}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                <tr>
                  <th className="py-3 px-4">Medication</th>
                  <th className="py-3 px-4 text-center">Allowed</th>
                  <th className="py-3 px-4 text-center">Used</th>
                  <th className="py-3 px-4 text-center">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {refillableMeds.length > 0 ? (
                  refillableMeds.map((item: any) => {
                    const med = item.drug;
                    const allowed = item.refillsAllowed || 0;
                    // Calculate used based on dispensed refill items
                    const used = prescription.refills?.filter((refill: any) =>
                      refill.items?.some((ri: any) => {
                        const match = (ri.prescriptionItem?.drugId === med.id) || (ri.prescriptionItem?.drug?.id === med.id);
                        return match && ri.dispensedAt;
                      })
                    ).length || 0;
                    const left = Math.max(0, allowed - used);

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-medium text-gray-900">{med.name}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{allowed}</td>
                        <td className="py-3 px-4 text-center text-blue-600 font-medium">{used}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold ${left > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {left}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No refillable medications in this prescription.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!canRefill && (
            <div className={`mt-4 p-3 border rounded-lg text-sm flex items-center gap-2 ${isExpired
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}>
              <FiAlertCircle className="h-4 w-4" />
              {isExpired
                ? `Prescription expired on ${new Date(prescription.expiryDate).toLocaleDateString()}`
                : 'Prescription must be ACTIVE or VERIFIED before creating refills'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refill History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Refill History</h3>

        {validRefills.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FiRefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Refills Yet</h3>
              <p className="text-gray-500">No refills have been dispensed for this prescription.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {validRefills.map((refill: any, index: number) => {
              // Get dispensed and pending items
              const dispensedItems = refill.items?.filter((ri: any) => ri.dispensedAt) || [];
              const pendingItems = refill.items?.filter((ri: any) => !ri.dispensedAt) || [];
              const dispensedDate = dispensedItems[0]?.dispensedAt
                ? new Date(dispensedItems[0].dispensedAt).toLocaleDateString()
                : null;

              return (
                <Card key={refill.id || index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">Refill #{refill.refillNumber || index + 1}</h4>
                        <p className="text-sm text-gray-500">
                          {dispensedDate
                            ? `Dispensed on ${dispensedDate} `
                            : 'Pending dispense'
                          }
                        </p>
                      </div>

                      <Badge
                        variant={refill.status === 'FULLY_USED' ? 'default' : 'outline'}
                        className={
                          refill.status === 'FULLY_USED' ? 'bg-green-600' :
                            refill.status === 'PARTIALLY_USED' ? 'bg-yellow-500 text-white' :
                              'bg-gray-100'
                        }
                      >
                        {refill.status === 'FULLY_USED' ? 'Fully Dispensed' :
                          refill.status === 'PARTIALLY_USED' ? 'Partially Dispensed' :
                            'Available'}
                      </Badge>
                    </div>

                    {/* Dispensed Medications */}
                    {dispensedItems.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <FiCheck className="h-4 w-4 text-green-600" />
                          Dispensed Medications ({dispensedItems.length})
                        </h5>
                        <div className="space-y-2">
                          {dispensedItems.map((ri: any) => (
                            <div key={ri.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <FiPackage className="h-4 w-4 text-green-600" />
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-900">
                                  {ri.prescriptionItem?.drug?.name || 'Unknown'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Qty: {ri.quantityDispensed || 0}
                                </div>
                              </div>
                              <FiCheck className="h-5 w-5 text-green-600" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending Medications */}
                    {pendingItems.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <FiX className="h-4 w-4 text-gray-400" />
                          Not Dispensed ({pendingItems.length})
                        </h5>
                        <div className="space-y-2">
                          {pendingItems.map((ri: any) => (
                            <div key={ri.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <FiPackage className="h-4 w-4 text-gray-400" />
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-600">
                                  {ri.prescriptionItem?.drug?.name || 'Unknown'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Pending
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div >
  );
}