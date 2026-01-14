'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FiLoader, FiX, FiPackage, FiDollarSign, FiCalendar, FiCheck, FiAlertCircle } from 'react-icons/fi';

interface SaltComposition {
  name: string;
  strength: number;
  unit: string;
}

interface Batch {
  id: string;
  batchNumber: string;
  currentQuantity: number;
  expiryDate: string;
  mrp: number;
  purchaseRate: number;
}

interface SubstituteDrug {
  id: string;
  name: string;
  manufacturer: string;
  saltLinks: Array<{
    salt: { name: string };
    strengthValue: number;
    strengthUnit: string;
  }>;
  batches: Batch[];
  totalStock: number;
  lowestPrice: number | null;
}

interface SubstituteResponse {
  original: {
    id: string;
    name: string;
    manufacturer: string;
    composition: SaltComposition[];
  };
  substitutes: SubstituteDrug[];
  totalFound: number;
  message?: string;
}

interface SubstituteFinderProps {
  drugId: string;
  drugName: string;
  storeId: string;
  onSelect: (drug: SubstituteDrug, batch: Batch) => void;
  onClose: () => void;
}

export default function SubstituteFinder({
  drugId,
  drugName,
  storeId,
  onSelect,
  onClose,
}: SubstituteFinderProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SubstituteResponse | null>(null);
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);

  useEffect(() => {
    fetchSubstitutes();
  }, [drugId, storeId]);

  const fetchSubstitutes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/drugs/substitutes?drugId=${encodeURIComponent(drugId)}&storeId=${encodeURIComponent(storeId)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch substitutes');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load substitutes');
    } finally {
      setLoading(false);
    }
  };

  const formatComposition = (saltLinks: SubstituteDrug['saltLinks']) => {
    return saltLinks
      .map(link => `${link.salt.name} ${link.strengthValue}${link.strengthUnit}`)
      .join(' + ');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    });
  };

  const handleSelectBatch = (drug: SubstituteDrug, batch: Batch) => {
    onSelect(drug, batch);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0ea5a3] to-[#0d9491] px-6 py-4 flex justify-between items-center">
          <div className="text-white">
            <h2 className="text-xl font-bold">Find Substitute</h2>
            <p className="text-sm opacity-90">for {drugName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
            <FiX className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FiLoader className="h-8 w-8 animate-spin text-[#0ea5a3] mb-4" />
              <p className="text-gray-600">Finding substitutes with same composition...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button variant="outline" onClick={fetchSubstitutes}>
                Try Again
              </Button>
            </div>
          ) : data ? (
            <>
              {/* Original Medicine Info */}
              <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Original Medicine</h3>
                <p className="text-blue-800 font-medium">{data.original.name}</p>
                <p className="text-sm text-blue-700">{data.original.manufacturer}</p>
                <p className="text-sm text-blue-600 mt-1">
                  <span className="font-medium">Composition:</span>{' '}
                  {data.original.composition.map(c => `${c.name} ${c.strength}${c.unit}`).join(' + ')}
                </p>
              </Card>

              {/* Substitutes */}
              {data.message ? (
                <div className="text-center py-8">
                  <FiAlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                  <p className="text-gray-600">{data.message}</p>
                </div>
              ) : data.substitutes.length === 0 ? (
                <div className="text-center py-8">
                  <FiPackage className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No substitutes found with the same composition in stock.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    {data.totalFound} Substitute{data.totalFound !== 1 ? 's' : ''} Found
                  </h3>

                  {data.substitutes.map((drug) => (
                    <Card
                      key={drug.id}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedDrug === drug.id
                          ? 'ring-2 ring-[#0ea5a3] bg-teal-50'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedDrug(selectedDrug === drug.id ? null : drug.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{drug.name}</h4>
                          <p className="text-sm text-gray-600">{drug.manufacturer}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatComposition(drug.saltLinks)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-green-600">
                            <FiPackage className="h-4 w-4" />
                            <span className="font-semibold">{drug.totalStock} in stock</span>
                          </div>
                          {drug.lowestPrice && (
                            <div className="flex items-center gap-1 text-gray-600 text-sm">
                              <FiDollarSign className="h-3 w-3" />
                              <span>From ₹{drug.lowestPrice.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Batch Selection */}
                      {selectedDrug === drug.id && drug.batches.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium text-gray-700 mb-2">Select Batch:</p>
                          <div className="space-y-2">
                            {drug.batches.map((batch) => (
                              <div
                                key={batch.id}
                                className="flex items-center justify-between p-3 bg-white rounded border hover:border-[#0ea5a3] transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="font-medium text-sm">{batch.batchNumber}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <FiCalendar className="h-3 w-3" />
                                      <span>Exp: {formatDate(batch.expiryDate)}</span>
                                    </div>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-green-600 font-medium">
                                      {batch.currentQuantity} units
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-lg">₹{batch.mrp.toFixed(2)}</span>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectBatch(drug, batch);
                                    }}
                                    className="bg-[#0ea5a3] hover:bg-[#0d9491]"
                                  >
                                    <FiCheck className="h-4 w-4 mr-1" />
                                    Select
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
