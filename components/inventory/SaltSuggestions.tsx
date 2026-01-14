'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FiCheck, FiX, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { SaltSuggestionService, SuggestedSalt } from '@/lib/salt-intelligence/salt-suggestion-service';

interface SaltSuggestionsProps {
  medicineName: string;
  onSelect: (salt: SuggestedSalt) => void;
  onManualEntry: () => void;
  storeId?: string;
}

export default function SaltSuggestions({
  medicineName,
  onSelect,
  onManualEntry,
  storeId,
}: SaltSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestedSalt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (medicineName && medicineName.trim().length >= 3) {
      loadSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [medicineName]);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await SaltSuggestionService.suggestSalts(medicineName);
      setSuggestions(results);

      if (results.length === 0) {
        setError('No suggestions found. Please add salts manually.');
      }
    } catch (err) {
      console.error('[SaltSuggestions] Error loading suggestions:', err);
      setError('Failed to load suggestions. Please try manual entry.');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (salt: SuggestedSalt) => {
    // Record user choice for learning
    if (storeId) {
      try {
        await SaltSuggestionService.recordUserChoice(medicineName, salt, storeId);
      } catch (err) {
        console.error('[SaltSuggestions] Failed to record choice:', err);
      }
    }

    onSelect(salt);
  };

  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'database':
        return '📊';
      case 'pattern':
        return '🔍';
      case 'ml':
        return '🤖';
      default:
        return '💡';
    }
  };

  if (!medicineName || medicineName.trim().length < 3) {
    return (
      <Card className="p-4 bg-gray-50">
        <p className="text-sm text-gray-600 text-center">
          Enter a medicine name to see salt suggestions
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <FiLoader className="h-6 w-6 animate-spin text-[#0ea5a3] mr-2" />
          <span className="text-sm text-gray-600">Finding salt suggestions...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-2">
          <FiAlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-800">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onManualEntry}
              className="mt-2"
            >
              Add Manually
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className="p-4 bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            No automatic suggestions available for this medicine
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onManualEntry}
          >
            Add Salts Manually
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          Suggested Salts for "{medicineName}"
        </h3>
        <p className="text-xs text-gray-500">
          Click to add a suggested salt, or add manually
        </p>
      </div>

      <div className="space-y-2 mb-3">
        {suggestions.map((salt, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => handleSelect(salt)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{getSourceIcon(salt.source)}</span>
                <span className="font-medium text-gray-900">{salt.name}</span>
                {salt.strength && (
                  <span className="text-sm text-gray-600">
                    {salt.strength}{salt.unit}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded border ${getConfidenceBadgeColor(
                    salt.confidence
                  )}`}
                >
                  {salt.confidence}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {salt.source}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#0ea5a3] hover:text-[#0d9491] hover:bg-[#f0fdfa]"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(salt);
              }}
            >
              <FiCheck className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={onManualEntry}
          className="w-full"
        >
          <FiX className="mr-2 h-4 w-4" />
          None of these - Add Manually
        </Button>
      </div>
    </Card>
  );
}
