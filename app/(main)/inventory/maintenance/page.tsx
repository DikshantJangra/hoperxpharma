'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FiLoader, FiSearch, FiCamera, FiEdit2, FiChevronLeft, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useAuthStore } from '@/lib/store/auth-store';
import CompositionEditModal from '@/components/inventory/CompositionEditModal';
import { toast } from 'sonner';

interface SaltEntry {
  id: string;
  name: string;
  strengthValue: number | null;
  strengthUnit: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface SaltLink {
  salt: { id: string; name: string };
  strengthValue: number;
  strengthUnit: string;
}

interface DrugRow {
  id: string;
  name: string;
  manufacturer: string;
  saltLinks: SaltLink[];
  ingestionStatus: string;
  createdAt: Date;
}

export default function SaltMaintenancePage() {
  const { primaryStore } = useAuthStore();
  const [drugs, setDrugs] = useState<DrugRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'pending' | 'all' | 'complete'>('pending');
  const [editModalDrug, setEditModalDrug] = useState<DrugRow | null>(null);

  useEffect(() => {
    if (primaryStore?.id) {
      loadDrugs();
    }
  }, [filterMode, primaryStore?.id]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (primaryStore?.id) {
        loadDrugs();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadDrugs = async () => {
    if (!primaryStore?.id) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('storeId', primaryStore.id);
      if (searchQuery) params.append('search', searchQuery);
      
      // Filter by composition status
      if (filterMode === 'pending') {
        params.append('hasComposition', 'false');
      } else if (filterMode === 'complete') {
        params.append('hasComposition', 'true');
      }

      const response = await fetch(`/api/drugs/bulk?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      const drugsArray = Array.isArray(data) ? data : [];

      setDrugs(drugsArray.map((drug: any) => ({
        id: drug.id,
        name: drug.name,
        manufacturer: drug.manufacturer || '',
        saltLinks: drug.saltLinks || [],
        ingestionStatus: drug.ingestionStatus,
        createdAt: new Date(drug.createdAt),
      })));
    } catch (error) {
      console.error('Failed to load drugs:', error);
      toast.error('Failed to load medicines');
      setDrugs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatComposition = (saltLinks: SaltLink[]) => {
    if (!saltLinks || saltLinks.length === 0) return null;
    return saltLinks.map((link) => 
      `${link.salt.name} ${link.strengthValue}${link.strengthUnit}`
    ).join(' + ');
  };

  const handleSaveComposition = async (drugId: string, salts: SaltEntry[]) => {
    // Frontend validation
    const invalidSalts = salts.filter(salt => {
      if (!salt.name || salt.name.trim().length < 2) return true;
      if (salt.strengthValue === null || salt.strengthValue <= 0) return true;
      if (!salt.strengthUnit || salt.strengthUnit.trim().length === 0) return true;
      return false;
    });

    if (invalidSalts.length > 0) {
      toast.error('Please fill all fields: Name (min 2 chars), Strength (> 0), and Unit are required');
      throw new Error('Validation failed');
    }

    try {
      const response = await fetch('/api/drugs/update-composition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drugId,
          saltLinks: salts.map((salt, index) => ({
            name: salt.name.trim(),
            strengthValue: salt.strengthValue,
            strengthUnit: salt.strengthUnit?.trim(),
            order: index,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to update composition');
        throw new Error(result.error || 'Failed to update');
      }

      toast.success('Composition saved successfully');
      loadDrugs();
    } catch (error: any) {
      if (error.message !== 'Validation failed') {
        console.error('Failed to save composition:', error);
      }
      throw error;
    }
  };

  const pendingCount = drugs.filter(d => !d.saltLinks || d.saltLinks.length === 0).length;
  const completeCount = drugs.filter(d => d.saltLinks && d.saltLinks.length > 0).length;

  if (!primaryStore?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="h-8 w-8 animate-spin text-[#0ea5a3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => window.location.href = '/inventory/stock'}
            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-3"
          >
            <FiChevronLeft className="w-4 h-4" />
            Back to Inventory
          </button>
          
          <h1 className="text-2xl font-semibold text-gray-900">Salt Composition</h1>
          <p className="text-sm text-gray-500 mt-1">Add or edit salt compositions for your medicines</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filterMode === 'pending'
                ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Pending
            {filterMode === 'pending' && drugs.length > 0 && (
              <span className="ml-2 bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full text-xs">
                {drugs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilterMode('complete')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filterMode === 'complete'
                ? 'bg-green-100 text-green-700 ring-2 ring-green-200'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Complete
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filterMode === 'all'
                ? 'bg-gray-200 text-gray-800 ring-2 ring-gray-300'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicines..."
            className="pl-12 h-12 text-base bg-white border-gray-200 rounded-xl"
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FiLoader className="h-8 w-8 animate-spin text-[#0ea5a3] mb-4" />
            <p className="text-gray-500">Loading medicines...</p>
          </div>
        ) : drugs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {filterMode === 'pending' ? 'All caught up!' : 'No medicines found'}
            </h3>
            <p className="text-gray-500 text-sm">
              {filterMode === 'pending' 
                ? 'All medicines have their compositions set'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {drugs.map((drug) => {
              const composition = formatComposition(drug.saltLinks);
              const hasSalts = drug.saltLinks && drug.saltLinks.length > 0;

              return (
                <div
                  key={drug.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{drug.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{drug.manufacturer || 'Unknown manufacturer'}</p>
                      
                      {hasSalts ? (
                        <div className="mt-2 flex items-center gap-2">
                          <FiCheck className="w-4 h-4 text-green-500 shrink-0" />
                          <p className="text-sm text-green-700 truncate">{composition}</p>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-2">
                          <FiAlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                          <p className="text-sm text-orange-600">No composition set</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditModalDrug(drug)}
                        className="h-9 px-3"
                      >
                        <FiCamera className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditModalDrug(drug)}
                        className="h-9 px-3"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Composition Edit Modal */}
      {editModalDrug && (
        <CompositionEditModal
          isOpen={!!editModalDrug}
          onClose={() => setEditModalDrug(null)}
          onSave={handleSaveComposition}
          drug={{
            id: editModalDrug.id,
            name: editModalDrug.name,
            manufacturer: editModalDrug.manufacturer,
          }}
          existingSalts={editModalDrug.saltLinks?.map((link, i) => ({
            id: `existing-${i}`,
            name: link.salt.name,
            strengthValue: link.strengthValue,
            strengthUnit: link.strengthUnit,
            confidence: 'HIGH' as const,
          }))}
          storeId={primaryStore?.id || ''}
        />
      )}
    </div>
  );
}
