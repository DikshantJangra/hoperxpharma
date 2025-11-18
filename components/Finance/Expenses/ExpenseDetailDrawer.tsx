'use client';

import React, { useState } from 'react';
import { Expense } from '@/types/expenses';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineDocumentText } from 'react-icons/hi2';

interface ExpenseDetailDrawerProps {
  expense: Expense | null;
  onApprove: (expenseId: string, comment: string) => void;
  onReject: (expenseId: string, comment: string) => void;
}

export default function ExpenseDetailDrawer({ expense, onApprove, onReject }: ExpenseDetailDrawerProps) {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [comment, setComment] = useState('');

  if (!expense) {
    return (
      <div className="bg-white border-l border-gray-200 p-6">
        <p className="text-sm text-gray-500">Select an expense to view details</p>
      </div>
    );
  }

  const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;

  const handleApprove = () => {
    onApprove(expense.expenseId, comment);
    setShowApproveModal(false);
    setComment('');
  };

  return (
    <div className="bg-white border-l border-gray-200 p-6 space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Expense Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Invoice #</span>
            <span className="font-medium text-gray-900">{expense.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Vendor</span>
            <span className="text-gray-900">{expense.vendorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Category</span>
            <span className="text-gray-900">{expense.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">GL Account</span>
            <span className="text-gray-900">{expense.glAccount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Gross</span>
            <span className="text-gray-900">{formatCurrency(expense.grossAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">GST</span>
            <span className="text-gray-900">{formatCurrency(expense.gstAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">TDS</span>
            <span className="text-gray-900">{formatCurrency(expense.tdsAmount)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-600 font-medium">Net Amount</span>
            <span className="font-medium text-gray-900">{formatCurrency(expense.netAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Due Date</span>
            <span className="text-gray-900">{new Date(expense.dueDate).toLocaleDateString('en-IN')}</span>
          </div>
        </div>
      </div>

      {expense.attachments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Attachments</h3>
          <div className="space-y-2">
            {expense.attachments.map(att => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <HiOutlineDocumentText className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{att.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {expense.approvalHistory.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Approval History</h3>
          <div className="space-y-2">
            {expense.approvalHistory.map((h, i) => (
              <div key={i} className="text-xs text-gray-600">
                <span className="font-medium">{h.action}</span> by {h.actor}
                {h.comment && <span className="text-gray-500"> • {h.comment}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {expense.status === 'PENDING_APPROVAL' && (
        <div className="space-y-2">
          <button
            onClick={() => setShowApproveModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            <HiOutlineCheckCircle className="h-4 w-4" />
            Approve
          </button>
          <button
            onClick={() => onReject(expense.expenseId, 'Rejected')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <HiOutlineXCircle className="h-4 w-4" />
            Reject
          </button>
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Approve expense {formatCurrency(expense.netAmount)}
            </h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add comment (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
