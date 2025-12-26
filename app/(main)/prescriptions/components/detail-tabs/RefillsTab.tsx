'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FiRefreshCw, FiShoppingCart, FiPackage, FiCheck, FiX, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { prescriptionApi } from '@/lib/api/prescriptions';

interface RefillsTabProps {
  prescription: any;
  onUpdate: () => void;
}

export default function RefillsTab({ prescription, onUpdate }: RefillsTabProps) {
  const router = useRouter();
  const [showCreateRefill, setShowCreateRefill] = useState(false);
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Filter only valid refills (has processedAt or quantity > 0)
  const validRefills = prescription?.refills?.filter((refill: any) =>
    refill.processedAt || refill.quantityDispensed > 0 || refill.daysSupply > 0
  ) || [];

  const totalRefills = prescription?.totalRefills || 0;
  const remainingRefills = Math.max(0, totalRefills - validRefills.length);

  // Get medications from latest version
  const medications = prescription?.versions?.[0]?.items || prescription?.items || [];

  // Filter medications that have refills allowed
  const refillableMeds = medications.filter((med: any) =>
    (med.refillsAllowed || 0) > 0
  );

  const canRefill = prescription.status === 'VERIFIED' || prescription.status === 'COMPLETED';

  const toggleMedication = (medId: string) => {
    setSelectedMedications(prev =>
      prev.includes(medId) ? prev.filter(id => id !== medId) : [...prev, medId]
    );
  };

  const handleDispenseRefill = async () => {
    if (selectedMedications.length === 0) {
      toast.error('Select at least one medication to refill');
      return;
    }

    if (creating) {
      // Prevent double-click/multiple submissions
      return;
    }

    setCreating(true);
    try {
      await prescriptionApi.createRefill(prescription.id, {
        medicationIds: selectedMedications,
        dispenseNow: true
      });

      // Show brief success message that auto-dismisses
      toast.success('Refill created! Redirecting...', {
        duration: 1000 // Auto-dismiss after 1 second
      });

      // Redirect to POS with prescription ID AND selected medication IDs
      const medicationIdsParam = selectedMedications.join(',');
      const url = `/pos/new-sale?prescriptionId=${prescription.id}&refill=true&medicationIds=${medicationIdsParam}`;

      // Use router.push for client-side navigation (no page reload)
      router.push(url);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create refill');
      setCreating(false);
    }
    // Don't reset creating here - let page navigation handle it
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
                    disabled={creating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {creating ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <FiShoppingCart className="h-4 w-4 mr-2" />
                        Dispense Selected ({selectedMedications.length})
                      </>
                    )}
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
                  const refillsUsed = 0; // TODO: Track per medication
                  const refillsRemaining = Math.max(0, (item.refillsAllowed || 0) - refillsUsed);
                  // Use drug.id (medication ID) for selection, not item.id
                  const medicationId = med.id;
                  const isSelected = selectedMedications.includes(medicationId);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMedications([...selectedMedications, medicationId]);
                            } else {
                              setSelectedMedications(selectedMedications.filter(id => id !== medicationId));
                            }
                          }}
                          disabled={refillsRemaining === 0}
                          className="mt-1 h-5 w-5 rounded border-gray-300"
                        />

                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{med.name}</div>
                              {med.form && (
                                <div className="text-sm text-gray-500 mt-0.5">{med.form} • {med.strength}</div>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Total Allowed: </span>
                              <span className="font-semibold">{item.refillsAllowed}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Used: </span>
                              <span className="font-semibold">{refillsUsed}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Remaining: </span>
                              <span className={`font-semibold ${refillsRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {refillsRemaining}
                              </span>
                            </div>
                          </div>
                        </div>

                        {refillsRemaining === 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            No Refills Left
                          </Badge>
                        )}
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FiRefreshCw className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Refill Summary</h3>
            </div>

            {(remainingRefills > 0 && canRefill) && (
              <Button
                size="sm"
                onClick={() => setShowCreateRefill(true)}
              >
                <FiPlus className="h-4 w-4 mr-2" />
                Create Refill
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Refills Dispensed</label>
              <p className="text-2xl font-bold text-blue-600">{validRefills.length}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Max Allowed</label>
              <p className="text-2xl font-bold text-gray-700">{totalRefills}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Remaining</label>
              <p className={`text-2xl font-bold ${remainingRefills > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {remainingRefills}
              </p>
            </div>
          </div>

          {!canRefill && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              Prescription must be verified or completed before creating refills
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
            {validRefills.map((refill: any, index: number) => (
              <Card key={refill.id || index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">Refill #{refill.refillNumber || index + 1}</h4>
                      <p className="text-sm text-gray-500">
                        {refill.processedAt
                          ? `Dispensed on ${new Date(refill.processedAt).toLocaleDateString()}`
                          : 'Pending dispense'
                        }
                      </p>
                    </div>

                    <Badge variant={refill.status === 'COMPLETED' ? 'default' : 'outline'}>
                      {refill.status || 'Pending'}
                    </Badge>
                  </div>

                  {refill.notes && (
                    <p className="text-sm text-gray-600 mt-2">{refill.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}