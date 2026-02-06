'use client';

import React, { useState } from 'react';
import { SuggestedItem, POLine } from '@/types/po';
import { HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineSearch, HiOutlineDocumentDuplicate, HiOutlineCloudUpload, HiOutlineDownload, HiOutlineCheckCircle, HiOutlineClock, HiOutlineBookOpen, HiOutlineRefresh } from 'react-icons/hi';
import { HiOutlinePlus, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';

interface SuggestionsPanelProps {
  suggestions: SuggestedItem[];
  isLoading?: boolean;
  onAddItem: (item: Partial<POLine>) => void;
  storeId: string;
  onRefresh?: () => void;
}

export default function SuggestionsPanel({ suggestions, isLoading = false, onAddItem, storeId, onRefresh }: SuggestionsPanelProps) {
  // Debug: Check if description is present and if loading matches expectations
  console.log('SuggestionsPanel Render:', { count: suggestions.length, isLoading, firstItem: suggestions[0] });

  const lowStockItems = suggestions.filter(item => item.reason.includes('Low stock'));
  const forecastItems = suggestions.filter(item => item.reason.includes('Forecast'));

  // Quick Actions State
  const [expandedSection, setExpandedSection] = useState<'recent' | 'catalog' | 'template' | null>(null);

  // Data State
  const [recentPOs, setRecentPOs] = useState<any[]>([]);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSection = (section: 'recent' | 'catalog' | 'template') => {
    console.log('🖱️ Toggling section:', section, 'Current state:', expandedSection);
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
      if (section === 'recent' && recentPOs.length === 0) {
        console.log('⚡ Triggering loadRecentPOs from toggle');
        loadRecentPOs();
      }
      if (section === 'catalog' && catalogItems.length === 0) loadCatalog();
    }
  };

  const loadRecentPOs = async () => {
    console.log('🚀 loadRecentPOs initiated', { storeId });
    setLoading(true);
    try {
      // Removed sort param as it caused 422 error and backend defaults to desc
      // Added storeId ensuring correct context filtering
      const params = new URLSearchParams({
        limit: '10',
        ...(storeId ? { storeId: storeId } : {})
      });
      const url = `/purchase-orders?${params.toString()}`;
      console.log('📡 Fetching Recent POs from:', url);

      const result = await apiClient.get(url);
      console.log('✅ Recent POs fetched:', result.data);

      // Handle both { data: [...] } envelope and raw [...] array
      // Response logic: If result.data is already an array, use it directly.
      // Otherwise, assume it's an envelope and try result.data.data
      const responseData = result.data;
      const pos = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setRecentPOs(pos);
    } catch (error) {
      console.error('❌ Failed to load recent POs', error);
      // Detailed logging for debugging 422/fetch issues
      console.log('Fetch Params:', { storeId });
      toast.error('Could not load recent POs');
    } finally {
      setLoading(false);
    }
  };

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        ...(storeId ? { storeId: storeId } : {})
      });
      const result = await apiClient.get(`/drugs?${params.toString()}`);
      const responseData = result.data;
      const drugs = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setCatalogItems(drugs);
    } catch (error) {
      console.error('Failed to load catalog', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicatePO = (po: any) => {
    if (po.items) {
      po.items.forEach((item: any) => {
        onAddItem({
          drugId: item.drugId,
          description: item.drug?.name || item.description || 'Unknown Item',
          packUnit: 'Strip',
          qty: item.quantity,
          unit: 'strip',
          pricePerUnit: Number(item.unitPrice),
          discountPercent: Number(item.discountPercent || 0),
          gstPercent: Number(item.gstPercent || 0),
        });
      });
      toast.success(`Added ${po.items.length} items`);
    }
  };

  const handleAddCatalogItem = (item: any) => {
    onAddItem({
      drugId: item.id,
      description: item.name,
      packUnit: item.packUnit || 'Strip',
      qty: 1,
      unit: 'strip',
      pricePerUnit: Number(item.price || 0),
      gstPercent: Number(item.gstRate || 12),
    });
    toast.success('Added to PO');
  };

  const filteredCatalog = catalogItems.filter(item =>
    item.name.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const items = lines.slice(1).map(line => {
        const [name, quantity, price] = line.split(',');
        if (!name) return null;
        return {
          description: name.trim(),
          qty: Number(quantity) || 1,
          pricePerUnit: Number(price) || 0
        };
      }).filter(Boolean);

      items.forEach((item: any) => {
        onAddItem({
          description: item.description,
          qty: item.qty,
          pricePerUnit: item.pricePerUnit,
          unit: 'strip',
          packUnit: 'Strip'
        });
      });
      toast.success(`Imported ${items.length} items from CSV`);
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const content = "Item Name,Quantity,Target Price\nDolo 650,10,2.50\nAmoxicillin 250mg,50,5.00";
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "po_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Suggestions Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900">Smart Suggestions</h3>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50 transition-colors"
                title="Refresh suggestions"
              >
                <HiOutlineRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : suggestions.length === 0 ? (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <HiOutlineCheckCircle className="w-4 h-4" /> Healthy
              </span>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500">Analyzing inventory...</p>
          </div>
        ) : suggestions.length > 0 ? (
          <div>
            {lowStockItems.length > 0 && (
              <div>
                <div className="px-5 py-2 bg-red-50 border-b border-red-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HiOutlineExclamationTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-medium text-red-900">Low Stock ({lowStockItems.length})</span>
                  </div>
                  <button onClick={() => lowStockItems.forEach(i => onAddItem(convertSuggestion(i)))} className="text-xs text-red-600 hover:underline">Add All</button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {lowStockItems.map((item, idx) => (
                    <SuggestionItem key={idx} item={item} onAdd={() => onAddItem(convertSuggestion(item))} variant="urgent" />
                  ))}
                </div>
              </div>
            )}

            {forecastItems.length > 0 && (
              <div>
                <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-900">Forecast ({forecastItems.length})</span>
                  <button onClick={() => forecastItems.forEach(i => onAddItem(convertSuggestion(i)))} className="text-xs text-blue-600 hover:underline">Add All</button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {forecastItems.map((item, idx) => (
                    <SuggestionItem key={idx} item={item} onAdd={() => onAddItem(convertSuggestion(item))} variant="forecast" />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mb-3">
              <HiOutlineCheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm text-gray-900 font-medium">No immediate actions needed</p>
            <p className="text-xs text-gray-500 mt-1">Your inventory is looking healthy!</p>
          </div>
        )}
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Recent POs Accordion */}
          <div>
            <button
              onClick={() => toggleSection('recent')}
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-sm text-gray-700"
            >
              <div className="flex items-center gap-2">
                <HiOutlineClock className="w-4 h-4 text-blue-500" />
                <span>Recent POs</span>
              </div>
              {expandedSection === 'recent' ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
            </button>

            {expandedSection === 'recent' && (
              <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                {loading ? (
                  <div className="text-center py-2 text-xs text-gray-500">Loading...</div>
                ) : recentPOs.length === 0 ? (
                  <div className="text-center py-4 text-xs text-gray-500 bg-gray-50 rounded">
                    <p>No recent purchase orders found.</p>
                    <button onClick={loadRecentPOs} className="mt-2 text-blue-600 hover:underline">Refresh</button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {recentPOs.map(po => (
                      <div key={po.id} className="text-xs border border-gray-100 rounded p-2 flex justify-between items-center bg-gray-50/50 hover:bg-gray-100">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{po.poNumber}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">{po.supplier?.name} <HiOutlineDocumentDuplicate className="text-gray-400" /> {po.items?.length || 0} items</div>
                          <div className="text-[10px] text-gray-400">{new Date(po.createdAt).toLocaleDateString()}</div>
                        </div>
                        <button
                          onClick={() => handleDuplicatePO(po)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded flex items-center gap-1"
                          title="Duplicate items"
                        >
                          <HiOutlineDocumentDuplicate className="w-3 h-3" />
                          <span className="text-[10px] font-medium">Duplicate</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Supplier Catalog Accordion */}
          <div>
            <button
              onClick={() => toggleSection('catalog')}
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-sm text-gray-700"
            >
              <div className="flex items-center gap-2">
                <HiOutlineBookOpen className="w-4 h-4 text-purple-500" />
                <span>Supplier Catalog</span>
              </div>
              {expandedSection === 'catalog' ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
            </button>

            {expandedSection === 'catalog' && (
              <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                <div className="relative mb-2">
                  <HiOutlineSearch className="absolute left-2 top-2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    placeholder="Search catalog..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded focus:border-purple-500 outline-none"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                  />
                </div>

                {loading ? (
                  <div className="text-center py-2 text-xs text-gray-500">Loading...</div>
                ) : filteredCatalog.length === 0 ? (
                  <div className="text-center py-2 text-xs text-gray-500">No items found.</div>
                ) : (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {filteredCatalog.map(item => (
                      <div key={item.id} className="text-xs border-b border-gray-50 py-1.5 flex justify-between items-center last:border-0 hover:bg-gray-50 px-1 rounded">
                        <div className="truncate flex-1 pr-2">
                          <div className="font-medium text-gray-800 truncate">{item.name}</div>
                          <div className="text-[10px] text-gray-500">{item.strength || item.packSize}</div>
                        </div>
                        <button
                          onClick={() => handleAddCatalogItem(item)}
                          className="text-purple-600 hover:text-purple-800 font-medium whitespace-nowrap"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Import Template Actions */}
          <div className="p-5 bg-gray-50 text-center">
            <p className="text-xs text-gray-500 mb-2 font-medium">Bulk Import Items</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={downloadTemplate}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
              >
                <HiOutlineDownload className="w-3 h-3" />
                Template
              </button>
              <label className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm">
                <HiOutlineCloudUpload className="w-3 h-3" />
                Upload CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to convert suggestion to partial PO line
function convertSuggestion(item: SuggestedItem): Partial<POLine> {
  return {
    drugId: item.drugId,
    description: item.description,
    packUnit: item.packUnit || 'Strip',
    qty: item.suggestedQty,
    unit: (item.packUnit || 'strip').toLowerCase(),
    pricePerUnit: Number(item.lastPurchasePrice) || 0,
    gstPercent: item.gstPercent,
    suggestedQty: item.suggestedQty,
    reorderReason: item.reason,
    lastPurchasePrice: item.lastPurchasePrice ? Number(item.lastPurchasePrice) : undefined,
    currentStock: item.currentStock
  };
}

interface SuggestionItemProps {
  item: SuggestedItem;
  onAdd: () => void;
  variant: 'urgent' | 'forecast';
}

function SuggestionItem({ item, onAdd, variant }: SuggestionItemProps) {
  const isUrgent = variant === 'urgent';

  return (
    <div className="px-5 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {item.description}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Current: {item.currentStock} • Suggested: {item.suggestedQty}
          </div>
          <div className={`mt-1 text-xs ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
            {item.reason}
          </div>
        </div>
        <button
          onClick={onAdd}
          className={`ml-3 p-1 rounded-md ${isUrgent ? 'text-red-600 hover:bg-red-100' : 'text-blue-600 hover:bg-blue-100'}`}
        >
          <HiOutlinePlus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
