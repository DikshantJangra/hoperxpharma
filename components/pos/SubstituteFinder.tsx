'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  FiLoader, FiX, FiPackage, FiDollarSign, FiCalendar,
  FiCheck, FiAlertCircle, FiChevronDown, FiChevronUp, FiInfo,
  FiTrendingDown, FiTrendingUp, FiCheckCircle
} from 'react-icons/fi';
import { saltApi } from '@/lib/api/salt';
import { toast } from 'sonner';

interface SaltComposition {
  name: string;
  strength: string | number;
  unit?: string;
}

interface Batch {
  id: string;
  batchNumber: string;
  baseUnitQuantity: number;
  expiryDate: string;
  mrp: number;
  purchaseRate: number;
  location?: string | null;
}

interface SubstituteDrug {
  drugId: string;
  name: string;
  manufacturer: string;
  form: string;
  mrp: number;
  totalStock: number;
  baseUnit?: string;
  displayUnit?: string;
  isGeneric: boolean;
  strengthMatch: 'EXACT' | 'PARTIAL';
  formMatch: boolean;
  priceDifference: number;
  priceDifferencePercent: number;
  salts: Array<{
    name: string;
    strength: string | number;
  }>;
  batches: Batch[];
}

interface SubstituteResponse {
  originalDrug: {
    id: string;
    name: string;
    manufacturer: string;
    salts: SaltComposition[];
    totalStock: number;
  };
  alternatives: SubstituteDrug[];
  totalFound: number;
}

interface SubstituteFinderProps {
  drugId: string;
  drugName: string;
  storeId: string;
  onSelect: (drug: any, batch: any) => void;
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
  const [expandedDrug, setExpandedDrug] = useState<string | null>(null);

  useEffect(() => {
    if (storeId && drugId) {
      fetchSubstitutes();
    } else {
      setError('Store ID or Drug ID is missing');
      setLoading(false);
    }
  }, [drugId, storeId]);

