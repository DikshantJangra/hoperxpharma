'use client';

import React, { useState } from 'react';
import { BankTransaction, Allocation } from '@/types/reconcile';
import { HiOutlineCheckCircle, HiOutlineDocumentPlus } from 'react-icons/hi2';

interface MatchDetailPanelProps {
  txn: BankTransaction | null;
  onMatch: (txnId: string, allocations: Allocation[], note: string) => void;
  onCreateAdjustment: (txnId: string) => void;
}

export default function MatchDetailPanel({ txn, onMatch, onCreateAdjustment }: MatchDetailPanelProps) {
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [note, setNote] = useState('');

  if (!txn) {
    return (
      <div className="bg-white border-l border-gray-200 p-6">
        <p className="text-sm text-gray-500">Select a transaction to view details</p>
      </div>
    );
  }

  const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;

  const handleSuggestionClick = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
    setShowMatchModal(true);
  };

  const confirmMatch = () => {
    if (selectedSuggestion) {
      const allocations: Allocation[] = [{
        type: selectedSuggestion.type,
        id: selectedSuggestion.candidateId,
        amount: txn.amount
      }];
      onMatch(txn.txnId, allocations, note);
      setShowMatchModal(false);
      setSelectedSuggestion(null);
      setNote('');
    }
  };

  return (
    <div className="bg-white border-l border-gray-200 p-6 space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Transaction Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Bank Ref</span>
            <span className="font-medium text-gray-900">{txn.bankRef}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date</span>
            <span className="text-gray-900">{new Date(txn.date).toLocaleDateString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount</span>
            <span className="font-medium text-gray-900">{formatCurrency(txn.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Direction</span>
            <span className="text-gray-900">{txn.direction === 'CR' ? 'Credit' : 'Debit'}</span>
          </div>
          <div className="pt-2 border-t">
            <span className="text-xs text-gray-600">Description</span>
            <p className="text-sm text-gray-900 mt-1">{txn.description}</p>
          </div>
        </div>
      </div>

      {txn.suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Top matches (confidence %)</h3>
          <div className="space-y-2">
            {txn.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-gray-900">{suggestion.reference}</span>
                  <span className="text-xs text-green-600 font-medium">{suggestion.score}%</span>
                </div>
                <div className="text-xs text-gray-600">{formatCurrency(suggestion.amount)}</div>
                <div className="text-xs text-gray-500 mt-1">{suggestion.reason}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={() => onCreateAdjustment(txn.txnId)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <HiOutlineDocumentPlus className="h-4 w-4" />
          Create Adjustment
        </button>
      </div>

      {showMatchModal && selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Match — create reconciliation</h3>
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Bank Transaction</span>
                <span className="font-medium">{formatCurrency(txn.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Match To</span>
                <span className="font-medium">{selectedSuggestion.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence</span>
                <span className="text-green-600 font-medium">{selectedSuggestion.score}%</span>
              </div>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add note (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-4"
              rows={2}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowMatchModal(false)}
                className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmMatch}
                className="flex-1 px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                <HiOutlineCheckCircle className="inline h-4 w-4 mr-1" />
                Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
