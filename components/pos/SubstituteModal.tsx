'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FiLoader, FiPackage, FiDollarSign } from 'react-icons/fi';
import { MdBusiness } from 'react-icons/md';

interface Substitute {
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

interface SubstituteModalProps {
  isOpen: boolean;
  onClose: () => void;
  drugId: string;
  drugName: string;
  storeId: string;
  onSelect: (substitute: Substitute) => void;
}

export default function SubstituteModal({
  isOpen,
  onClose,
  drugId,
  drugName,
  storeId,
  onSelect,
}: SubstituteModalProps) {
  const [substitutes, setSubstitutes] = useState<Substitute[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && drugId) {
      loadSubstitutes();
    }
  }, [isOpen, drugId]);

  const loadSubstitutes = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/substitutes?drugId=${drugId}&storeId=${storeId}&includePartialMatches=true`
      );
      const data = await response.json();
      setSubstitutes(data);
    } catch (error) {
      console.error('Failed to load substitutes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (substitute: Substitute) => {
    onSelect(substitute);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Find Substitutes for {drugName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <FiLoader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : substitutes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No alternatives found</p>
            <p className="text-sm text-gray-400">
              Consider ordering from supplier or checking with other stores
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {substitutes.map((sub) => (
              <div
                key={sub.drugId}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{sub.name}</h3>
                      <Badge
                        variant={sub.matchType === 'EXACT' ? 'default' : 'secondary'}
                      >
                        {sub.matchType} {sub.matchScore}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {sub.manufacturer} • {sub.form}
                    </p>
                    <div className="text-sm text-gray-700">
                      {sub.salts.map((salt, idx) => (
                        <span key={idx}>
                          {salt.saltName} {salt.strengthValue}
                          {salt.strengthUnit}
                          {idx < sub.salts.length - 1 && ' + '}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      ₹{sub.mrp.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <FiPackage className="h-4 w-4" />
                      <span
                        className={
                          sub.availableStock > 0
                            ? 'text-green-600 font-medium'
                            : 'text-red-600'
                        }
                      >
                        {sub.availableStock > 0
                          ? `${sub.availableStock} in stock`
                          : 'Out of stock'}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleSelect(sub)}
                  disabled={sub.availableStock === 0}
                  className="w-full"
                >
                  {sub.availableStock > 0 ? 'Replace with this' : 'Out of Stock'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