  const fetchSubstitutes = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 [SubstituteFinder] Requesting alternatives for: ${drugName} (ID: ${drugId}) at Store: ${storeId}`);
      const result = await saltApi.getAlternatives(drugId, storeId);
      console.log('✅ [SubstituteFinder] API Response:', result);

      if (result) {
        setData(result);
        // Auto-expand first result if available
        if (result.alternatives?.length > 0) {
          setExpandedDrug(result.alternatives[0].drugId);
        }
      } else {
        setError('Failed to fetch substitutes');
      }
    } catch (err: any) {
      console.error('[SubstituteFinder] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load substitutes');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    });
  };

  const getExpiryColor = (dateStr: string) => {
    if (!dateStr) return 'text-gray-500';
    const expiry = new Date(dateStr);
    const now = new Date();
    const diffMonths = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());

    if (diffMonths < 0) return 'text-red-600 font-bold';
    if (diffMonths < 3) return 'text-orange-600 font-semibold';
    if (diffMonths < 6) return 'text-amber-600';
    return 'text-green-600';
  };

  const handleSelect = (drug: SubstituteDrug, batch: Batch) => {
    // Map drug fields to match what handleSubstituteSelect expects
    const mappedDrug = {
      ...drug,
      id: drug.drugId,
      saltLinks: drug.salts
    };

    // Map batch fields
    const mappedBatch = {
      ...batch,
      currentQuantity: batch.baseUnitQuantity
    };

    onSelect(mappedDrug, mappedBatch);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-5 flex justify-between items-center bg-gradient-to-r from-teal-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Smart Substitution</h2>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Same Molecule Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FiPackage className="text-teal-600 animate-pulse" />
                </div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Analyzing chemical composition & stock...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle className="w-8 h-8" />
              </div>
              <p className="text-red-800 font-semibold text-lg">{error}</p>
              <Button variant="outline" onClick={fetchSubstitutes} className="mt-4 border-red-200 text-red-600 hover:bg-red-50">
                Retry Analysis
              </Button>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Context Summary */}
              <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5">
                  <FiInfo className="w-24 h-24 text-blue-500" />
                </div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase mb-2 inline-block">Reference Medicine</span>
                    <h3 className="font-black text-xl text-gray-900">{drugName}</h3>
                    <p className="text-sm text-gray-500 font-medium capitalize mb-2">{data.originalDrug?.manufacturer || 'Unknown Manufacturer'}</p>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Salt Composition</span>
                      <div className="flex flex-wrap gap-2">
                        {data.originalDrug?.salts?.map((salt, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                            <FiCheck className="mr-1 w-3 h-3" /> {salt.name} <span className="ml-1 text-black bg-white/50 px-1 rounded">{salt.strength}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-end border-l border-gray-100 pl-4">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Status</span>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${data.originalDrug?.totalStock > 0
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                          {data.originalDrug?.totalStock > 0 ? `${data.originalDrug.totalStock} Available` : 'OUT OF STOCK'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Searching for <b>Exact Strength</b> matches in store inventory...
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alternatives List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <FiPackage className="text-teal-600" />
                    Smart Recommendations ({data.alternatives?.length || 0})
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] text-gray-500 bg-white px-2 py-1 rounded border border-gray-200 font-medium shadow-sm">
                      Sorted by: <b>Relevance & Stock</b>
                    </div>
                  </div>
                </div>

                {data.alternatives?.length === 0 ? (
                  <div className="bg-white py-12 px-6 rounded-xl border border-dashed border-gray-200 text-center">
                    <FiAlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="text-gray-900 font-bold mb-1">No Alternatives Found</h4>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                      We couldn't find any other medicines in stock with the <b>exact same salt composition</b>.
                      Try searching for a partial match or generic name manually.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {data.alternatives.map((drug) => {
                      const isExpanded = expandedDrug === drug.drugId;
                      // Determine best tag
                      let bestTag = null;
                      if (drug.priceDifference < 0) bestTag = { text: `${Math.abs(drug.priceDifferencePercent)}% CHEAPER`, color: 'text-green-600 bg-green-50 border-green-200' };
                      else if (drug.manufacturer === data.originalDrug?.manufacturer) bestTag = { text: 'SAME BRAND', color: 'text-purple-600 bg-purple-50 border-purple-200' };
                      else if (drug.isGeneric) bestTag = { text: 'GENERIC', color: 'text-blue-600 bg-blue-50 border-blue-200' };

                      return (
                        <div
                          key={drug.drugId}
                          className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-sm ${isExpanded ? 'border-teal-500 ring-1 ring-teal-500/20 shadow-md' : 'border-gray-200 hover:border-teal-300 hover:shadow'
                            }`}
                        >
                          <div
                            className="p-4 cursor-pointer flex flex-col sm:flex-row gap-4 sm:items-center"
                            onClick={() => setExpandedDrug(isExpanded ? null : drug.drugId)}
                          >
                            {/* Left: Drug Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {bestTag && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-black uppercase tracking-tight ${bestTag.color}`}>
                                    {bestTag.text}
                                  </span>
                                )}
                                <h4 className="font-bold text-lg text-gray-900 leading-tight">{drug.name}</h4>
                              </div>
                              <div className="text-sm text-gray-500 font-medium mb-2">{drug.manufacturer} • <span className="text-gray-400 text-xs">{drug.form}</span></div>

                              {/* Salt Preview (Horizontal) */}
                              <div className="flex flex-wrap gap-1.5 opacity-80">
                                {drug.salts?.slice(0, 2).map((s, idx) => (
                                  <span key={idx} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                                    {s.name} <b>{s.strength}</b>
                                  </span>
                                ))}
                                {drug.salts?.length > 2 && <span className="text-[10px] text-gray-400">+{drug.salts.length - 2} more</span>}
                              </div>
                            </div>

                            {/* Right: Metrics */}
                            <div className="flex items-center justify-between sm:justify-end gap-6 sm:pl-6 sm:border-l border-gray-50">
                              <div className="text-right min-w-[80px]">
                                <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Price</span>
                                <div className="text-lg font-black text-gray-900 leading-none">₹{Number(drug.mrp).toFixed(2)}</div>
                                {drug.priceDifference !== 0 && (
                                  <div className={`text-[10px] font-bold flex items-center justify-end gap-0.5 mt-0.5 ${drug.priceDifference > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                    {drug.priceDifference > 0 ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
                                    {Math.abs(drug.priceDifferencePercent)}%
                                  </div>
                                )}
                              </div>

                              <div className="text-right min-w-[80px]">
                                <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Stock</span>
                                <div className={`text-sm font-bold ${drug.totalStock > 10 ? 'text-teal-600' : 'text-amber-600'}`}>
                                  {drug.totalStock} {drug.baseUnit}s
                                </div>
                                <div className="text-[10px] text-gray-400 font-medium">{drug.batches?.length} Batches</div>
                              </div>

                              <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                <FiChevronDown className="text-gray-300" />
                              </div>
                            </div>
                          </div>

                          {/* Batches Sub-list (Expanded) */}
                          {isExpanded && (
                            <div className="bg-gray-50/80 border-t border-gray-100 p-4 animate-in slide-in-from-top-2 duration-300">
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-[10px] font-bold text-teal-600 uppercase tracking-widest flex items-center gap-2">
                                  <FiCheckCircle className="w-3 h-3" /> Recommended Batches
                                </div>
                                <span className="text-[10px] text-gray-400">Select a batch to add to cart</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {drug.batches?.length > 0 ? (
                                  drug.batches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()).map((batch, idx) => (
                                    <div
                                      key={batch.id}
                                      onClick={() => handleSelect(drug, batch)}
                                      className={`group bg-white p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all relative overflow-hidden ${idx === 0 ? 'ring-1 ring-teal-500/30 bg-teal-50/10' : ''}`}
                                    >
                                      {idx === 0 && (
                                        <div className="absolute top-0 right-0 bg-teal-500 text-white text-[8px] font-black px-2 py-0.5 rounded-bl shadow-sm uppercase z-10">
                                          Best Pick
                                        </div>
                                      )}

                                      <div className='flex justify-between items-start mb-2'>
                                        <div>
                                          <div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Batch No</div>
                                          <div className="text-xs font-bold text-gray-700 font-mono tracking-tight">{batch.batchNumber}</div>
                                        </div>
                                        <div className='text-right'>
                                          <div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Expiry</div>
                                          <div className={`text-xs font-bold flex items-center justify-end gap-1 ${getExpiryColor(batch.expiryDate)}`}>
                                            {formatDate(batch.expiryDate)}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex justify-between items-end border-t border-gray-50 pt-2 mt-1">
                                        <div>
                                          <span className="text-[10px] text-gray-400 font-medium">Qty:</span> <span className="text-xs font-bold text-gray-900">{batch.baseUnitQuantity}</span>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-xs font-black text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">₹{Number(batch.mrp).toFixed(2)}</span>
                                        </div>
                                      </div>

                                      {/* Hover Action */}
                                      <div className="absolute inset-0 bg-teal-900/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                                        <span className="bg-white text-teal-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-teal-100 transform scale-90 group-hover:scale-100 transition-transform">
                                          Add to Cart
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="col-span-full py-4 text-center text-gray-500 italic text-sm border border-dashed rounded-lg bg-white">
                                    No active batches found.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            <FiInfo className="w-3 h-3 text-amber-500" />
            Always confirm with patient before molecule substitution.
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 font-bold uppercase tracking-widest text-[10px] hover:text-gray-700">
            Cancel & Keep Original
          </Button>
        </div>
      </div>
    </div>
  );
}
