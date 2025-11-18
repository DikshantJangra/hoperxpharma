'use client';

import React, { useState } from 'react';
import { LedgerRow, MatchCandidate } from '@/types/finance';
import { HiOutlineCheckCircle, HiOutlineDocumentText } from 'react-icons/hi2';

interface ReconciliationPanelProps {
  row: LedgerRow | null;
  candidates: MatchCandidate[];
  onMatch: (ledgerId: string, bankTxId: string) => void;
  onAdjustment: (ledgerId: string) => void;
}

export default function ReconciliationPanel({ row, candidates, onMatch, onAdjustment }: ReconciliationPanelProps) {
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<MatchCandidate | null>(null);

  if (!row) {
    return (
      <div className="bg-white border-l border-gray-200 p-6">
        <p className="text-sm text-gray-500">Select a transaction to view details</p>
      </div>
    );
  }

  const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;

  const handleMatchClick = (candidate: MatchCandidate) => {
    setSelectedCandidate(candidate);
    setShowMatchModal(true);
  };

  const confirmMatch = () => {
    if (selectedCandidate) {
      onMatch(row.id, selectedCandidate.bankTx.id);
      setShowMatchModal(false);
      setSelectedCandidate(null);
    }
  };

  return (
    <div className="bg-white border-l border-gray-200 p-6 space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Transaction Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Invoice</span>
            <span className="font-medium text-gray-900">{row.invoiceId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Customer</span>
            <span className="text-gray-900">{row.customer.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount</span>
            <span className="font-medium text-gray-900">{formatCurrency(row.net)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment</span>
            <span className="text-gray-900">{row.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status</span>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              row.reconStatus === 'MATCHED' ? 'bg-green-100 text-green-800' :
              row.reconStatus === 'UNMATCHED' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {row.reconStatus}
            </span>
          </div>
        </div>
      </div>

      {row.reconStatus === 'UNMATCHED' && candidates.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Match Candidates</h3>
          <div className="space-y-2">
            {candidates.map(candidate => (
              <button
                key={candidate.bankTx.id}
                onClick={() => handleMatchClick(candidate)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(candidate.bankTx.amount)}
                  </span>
                  <span className="text-xs text-green-600 font-medium">
                    {Math.round(candidate.confidence * 100)}% match
                  </span>
                </div>
                <div className="text-xs text-gray-600">{candidate.bankTx.reference}</div>
                <div className="text-xs text-gray-500">{candidate.bankTx.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={() => onAdjustment(row.id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <HiOutlineDocumentText className="h-4 w-4" />
          Create Adjustment
        </button>
      </div>

      {showMatchModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm match</h3>
            <p className="text-sm text-gray-600 mb-4">
              Match invoice {row.invoiceId} ({formatCurrency(row.net)}) with bank transaction {selectedCandidate.bankTx.reference} ({formatCurrency(selectedCandidate.bankTx.amount)})? This will mark invoice as Paid and create reconciliation record.
            </p>
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
