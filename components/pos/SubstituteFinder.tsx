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
  drugId: string;
  name: string;
  manufacturer: string;
  form: string;
  mrp: number;
  availableStock: number;
  matchType: 'EXACT' | 'PARTIAL';
  matchScore: number;
  salts: Array<{
    saltName: string;
    strengthValue: number;
    strengthUnit: string;
  }>;
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
    console.log('[SubstituteFinder] Component mounted with:', { drugId, drugName, storeId });
    if (storeId) {
      fetchSubstitutes();
    } else {
      console.error('[SubstituteFinder] No storeId provided!');
      setError('Store ID is missing');
      setLoading(false);
    }
  }, [drugId, storeId]);

  const fetchSubstitutes = async () => {
    console.log('[SubstituteFinder] fetchSubstitutes called');
    
    if (!storeId) {
      console.error('[SubstituteFinder] No storeId!');
      setError('Store ID is required');
      setLoading(false);
      return;
    }

    console.log('[SubstituteFinder] Starting fetch for drugId:', drugId, 'storeId:', storeId);
    setLoading(true);
    setError(null);

    try {
      const url = `/api/drugs/substitutes?drugId=${encodeURIComponent(drugId)}&storeId=${encodeURIComponent(storeId)}`;
      console.log('[SubstituteFinder] Fetching from:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      console.log('[SubstituteFinder] Response received:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[SubstituteFinder] Error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch substitutes');
      }

      const result = await response.json();
      console.log('[SubstituteFinder] Success, received data:', result);
      
      const transformedData = {
        original: { id: drugId, name: drugName, manufacturer: '', composition: [] },
        substitutes: Array.isArray(result) ? result : [],
        totalFound: Array.isArray(result) ? result.length : 0,
        message: Array.isArray(result) && result.length === 0 ? 'No substitutes found' : undefined
      };
      
      setData(transformedData);
    } catch (err: any) {
      console.error('[SubstituteFinder] Fetch error:', err);
      if (err.name === 'AbortError') {
        setError('Request timeout - please try again');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load substitutes');
      }
    } finally {
      setLoading(false);
      console.log('[SubstituteFinder] Fetch complete');
    }
  };

  const formatComposition = (salts: SubstituteDrug['salts']) => {
    return salts
      .map(salt => `${salt.saltName} ${salt.strengthValue}${salt.strengthUnit}`)
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
                      key={drug.drugId}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedDrug === drug.drugId
                          ? 'ring-2 ring-[#0ea5a3] bg-teal-50'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedDrug(selectedDrug === drug.drugId ? null : drug.drugId)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{drug.name}</h4>
                          <p className="text-sm text-gray-600">{drug.manufacturer}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatComposition(drug.salts)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-green-600">
                            <FiPackage className="h-4 w-4" />
                            <span className="font-semibold">{drug.availableStock} in stock</span>
                          </div>
                          {drug.mrp > 0 && (
                            <div className="flex items-center gap-1 text-gray-600 text-sm">
                              <FiDollarSign className="h-3 w-3" />
                              <span>₹{drug.mrp.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Match Info */}
                      {selectedDrug === drug.drugId && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">
                              Match: {drug.matchType} ({drug.matchScore}%)
                            </span>
                            <Button
                              size="sm"
                              onClick={() => {
                                // For now, create a mock batch since backend doesn't return batches
                                const mockBatch: Batch = {
                                  id: `batch-${drug.drugId}`,
                                  batchNumber: 'AUTO',
                                  currentQuantity: drug.availableStock,
                                  expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                                  mrp: drug.mrp,
                                  purchaseRate: drug.mrp * 0.7
                                };
                                handleSelectBatch(drug as any, mockBatch);
                              }}
                              className="bg-[#0ea5a3] hover:bg-[#0d9491]"
                            >
                              <FiCheck className="h-4 w-4 mr-1" />
                              Select
                            </Button>
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
