'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FiLoader, FiSave, FiFilter, FiSearch } from 'react-icons/fi';
import { useAuthStore } from '@/lib/store/auth-store';

interface DrugRow {
  id: string;
  name: string;
  manufacturer: string;
  composition: string;
  ingestionStatus: string;
  createdAt: Date;
  daysPending: number;
  isEditing: boolean;
  pendingChanges?: any;
}

export default function BulkCorrectionPage() {
  const { primaryStore } = useAuthStore();
  const [drugs, setDrugs] = useState<DrugRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    status: 'SALT_PENDING',
    search: '',
    manufacturer: '',
  });
  const [pendingChanges, setPendingChanges] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    if (primaryStore?.id) {
      loadDrugs();
    }
  }, [filters, primaryStore?.id]);

  const loadDrugs = async () => {
    if (!primaryStore?.id) {
      console.log('Waiting for store data...');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const storeId = primaryStore.id;

      const params = new URLSearchParams();
      params.append('storeId', storeId);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.manufacturer) params.append('manufacturer', filters.manufacturer);

      const response = await fetch(`/api/drugs/bulk?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch drugs: ${response.status}`);
      }
      
      const data = await response.json();

      // Ensure data is an array
      const drugsArray = Array.isArray(data) ? data : [];

      const rows: DrugRow[] = drugsArray.map((drug: any) => ({
        id: drug.id,
        name: drug.name,
        manufacturer: drug.manufacturer || '',
        composition: formatComposition(drug.saltLinks),
        ingestionStatus: drug.ingestionStatus,
        createdAt: new Date(drug.createdAt),
        daysPending: calculateDaysPending(drug.createdAt),
        isEditing: false,
      }));

      setDrugs(rows);
    } catch (error) {
      console.error('Failed to load drugs:', error);
      setDrugs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatComposition = (saltLinks: any[]) => {
    if (!saltLinks || saltLinks.length === 0) return 'No composition';
    return saltLinks
      .map((link) => `${link.salt.name} ${link.strengthValue}${link.strengthUnit}`)
      .join(' + ');
  };

  const calculateDaysPending = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const toggleEdit = (drugId: string) => {
    setDrugs(
      drugs.map((drug) =>
        drug.id === drugId ? { ...drug, isEditing: !drug.isEditing } : drug
      )
    );
  };

  const updateComposition = (drugId: string, newComposition: string) => {
    const changes = new Map(pendingChanges);
    changes.set(drugId, { composition: newComposition });
    setPendingChanges(changes);
  };

  const handleBatchSave = async () => {
    if (pendingChanges.size === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Save ${pendingChanges.size} changes? This will update salt mappings for selected medicines.`
    );

    if (!confirmed) return;

    setSaving(true);
    try {
      const updates = Array.from(pendingChanges.entries()).map(([drugId, changes]) => ({
        drugId,
        ...changes,
      }));

      const response = await fetch('/api/drugs/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      const result = await response.json();
      alert(`Successfully updated ${result.successful} medicines`);

      setPendingChanges(new Map());
      loadDrugs();
    } catch (error) {
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'SALT_PENDING':
        return 'bg-orange-100 text-orange-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityHighlight = (daysPending: number) => {
    if (daysPending > 7) {
      return 'border-l-4 border-red-500 bg-red-50';
    }
    return '';
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {!primaryStore?.id ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <FiLoader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading store data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Bulk Salt Correction</h1>
            {pendingChanges.size > 0 && (
          <Button onClick={handleBatchSave} disabled={saving}>
            {saving ? (
              <>
                <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FiSave className="mr-2 h-4 w-4" />
                Save {pendingChanges.size} Changes
              </>
            )}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border rounded-md p-2"
            >
              <option value="">All</option>
              <option value="SALT_PENDING">Salt Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Medicine name..."
                className="pl-8"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Manufacturer</label>
            <Input
              value={filters.manufacturer}
              onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })}
              placeholder="Filter by manufacturer..."
            />
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={loadDrugs}>
              <FiFilter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <FiLoader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : drugs.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500">No medicines found matching your filters.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {drugs.map((drug) => (
            <Card
              key={drug.id}
              className={`p-4 ${getPriorityHighlight(drug.daysPending)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{drug.name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(
                        drug.ingestionStatus
                      )}`}
                    >
                      {drug.ingestionStatus}
                    </span>
                    {drug.daysPending > 7 && (
                      <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                        {drug.daysPending} days pending
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    Manufacturer: {drug.manufacturer || 'Unknown'}
                  </p>

                  {drug.isEditing ? (
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-1">
                        Composition
                      </label>
                      <Input
                        value={pendingChanges.get(drug.id)?.composition || drug.composition}
                        onChange={(e) => updateComposition(drug.id, e.target.value)}
                        placeholder="e.g., Paracetamol 500mg + Caffeine 65mg"
                      />
                    </div>
                  ) : (
                    <p className="text-sm">
                      <span className="font-medium">Composition:</span> {drug.composition}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleEdit(drug.id)}
                  >
                    {drug.isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}
